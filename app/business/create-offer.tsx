import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import { useState } from "react";
import { router } from "expo-router";

import { theme } from "../../src/theme";
import { createOffer } from "../../src/services/offers";
import { useAuthStore } from "../../src/store/auth";


export default function CreateOfferScreen() {

  const token = useAuthStore(
    (state) => state.token
  );


  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSubmit() {

    if (!token) {
      Alert.alert(
        "خطا",
        "لطفا دوباره وارد شوید."
      );
      return;
    }


    try {

      setLoading(true);


      await createOffer(
        token,
        {
          category_id:
            "10000000-0000-4000-8000-000000000005",

          title,

          description,

          platform:
            "INSTAGRAM",

          content_type:
            "REEL",

          budget:
            Number(budget),

          city:
            "تهران",
        }
      );


      Alert.alert(
        "موفق",
        "کمپین شما ثبت شد."
      );


      router.replace("/business");


    } catch (error) {

      Alert.alert(
        "خطا",
        error instanceof Error
          ? error.message
          : "خطایی رخ داد"
      );

    } finally {

      setLoading(false);

    }

  }


  return (

    <View style={styles.container}>


      <Text style={styles.title}>
        ساخت کمپین جدید
      </Text>


      <TextInput
        placeholder="نام کمپین"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />


      <TextInput
        placeholder="توضیحات"
        value={description}
        onChangeText={setDescription}
        style={[
          styles.input,
          styles.textArea,
        ]}
        multiline
      />


      <TextInput
        placeholder="بودجه"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
        style={styles.input}
      />


      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >

        <Text style={styles.buttonText}>
          {loading
            ? "در حال ثبت..."
            : "ثبت کمپین"}
        </Text>

      </TouchableOpacity>


    </View>

  );

}



const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
    padding:
      theme.spacing.l,
    justifyContent:
      "center",
  },


  title: {
    ...theme.typography.title,
    textAlign:
      "center",
    marginBottom:
      theme.spacing.l,
  },


  input: {
    backgroundColor:
      theme.colors.surface,
    borderWidth:
      1,
    borderColor:
      theme.colors.border,
    borderRadius:
      theme.layout.borderRadius,
    padding:
      theme.spacing.m,
    marginBottom:
      theme.spacing.m,
    textAlign:
      "right",
  },


  textArea: {
    height:
      100,
    textAlignVertical:
      "top",
  },


  button: {
    backgroundColor:
      theme.colors.primary,
    padding:
      theme.spacing.m,
    borderRadius:
      theme.layout.borderRadius,
    alignItems:
      "center",
  },


  buttonText: {
    color:
      theme.colors.surface,
    fontWeight:
      "bold",
  },

});
