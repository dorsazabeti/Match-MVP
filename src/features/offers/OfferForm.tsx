import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { resolveApiAssetUrl } from "../../services/api";
import { theme } from "../../theme";
import type {
  LocalOfferImage,
  Offer,
  OfferOptions,
  OfferWritePayload,
  RewardType,
} from "../../types/offers";


const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function normalizeNumber(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٬،,\s]/g, "")
    .replace(/[^\d.]/g, "");
}

function toNumber(value: string) {
  const normalized = normalizeNumber(value);
  return normalized ? Number(normalized) : 0;
}

function moneyInput(value: string | null | undefined) {
  if (!value) return "";
  return String(Number(value));
}


export function OfferForm({
  options,
  initialOffer,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  options: OfferOptions;
  initialOffer?: Offer;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (
    payload: OfferWritePayload,
    image: LocalOfferImage | null
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState(initialOffer?.title ?? "");
  const [description, setDescription] = useState(initialOffer?.description ?? "");
  const [categoryId, setCategoryId] = useState(
    initialOffer?.category_id ?? options.categories[0]?.id ?? ""
  );
  const [rewardType, setRewardType] = useState<RewardType>(
    initialOffer?.reward_type ?? "PRODUCT"
  );
  const [retailValue, setRetailValue] = useState(
    moneyInput(initialOffer?.retail_value)
  );
  const [cashAmount, setCashAmount] = useState(
    moneyInput(initialOffer?.cash_amount)
  );
  const [quantity, setQuantity] = useState(
    initialOffer ? String(initialOffer.available_quantity) : ""
  );
  const [unitsPerDeal, setUnitsPerDeal] = useState(
    initialOffer ? String(initialOffer.units_per_deal) : "1"
  );
  const [fulfillmentNotes, setFulfillmentNotes] = useState(
    initialOffer?.fulfillment_notes ?? ""
  );
  const [remotelyFulfillable, setRemotelyFulfillable] = useState(
    initialOffer?.remotely_fulfillable ?? false
  );
  const [expiryDate, setExpiryDate] = useState(
    initialOffer?.expires_at?.slice(0, 10) ?? ""
  );
  const [selectedImage, setSelectedImage] = useState<LocalOfferImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasInventory = rewardType !== "CASH";
  const hasCash = rewardType === "CASH" || rewardType === "HYBRID";
  const previewUri = selectedImage?.uri
    ?? (initialOffer?.images[0]
      ? resolveApiAssetUrl(initialOffer.images[0].storage_path)
      : null);


  function chooseRewardType(nextType: RewardType) {
    setRewardType(nextType);
    if (nextType === "CASH") {
      setRetailValue("");
      setQuantity("");
      setUnitsPerDeal("0");
      setRemotelyFulfillable(true);
    } else {
      if (unitsPerDeal === "0") setUnitsPerDeal("1");
      if (nextType !== "HYBRID") setCashAmount("");
    }
  }


  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("برای انتخاب تصویر، دسترسی گالری را در تنظیمات گوشی فعال کنید.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.82,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";
    const extension = mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";
    setSelectedImage({
      uri: asset.uri,
      mimeType,
      fileName: asset.fileName ?? `offer-${Date.now()}.${extension}`,
    });
    setError(null);
  }


  function buildPayload(): OfferWritePayload | null {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (cleanTitle.length < 3) {
      setError("عنوان پیشنهاد باید حداقل ۳ کاراکتر باشد.");
      return null;
    }
    if (cleanDescription.length < 10) {
      setError("توضیحات پیشنهاد باید حداقل ۱۰ کاراکتر باشد.");
      return null;
    }
    if (!categoryId) {
      setError("یک دسته‌بندی انتخاب کنید.");
      return null;
    }

    const retail = toNumber(retailValue);
    const cash = toNumber(cashAmount);
    const available = Math.trunc(toNumber(quantity));
    const units = Math.trunc(toNumber(unitsPerDeal));

    if (hasInventory && retail <= 0) {
      setError("ارزش واقعی محصول یا خدمت را وارد کنید.");
      return null;
    }
    if (hasCash && cash <= 0) {
      setError("مبلغ نقدی هر همکاری را وارد کنید.");
      return null;
    }
    if (hasInventory && (units <= 0 || available < units)) {
      setError("موجودی باید حداقل به اندازه سهم هر همکاری باشد.");
      return null;
    }

    let expiresAt: string | null = null;
    if (expiryDate.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizeNumber(expiryDate))) {
        setError("تاریخ انقضا را به شکل 2026-09-30 وارد کنید.");
        return null;
      }
      const parsed = new Date(`${normalizeNumber(expiryDate)}T23:59:59`);
      if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
        setError("تاریخ انقضا باید معتبر و در آینده باشد.");
        return null;
      }
      expiresAt = parsed.toISOString();
    }

    return {
      category_id: categoryId,
      title: cleanTitle,
      description: cleanDescription,
      reward_type: rewardType,
      retail_value: hasInventory ? String(retail) : null,
      cash_amount: hasCash ? String(cash) : null,
      currency: options.currency,
      units_per_deal: hasInventory ? units : 0,
      available_quantity: hasInventory ? available : 0,
      fulfillment_notes: fulfillmentNotes.trim() || null,
      remotely_fulfillable: hasInventory ? remotelyFulfillable : true,
      expires_at: expiresAt,
    };
  }


  async function handleSubmit() {
    const payload = buildPayload();
    if (!payload) return;
    try {
      setError(null);
      setSubmitting(true);
      await onSubmit(payload, selectedImage);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "ذخیره پیشنهاد انجام نشد. دوباره تلاش کنید."
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
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>OFFER BUILDER</Text>
          <Text style={styles.title}>
            {initialOffer ? "ویرایش پیشنهاد" : "پیشنهاد همکاری جدید"}
          </Text>
          <Text style={styles.subtitle}>
            چیزی را که واقعاً می‌توانی به ناشر ارائه بدهی، شفاف تعریف کن.
          </Text>
        </View>

        <FormSection title="هویت پیشنهاد" number="۱">
          <Field label="عنوان" hint="کوتاه، مشخص و قابل فهم">
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="مثال: یک شب اقامت برای دو نفر"
              placeholderTextColor={theme.colors.textMuted}
              textAlign="right"
            />
          </Field>
          <Field label="دسته‌بندی">
            <View style={styles.chipGrid}>
              {options.categories.map((category) => (
                <Choice
                  key={category.id}
                  label={category.name}
                  selected={categoryId === category.id}
                  onPress={() => setCategoryId(category.id)}
                />
              ))}
            </View>
          </Field>
          <Field label="توضیحات" hint="ناشر دقیقاً چه چیزی دریافت می‌کند؟">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="جزئیات ارزش، شرایط استفاده و مزیت اصلی پیشنهاد"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />
          </Field>
        </FormSection>

        <FormSection title="مدل پاداش" number="۲">
          <View style={styles.rewardGrid}>
            {options.reward_types.map((reward) => (
              <RewardChoice
                key={reward.value}
                label={reward.label}
                rewardType={reward.value}
                selected={rewardType === reward.value}
                onPress={() => chooseRewardType(reward.value)}
              />
            ))}
          </View>

          {hasInventory ? (
            <>
              <Field label={`ارزش واقعی (${options.currency})`}>
                <TextInput
                  style={styles.input}
                  value={retailValue}
                  onChangeText={setRetailValue}
                  keyboardType="numeric"
                  placeholder="مثال: 15000000"
                  placeholderTextColor={theme.colors.textMuted}
                  textAlign="right"
                />
              </Field>
              <View style={styles.twoColumns}>
                <View style={styles.flexField}>
                  <Field label="موجودی قابل ارائه">
                    <TextInput
                      style={styles.input}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="number-pad"
                      placeholder="10"
                      placeholderTextColor={theme.colors.textMuted}
                      textAlign="right"
                    />
                  </Field>
                </View>
                <View style={styles.flexField}>
                  <Field label="سهم هر همکاری">
                    <TextInput
                      style={styles.input}
                      value={unitsPerDeal}
                      onChangeText={setUnitsPerDeal}
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={theme.colors.textMuted}
                      textAlign="right"
                    />
                  </Field>
                </View>
              </View>
            </>
          ) : null}

          {hasCash ? (
            <Field label={`مبلغ نقدی هر همکاری (${options.currency})`}>
              <TextInput
                style={styles.input}
                value={cashAmount}
                onChangeText={setCashAmount}
                keyboardType="numeric"
                placeholder="مثال: 5000000"
                placeholderTextColor={theme.colors.textMuted}
                textAlign="right"
              />
            </Field>
          ) : null}
        </FormSection>

        <FormSection title="تحویل و نمایش" number="۳">
          <Field label="تصویر پیشنهاد" hint={`JPG، PNG یا WebP تا ${options.max_image_size_mb}MB`}>
            <Pressable onPress={pickImage} style={styles.imagePicker}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlus}>+</Text>
                  <Text style={styles.imagePickerTitle}>انتخاب تصویر واقعی</Text>
                  <Text style={styles.imagePickerHint}>نسبت پیشنهادی ۴ به ۳</Text>
                </View>
              )}
            </Pressable>
            {previewUri ? (
              <Pressable onPress={pickImage} style={styles.changeImageButton}>
                <Text style={styles.changeImageText}>تغییر تصویر</Text>
              </Pressable>
            ) : null}
          </Field>

          <Field label="نحوه تحویل" hint="شرایطی که قبل از قبول همکاری باید روشن باشد">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={fulfillmentNotes}
              onChangeText={setFulfillmentNotes}
              placeholder="مثال: کد رزرو پس از فعال‌شدن همکاری ارسال می‌شود"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />
          </Field>

          {hasInventory ? (
            <View style={styles.switchRow}>
              <Switch
                value={remotelyFulfillable}
                onValueChange={setRemotelyFulfillable}
                trackColor={{
                  false: theme.colors.borderStrong,
                  true: theme.colors.primaryMuted,
                }}
                thumbColor={
                  remotelyFulfillable
                    ? theme.colors.primary
                    : theme.colors.surface
                }
              />
              <View style={styles.switchCopy}>
                <Text style={styles.switchTitle}>قابل تحویل از راه دور</Text>
                <Text style={styles.switchHint}>ارسال، کد یا دسترسی آنلاین ممکن است</Text>
              </View>
            </View>
          ) : null}

          <Field label="تاریخ انقضا (اختیاری)" hint="میلادی، با فرمت YYYY-MM-DD">
            <TextInput
              style={styles.input}
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="2026-09-30"
              placeholderTextColor={theme.colors.textMuted}
              textAlign="right"
            />
          </Field>
        </FormSection>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={({ pressed }) => [
            styles.submitButton,
            (pressed || submitting) && styles.buttonPressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <Text style={styles.submitText}>{submitLabel}</Text>
          )}
        </Pressable>
        <Pressable onPress={onCancel} disabled={submitting} style={styles.cancelButton}>
          <Text style={styles.cancelText}>انصراف</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


