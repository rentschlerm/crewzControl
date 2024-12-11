import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  Image,
  ScrollView,
} from 'react-native';
import { JobsContext, Job } from '../components/JobContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LogoStyles from '../components/LogoStyles';
import DropDownPicker from 'react-native-dropdown-picker';
import CustomDatePicker from '../components/CustomDatePicker';
import { getDeviceInfo } from '../components/DeviceUtils';
import { XMLParser } from 'fast-xml-parser';
import CryptoJS from 'crypto-js';
import { FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; 

interface WorkPackageAlternate {
  AlternateName: string;
  AlternatePriority: number;
  AlternateStatus: number;
  AlternateHour: number;
  AlternateSerial: number;
}

interface WorkPackage {
  WorkPackage: any;
  WorkPackages: any;
  WorkPackageName: string;
  WorkPackageSerial: number;
  WorkPackageAlternates: WorkPackageAlternate[] | WorkPackageAlternate;
}

interface QuoteDetailNote {
  '#text'?: string;
}

interface Service {
  ServiceSerial: number;
  QuoteDetailName: string;
  QuoteDetailNote: string | QuoteDetailNote;
  Quantity?: string;
  WorkPackages: WorkPackage | WorkPackage[] | undefined;
}

const ProjectUpdate: React.FC = () => {
  const router = useRouter();
  const { job } = useLocalSearchParams();

  if (!job) {
    return <Text>Error: No job data found</Text>;
  }

  const jobObj: Job = typeof job === 'string' ? JSON.parse(job) : job;
  const { updateJob, authorizationCode } = useContext(JobsContext)!;
  const [customerName, setName] = useState(jobObj?.Name);
  const [address, setAddress] = useState(jobObj?.Address);
  const [city, setCity] = useState(jobObj?.City);
  const [urgency, setUrgency] = useState('Normal');
  const [urgencyOpen, setUrgencyOpen] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{
    softwareVersion: string | number | boolean;
    id: string;
    type: string;
    model: string;
    version: string;
  } | null>(null);

  const [location, setLocation] = useState<{
    longitude: string;
    latitude: string;
    accuracy: string;
  } | null>(null);

  const [mustCompleteDate, setMustCompleteDate] = useState(jobObj?.mustCompleteDate);
  const [niceToHaveDate, setNiceToHaveDate] = useState(jobObj?.niceToHaveDate);
  const [blackoutDate, setBlackoutDate] = useState(jobObj?.blackoutDate);
  const [availableDate, setAvailableDate] = useState(jobObj?.availableDate);

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
      setLocation({
        longitude: '123.456',
        latitude: '78.910',
        accuracy: '5',
      });
    };

    fetchDeviceInfo();
  }, []);

  const normalizeToArray = <T,>(data: T | T[] | undefined): T[] => {
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  };

  const normalizeWorkPackages = (
    workPackages: WorkPackage | WorkPackage[] | undefined
  ): WorkPackage[] => {
    try {
      if (!workPackages) return [];
      return Array.isArray(workPackages) ? workPackages : [workPackages];
    } catch (error) {
      console.error('Error parsing Work Packages:', error);
      return [];
    }
  };

  const services: Service[] = (() => {
    try {
      const parsedServices =
        typeof jobObj.Services === 'string' ? JSON.parse(jobObj.Services) : jobObj.Services;
      return normalizeToArray(parsedServices?.Service);
    } catch (error) {
      console.error('Error parsing Services:', error);
      return [];
    }
  })();

  const handleSave = async () => {
    if (!deviceInfo || !location || !jobObj.Serial) {
      Alert.alert('Device, location, or quote serial information is missing');
      return;
    }
    
    const crewzControlVersion = '1';
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(
      currentDate.getHours()
    ).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  
    const keyString = `${deviceInfo.id}${formattedDate}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    const serial = jobObj.Serial;  // Use jobObj.Serial here
  
    const url = 
    
    // `https://CrewzControl.com/dev/CCService/UpdateQuote.php?DeviceID=${encodeURIComponent(
    //   deviceInfo.id
    // )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Serial=${serial}&Longitude=${
    //   location.longitude
    // }&Latitude=${location.latitude}`;
  

    `https://CrewzControl.com/dev/CCService/UpdateQuote.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Serial=${serial}&Priority=${urgency}&MustCompleteBy=${mustCompleteDate || ''}&NiceToHaveBy=${
      niceToHaveDate || ''
    }&BlackoutDate=${blackoutDate || ''}&AvailableDate=${availableDate || ''}&Longitude=${
      location.longitude
    }&Latitude=${location.latitude}`;


    console.log(`${url}`);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      console.log(data);
  
      const parser = new XMLParser();
      const result = parser.parse(data);
  
      if (result.ResultInfo?.Result === 'Success') {
         // Update date fields from response
         setMustCompleteDate(result?.Quote?.MustCompleteBy || mustCompleteDate);
         setNiceToHaveDate(result?.Quote?.NiceToHaveBy || niceToHaveDate);
         setBlackoutDate(result?.Quote?.BlackoutDate || blackoutDate);
         setAvailableDate(result?.Quote?.AvailableDate || availableDate);

        Alert.alert('Success', 'Quote updated successfully.');
        router.back();
      } else {
        Alert.alert('Error', result.ResultInfo?.Message || 'Failed to update the quote.');
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      Alert.alert('Error', 'An error occurred while updating the quote.');
    }
  };
  
  

  const handleCancel = () => {
    Alert.alert('Exit Without Saving?', 'Are you sure you want to exit without saving?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: () => router.back() },
    ]);
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
      <FlatList
        data={[1]} // Use this as a wrapper for your static content
        keyExtractor={(item, index) => index.toString()}
        renderItem={() => (
          <View style={styles.mainDiv}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Quote Update</Text>
            </View>
  
            {/* Form */}
            <View style={styles.form}>
              <View style={styles.row}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.textValue}>{customerName || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.textValue}>{address || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>City:</Text>
                <Text style={styles.textValue}>{city || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Priority:</Text>
                <View style={styles.dropdownWrapper}>
                  <DropDownPicker
                    open={urgencyOpen}
                    value={urgency}
                    items={[
                      { label: 'Emergency', value: 'Emergency' },
                      { label: 'Urgent', value: 'Urgent' },
                      { label: 'Normal', value: 'Normal' },
                    ]}
                    setOpen={setUrgencyOpen}
                    setValue={setUrgency}
                    style={[
                      styles.dropdownStyle,
                      { width: 220, marginLeft: -55, marginBottom: 20 },
                    ]}
                    dropDownContainerStyle={styles.dropDownContainerStyle}
                  />
                </View>
              </View>
              <View style={styles.dateSection}>
                <CustomDatePicker
                  label="Must Be Complete By:"
                  value={mustCompleteDate || ''}
                  labelStyle={{ textAlign: 'right', fontSize: 16 }}
                  onChange={setMustCompleteDate}
                />
                <CustomDatePicker
                  label="Nice To Have By:"
                  value={niceToHaveDate || ''}
                  labelStyle={{ textAlign: 'right', fontSize: 16 }}
                  onChange={setNiceToHaveDate}
                />
                <CustomDatePicker
                  label="Blackout Date:"
                  value={blackoutDate || ''}
                  labelStyle={{ textAlign: 'right', fontSize: 16 }}
                  onChange={setBlackoutDate}
                />
                <CustomDatePicker
                  label="Available Date:"
                  value={availableDate || ''}
                  labelStyle={{ textAlign: 'right', fontSize: 16 }}
                  onChange={setAvailableDate}
                />
              </View>
  
              {/* Services Section */}
              <Text style={styles.sectionTitle}>Services</Text>
              {services.map((service, index) => {
                const workPackages = normalizeWorkPackages(service.WorkPackages);
  
                return (
                  <View key={index} style={styles.serviceContainer}>
                    <Text style={styles.serviceTitle}>
                      {service.QuoteDetailName || 'Unnamed Service'}
                    </Text>
                    <Text style={styles.serviceTitle}>Quantity: {service.Quantity || '-'}</Text>
                    <Text style={styles.note}>
                      Note:{' '}
                      {typeof service.QuoteDetailNote === 'object'
                        ? service.QuoteDetailNote['#text']
                        : service.QuoteDetailNote || 'N/A'}
                    </Text>
                    {/* Work Packages */}
                    <Text style={styles.sectionTitle}>Resources</Text>
                    {workPackages.map((wp, wpIndex) => {
                      const workPackage = wp.WorkPackage; // Extract the inner WorkPackage object
                      const alternates = normalizeToArray(workPackage?.WorkPackageAlternates?.WorkPackageAlternate);
  
                      return (
                        <View key={wpIndex} style={styles.workPackageContainer}>
                          <View style={styles.headerRow}>
                            <Text style={styles.workPackageTitle}>
                              {workPackage?.WorkPackageName || 'Unnamed Work Package'}
                            </Text>
                            {alternates.length > 0 && (
                              <TouchableOpacity
                                style={styles.alternateButton}
                                onPress={() =>
                                  router.push({
                                    pathname: '/AlternativeSelection',
                                    params: {
                                      workPackageName: workPackage?.WorkPackageName,
                                      workPackageAlternates: JSON.stringify(alternates),
                                    },
                                  })
                                }
                              >
                                {/* <Text style={styles.alternateButtonText}>View Alternatives</Text> */}
                                <Image
                                  source={require('@/assets/images/list-icon.png')} // Adjust the path if needed
                                  style={styles.icon}
                                />
                              </TouchableOpacity>
                            )}
                             <TouchableOpacity
                              style={styles.alternateButton}
                              onPress={() => {
                                // Handle the action for the new button
                              }}
                            >
                              <Text><Icon name="minus" size={24} color="#fff" /> {/* Minus icon */}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
  
            {/* Footer (Buttons) */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </ImageBackground>
  );
};
const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  alternateButton: {
    padding: 8,
    backgroundColor: '#20D5FF',
    borderRadius: 15,
    marginLeft: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alternateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  note: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginBottom: 50
  },
  serviceSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Space below the row
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginLeft: -39, // Add a bit of space between name and quantity
    marginTop: 15,
  },
  workPackageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  workPackage: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  alternate: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
  },
  serviceTitle: { fontWeight: 'bold', marginBottom: 5 },
  workPackagesSection: { marginTop: 10 },
  workPackageContainer: { marginBottom: 10, padding: 10, backgroundColor: '#e9e9e9', borderRadius: 5 },
  alternateContainer: { marginTop: 5, paddingLeft: 10 },
  alternateTitle: { fontWeight: 'bold' },
  dropdownStyle: { borderWidth: 1, borderColor: '#ccc', height: 40, borderRadius: 5, color:'white' },
  dropDownContainerStyle: { backgroundColor: '#fafafa' },
  dropdownWrapper: { flex: 1 }, 
  mainDiv: {
    flex: 1,
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginTop: 150, // Space for the logo
  }, 
  column: {
    flex: 1, // Ensures each column takes up equal space
    paddingRight: 10, // Adjusts spacing between columns
  },
  scrollViewContent: {
    flexGrow: 1, // Ensures the ScrollView can grow and the content will remain scrollable
    padding: 16, // Adds padding around the content for better spacing
    justifyContent: 'flex-start', // Aligns content at the top
  },
  dateSection: {
    marginTop: 20,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  textValue: {
    flex: 2,
    fontSize: 16,
    color: '#333',  // Color for the plain text
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 90,
    color: '#7B7B7B',
  },
  form: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    marginRight: 15,
    alignItems: 'center'
  },
  label: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'left',
  },
  input: {
    flex: 2,
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16, // Adjust input font size
    // borderWidth: 1,
    // borderColor: '#ccc',
    padding: 0,
    // borderRadius: 15,
  },
  picker: {
    width: '68%',
    borderRadius: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#20D5FF',
    paddingVertical: 10,
    paddingHorizontal: 50,
    borderRadius: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  serviceContainer: {
    marginVertical: 20, // Add some spacing
    padding: 10, // Optional padding for better touch targets
    backgroundColor: "#f9f9f9", 
    borderRadius: 8, 
    marginTop: -5,
    marginBottom: -5,
  },
  serviceListContainer: {
    marginTop: 10, // Add spacing between title and list
    
  },
  serviceRow: {
    padding: 10,
    backgroundColor: "#e0e0e0", 
    marginVertical: 5, // Space between items
    borderRadius: 4,
  },
  serviceName: {
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#20D5FF',
    paddingVertical: 10,
    paddingHorizontal: 50,
    borderRadius: 15,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProjectUpdate;
