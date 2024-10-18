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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SignIn: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isInvalid, setIsInvalid] = useState<boolean>(false);

  const handleLogin = () => {
    if (email === 'test@example.com' && password === 'password') {
      Alert.alert(`Welcome, ${email}!`);
      setIsInvalid(false);
      router.push('/Project'); // Navigate to the Project screen
    } else {
      setIsInvalid(true);
    }
  };

  useEffect(() => {
    // Focus on the email input field when the component mounts
    // You can use a ref for the TextInput if needed
  }, []);

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
              autoFocus={true} // Automatically focus on this field (email)
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
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Sign-in</Text>
            </TouchableOpacity>
          </View>
        )}
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
  container: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    padding: 20, // Add padding to the container
  },
  icon: {
    width: 350, // Set a fixed width for the icon
    height: 130, // Set a fixed height for the icon to maintain aspect ratio
    marginBottom: 20, // Space between icon and login form
    marginTop: -100,
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
