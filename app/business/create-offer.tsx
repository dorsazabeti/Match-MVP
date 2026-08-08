import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { useEffect, useState } from "react";
import { router } from "expo-router";

import { theme } from "../../src/theme";

import {
  createOffer,
  getOfferOptions,
} from "../../src/services/offers";

import { useAuthStore } from "../../src/store/auth";

import type {
  CategoryOption,
  SelectOption,
} from "../../src/types/publisherOnboarding";

import type {
  RewardType,
} from "../../src/types/offers";



export default function CreateOfferScreen(){


const token =
useAuthStore(
state=>state.token
);



const [categories,setCategories]
=
useState<CategoryOption[]>([]);



const [rewardTypes,setRewardTypes]
=
useState<SelectOption<RewardType>[]>([]);



const [categoryId,setCategoryId]
=
useState("");



const [rewardType,setRewardType]
=
useState<RewardType>("PRODUCT");



const [title,setTitle]
=
useState("");

const [description,setDescription]
=
useState("");

const [value,setValue]
=
useState("");

const [units,setUnits]
=
useState("1");

const [quantity,setQuantity]
=
useState("20");

const [notes,setNotes]
=
useState("");



const [loading,setLoading]
=
useState(false);




useEffect(()=>{


async function load(){

try{

const options =
await getOfferOptions();


setCategories(
options.categories
);


setRewardTypes(
options.reward_types as SelectOption<RewardType>[]
);



if(options.categories.length){

setCategoryId(
options.categories[0].id
);

}


}catch{

Alert.alert(
"خطا",
"دریافت اطلاعات اولیه ناموفق بود"
);

}

}


load();


},[]);






async function submit(){


if(!token){

Alert.alert(
"خطا",
"دوباره وارد شوید"
);

return;

}



try{


setLoading(true);



await createOffer(

token,

{


category_id:
categoryId,


title,


description,


reward_type:
rewardType,



retail_value:
rewardType==="CASH"
?
null
:
Number(value),



cash_amount:
rewardType==="CASH"
?
Number(value)
:
null,



currency:
"IRR",



units_per_deal:
Number(units),



available_quantity:
Number(quantity),



fulfillment_notes:
notes || null,



remotely_fulfillable:
false,



expires_at:
null,


}

);



Alert.alert(
"موفق",
"کمپین ثبت شد"
);



router.replace("/business");



}catch(error){


Alert.alert(
"خطا",
error instanceof Error
?
error.message
:
"خطا در ثبت کمپین"
);



}
finally{

setLoading(false);

}



}




return (

<ScrollView
contentContainerStyle={styles.container}
>


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
placeholder="توضیحات کمپین"
value={description}
onChangeText={setDescription}
multiline
style={[
styles.input,
styles.area
]}
/>




<Text style={styles.label}>
دسته بندی
</Text>


<View style={styles.row}>

{
categories.map(cat=>(

<TouchableOpacity

key={cat.id}

onPress={()=>
setCategoryId(cat.id)
}

style={[
styles.chip,
categoryId===cat.id &&
styles.active
]}

>

<Text>
{cat.name}
</Text>


</TouchableOpacity>


))
}


</View>





<Text style={styles.label}>
نوع جایزه
</Text>


<View style={styles.row}>

{
rewardTypes.map(item=>(


<TouchableOpacity

key={item.value}

onPress={()=>
setRewardType(item.value)
}


style={[
styles.chip,
rewardType===item.value &&
styles.active
]}


>

<Text>
{item.label}
</Text>


</TouchableOpacity>


))
}


</View>





<TextInput

placeholder="ارزش محصول / مبلغ"

value={value}

onChangeText={setValue}

keyboardType="numeric"

style={styles.input}

/>




<TextInput

placeholder="تعداد هر همکاری"

value={units}

onChangeText={setUnits}

keyboardType="numeric"

style={styles.input}

/>



<TextInput

placeholder="تعداد کل موجودی"

value={quantity}

onChangeText={setQuantity}

keyboardType="numeric"

style={styles.input}

/>





<TextInput

placeholder="توضیحات ارسال یا شرایط"

value={notes}

onChangeText={setNotes}

style={styles.input}

/>





<TouchableOpacity

style={styles.button}

onPress={submit}

disabled={loading}

>


{
loading
?
<ActivityIndicator color="white"/>
:
<Text style={styles.buttonText}>
ثبت کمپین
</Text>

}


</TouchableOpacity>



</ScrollView>

);


}




const styles =
StyleSheet.create({

container:{
flexGrow:1,
justifyContent:"center",
padding:24,
backgroundColor:
theme.colors.background
},


title:{
...theme.typography.h1,
textAlign:"center",
marginBottom:25
},


label:{
textAlign:"right",
marginBottom:10
},


input:{
backgroundColor:
theme.colors.surface,
borderWidth:1,
borderColor:
theme.colors.border,
borderRadius:12,
padding:14,
marginBottom:15,
textAlign:"right"
},


area:{
height:120
},


row:{
flexDirection:"row",
flexWrap:"wrap",
gap:8,
marginBottom:20
},


chip:{
padding:10,
borderWidth:1,
borderColor:"#ddd",
borderRadius:20
},


active:{
borderColor:
theme.colors.primary,
backgroundColor:
theme.colors.primarySoft
},


button:{
backgroundColor:
theme.colors.primary,
padding:16,
borderRadius:12,
alignItems:"center"
},


buttonText:{
color:"white",
fontWeight:"bold"
}


});
