import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

import { router } from "expo-router";

import { theme } from "../../src/theme";
import { useAuthStore } from "../../src/store/auth";


export default function PublisherHome() {

  const user = useAuthStore(
    (state) => state.user
  );


  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        سلام {user?.display_name ?? ""}
      </Text>

      <Text style={styles.subtitle}>
        داشبورد ناشر
      </Text>


      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          پروفایل شما آماده است
        </Text>

        <Text style={styles.text}>
          از اینجا می‌توانید پیشنهادهای همکاری
          برندها را مشاهده کنید.
        </Text>
      </View>


      <Pressable
        style={styles.button}
        onPress={() =>
          router.push("/publisher")
        }
      >
        <Text style={styles.buttonText}>
          مشاهده پیشنهادها
        </Text>
      </Pressable>

    </View>
  );
}



const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:theme.colors.background,
    justifyContent:"center",
    padding:theme.spacing.l,
  },


  title:{
    ...theme.typography.h1,
    textAlign:"center",
  },


  subtitle:{
    ...theme.typography.body,
    textAlign:"center",
    marginBottom:theme.spacing.l,
  },


  card:{
    backgroundColor:theme.colors.surface,
    padding:theme.spacing.l,
    borderRadius:theme.layout.cardRadius,
  },


  cardTitle:{
    ...theme.typography.h2,
    textAlign:"right",
  },


  text:{
    ...theme.typography.body,
    textAlign:"right",
    marginTop:theme.spacing.m,
  },


  button:{
    marginTop:theme.spacing.l,
    backgroundColor:theme.colors.primary,
    padding:theme.spacing.m,
    borderRadius:theme.layout.borderRadius,
    alignItems:"center",
  },


  buttonText:{
    color:theme.colors.surface,
    fontWeight:"bold",
  }

});
