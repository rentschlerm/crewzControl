import React, { useState, useEffect, useContext } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import CryptoJS from 'crypto-js';
import { XMLParser } from 'fast-xml-parser';
import { JobsContext } from '../components/JobContext'; // Import the context
import AsyncStorage from '@react-native-async-storage/async-storage';

const SecurityCodeScreen: React.FC = () => {
  const router = useRouter();
  const { deviceInfo, location } = useLocalSearchParams();
  const [securityCode, setSecurityCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { setAuthorizationCode } = useContext(JobsContext); // Get the function to update authorizationCode

  useEffect(() => {
    if (!deviceInfo || !location || Array.isArray(deviceInfo) || Array.isArray(location)) {
      Alert.alert('Error', 'Device information is missing.');
      router.back();
    }
  }, [deviceInfo, location]);

  const handleCodeSubmit = async () => {
    if (!deviceInfo || !location || Array.isArray(deviceInfo) || Array.isArray(location)) return;

    const parsedDeviceInfo = JSON.parse(deviceInfo);
    const parsedLocation = JSON.parse(location);

    // JCM 04/30/2025: Updated the location condition. It will first check if the hook has returned location data such as longitude and latitude. If the location hook has returned null, then it will check the AsyncStorage if it has location data. If AsyncStorage has no location data, it will then trigger the error alert "Please allow CrewzControl to access your location.", else, it will assign values to the location variables to be used for the API URL.
    // ================================================================ 
    let longitude = parsedLocation?.longitude;
    let latitude = parsedLocation?.latitude;

    if (!longitude || !latitude) {
      const storedLocation = await AsyncStorage.getItem('location');
      if (storedLocation) {
        const parsedLocation = JSON.parse(storedLocation);
        longitude = parsedLocation.longitude;
        latitude = parsedLocation.latitude;
      } else {
        Alert.alert('Please allow CrewzControl to access your location.');
        return;
      }
    }
   // ================================================================ 

    setIsLoading(true);

    try {
      const currentDate = new Date();
      const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
      const keyString = `${parsedDeviceInfo.id}${formattedDate}`;
      const key = CryptoJS.SHA1(keyString).toString();

      const url = `https://crewzcontrol.com/dev/CCService/AuthorizeDeviceID.php?DeviceID=${encodeURIComponent(
        parsedDeviceInfo.id
      )}&Date=${formattedDate}&Key=${key}&CrewzControlVersion=10&SecurityCode=${securityCode}&Longitude=${longitude}&Latitude=${latitude}`;
      console.log(`${url}`);
      const response = await fetch(url);
      const data = await response.text();

      const parser = new XMLParser();
      const result = parser.parse(data);

      const resultInfo = result?.ResultInfo;

      if (resultInfo) {
        const resultCode = resultInfo.Result;
        const message = resultInfo.Message;

        if (resultCode === 'Success') {
          const authorizationCode = resultInfo.Auth; // Extract the Auth code
          await AsyncStorage.setItem('authorizationCode', authorizationCode); // Save the authorizationCode to AsyncStorage
          await AsyncStorage.setItem('location', location); // Save the authorizationCode to AsyncStorage
          setAuthorizationCode(authorizationCode); // Update the context
          router.push('/Project');
        } else {
          Alert.alert('Authorization Failed', message || 'An unknown error occurred');
        }
      } else {
        Alert.alert('Authorization Failed', 'The server response was not in the expected format.');
      }
    } catch (error) {
      console.error('Error during authorization:', error);
      Alert.alert('Authorization Failed', 'An error occurred during authorization');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <ImageBackground source={require('../assets/images/background.png')} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Enter Security Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter security code"
          value={securityCode}
          onChangeText={setSecurityCode}
          keyboardType="number-pad"
        />
        <TouchableOpacity style={styles.button} onPress={handleCodeSubmit} disabled={isLoading}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        
        {isLoading && <ActivityIndicator size="large" color="#ffffff" style={styles.loading} />}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  background: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loading: {
    marginTop: 20,
  },
});

export default SecurityCodeScreen;
