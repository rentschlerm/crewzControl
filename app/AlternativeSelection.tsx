import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  Alert,
} from 'react-native';
import { Checkbox } from 'react-native-paper'; // Using react-native-paper for checkboxes
import { useLocalSearchParams, useRouter } from 'expo-router';
import LogoStyles from '../components/LogoStyles';
import CryptoJS, { SHA1 } from 'crypto-js';
import useLocation from '@/hooks/useLocation';
import { getDeviceInfo } from '../components/DeviceUtils';
import { JobsContext } from '../components/JobContext';
import { useQuotes } from '../components/QuoteContext';
import { XMLParser } from 'fast-xml-parser';

interface Alternative {
  AlternateHour: string;
  name: string;
  hours: string;
  checked?: boolean;
  details?: string;
  // alternateStatus: string;
}

const AlternativeSelection: React.FC = () => {
  const router = useRouter();
  const { updateJob, authorizationCode } = useContext(JobsContext)!;
  const [deviceInfo, setDeviceInfo] = useState<{
      softwareVersion: string | number | boolean;
      id: string;
      type: string;
      model: string;
      version: string;
    } | null>(null);
  const { quoteSerial } = useLocalSearchParams<{ quoteSerial?: string}>();
  
  console.log("Quote Serial received:", quoteSerial);
  const { serial, workPackageName, workPackageAlternates, quoteWorkPackageAlternates } = useLocalSearchParams();
  const jobIdParam = Array.isArray(serial) ? serial[0] : serial;
  const jobId = jobIdParam ? parseInt(jobIdParam, 10) : NaN;

  const { fetchQuoteDetailsFromAPI , loadingQuote } = useQuotes();
  const { refreshJobs } = useContext(JobsContext);
  const { location, fetchLocation } = useLocation();
  // const { workPackageName, workPackageAlternates } = useLocalSearchParams();

  // Parse alternates if passed via route params
  // const parsedAlternates = workPackageAlternates
  //   ? JSON.parse(Array.isArray(workPackageAlternates) ? workPackageAlternates.join('') : workPackageAlternates)
  //   : [];

  // const alternativesData: Alternative[] = parsedAlternates.map((alt: any) => ({
  //   name: alt.AlternateName || 'Unnamed Alternate',
  //   hours: alt.AlternateHour ? alt.AlternateHour.toString() : '',  // Make sure hours is a string
  //   checked: alt.AlternateStatus === '1',
  // }));
  const parsedAlternates = workPackageAlternates
  ? JSON.parse(Array.isArray(workPackageAlternates) ? workPackageAlternates.join('') : workPackageAlternates)
  : [];
 

  const parsedQuoteAlternates = quoteWorkPackageAlternates
    ? JSON.parse(
        Array.isArray(quoteWorkPackageAlternates)
          ? quoteWorkPackageAlternates.join('')
          : quoteWorkPackageAlternates
      )
    : [];
  

// Match alternates by serial and merge extra info like WPAlternateName
const alternativesData: Alternative[] = parsedAlternates.map((alt: any) => {
  // const quoteAlt = parsedQuoteAlternates.find((qa: any) => qa.WPAlternateSerial === alt.WPAlternateSerial);
//   console.log('Matching alt:', alt);
// console.log('Found quoteAlt:', quoteAlt);
// console.log('quoteAlt for', alt.WPAlternateName, alt);
// console.log(
//   'Raw WPAlternateItem:',
//   alt?.WPAlternateDetail?.WPAlternateItem
// );
  //RHCM 5/08/2025
   // Normalize WPAlternateItem into an array
  // let detailItems: string[] = [];
  // if (alt?.WPAlternateDetail?.WPAlternateItem) {
  //   if (Array.isArray(alt.WPAlternateDetail.WPAlternateItem)) {
  //     detailItems = alt.WPAlternateDetail.WPAlternateItem;
  //   } else {
  //     detailItems = [alt.WPAlternateDetail.WPAlternateItem];
  //   }
  // }

  return {
    name: alt.AlternateName || alt.WPAlternateName || 'Unnamed Alternative',
    hours: alt.WPAlternateHour ? alt.WPAlternateHour.toString() : '',
    checked: alt.AlternateStatus === 1 || alt.WPAlternateStatus === 1,
    details: alt?.WPAlternateDetail?.WPAlternateItem, // Use WPAlternateDetail if available
    
    // details: detailItems, // Use the normalized detail items
  };
});

//RHCM 08/18/2025
//added handleBack function to refresh jobs when navigating back
 const handleBack = async () => {
    await refreshJobs();   // Call API again
    router.back();         // Then navigate back
  };

  const [alternatives, setAlternatives] = useState<Alternative[]>(alternativesData);
  
    useEffect(() => {
      console.log("Serial:", quoteSerial);
      const fetchDeviceInfo = async () => {
        const info = await getDeviceInfo();
        setDeviceInfo(info);
        fetchLocation();
      };
      fetchDeviceInfo();
    
  }, []);
  // console.log('Initial Alternatives State:', alternatives);
  useEffect(() => {
    
  }, [alternatives]); 

  const toggleCheckbox = (index: number) => {
    const updatedAlternatives = [...alternatives];
    updatedAlternatives[index].checked = !updatedAlternatives[index].checked;
    setAlternatives(updatedAlternatives);
  };
  //RHCM 5/08/2025
  //Commented out the previous save function
  //--------------------------------------Start of------------------------------------------------
  // const handleSave = () => {
  //   const selectedAlternatives = alternatives.filter((item) => item.checked);
  //   console.log('Selected Alternatives:', selectedAlternatives);
  //   router.back();
  // };
  //---------------------------------------End of-------------------------------------------------
  // RHCM 5/08/2025
  //Added API call to the UpdateResourceOption endpoint
  //---------------------------------------Start of-----------------------------------------------
  const handleSave = async () => {
  try {
    if (!alternatives || !parsedAlternates || !authorizationCode || !deviceInfo || !location) {
      Alert.alert("Error", "Missing required data: alternatives, parsedAlternates, or authorization code.");
      return;
    }

    console.log("Parsed Alternates:", parsedAlternates);

    // 🔹 Format selected alternatives
    const selectedAlternatives = alternatives.map((item, index) => ({
      serial: parsedAlternates[index]?.WPAlternateSerial || "",
      checked: item.checked ? "1" : "0",
       hours: item.hours || "0" ,
    }));

    const listParam = selectedAlternatives
      .filter((item) => item.serial) // Remove empty serials
      .map((item) => `${item.serial}-${item.checked}`)
      .join(",");

    console.log("List Param:", listParam);

    const hourParam = selectedAlternatives
      .filter((item) => item.serial) // remove empty serials
      .map((item) => {
        // Ensure hours is valid decimal string
        const normalizedHours = isNaN(parseFloat(item.hours)) ? "0" : parseFloat(item.hours).toString();
        return `${item.serial}-${normalizedHours}`;
      })
      .join(",");

    console.log("Hour Param:", hourParam);

    if (!listParam) {
      Alert.alert("Error", "No valid alternatives selected.");
      return;
    }

    // 🔹 Device info and version
    const deviceId = deviceInfo.id || "defaultDeviceId";
    const crewzControlVersion = "1";

    // 🔹 Format date
    const now = new Date();
    const formattedDate = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(
      now.getDate()
    ).padStart(2, "0")}/${now.getFullYear()}-${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    // 🔹 Generate secure key
    const keyString = `${deviceId}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();

    // 🔹 Build Update URL
    const updateUrl = `https://CrewzControl.com/dev/CCService/UpdateResourceOption.php?DeviceID=${encodeURIComponent(
      deviceId
    )}&Date=${encodeURIComponent(formattedDate)}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}&Action=add&List=${listParam}&Hour=${hourParam}`;

    console.log("Update Resource Option URL:", updateUrl);

    // 🔹 Make Update API request
    const updateResponse = await fetch(updateUrl);
    const updateData = await updateResponse.text();
    console.log("Update API Response:", updateData);

    const updateParser = new XMLParser();
    const updateResult = updateParser.parse(updateData);

    if (updateResult.ResultInfo?.Result === "Success") {
      console.log("✅ Resource options updated successfully.");

      // 🔹 Now fetch updated Quote (like handleProceed)
      console.log("🔄 Fetching updated quote...");
      const fetchUrl = `https://CrewzControl.com/dev/CCService/GetQuote.php?DeviceID=${encodeURIComponent(
        deviceId
      )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Serial=${quoteSerial}&Longitude=${location.longitude}&Latitude=${location.latitude}`;

      console.log("GetQuote URL:", fetchUrl);

      const fetchResponse = await fetch(fetchUrl);
      const fetchData = await fetchResponse.text();

      console.log("GetQuote API Response:", fetchData);

      const fetchParser = new XMLParser();
      const fetchResult = fetchParser.parse(fetchData);

      if (fetchResult.ResultInfo?.Result === "Success") {
        console.log("Fetched updated quote data:", fetchResult.ResultInfo.Selections.Quote);

        router.push({
          pathname: "/ProjectUpdate",
          params: { job: JSON.stringify(fetchResult.ResultInfo.Selections.Quote) },
        });
      } else {
        Alert.alert("Error", fetchResult.ResultInfo?.Message || "Failed to fetch updated quote details.");
      }
    } else {
      Alert.alert("Error", updateResult.ResultInfo?.Message || "Failed to update resource options.");
    }
  } catch (error) {
    console.error("❌ Save failed:", error);
    Alert.alert("Error", "An unexpected error occurred while saving.");
  }
};
  //-------------------------------------End of---------------------------------------------------


  const handleHoursChange = (text: string, alt: { hours: string }) => {
    const updatedHours = text.replace(/[^0-9]/g, ''); // Allow only numeric values
    alt.hours = updatedHours; // Update the value in the `alt` object
    setAlternatives((prev) => [...prev]); // Trigger a re-render (if using state or context)
  };
  

  return (
    <ImageBackground
      source={require('../assets/images/background.png')}
      style={styles.background}
    >
      <Image
        source={require('../assets/images/crewzControlIcon.png')}
        style={LogoStyles.logo}
        resizeMode="contain"
      />

      <View style={styles.mainDiv}>
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {workPackageName || 'Work Package'}
            </Text>
          </View>

          <Text style={styles.subtitle}>Available Alternatives:</Text>

          {alternatives.length > 0 ? (
            alternatives.map((alt, index) => {
              // console.log('Rendering alt:', alt);  // Log alt to ensure data is correctly passed
              return (
                <View key={index} style={{ marginBottom: 15 }}>
                   <View style={styles.row}>
                  <View style={styles.checkboxContainer}>
                    <View style={styles.checkboxWrapper}>
                    <Checkbox
                      status={alt.checked ? 'checked' : 'unchecked'}
                      onPress={() => toggleCheckbox(index)}
                      color="#007BFF"
                      uncheckedColor="#666"
                    />
                    </View>
                    </View>
                  {/* <Checkbox
                    status={alt.checked ? 'checked' : 'unchecked'}
                    onPress={() => toggleCheckbox(index)}
                  /> */}
                  <Text style={styles.altText}>{alt.name}</Text>
                      {/*RHCM 5/08/2025 */}
                      {/* NEW: Render WPAlternateDetail items */}
                      
                      {/* {alt.details?.map((detail, dIdx) => (
                        <Text
                          key={dIdx}
                          style={[styles.altDetailText, { paddingLeft: 20, color: '#555' }]}
                        >
                          {detail}
                        </Text>
                      ))} */}
                  {/* Check if hours are rendered correctly */}
                  <View style={styles.hoursField}>
                    <TextInput
                      style={styles.hoursText}
                      value={alt.hours} // Bind the `alt.hours` state
                      onChangeText={(text) => handleHoursChange(text, alt)} // Handle text changes
                      editable={true} // Enable editing
                      selectTextOnFocus={true} // Allow text selection
                      keyboardType="numeric" // Use a numeric keyboard for hours input
                    />
                    <Text style={styles.unitText}>
                      {alt.hours === '1' ? 'hr' : 'hrs'}
                    </Text>
                  </View>
                </View>
                {Array.isArray(alt.details) &&
                        alt.details.map((item: string, idx: number) => (
                          <Text
                            key={idx}
                            style={[styles.workPackageSubTitle, { paddingLeft: 70 }]}
                          >
                            {item}
                          </Text>
                        ))
                      }
                </View>
              );
            })
          ) : (
            <Text>No alternatives available.</Text>
          )}
          


          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};


const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workPackageSubTitle:{
  fontSize: 14,
  color: '#555',
  paddingLeft: 50, // indent so it's visually linked to the main row
  marginTop: -5,
  },
  
  checkboxWrapper: {
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 4,
    justifyContent: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15,
    marginTop: 15,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  hoursField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginLeft: 10,
    minWidth: 80,
    backgroundColor: '#f9f9f9',
  },
  hoursText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 5,
  },
  mainDiv: {
    width: '90%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 40
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    color: '#007BFF',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  serviceLabel: {
    fontSize: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  altDetailText: {
  fontSize: 12,
  color: '#666',
},
  altText: {
    flex: 1,
    fontSize: 16,
  },
  hoursInput: {
    width: 80,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  cancelButton: {
    backgroundColor: '#20D5FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: '#20D5FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default AlternativeSelection;
