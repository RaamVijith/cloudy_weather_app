import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView} from "react-native";
import { Image } from "react-native";
import { theme } from "../../theme";
import { MagnifyingGlassIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { CalendarDaysIcon, MapPinIcon } from 'react-native-heroicons/solid'
import { debounce } from "lodash";
import {fetchWeatherForecast, fetchLocations} from '../api/weather';
import { weatherImages } from "../constant";
import * as Progress from 'react-native-progress';
import { getData, storeData } from "../utils/asyncStorage";

const HomeScreen = ()=>{
    const [showSearchBar,setShowSearchBar] = useState(false);
    const [locations, setLocations] = useState([]);
    const [weather, setWeather] = useState({})
    const [loading, setLoading] = useState(true);


    const handleLocation = loc=>{
        console.log('location',loc)
        setLoading(true);
        setShowSearchBar(false);
        setLocations([]);
        fetchWeatherForecast({
          cityName: loc.name,
          days: '7'
        }).then(data=>{
          setLoading(false);
          setWeather(data);
          storeData('city',loc.name);
        })
      }

    const handleSearch = value=>{
        if(value.length>2)
        fetchLocations({cityName: value}).then(data=>{
       //console.log('got locations: ',data);
         setLocations(data);
    })
    }

    useEffect(()=>{
        fetchMyWeatherData();
      },[]);
    
      const fetchMyWeatherData = async ()=>{
        let myCity = await getData('city');
        let cityName = 'Islamabad';
        if(myCity){
          cityName = myCity;
        }
        fetchWeatherForecast({
          cityName,
          days: '7'
        }).then(data=>{
          // console.log('got data: ',data.forecast.forecastday);
          setWeather(data);
          setLoading(false);
        })
        
      }
    
      const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);
    
      const {location, current} = weather;

    return(
        <View style={styles.container}>
            <StatusBar style='light' />
            <Image blurRadius={70} style={styles.bg_img} source={require('../../assets/images/bg.png')} />

            {
                loading? (
                    <View style ={{flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                    <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
                    </View>
                ):(
                   
            <SafeAreaView style={styles.sf_View}>
                {/** Search View */}
                <View style={styles.search_container}>
                    <View style={[styles.search_container1, {backgroundColor: showSearchBar? theme.bgWhite(0.2) : 'transparent' }]} >
                        
                         {
                        showSearchBar? (
                            <TextInput 
                            onChangeText={handleTextDebounce}
                            placeholder="Search city" 
                            placeholderTextColor={'lightgray'} 
                            style={styles.search_text_input}
                            />
                        ):null
                         }

                         <TouchableOpacity 
                            style={styles.search_touchable_opacity} 
                            onPress={()=>setShowSearchBar(!showSearchBar)}    >
                             <MagnifyingGlassIcon size="25" color="white" />
                         </TouchableOpacity>

                    </View>      
                    {/**Search Sugesion View */}
                    {locations.length>0 && showSearchBar? (
                        <View style={styles.search_sug}>
                        {
                            locations.map((loc,index)=>{
                                let showBorder = index + 1 !== locations.length;
                                let borderStyle = {
                                    borderBottomWidth: showBorder ? 2 : 0,
                                    borderBottomColor: 'gray',
                                };
                                return(
                                <TouchableOpacity 
                                    key={index} 
                                    style={[styles.search_sug_touchable,borderStyle]}
                                    onPress={()=>handleLocation(loc)}>

                                    <MapPinIcon size="20" color="gray" />
                                    <Text style={styles.search_sug_text}>{loc?.name}, {loc?.country}</Text>
                                </TouchableOpacity>
                                )
                            })
                        }
                        </View>

                    ): null}


                </View>
                
                {/**Forecast section */}
                <View style={styles.forecast_view}>
                    <Text style={styles.forecast_Text1}> {location?.name} ,                        
                        <Text style={styles.forecast_Text2}>{location?.country}</Text>
                    </Text>
                    <View style={{justifyContent:'center',flexDirection:'row'}}>
                        <Image 
                                  source={weatherImages[current?.condition?.text || 'other']} 
                                style={{width:280,height:280}} />

                    </View>
                    <View style={{marginTop:8}}>
                        <Text  style={{textAlign:'center', fontWeight:'bold',color:'white',fontSize:60, marginLeft:20} }>{current?.temp_c}&#176;</Text>
                        <Text  style={{textAlign:'center', fontWeight:'300',color:'white',fontSize:20} }>{current?.condition?.text}</Text>
                    </View>
                        {/**Other state */}
                    <View style={{display:'flex', flexDirection:'row', justifyContent:'space-around'}}>
                        <View style={{alignItems:'center', flexDirection:'row',marginHorizontal:8}}>
                           <Image source={require('../../assets/icons/wind.png')} style={{width:24,height:24,marginRight:4}}  />
                            <Text style={{color:'white',fontSize:24}}>{current?.wind_kph}km</Text>
                        </View>

                        <View style={{alignItems:'center', flexDirection:'row',marginHorizontal:8}}>
                            <Image source={require('../../assets/icons/drop.png')} style={{width:24,height:24,marginRight:4}} />
                            <Text style={{color:'white',fontSize:24}}>{current?.humidity}%</Text>
                        </View>

                        <View style={{alignItems:'center', flexDirection:'row',marginHorizontal:8}}>
                            <Image source={require('../../assets/icons/sun.png')} style={{width:24,height:24,marginRight:4}} />
                            <Text style={{color:'white',fontSize:24}}>{ weather?.forecast?.forecastday[0]?.astro?.sunrise }</Text>
                        </View>
                    </View>
                    </View>

                {/** Forecast date */}
                <View style={{marginBottom:8, marginTop:12}}>
                <View style={{justifyContent:'flex-start',marginLeft:24, flexDirection:'row',alignItems:'center'}}>
                    <CalendarDaysIcon size="22" color="white"  />
                    <Text  style={{textAlign:'center', fontWeight:'300',color:'white',fontSize:20,marginLeft:8} }>Calander</Text>
                </View>
                <ScrollView   
                  horizontal
                  contentContainerStyle={{paddingHorizontal: 15}}
                  showsHorizontalScrollIndicator={false}
                >
                 {
                    weather?.forecast?.forecastday?.map((item,index)=>{
                      const date = new Date(item.date);
                      const options = { weekday: 'long' };
                      let dayName = date.toLocaleDateString('en-US', options);
                      dayName = dayName.split(',')[0];

                      return (
                        <View key={index} style={{backgroundColor: theme.bgWhite(0.15),display:'flex',justifyContent:'center',alignItems:'center',width:96, borderRadius:20, paddingVertical:12, marginVertical:4, marginRight:16}} >
                          <Image 
                          source={weatherImages[item?.day?.condition?.text || 'other']} 
                          style={{width:24,height:24,marginRight:4}} />
                          <Text style={{color:'white'}}>{dayName}</Text>
                          <Text style={{color:'white', fontSize:24, fontWeight:'500'}}>
                          {item?.day?.avgtemp_c}&#176;
                          </Text>
                        </View>
                      )
                    })
                  }
                         
                        
                </ScrollView>
                </View>
                

            </SafeAreaView>
                )
            }
           

        </View>
    )
}

export default HomeScreen;


const styles = StyleSheet.create({
    container: {
        flex:1,
        position:'relative'
    },
    bg_img: {
        width: '100%',
        height: "100%",
        position: 'absolute'
      },
    sf_View:{
        display:'flex',
        flex:1,   
    },
    search_container:{
        height:'7%',
        marginHorizontal:24,
        marginTop:'10%',
        zIndex:50,
        position:'relative',
    },
    search_container1:{
       flexDirection:'row',
       justifyContent:'flex-end',
       alignItems:'center',
       borderRadius:999        
    },
    search_text_input:{
      paddingLeft:24,
      height:40,
      paddingBottom:4,
      flex:1,
      fontSize:16,
      color:'white'
    },
    search_touchable_opacity:{
        margin:4,
        padding:9,
        backgroundColor: theme.bgWhite(0.3),
        borderRadius:999
    },
    search_sug:{
        position:'absolute',
        width:'100%',
        top:54,
        backgroundColor:'rgb(209 213 219)',
        borderRadius:30      
    },
    search_sug_touchable:{
        flexDirection:'row',
        alignItems:'center',
        borderWidth:0,
        padding:12,
        paddingHorizontal:18,
        marginBottom:4,
    },
    search_sug_text:{
        fontSize:15,
        marginLeft:8,
        color:'black'
    },
    forecast_view:{
        display:'flex',
        justifyContent:'space-around',
        flex:1,
        marginHorizontal:16,
        marginBottom:8,

    },
    forecast_Text1:{
        textAlign:'center',
        color:'white',
        fontWeight:'bold',
        fontSize:24
    },
    forecast_Text2:{
        textAlign:'center',
        color:'gray',
        fontWeight:'300',
        fontSize:24
    }


});