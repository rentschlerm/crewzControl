import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  ImageBackground,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getDeviceInfo } from '../components/DeviceUtils'; // Import the getDeviceInfo function
import CryptoJS from 'crypto-js'; // SHA-1 hashing
import { XMLParser } from 'fast-xml-parser'; // Import Fast XML Parser

const SignIn: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>('test@example.com');
  const [password, setPassword] = useState<string>('password');
  const [deviceInfo, setDeviceInfo] = useState<{ id: string; type: string; version: string } | null>(null);
  const [location, setLocation] = useState<{ longitude: string; latitude: string; accuracy: string } | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);

  // Fetch device info on component mount
  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);

      // Set mock location values for testing
      setLocation({
        longitude: '123.456', // Replace with your desired mock longitude
        latitude: '78.910',    // Replace with your desired mock latitude
        accuracy: '5.0',       // Replace with desired accuracy
      });
    };

    fetchDeviceInfo();
  }, []);
  
  const handleLogin = async () => {
    if (!deviceInfo || !location) {
      Alert.alert('Device or location information is missing');
      return;
    }
 
    const crewzControlVersion = '10'; // Hardcoded version
  
    // Get current date in MM/DD/YYYY-HH:mm format
    const currentDate = new Date();
    const formattedDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}-${currentDate.getHours()}:${currentDate.getMinutes()}`;
  
    // Create SHA-1 key
    const keyString = `${deviceInfo.id}${formattedDate}${email}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    // Construct API URL
    const url = `https://crewzcontrol.com/dev/CCService/AuthorizeEmployee.php?DeviceID=${deviceInfo.id}&DeviceType=${deviceInfo.type}&DeviceModel=${deviceInfo.type}&SoftwareVersion=${deviceInfo.version}&Date=${formattedDate}&Key=${key}&UserName=${email}&Password=${password}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}&GeoAccuracy=${location.accuracy}&Language=EN&TestFlag=1`;
  
    try {
      const response = await fetch(url);
      const data = await response.text();
  
      console.log("Raw API Response:", data);
      console.log("Constructed URL:", url);
      
      // Parse the XML response using Fast XML Parser
      const parser = new XMLParser();
      const result = parser.parse(data);
      
      console.log("Parsed XML Result:", result); // Log the parsed result
  
      // Access the required fields based on your expected XML structure
      const resultInfo = result.ResultInfo; // Adjust according to the actual root element
      if (resultInfo) {
        const resultCode = resultInfo.Result; // Check for Success or Fail
        const message = resultInfo.Message;    // Message for the user
        const authCode = resultInfo.Auth;      // 10 digit authentication code
        const companyName = resultInfo.Comp;   // Company name
        const employeeName = resultInfo.Name;   // Employee name
  
        if (resultCode === 'Success') {
          Alert.alert(`Welcome, ${email}! Your Auth Code: ${authCode}`);
          setIsInvalid(false);
          router.push('/Project'); // Navigate to the Project screen
        } else {
          Alert.alert('Login Failed', message || 'An unknown error occurred');
          setIsInvalid(true);
        }
      } else {
        Alert.alert('Error', 'Unexpected response structure from the server.');
        console.log("Parsed Result:", result);
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Login Failed', 'An error occurred during login');
      setIsInvalid(true);
    }
  };
  
  

  return (
    <ImageBackground
      source={require('../assets/images/background.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        <Image
          source={require('../assets/images/crewzControlIcon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
        {isInvalid ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Invalid Sign-in. Please Try Again.</Text>
            <TouchableOpacity style={styles.button} onPress={() => setIsInvalid(false)}>
              <Text style={styles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginContainer}>
            <Text style={styles.title}>Sign-in</Text>
            <TextInput
              style={styles.email}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus={true}
            />
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#007BFF"
                />
              </TouchableOpacity>
             
            </View>
             {/* Terms of Service and Privacy Policy Checkbox */}
             <View style={styles.checkboxContainer}>
              <Checkbox
                status={isChecked ? 'checked' : 'unchecked'}
                onPress={() => setIsChecked(!isChecked)}
              />
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.button, !isChecked && styles.disabledButton]}
              onPress={handleLogin}
              disabled={!isChecked}
            >
              <Text style={styles.buttonText}>Sign-in</Text>
            </TouchableOpacity>
            
          </View>
        )}
        {/* {deviceInfo && (
          <View>
            <Text>Device ID: {deviceInfo.id}</Text>
            <Text>Device Type: {deviceInfo.type}</Text>
            <Text>Software Version: {deviceInfo.version}</Text>
          </View>
        )}
        {location && (
          <View>
            <Text>Longitude: {location.longitude}</Text>
            <Text>Latitude: {location.latitude}</Text>
            <Text>Accuracy: {location.accuracy} meters</Text>
          </View>
        )} */}
      </View>
      <StatusBar style="auto" />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: -15
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  linkText: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
  disabledButton: {
    backgroundColor: '#cccccc', // Grey out the button when disabled
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    padding: 20, // Add padding to the container
  },
  icon: {
    width: 350, // Set a fixed width for the icon
    height: 500, // Set a fixed height for the icon to maintain aspect ratio
    marginBottom: -150, // Space between icon and login form
    marginTop: -350,
  },
  loginContainer: {
    width: '100%', // Set width to 100% of the available space
    padding: 20,
    backgroundColor: '#f9f9f9', // Background color of the container
    borderRadius: 25, // Rounded corners
    shadowColor: '#000', // Shadow color for Android
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2, // Shadow opacity for Android
    shadowRadius: 2, // Shadow radius for Android
    elevation: 5, // Elevation for iOS
  },
  email:{
    width: undefined,
    height: 50, // Adjusted for better usability
    borderColor: '#666', // Darker border color
    borderWidth: 1,
    borderRadius: 10, // Rounded corners for input fields
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#eee', // Lighter background color
  },
  errorContainer: {
    width: '100%', // Set width to 100% of the available space
    padding: 20,
    backgroundColor: '#f9f9f9', // Background color of the container
    borderRadius: 15, // Rounded corners
    alignItems: 'center', // Center items
    marginBottom: 20, // Space below the error container
  },
  errorText: {
    color: '#FF0000', // Red color for error text
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center', // Center the error text
  },
  title: {
    color: '#7B7B7B', // Fixed color to be in a valid format
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center', // Center the title
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 50, // Adjusted for better usability
    borderColor: '#666', // Darker border color
    borderWidth: 1,
    borderRadius: 10, // Rounded corners for input fields
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#eee', // Lighter background color
  },
  passwordContainer: {
    flexDirection: 'row', // Layout for input and icon
    alignItems: 'center', // Center the icon vertically with the input
  },
  eyeIcon: {
    position: 'absolute', // Position the icon absolutely within the container
    right: 10, // Space from the right edge
    bottom: 10, // Space from the bottom edge
  },
  button: {
    backgroundColor: '#20D5FF', // Button background color
    borderRadius: 15, // Rounded corners for the button
    paddingVertical: 10, // Vertical padding
    paddingHorizontal: 40, // Horizontal padding
    alignSelf: 'center', // Center the button
  },
  buttonText: {
    color: '#FFFFFF', // Button text color
    fontSize: 16, // Button text size
    textAlign: 'center', // Center the text
    fontWeight: '600',
  },
});

export default SignIn;
