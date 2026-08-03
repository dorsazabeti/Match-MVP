import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

import { theme } from "../theme";


export function OnboardingScaffold({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.brand}>MATCH</Text>
          <Text style={styles.step}>{step}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


export function LoadingScreen({ label = "در حال بارگذاری..." }) {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}


export function FormField({
  label,
  multiline,
  ...inputProps
}: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          inputProps.style,
        ]}
      />
    </View>
  );
}


export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return <Text style={styles.errorText}>{message}</Text>;
}


export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[
        styles.primaryButton,
        isDisabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.surface} />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}


export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "danger";
}) {
  const color = tone === "danger"
    ? theme.colors.error
    : theme.colors.primary;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[
        styles.secondaryButton,
        { borderColor: color },
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.secondaryButtonText, { color }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}


export function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        selected && styles.selectedChip,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.selectedChipText,
        ]}
      >
        {selected ? "✓ " : ""}{label}
      </Text>
    </TouchableOpacity>
  );
}


export function ChoiceGrid({ children }: { children: ReactNode }) {
  return <View style={styles.choiceGrid}>{children}</View>;
}


export function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? (
        <Text style={styles.sectionDescription}>{description}</Text>
      ) : null}
    </View>
  );
}


export function ResourceCard({
  title,
  lines,
  onEdit,
  onDelete,
}: {
  title: string;
  lines: string[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.resourceCard}>
      <Text style={styles.resourceTitle}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.resourceLine}>{line}</Text>
      ))}
      <View style={styles.resourceActions}>
        <TouchableOpacity onPress={onEdit} style={styles.textAction}>
          <Text style={styles.editActionText}>ویرایش</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.textAction}>
          <Text style={styles.deleteActionText}>حذف</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.l,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    padding: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.cardRadius,
    backgroundColor: theme.colors.surface,
  },
  brand: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: theme.spacing.s,
  },
  step: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: theme.spacing.m,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.m,
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
  },
  loadingLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  fieldGroup: {
    marginBottom: theme.spacing.m,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.text,
    textAlign: "right",
    fontWeight: "700",
    marginBottom: theme.spacing.s,
  },
  input: {
    minHeight: theme.layout.minTouchTarget,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    textAlign: "right",
    writingDirection: "rtl",
  },
  multilineInput: {
    minHeight: 112,
    paddingTop: theme.spacing.m,
    textAlignVertical: "top",
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    textAlign: "right",
    lineHeight: 22,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: "#FFF1F4",
  },
  primaryButton: {
    minHeight: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.s,
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.m,
    borderWidth: 1,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.m,
  },
  secondaryButtonText: {
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.55,
  },
  choiceGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: theme.spacing.s,
    marginBottom: theme.spacing.l,
  },
  chip: {
    minHeight: theme.layout.minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
  },
  selectedChip: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: "600",
  },
  selectedChipText: {
    color: theme.colors.primary,
    fontWeight: "800",
  },
  sectionHeader: {
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: "right",
  },
  sectionDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: "right",
    marginTop: theme.spacing.xs,
  },
  resourceCard: {
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.background,
  },
  resourceTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: "right",
    marginBottom: theme.spacing.s,
  },
  resourceLine: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: "right",
    marginBottom: theme.spacing.xs,
  },
  resourceActions: {
    flexDirection: "row-reverse",
    gap: theme.spacing.s,
    marginTop: theme.spacing.m,
  },
  textAction: {
    minWidth: 72,
    minHeight: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
  },
  editActionText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  deleteActionText: {
    color: theme.colors.error,
    fontWeight: "700",
  },
});
