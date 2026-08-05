import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { theme } from "../../theme";
import type { Offer } from "../../types/offers";
import type {
  PromotionGoal,
  PromotionOptions,
  PromotionPlatform,
  PromotionWritePayload,
} from "../../types/promotions";


const GOAL_META: Record<PromotionGoal, { icon: string; detail: string }> = {
  AWARENESS: { icon: "◉", detail: "دیده‌شدن برند توسط مخاطب تازه" },
  ENGAGEMENT: { icon: "✦", detail: "گفت‌وگو، ذخیره و تعامل بیشتر" },
  CONTENT: { icon: "◇", detail: "دریافت محتوای قابل استفاده برای برند" },
  TRAFFIC: { icon: "↗", detail: "هدایت مخاطب به صفحه یا کانال" },
  SALES: { icon: "✓", detail: "تمرکز بر خرید و تبدیل" },
};

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function numeric(value: string) {
  const normalized = value.replace(/[۰-۹]/g, (digit) =>
    String(PERSIAN_DIGITS.indexOf(digit))
  );
  return Math.trunc(Number(normalized.replace(/\D/g, "")) || 0);
}


export function PromotionForm({
  offer,
  options,
  onCancel,
  onSubmit,
}: {
  offer: Offer;
  options: PromotionOptions;
  onCancel: () => void;
  onSubmit: (payload: PromotionWritePayload) => Promise<void>;
}) {
  const [goal, setGoal] = useState<PromotionGoal>("AWARENESS");
  const [targetCity, setTargetCity] = useState("");
  const [platforms, setPlatforms] = useState<PromotionPlatform[]>([]);
  const [desiredDeals, setDesiredDeals] = useState("1");
  const [invitationHours, setInvitationHours] = useState(
    String(options.default_invitation_expiry_hours)
  );
  const [deadlineDays, setDeadlineDays] = useState(
    String(options.default_content_deadline_days)
  );
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inventoryLimit = offer.reward_type === "CASH"
    ? options.maximum_cash_deals
    : Math.floor(offer.available_quantity / offer.units_per_deal);

  function togglePlatform(platform: PromotionPlatform) {
    setPlatforms((current) => current.includes(platform)
      ? current.filter((item) => item !== platform)
      : [...current, platform]
    );
  }

  async function submit() {
    const dealCount = numeric(desiredDeals);
    const expiry = numeric(invitationHours);
    const deadline = numeric(deadlineDays);
    if (dealCount < 1 || dealCount > inventoryLimit) {
      setError(`تعداد همکاری باید بین ۱ تا ${inventoryLimit.toLocaleString("fa-IR")} باشد.`);
      return;
    }
    if (expiry < 1 || expiry > 168) {
      setError("مهلت پذیرش باید بین ۱ تا ۱۶۸ ساعت باشد.");
      return;
    }
    if (deadline < 1 || deadline > 90) {
      setError("مهلت تحویل محتوا باید بین ۱ تا ۹۰ روز باشد.");
      return;
    }

    try {
      setError(null);
      setSubmitting(true);
      await onSubmit({
        goal,
        target_city: targetCity.trim() || null,
        preferred_platforms: platforms,
        desired_deals: dealCount,
        invitation_expiry_hours: expiry,
        content_deadline_days: deadline,
        brief: brief.trim() || null,
      });
    } catch (submitError) {
      setError(submitError instanceof Error
        ? submitError.message
        : "ساخت پروموشن انجام نشد. دوباره تلاش کنید."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.navRow}>
          <Pressable onPress={onCancel} style={styles.navButton}>
            <Text style={styles.navButtonText}>›</Text>
          </Pressable>
          <Text style={styles.navTitle}>ساخت پروموشن</Text>
          <View style={styles.navSpacer} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SMART MATCH · 01</Text>
          <Text style={styles.title}>رسانه‌های مناسب را پیدا کن</Text>
          <Text style={styles.subtitle}>
            چند معیار روشن مشخص کن؛ Match ناشرهای واجد شرایط را شفاف و قابل‌توضیح رتبه‌بندی می‌کند.
          </Text>
          <View style={styles.offerPill}>
            <Text numberOfLines={1} style={styles.offerPillText}>{offer.title}</Text>
            <Text style={styles.offerPillLabel}>پیشنهاد انتخاب‌شده</Text>
          </View>
        </View>

        <Section number="۱" title="هدف اصلی">
          <Text style={styles.sectionHint}>مهم‌ترین نتیجه‌ای که از این همکاری می‌خواهی چیست؟</Text>
          <View style={styles.goalList}>
            {options.goals.map((item) => {
              const selected = goal === item.value;
              const meta = GOAL_META[item.value];
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setGoal(item.value)}
                  style={[styles.goalCard, selected && styles.goalCardSelected]}
                >
                  <View style={[styles.goalIcon, selected && styles.goalIconSelected]}>
                    <Text style={[styles.goalIconText, selected && styles.goalIconTextSelected]}>{meta.icon}</Text>
                  </View>
                  <View style={styles.goalCopy}>
                    <Text style={[styles.goalTitle, selected && styles.goalTitleSelected]}>{item.label}</Text>
                    <Text style={styles.goalDetail}>{meta.detail}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section number="۲" title="دامنه‌ی جست‌وجو">
          <Field label="شهر هدف" hint="خالی بگذار تا سراسر ایران بررسی شود">
            <TextInput
              value={targetCity}
              onChangeText={setTargetCity}
              style={styles.input}
              placeholder="مثال: تهران"
              placeholderTextColor={theme.colors.textMuted}
              textAlign="right"
            />
          </Field>
          <Field label="پلتفرم‌های ترجیحی" hint="بدون انتخاب یعنی همه‌ی پلتفرم‌ها">
            <View style={styles.chips}>
              {options.platforms.map((item) => {
                const selected = platforms.includes(item.value);
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => togglePlatform(item.value)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {selected ? "✓ " : ""}{item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        </Section>

        <Section number="۳" title="ظرفیت و زمان‌بندی">
          <View style={styles.capacityNote}>
            <Text style={styles.capacityValue}>{inventoryLimit.toLocaleString("fa-IR")}</Text>
            <View style={styles.capacityCopy}>
              <Text style={styles.capacityTitle}>حداکثر همکاری قابل پشتیبانی</Text>
              <Text style={styles.capacityText}>براساس موجودی و سهم هر همکاری</Text>
            </View>
          </View>
          <View style={styles.twoColumns}>
            <View style={styles.flexField}>
              <Field label="تعداد همکاری">
                <TextInput
                  value={desiredDeals}
                  onChangeText={setDesiredDeals}
                  style={styles.input}
                  keyboardType="number-pad"
                  textAlign="right"
                />
              </Field>
            </View>
            <View style={styles.flexField}>
              <Field label="مهلت پذیرش (ساعت)">
                <TextInput
                  value={invitationHours}
                  onChangeText={setInvitationHours}
                  style={styles.input}
                  keyboardType="number-pad"
                  textAlign="right"
                />
              </Field>
            </View>
          </View>
          <Field label="مهلت تحویل محتوا (روز)">
            <TextInput
              value={deadlineDays}
              onChangeText={setDeadlineDays}
              style={styles.input}
              keyboardType="number-pad"
              textAlign="right"
            />
          </Field>
        </Section>

        <Section number="۴" title="بریف کوتاه">
          <Field label="انتظار اصلی از ناشر" hint="اختیاری؛ جزئیات بسته همکاری در Day 6 ساخته می‌شود">
            <TextInput
              value={brief}
              onChangeText={setBrief}
              style={[styles.input, styles.textArea]}
              placeholder="مثال: تجربه واقعی استفاده را با لحن صمیمی روایت کن..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              textAlign="right"
              textAlignVertical="top"
              maxLength={2000}
            />
          </Field>
        </Section>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          onPress={submit}
          disabled={submitting}
          style={[styles.submit, submitting && styles.disabled]}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.submitArrow}>←</Text>
              <Text style={styles.submitText}>ساخت و مشاهده‌ی پیشنهادها</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.privacyNote}>فقط اطلاعات عمومی ناشرهای فعال بررسی می‌شود.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>{number}</Text></View>
      </View>
      {children}
    </View>
  );
}


function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { width: "100%", maxWidth: theme.layout.screenMaxWidth, alignSelf: "center", padding: theme.spacing.m, paddingBottom: 72 },
  navRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.m },
  navButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: theme.colors.surface },
  navButtonText: { fontSize: 34, lineHeight: 38, color: theme.colors.text },
  navTitle: { ...theme.typography.h3, color: theme.colors.text },
  navSpacer: { width: 48 },
  hero: { borderRadius: 28, padding: theme.spacing.l, backgroundColor: theme.colors.primaryDark, overflow: "hidden", marginBottom: theme.spacing.l },
  eyebrow: { ...theme.typography.micro, color: theme.colors.primaryMuted, fontWeight: "900", letterSpacing: 1.5, textAlign: "right" },
  title: { ...theme.typography.h1, color: "#fff", textAlign: "right", marginTop: 10 },
  subtitle: { ...theme.typography.caption, color: "#E7DFFF", textAlign: "right", marginTop: 8 },
  offerPill: { marginTop: theme.spacing.l, padding: theme.spacing.sm, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.12)" },
  offerPillText: { ...theme.typography.body, color: "#fff", fontWeight: "800", textAlign: "right" },
  offerPillLabel: { ...theme.typography.micro, color: theme.colors.primaryMuted, textAlign: "right" },
  section: { borderRadius: theme.layout.cardRadius, padding: theme.spacing.m, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.m, ...theme.shadow.card },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10, marginBottom: theme.spacing.m },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, textAlign: "right" },
  sectionNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center" },
  sectionNumberText: { color: theme.colors.primary, fontWeight: "900" },
  sectionHint: { ...theme.typography.caption, textAlign: "right", marginBottom: theme.spacing.sm },
  goalList: { gap: 10 },
  goalCard: { minHeight: 74, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, padding: 12, flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  goalCardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  goalIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: theme.colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  goalIconSelected: { backgroundColor: theme.colors.primary },
  goalIconText: { color: theme.colors.textSecondary, fontSize: 20, fontWeight: "900" },
  goalIconTextSelected: { color: "#fff" },
  goalCopy: { flex: 1 },
  goalTitle: { ...theme.typography.body, color: theme.colors.text, fontWeight: "800", textAlign: "right" },
  goalTitleSelected: { color: theme.colors.primaryDark },
  goalDetail: { ...theme.typography.micro, color: theme.colors.textSecondary, textAlign: "right" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.borderStrong, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: theme.colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  field: { marginBottom: theme.spacing.m },
  label: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "800", textAlign: "right", marginBottom: 3 },
  hint: { ...theme.typography.micro, color: theme.colors.textMuted, textAlign: "right", marginBottom: 8 },
  input: { minHeight: 52, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, paddingHorizontal: theme.spacing.m, color: theme.colors.text, backgroundColor: theme.colors.background, ...theme.typography.body },
  textArea: { minHeight: 120, paddingTop: 14 },
  chips: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
  chipSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  chipText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: "700" },
  chipTextSelected: { color: theme.colors.primaryDark },
  capacityNote: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: theme.spacing.m, borderRadius: 16, backgroundColor: theme.colors.successSoft, marginBottom: theme.spacing.m },
  capacityValue: { fontSize: 28, fontWeight: "900", color: theme.colors.success },
  capacityCopy: { flex: 1, marginLeft: 12 },
  capacityTitle: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "800", textAlign: "right" },
  capacityText: { ...theme.typography.micro, color: theme.colors.textSecondary, textAlign: "right" },
  twoColumns: { flexDirection: "row-reverse", gap: 10 },
  flexField: { flex: 1 },
  error: { ...theme.typography.caption, color: theme.colors.error, backgroundColor: theme.colors.errorSoft, borderRadius: 14, padding: theme.spacing.m, textAlign: "right", marginBottom: theme.spacing.m },
  submit: { minHeight: 58, borderRadius: 18, backgroundColor: theme.colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, ...theme.shadow.card },
  submitText: { ...theme.typography.body, color: "#fff", fontWeight: "900" },
  submitArrow: { color: "#fff", fontSize: 22 },
  disabled: { opacity: 0.6 },
  privacyNote: { ...theme.typography.micro, color: theme.colors.textMuted, textAlign: "center", marginTop: 12 },
});
