// app/(auth)/index.tsx

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../src/theme'; // Import design tokens

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ورود به حساب کاربری </Text>

      <TextInput
        style={styles.input}
        placeholder="ایمیل خود را وارد کنید"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="رمز عبور"
        secureTextEntry
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>ورود</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.h1,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: theme.layout.minTouchTarget, // Minimum touch target constraint
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    alignItems: 'center',
    marginTop: theme.spacing.s,
    minHeight: theme.layout.minTouchTarget, // Minimum touch target constraint
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.surface,
    ...theme.typography.body,
    fontWeight: 'bold',
  },
});