function FormSection({
  title,
  number,
  children,
}: {
  title: string;
  number: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>{number}</Text></View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}


function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}


function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
        {selected ? "✓  " : ""}{label}
      </Text>
    </Pressable>
  );
}


function RewardChoice({
  label,
  rewardType,
  selected,
  onPress,
}: {
  label: string;
  rewardType: RewardType;
  selected: boolean;
  onPress: () => void;
}) {
  const icons: Record<RewardType, string> = {
    PRODUCT: "□",
    SERVICE: "◇",
    CASH: "₮",
    HYBRID: "✦",
  };
  return (
    <Pressable
      onPress={onPress}
      style={[styles.rewardChoice, selected && styles.rewardChoiceSelected]}
    >
      <Text style={[styles.rewardIcon, selected && styles.rewardTextSelected]}>
        {icons[rewardType]}
      </Text>
      <Text style={[styles.rewardText, selected && styles.rewardTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    width: "100%",
    maxWidth: theme.layout.screenMaxWidth,
    alignSelf: "center",
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.xl,
    paddingBottom: 64,
  },
  intro: { alignItems: "flex-end", marginBottom: theme.spacing.l },
  eyebrow: {
    ...theme.typography.micro,
    color: theme.colors.primary,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: { ...theme.typography.h1, color: theme.colors.text, textAlign: "right" },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: "right",
    marginTop: theme.spacing.xs,
  },
  section: {
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.cardRadius,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.l,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },
  sectionNumberText: { color: theme.colors.primary, fontWeight: "900" },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text },
  field: { marginBottom: theme.spacing.m },
  fieldHeader: { alignItems: "flex-end", marginBottom: theme.spacing.s },
  fieldLabel: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "800" },
  fieldHint: { ...theme.typography.micro, color: theme.colors.textSecondary, marginTop: 2 },
  input: {
    minHeight: theme.layout.minTouchTarget,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    writingDirection: "rtl",
  },
  textArea: { minHeight: 110 },
  chipGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: theme.spacing.s },
  choice: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    backgroundColor: theme.colors.background,
  },
  choiceSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  choiceText: { ...theme.typography.micro, color: theme.colors.textSecondary, fontWeight: "700" },
  choiceTextSelected: { color: theme.colors.primary },
  rewardGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: theme.spacing.s,
    marginBottom: theme.spacing.l,
  },
  rewardChoice: {
    width: "48%",
    minHeight: 82,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.background,
  },
  rewardChoiceSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  rewardIcon: { color: theme.colors.textSecondary, fontSize: 22, fontWeight: "800" },
  rewardText: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "800", marginTop: 3 },
  rewardTextSelected: { color: theme.colors.primary },
  twoColumns: { flexDirection: "row-reverse", gap: theme.spacing.sm },
  flexField: { flex: 1 },
  imagePicker: {
    overflow: "hidden",
    minHeight: 184,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.primaryMuted,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.primarySoft,
  },
  previewImage: { width: "100%", height: 210, resizeMode: "cover" },
  imagePlaceholder: { flex: 1, minHeight: 184, alignItems: "center", justifyContent: "center" },
  imagePlus: { color: theme.colors.primary, fontSize: 34, fontWeight: "400" },
  imagePickerTitle: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: "800" },
  imagePickerHint: { ...theme.typography.micro, color: theme.colors.textSecondary, marginTop: 2 },
  changeImageButton: { alignSelf: "flex-end", minHeight: 44, justifyContent: "center" },
  changeImageText: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: "800" },
  switchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.background,
  },
  switchCopy: { flex: 1, alignItems: "flex-end", marginRight: theme.spacing.m },
  switchTitle: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "800" },
  switchHint: { ...theme.typography.micro, color: theme.colors.textSecondary },
  errorBox: {
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.errorSoft,
  },
  errorText: { ...theme.typography.caption, color: theme.colors.error, textAlign: "right" },
  submitButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.primary,
  },
  submitText: { ...theme.typography.body, color: theme.colors.surface, fontWeight: "900" },
  buttonPressed: { opacity: 0.72 },
  cancelButton: { minHeight: 52, alignItems: "center", justifyContent: "center" },
  cancelText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: "700" },
});
