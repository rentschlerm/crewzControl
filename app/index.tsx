import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  ImageBackground,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getDeviceInfo } from '../components/DeviceUtils';
import CryptoJS from 'crypto-js';
import { XMLParser } from 'fast-xml-parser';
import LogoStyles from '../components/LogoStyles';
import useLocation from '../hooks/useLocation'; // Import the custom hook

// JCM 01/17/2025: Import AsyncStorage to be used for user redirection
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JobsContext } from '../components/JobContext';

const SignIn: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [deviceInfo, setDeviceInfo] = useState<{
    softwareVersion: string | number | boolean;
    id: string;
    type: string;
    model: string;
    version: string;
  } | null>(null);
  const { location, fetchLocation } = useLocation(); // Use the custom hook
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { setAuthorizationCode } = useContext(JobsContext); // Get the function to update authorizationCode

  // Fetch device info and location on component mount
  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
      await fetchLocation();
    };

    
    // JCM 01/18/2025: Added a checking when an app is loaded. If there's an authorizationCode, redirected the user to the /Project screen directly.
    const checkAuthorizationCode = async () => {
      try {
        const authorizationCode = await AsyncStorage.getItem('authorizationCode');
        // console.log('AuthorizationCode:', authorizationCode);
        if (authorizationCode) {
          // Redirect to Project screen if authorizationCode exists
          setAuthorizationCode(authorizationCode); 
          router.push('/Project');
        } else {
          setIsLoading(false); 
        }
      } catch (error) {
        console.error('Error checking AsyncStorage:', error);
        setIsLoading(false);
      }
    };

    checkAuthorizationCode();

    // JCM 01/18/2025: Function to delete data from AsyncStorage
    // const deleteItem = async (key: string) => {
    //   try {
    //     await AsyncStorage.removeItem(key);
    //     console.log(`${key} has been removed from AsyncStorage`);
    //   } catch (error) {
    //     console.error(`Error removing ${key} from AsyncStorage:`, error);
    //   }
    // };
    
    // // Usage
    // deleteItem('authorizationCode');

    fetchDeviceInfo();
    // fetchLocation(); // Fetch location using the custom hook
  }, []);

  const handleLogin = async () => {
    if (!deviceInfo) {
      // Alert.alert('Device information is loading');
      return;
    }
     if (!location) {
    setIsLoading(true);
    await fetchLocation();

    if (!location) {
      setIsLoading(false);
      // Alert.alert('Error', 'CrewzControl is still fetching your location. Please try again');
      Alert.alert(
        'Error',
        'CrewzControl is still fetching your location. Please try again.',
        [
          {
            text: 'Try Again',
            // onPress: () => fetchLocation(), // Retry fetching location
            style: 'default'
          }
        ],
        { cancelable: true }
      );
      return;
    }
  }

    setIsLoading(true);

    const crewzControlVersion = '10';
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    const keyString = `${deviceInfo.id}${formattedDate}`;
    const key = CryptoJS.SHA1(keyString).toString();

    const validEmail = email ?? ''; // Use an empty string if email is undefined
    const validPassword = password ?? ''; // Use an empty string if password is undefined
                        
    const url = `https://crewzcontrol.com/dev/CCService/AuthorizeEmployee.php?DeviceID=${encodeURIComponent(deviceInfo.id)}&DeviceType=${encodeURIComponent(deviceInfo.type)}&DeviceModel=${encodeURIComponent(deviceInfo.model)}&DeviceVersion=${encodeURIComponent(deviceInfo.version)}&SoftwareVersion=${encodeURIComponent(deviceInfo.softwareVersion)}&Date=${formattedDate}&Key=${key}&UserName=${encodeURIComponent(validEmail)}&Password=${encodeURIComponent(validPassword)}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}&Language=EN&GeoAccuracy=${location.accuracy}&TestFlag=1`;
    console.log(url);
    try {
      const response = await fetch(url);
      const data = await response.text();

      const parser = new XMLParser();
      const result = parser.parse(data);
      const resultInfo = result.ResultInfo;
      
      if (resultInfo) {
        const resultCode = resultInfo.Result;
        const message = resultInfo.Message;
        const name = resultInfo.Name;

        if (resultCode === 'Success') {
          Alert.alert(`Welcome, ${name}!`, message);
          setIsInvalid(false);
          router.push({
            pathname: '/SecurityCodeScreen',
            params: {
              deviceInfo: JSON.stringify(deviceInfo),
              location: JSON.stringify(location),
            },
          });
        } else {
          Alert.alert('Login Failed', message || 'An unknown error occurred');
          setIsInvalid(true);
        }
      } else {
        Alert.alert('Error', 'Unexpected response structure from the server.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Login Failed', 'An error occurred during login');
      setIsInvalid(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/images/background.png')} style={styles.background}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <View style={{ flex: 1 }}>
    <View style={styles.container}>
      <Image source={require('../assets/images/crewzControlIcon.png')} style={LogoStyles.logo} resizeMode="contain" />
      {!location && (
        <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 10 }}>
          Fetching location...
        </Text>
      )}
      {isLoading ? (
        <ActivityIndicator size="large" color="#ffffff" style={[styles.loading, { transform: [{ scale: 2 }] }]} />
      ) : (
        isInvalid ? (
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
              placeholder="Username"
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
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#007BFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkboxWrapper}>
                <Checkbox
                  status={isChecked ? 'checked' : 'unchecked'}
                  onPress={() => setIsChecked(!isChecked)}
                  color="#007BFF"
                  uncheckedColor="#666"
                />
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text style={styles.linkText} onPress={() => Linking.openURL('https://crewzcontrol.com/CrewzControlEndUserLicenseAgreement.htm')}>
                  Terms of Service
                </Text>{' '}and{' '}
                <Text style={styles.linkText} onPress={() => Linking.openURL('https://crewzcontrol.com/CrewzControlPrivacyPolicy.htm')}>
                  Privacy Policy
                </Text>.
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
        )
      )}
    </View>
    <StatusBar style="auto" />
  </View>
</TouchableWithoutFeedback>

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
    marginLeft: -15,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10
  },
  checkboxWrapper: {
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 4,
    justifyContent: 'center',
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
    marginTop: -260,
  },
  loading: {
    
    
    justifyContent: 'center',
    alignItems: 'center',
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
    bottom: 25, // Space from the bottom edge
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
