import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";

import { theme } from "../../src/theme";
import { useAuthStore } from "../../src/store/auth";
import { createBusinessProfile } from "../../src/services/profiles";


export default function BusinessProfileScreen() {

  const token = useAuthStore(
    (state) => state.token
  );

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");


  async function handleSubmit() {

    if (!token) {
      return;
    }

    await createBusinessProfile(
      token,
      {
        name,
        category,
        city,
        description,
      }
    );

    router.replace("/");
  }


  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        اطلاعات کسب‌وکار
      </Text>


      <TextInput
        style={styles.input}
        placeholder="نام کسب‌وکار"
        value={name}
        onChangeText={setName}
      />


      <TextInput
        style={styles.input}
        placeholder="دسته‌بندی"
        value={category}
        onChangeText={setCategory}
      />


      <TextInput
        style={styles.input}
        placeholder="شهر"
        value={city}
        onChangeText={setCity}
      />


      <TextInput
        style={styles.input}
        placeholder="توضیحات"
        value={description}
        onChangeText={setDescription}
      />


      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>
          ثبت اطلاعات
        </Text>
      </TouchableOpacity>


    </View>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
  },

  title: {
    ...theme.typography.h1,
    textAlign: "center",
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
  },

  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    alignItems: "center",
  },

  buttonText: {
    color: theme.colors.surface,
    fontWeight: "bold",
  },

});

