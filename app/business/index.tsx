import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  EmptyOffers,
  OfferCard,
  ScreenHeader,
} from "../../src/features/offers/components";
import { listOffers } from "../../src/services/offers";
import { useAuthStore } from "../../src/store/auth";
import { theme } from "../../src/theme";
import type { Offer, OfferStatus } from "../../src/types/offers";


const FILTERS: Array<{ label: string; value: OfferStatus | "ALL" }> = [
  { label: "همه", value: "ALL" },
  { label: "فعال", value: "ACTIVE" },
  { label: "متوقف", value: "PAUSED" },
  { label: "منقضی", value: "EXPIRED" },
];


export default function BusinessHome() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filter, setFilter] = useState<OfferStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const loadOffers = useCallback(async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      setError(null);
      const response = await listOffers(token);
      setOffers(response.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "پیشنهادها بارگذاری نشدند."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    loadOffers();
  }, [loadOffers]));

  async function handleLogout() {
    await logout();
    router.replace("/(auth)");
  }

  const activeCount = offers.filter((offer) => offer.status === "ACTIVE").length;
  const availableUnits = offers.reduce(
    (total, offer) => total + offer.available_quantity,
    0
  );
  const visibleOffers = filter === "ALL"
    ? offers
    : offers.filter((offer) => offer.status === filter);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOffers(true)}
            tintColor={theme.colors.primary}
          />
        }
      >
        <ScreenHeader
          eyebrow="MATCH FOR BUSINESS"
          title={`سلام ${user?.display_name?.split(" ")[0] ?? "همراه"}`}
          subtitle="پیشنهادهایت را بساز؛ Match مسیر همکاری را هوشمند می‌کند."
          action={
            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>خروج</Text>
            </Pressable>
          }
        />

        <View style={styles.hero}>
          <View style={styles.heroOrb} />
          <Text style={styles.heroEyebrow}>پیشنهاد بعدی تو</Text>
          <Text style={styles.heroTitle}>یک دارایی، چند همکاری واقعی</Text>
          <Text style={styles.heroText}>
            محصول، خدمت یا بودجه‌ات را در کمتر از سه دقیقه آماده کن.
          </Text>
          <Pressable
            onPress={() => router.push("/business/create-offer")}
            style={styles.heroButton}
          >
            <Text style={styles.heroButtonText}>+ ساخت پیشنهاد جدید</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <Stat value={String(activeCount)} label="پیشنهاد فعال" />
          <Stat value={String(availableUnits)} label="موجودی آماده" />
          <Stat value="—" label="همکاری فعال" muted />
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>پیشنهادهای من</Text>
          <Text style={styles.listCount}>{visibleOffers.length.toLocaleString("fa-IR")} مورد</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setFilter(item.value)}
              style={[styles.filter, filter === item.value && styles.filterActive]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.stateText}>در حال دریافت پیشنهادها...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => loadOffers()} style={styles.retryButton}>
              <Text style={styles.retryText}>تلاش دوباره</Text>
            </Pressable>
          </View>
        ) : visibleOffers.length === 0 ? (
          <EmptyOffers onCreate={() => router.push("/business/create-offer")} />
        ) : (
          visibleOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onPress={() => router.push(`/business/offer/${offer.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


function Stat({ value, label, muted = false }: { value: string; label: string; muted?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, muted && styles.statMuted]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    width: "100%",
    maxWidth: theme.layout.screenMaxWidth,
    alignSelf: "center",
    padding: theme.spacing.m,
    paddingBottom: 64,
  },
  logoutButton: {
    minWidth: 52,
    minHeight: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
  },
  logoutText: { ...theme.typography.micro, color: theme.colors.textSecondary, fontWeight: "800" },
  hero: {
    overflow: "hidden",
    alignItems: "flex-end",
    padding: theme.spacing.l,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    ...theme.shadow.card,
  },
  heroOrb: {
    position: "absolute",
    width: 180,
    height: 180,
    left: -60,
    bottom: -90,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  heroEyebrow: { ...theme.typography.micro, color: theme.colors.primaryMuted, fontWeight: "900" },
  heroTitle: { ...theme.typography.h2, color: theme.colors.surface, textAlign: "right", marginTop: 2 },
  heroText: { ...theme.typography.caption, color: "#E8DEFF", textAlign: "right", marginTop: theme.spacing.s },
  heroButton: {
    minHeight: theme.layout.minTouchTarget,
    justifyContent: "center",
    marginTop: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
  },
  heroButtonText: { color: theme.colors.primaryDark, fontWeight: "900" },
  statsRow: { flexDirection: "row-reverse", gap: theme.spacing.s, marginVertical: theme.spacing.m },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
  },
  statValue: { ...theme.typography.h3, color: theme.colors.primary },
  statMuted: { color: theme.colors.textMuted },
  statLabel: { ...theme.typography.micro, color: theme.colors.textSecondary, textAlign: "center" },
  listHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: theme.spacing.s,
  },
  listTitle: { ...theme.typography.h2, color: theme.colors.text },
  listCount: { ...theme.typography.caption, color: theme.colors.textSecondary },
  filters: { flexDirection: "row-reverse", gap: theme.spacing.s, paddingVertical: theme.spacing.m },
  filter: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
  },
  filterActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  filterText: { ...theme.typography.micro, color: theme.colors.textSecondary, fontWeight: "700" },
  filterTextActive: { color: theme.colors.primary, fontWeight: "900" },
  stateBox: { alignItems: "center", gap: theme.spacing.sm, padding: theme.spacing.xl },
  stateText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  errorBox: {
    alignItems: "center",
    padding: theme.spacing.l,
    borderRadius: theme.layout.cardRadius,
    backgroundColor: theme.colors.errorSoft,
  },
  errorText: { ...theme.typography.caption, color: theme.colors.error, textAlign: "center" },
  retryButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: theme.spacing.m },
  retryText: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: "900" },
});
