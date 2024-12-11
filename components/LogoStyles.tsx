import { StyleSheet } from 'react-native';

const LogoStyles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Adjust as per the space you want between the logo and the rest of the content
  },
  logo: {
    width: 250, // Adjust width as per your design
    height: 400, // Adjust height as per your design
    resizeMode: 'contain', // Ensures the image maintains its aspect ratio
    position: 'absolute', // Absolute position to make it float on top
    top: -150, // Adjust this based on your layout or design (distance from the top)
    alignSelf: 'center'
  },
});

export default LogoStyles;
// width: 350, // Set a fixed width for the icon
//     height: 500, // Set a fixed height for the icon to maintain aspect ratio
//     marginBottom: -150, // Space between icon and login form
//     marginTop: -350,