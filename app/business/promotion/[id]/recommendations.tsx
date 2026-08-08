import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatMoney } from "../../../../src/features/offers/components";
import { PackageBreakdown } from "../../../../src/features/promotions/PackageBreakdown";
import {
  getPromotion,
  listRecommendations,
  invitePublisher,
} from "../../../../src/services/promotions";
import { useAuthStore } from "../../../../src/store/auth";
import { theme } from "../../../../src/theme";
import type {
  Promotion,
  Recommendation,
} from "../../../../src/types/promotions";


const FACTOR_LABELS = {
  interest: "علاقه مرتبط",
  value_fit: "تناسب ارزش",
  location: "موقعیت",
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


export default function RecommendationResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);

  const [promotion, setPromotion] =
    useState<Promotion | null>(null);

  const [items, setItems] =
    useState<Recommendation[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [platformFilter, setPlatformFilter] =
    useState("ALL");

  const [minimumScore, setMinimumScore] =
    useState<0 | 80>(0);


  const load = useCallback(async () => {
    if (!token || !id) return;

    try {
      setError(null);

      const [
        promotionResponse,
        resultResponse,
      ] = await Promise.all([
        getPromotion(token, id),
        listRecommendations(token, id),
      ]);

      setPromotion(promotionResponse);
      setItems(resultResponse.items);

    } catch (loadError) {

      setError(
        loadError instanceof Error
          ? loadError.message
          : "نتایج دریافت نشد."
      );

    } finally {

      setLoading(false);

    }

  }, [id, token]);


  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );


  if (loading) {
    return (
      <State
        loading
        text="در حال رتبه‌بندی رسانه‌ها..."
      />
    );
  }


  if (error || !promotion) {
    return (
      <State
        text={error ?? "پروموشن پیدا نشد."}
        onRetry={load}
      />
    );
  }


  const availablePlatforms =
    Array.from(
      new Set(
        items.map(
          item =>
            item.best_media_plan.platform
        )
      )
    );


  const filteredItems =
    items.filter(
      item =>
        (
          platformFilter === "ALL" ||
          item.best_media_plan.platform === platformFilter
        )
        &&
        Number(item.score) >= minimumScore
    );


  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >

      <ScrollView
        contentContainerStyle={styles.content}
      >

        <View style={styles.navRow}>

          <Pressable
            onPress={() =>
              router.replace(
                `/business/offer/${promotion.offer_id}`
              )
            }
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>
              ×
            </Text>
          </Pressable>


          <Text style={styles.navTitle}>
            پیشنهاد رسانه‌ها
          </Text>


          <View style={styles.navSpacer}/>

        </View>


        <View style={styles.hero}>

          <Text style={styles.heroNumber}>
            {filteredItems.length.toLocaleString("fa-IR")}
          </Text>

          <Text style={styles.heroTitle}>
            رسانه‌ی واجد شرایط
          </Text>

          <Text style={styles.heroSubtitle}>
            ترتیب براساس تناسب علاقه، ارزش، شهر، پلتفرم و توان تولید محتواست.
          </Text>

        </View>



        {
          filteredItems.length ? (

            filteredItems.map(
              (item,index)=>(

                <RecommendationCard
                  key={item.id}
                  item={item}
                  rank={index+1}
                  token={token}
                />

              )
            )

          ) : (

            <View style={styles.emptyCard}>

              <Text style={styles.emptyTitle}>
                نتیجه‌ای پیدا نشد
              </Text>

            </View>

          )
        }


      </ScrollView>

    </SafeAreaView>
  );
}



