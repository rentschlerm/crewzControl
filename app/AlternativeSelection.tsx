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
import { JobsContext } from '@/components/JobContext';
import { XMLParser } from 'fast-xml-parser';

interface Alternative {
  AlternateHour: string;
  name: string;
  hours: string;
  checked?: boolean;
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
  
    const { location, fetchLocation } = useLocation();
  const { workPackageName, workPackageAlternates } = useLocalSearchParams();

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
  const { quoteWorkPackageAlternates } = useLocalSearchParams();

  const parsedQuoteAlternates = quoteWorkPackageAlternates
    ? JSON.parse(
        Array.isArray(quoteWorkPackageAlternates)
          ? quoteWorkPackageAlternates.join('')
          : quoteWorkPackageAlternates
      )
    : [];
  

// Match alternates by serial and merge extra info like WPAlternateName
const alternativesData: Alternative[] = parsedAlternates.map((alt: any) => {
  const quoteAlt = parsedQuoteAlternates.find((qa: any) => qa.AlternateSerial === alt.AlternateSerial);

  return {
    name: alt.AlternateName || alt.WPAlternateName || 'Unnamed Alternative',
    hours: alt.AlternateHour ? alt.AlternateHour.toString() : '',
    checked: alt.AlternateStatus === '1' || alt.WPAlternateStatus === '1',
  };
});

  const [alternatives, setAlternatives] = useState<Alternative[]>(alternativesData);
  
    useEffect(() => {
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
        Alert.alert('Missing required data: alternatives, parsedAlternates, or authorizationCode');
        return;
      }
      // else if (!location){
      //   Alert.alert('Missing location');
      //   return;
      // }
  
      // 🔹 Format selected alternatives
      const selectedAlternatives = alternatives.map((item, index) => ({
        serial: parsedAlternates[index]?.AlternateSerial || '',
        checked: item.checked ? '1' : '0',
      }));
  
      const listParam = selectedAlternatives
        .filter(item => item.serial) // Remove empty serials
        .map(item => `${item.serial}-${item.checked}`)
        .join(',');
  
      if (!listParam) {
        Alert.alert('No valid alternatives selected.');
        return;
      }
  
      // 🔹 Device info and version
      const deviceId = deviceInfo.id || 'defaultDeviceId';
      const crewzControlVersion = '1';
  
      // 🔹 Format date
      const now = new Date();
      const formattedDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
      // 🔹 Generate secure key
      const keyString = `${deviceId}${formattedDate}${authorizationCode}`;
      const key = CryptoJS.SHA1(keyString).toString();
  
      // 🔹 Build request URL
      const url = `https://CrewzControl.com/dev/CCService/UpdateResourceOption.php?DeviceID=${encodeURIComponent(
        deviceId
      )}&Date=${encodeURIComponent(formattedDate)}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}&List=${listParam}`;
  
      console.log('Request URL:', url);
  
      // 🔹 Make API request
      const response = await fetch(url);
      const resultText = await response.text();
  
      console.log('API Response:', resultText);
  
      const parser = new XMLParser();
      const result = parser.parse(resultText);
  
      if (result.ResultInfo?.Result === 'Success') {
        console.log('✅ Resource options updated successfully.');
        router.back(); // navigate back on success
      } else {
        Alert.alert('Error', result.ResultInfo?.Message || 'Failed to update resource options.');
      }
    } catch (error) {
      console.error('❌ Save failed:', error);
      Alert.alert('Error', 'An unexpected error occurred while saving.');
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
            <TouchableOpacity onPress={() => router.back()}>
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
                <View key={index} style={styles.row}>
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
