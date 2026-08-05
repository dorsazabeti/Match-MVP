import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PackageBreakdown } from "../../../src/features/promotions/PackageBreakdown";
import { getRecommendation } from "../../../src/services/promotions";
import { useAuthStore } from "../../../src/store/auth";
import { theme } from "../../../src/theme";
import type { Recommendation } from "../../../src/types/promotions";


const FACTOR_LABELS = {
  interest: "علاقه شخصی",
  value_fit: "تناسب ارزش",
  location: "شهر و تحویل",
  platform: "پلتفرم",
  capability: "توان محتوا",
} as const;

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "اینستاگرام",
  TELEGRAM: "تلگرام",
  YOUTUBE: "یوتیوب",
  RUBIKA: "روبیکا",
  BALE: "بله",
  EITAA: "ایتا",
  OTHER: "سایر",
};


export default function RecommendationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const [item, setItem] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      setError(null);
      setItem(await getRecommendation(token, id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "جزئیات دریافت نشد.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  if (loading) return <State loading text="در حال دریافت جزئیات بسته..." />;
  if (error || !item) return <State text={error ?? "پیشنهاد پیدا نشد."} onRetry={load} />;

  const score = Math.round(Number(item.score));
  const initials = item.publisher_public_name.trim().slice(0, 2);
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.navRow}>
          <Pressable onPress={() => router.back()} style={styles.navButton}>
            <Text style={styles.navButtonText}>›</Text>
          </Pressable>
          <Text style={styles.navTitle}>جزئیات پیشنهاد رسانه</Text>
          <View style={styles.navSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.scoreBlock}>
            <Text style={styles.score}>{score.toLocaleString("fa-IR")}</Text>
            <Text style={styles.scoreLabel}>MATCH SCORE</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text numberOfLines={2} ellipsizeMode="tail" style={styles.name}>
              {item.publisher_public_name}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.city}>
              {item.publisher_city}
            </Text>
            <Text numberOfLines={3} style={styles.bio}>{item.publisher_bio}</Text>
          </View>
          {item.publisher_avatar_url ? (
            <Image source={{ uri: item.publisher_avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          )}
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyMark}>◌</Text>
          <View style={styles.privacyCopy}>
            <Text style={styles.privacyTitle}>پروفایل عمومی و امن</Text>
            <Text style={styles.privacyText}>شماره تماس، ایمیل و داده مالی ناشر در این صفحه و درخواست مدل وجود ندارد.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>رسانه‌های فعال</Text>
        <View style={styles.platformList}>
          {item.platforms.map((platform) => (
            <View key={`${platform.platform}-${platform.handle}`} style={styles.platformCard}>
              <View style={styles.followersBlock}>
                <Text style={styles.followersValue}>{platform.followers_count.toLocaleString("fa-IR")}</Text>
                <Text style={styles.followersLabel}>دنبال‌کننده</Text>
              </View>
              <View style={styles.platformCopy}>
                <Text style={styles.platformName}>{PLATFORM_LABELS[platform.platform]}</Text>
                <Text numberOfLines={1} ellipsizeMode="middle" style={styles.handle}>
                  @{platform.handle}
                </Text>
              </View>
              <View style={styles.platformIcon}><Text style={styles.platformIconText}>#</Text></View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>منطق تطبیق</Text>
        <View style={styles.matchCard}>
          <Text style={styles.matchExplanation}>
            {item.factors.match_explanation ?? item.explanation}
          </Text>
          <View style={styles.factorList}>
            {(Object.keys(FACTOR_LABELS) as Array<keyof typeof FACTOR_LABELS>).map((key) => {
              const factor = item.factors[key];
              const percent = Math.round((factor.score / factor.maximum) * 100);
              const width = `${percent}%` as `${number}%`;
              return (
                <View key={key} style={styles.factorItem}>
                  <View style={styles.factorHeading}>
                    <Text style={styles.factorValue}>{factor.score.toLocaleString("fa-IR")} از {factor.maximum.toLocaleString("fa-IR")}</Text>
                    <Text style={styles.factorName}>{FACTOR_LABELS[key]}</Text>
                  </View>
                  <View style={styles.factorTrack}><View style={[styles.factorFill, { width }]} /></View>
                </View>
              );
            })}
          </View>
          {item.factors.reliability?.redistributed ? (
            <Text style={styles.historyNote}>سابقه کافی هنوز وجود ندارد؛ وزن قابلیت اطمینان طبق PRD بین عوامل دیگر توزیع شده است.</Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>بسته‌ی تبادل ارزش</Text>
        {item.package ? (
          <PackageBreakdown packageData={item.package} />
        ) : (
          <View style={styles.legacyCard}><Text style={styles.legacyText}>این Recommendation قبل از Day 6 ساخته شده و snapshot بسته ندارد.</Text></View>
        )}

        <View style={styles.inviteCard}>
          <Text style={styles.inviteEyebrow}>NEXT · DAY 7</Text>
          <Text style={styles.inviteTitle}>بسته آماده‌ی دعوت است</Text>
          <Text style={styles.inviteText}>در گام بعد، دعوت منحصربه‌فرد، تاریخ انقضا و امکان Adjust ساختاریافته اضافه می‌شود.</Text>
          <View style={styles.inviteButton}><Text style={styles.inviteButtonText}>دعوت ناشر — به‌زودی</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


function State({ loading, text, onRetry }: { loading?: boolean; text: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      {loading ? <ActivityIndicator size="large" color={theme.colors.primary} /> : null}
      <Text style={styles.stateText}>{text}</Text>
      {onRetry ? <Pressable onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>تلاش دوباره</Text></Pressable> : null}
    </View>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { width: "100%", maxWidth: theme.layout.screenMaxWidth, alignSelf: "center", padding: theme.spacing.m, paddingBottom: 72 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.m, padding: theme.spacing.l, backgroundColor: theme.colors.background },
  stateText: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: "center" },
  retry: { minHeight: 48, justifyContent: "center", paddingHorizontal: theme.spacing.l },
  retryText: { color: theme.colors.primary, fontWeight: "900" },
  navRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.m },
  navButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: theme.colors.surface },
  navButtonText: { fontSize: 32, color: theme.colors.text },
  navTitle: { ...theme.typography.h3, color: theme.colors.text },
  navSpacer: { width: 48 },
  hero: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 26, padding: theme.spacing.l, backgroundColor: theme.colors.primaryDark },
  avatar: { width: 66, height: 66, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primarySoft },
  avatarText: { ...theme.typography.h2, color: theme.colors.primaryDark },
  heroCopy: { flex: 1, minWidth: 0, alignItems: "flex-end" },
  name: { ...theme.typography.h2, flexShrink: 1, color: "#fff", textAlign: "right" },
  city: { ...theme.typography.micro, color: theme.colors.primaryMuted, fontWeight: "800", textAlign: "right" },
  bio: { ...theme.typography.micro, color: "#E7DFFF", textAlign: "right", marginTop: 5 },
  scoreBlock: { width: 54, flexShrink: 0, alignItems: "center" },
  score: { fontSize: 34, fontWeight: "900", color: "#fff" },
  scoreLabel: { fontSize: 7, color: theme.colors.primaryMuted, letterSpacing: 1 },
  privacyCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 17, padding: theme.spacing.m, marginTop: theme.spacing.m, backgroundColor: theme.colors.successSoft },
  privacyMark: { fontSize: 28, color: theme.colors.success },
  privacyCopy: { flex: 1 },
  privacyTitle: { ...theme.typography.caption, color: theme.colors.success, fontWeight: "900", textAlign: "right" },
  privacyText: { ...theme.typography.micro, color: theme.colors.textSecondary, textAlign: "right" },
  sectionTitle: { ...theme.typography.h2, color: theme.colors.text, textAlign: "right", marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
  platformList: { gap: 8 },
  platformCard: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, padding: theme.spacing.sm, backgroundColor: theme.colors.surface },
  platformIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primarySoft },
  platformIconText: { color: theme.colors.primary, fontSize: 20, fontWeight: "900" },
  platformCopy: { flex: 1, minWidth: 0, alignItems: "flex-end" },
  platformName: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "900" },
  handle: { ...theme.typography.micro, flexShrink: 1, color: theme.colors.textSecondary },
  followersBlock: { alignItems: "flex-start" },
  followersValue: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "900" },
  followersLabel: { fontSize: 9, color: theme.colors.textMuted },
  matchCard: { borderRadius: 22, padding: theme.spacing.m, backgroundColor: theme.colors.surface, ...theme.shadow.card },
  matchExplanation: { ...theme.typography.caption, color: theme.colors.textSecondary, textAlign: "right" },
  factorList: { gap: 12, marginTop: theme.spacing.m },
  factorItem: { gap: 5 },
  factorHeading: { flexDirection: "row", justifyContent: "space-between" },
  factorName: { ...theme.typography.micro, color: theme.colors.text, fontWeight: "800" },
  factorValue: { ...theme.typography.micro, color: theme.colors.textSecondary },
  factorTrack: { height: 8, borderRadius: 4, backgroundColor: theme.colors.surfaceMuted, overflow: "hidden" },
  factorFill: { height: "100%", borderRadius: 4, backgroundColor: theme.colors.primary },
  historyNote: { ...theme.typography.micro, color: theme.colors.warning, textAlign: "right", marginTop: theme.spacing.m },
  legacyCard: { borderRadius: 18, padding: theme.spacing.m, backgroundColor: theme.colors.warningSoft },
  legacyText: { ...theme.typography.caption, color: theme.colors.warning, textAlign: "right" },
  inviteCard: { borderRadius: 24, padding: theme.spacing.l, backgroundColor: theme.colors.text, marginTop: theme.spacing.xl },
  inviteEyebrow: { ...theme.typography.micro, color: theme.colors.primaryMuted, fontWeight: "900", letterSpacing: 1.3, textAlign: "right" },
  inviteTitle: { ...theme.typography.h2, color: "#fff", textAlign: "right", marginTop: 6 },
  inviteText: { ...theme.typography.caption, color: theme.colors.borderStrong, textAlign: "right", marginTop: 6 },
  inviteButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "rgba(255,255,255,0.10)", marginTop: theme.spacing.m },
  inviteButtonText: { ...theme.typography.caption, color: theme.colors.textMuted, fontWeight: "900" },
});