function RecommendationCard({
  item,
  rank,
  token,
}:{
  item: Recommendation;
  rank:number;
  token:string|null;
}) {


  const score =
    Math.round(Number(item.score));


  const initials =
    item.publisher_public_name
      .trim()
      .slice(0,2);



  async function handleInvite(){

    if(!token)
      return;


    try{

      await invitePublisher(
        token,
        item.id,
        "سلام، برای همکاری تبلیغاتی دعوت شده‌اید."
      );


      alert(
        "دعوت همکاری ارسال شد"
      );


    }catch(error){

      alert(
        error instanceof Error
        ? error.message
        : "خطا در ارسال دعوت"
      );

    }

  }



  return (

    <View style={styles.card}>


      <View style={styles.cardTop}>


        <View style={styles.scoreRing}>

          <Text style={styles.scoreNumber}>
            {score.toLocaleString("fa-IR")}
          </Text>

          <Text style={styles.scoreLabel}>
            امتیاز
          </Text>

        </View>



        <View style={styles.publisherCopy}>

          <Text style={styles.publisherName}>
            {item.publisher_public_name}
          </Text>


          <Text style={styles.publisherMeta}>
            {item.publisher_city}
            {" · "}
            {PLATFORM_LABELS[item.best_media_plan.platform]}
          </Text>


        </View>



        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initials}
          </Text>
        </View>


      </View>



      <View style={styles.planRow}>

        <Text style={styles.planValue}>
          {formatMoney(
            item.best_media_plan.price,
            item.best_media_plan.currency
          )}
        </Text>


        <Text style={styles.planLabel}>
          تعرفه رسانه
        </Text>

      </View>



      <Text style={styles.explanation}>
        {item.explanation}
      </Text>



      <Pressable
        onPress={handleInvite}
        style={styles.inviteButton}
      >

        <Text style={styles.inviteButtonText}>
          ارسال دعوت همکاری
        </Text>

      </Pressable>



      <Pressable
        onPress={() =>
          router.push(
            `/business/recommendation/${item.id}`
          )
        }
        style={styles.detailButton}
      >

        <Text style={styles.detailButtonText}>
          مشاهده جزئیات
        </Text>

      </Pressable>


    </View>

  );
}



function State({
  loading,
  text,
  onRetry
}:{
  loading?:boolean;
  text:string;
  onRetry?:()=>void;
}){

return (

<View style={styles.center}>

{
loading &&
<ActivityIndicator
size="large"
color={theme.colors.primary}
/>
}


<Text style={styles.stateText}>
{text}
</Text>


</View>

);

}



const styles = StyleSheet.create({

safeArea:{
flex:1,
backgroundColor:theme.colors.background
},


content:{
padding:theme.spacing.m
},


center:{
flex:1,
alignItems:"center",
justifyContent:"center"
},


stateText:{
...theme.typography.body
},


navRow:{
flexDirection:"row-reverse",
justifyContent:"space-between",
alignItems:"center"
},


navButton:{
width:48,
height:48,
borderRadius:24,
justifyContent:"center",
alignItems:"center",
backgroundColor:theme.colors.surface
},


navButtonText:{
fontSize:28
},


navTitle:{
...theme.typography.h3
},


navSpacer:{
width:48
},


hero:{
padding:24,
borderRadius:24,
backgroundColor:theme.colors.primaryDark,
marginVertical:20
},


heroNumber:{
fontSize:52,
fontWeight:"900",
color:"#fff"
},


heroTitle:{
...theme.typography.h2,
color:"#fff"
},


heroSubtitle:{
color:"#eee"
},


card:{
backgroundColor:theme.colors.surface,
borderRadius:24,
padding:20,
marginBottom:20
},


cardTop:{
flexDirection:"row",
alignItems:"center",
gap:12
},


scoreRing:{
width:60,
height:60,
borderRadius:30,
justifyContent:"center",
alignItems:"center",
backgroundColor:theme.colors.successSoft
},


scoreNumber:{
fontWeight:"900"
},


scoreLabel:{
fontSize:10
},


publisherCopy:{
flex:1
},


publisherName:{
fontWeight:"900",
fontSize:18
},


publisherMeta:{
color:theme.colors.primary
},


avatar:{
width:50,
height:50,
borderRadius:20,
backgroundColor:theme.colors.primarySoft,
justifyContent:"center",
alignItems:"center"
},


avatarText:{
fontWeight:"900"
},


planRow:{
marginTop:20,
padding:15,
backgroundColor:theme.colors.surfaceMuted,
borderRadius:15
},


planValue:{
fontWeight:"900"
},


planLabel:{
fontSize:12
},


explanation:{
marginTop:15
},


inviteButton:{
marginTop:20,
height:48,
borderRadius:14,
justifyContent:"center",
alignItems:"center",
backgroundColor:theme.colors.success
},


inviteButtonText:{
color:"#fff",
fontWeight:"900"
},


detailButton:{
marginTop:10,
height:48,
borderRadius:14,
justifyContent:"center",
alignItems:"center",
backgroundColor:theme.colors.primary
},


detailButtonText:{
color:"#fff",
fontWeight:"900"
},


emptyCard:{
padding:30,
alignItems:"center"
},


emptyTitle:{
fontSize:20,
fontWeight:"900"
}

});
