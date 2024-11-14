import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ImageBackground, 
  Image 
} from 'react-native';
import { JobsContext, Job } from '../components/JobContext'; // Import the context and Job type
import { useRouter, useLocalSearchParams } from 'expo-router'; // Import useRouter and useLocalSearchParams
import LogoStyles from '../components/LogoStyles';
import DropDownPicker from 'react-native-dropdown-picker'; // Import DropDownPicker
import { TextInput } from 'react-native-paper';

// Service List Item Component
interface ServiceListItemProps {
  service: string;
  onPress: () => void;
}

const ServiceListItem: React.FC<ServiceListItemProps> = ({ service, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.serviceRow}>
    <Text style={styles.serviceName}>{service}</Text>
  </TouchableOpacity>
);

const ProjectUpdate: React.FC = () => {
  const router = useRouter(); // Initialize the router
  const { job } = useLocalSearchParams(); // Use useLocalSearchParams to get route params

  if (!job) {
    return <Text>Error: No job data found</Text>; // Handle case when no job data is passed
  }

  const jobObj: Job = JSON.parse(job as string); // Parse the job JSON string back to an object
  const { updateJob } = useContext(JobsContext)!; // Use context to update job

  const [customerName, setName] = useState(jobObj.customerName);
  const [address, setAddress] = useState(jobObj.address);
  const [city, setCity] = useState(jobObj.city);
  const [urgency, setUrgency] = useState('High'); // Use "High" as default urgency
  const [baseHours, setBaseHours] = useState('');
  const [selectedService, setSelectedService] = useState('');

  const [urgencyOpen, setUrgencyOpen] = useState(false); // Managed dropdown state

  const serviceNames = ['Service Name 1', 'Service Name 2', 'Service Name 3', 'Service Name 4', 'Service Name 5', 'Service Name 6'];

  const handleSave = () => {
    const updatedJob: Job = {
      ...jobObj,
      customerName,
      address,
      city,
      urgency,
      baseHours,
      // extra: selectedService,
    };

    updateJob(updatedJob); // Update the job in the context
    router.back(); // Go back after saving
  };

  const handleCancel = () => {
    Alert.alert(
      'Exit Without Saving?',
      'Are you sure you want to exit without saving?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => router.back() }, // Exit without saving
      ]
    );
  };

  const handleServicePress = (service: string) => {
    setSelectedService(service);
    router.push({ pathname: '/AlternativeSelection', params: { service } }); // Navigate to AlternativeSelection
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Quote Update</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.row}>
            <Text style={styles.label}>Name :</Text>
            <Text style={styles.textValue}>
              {customerName || "N/A"}  {/* Show default text if no name is available */}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Address :</Text>
            <Text style={styles.textValue}>
              {address || "N/A"}  {/* Show default text if no address is available */}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>City :</Text>
            <Text style={styles.textValue}>
              {city || "N/A"}  {/* Show default text if no city is available */}
            </Text>
          </View>

          {/* Urgency Dropdown */}
          <View style={styles.row}>
            <Text style={styles.label}>Urgency :</Text>
            <View style={styles.dropdownWrapper}>
              <DropDownPicker
                open={urgencyOpen} // Controlled by state
                value={urgency}
                items={[
                  { label: 'Emergency', value: 'Emergency' },
                  { label: 'Urgent', value: 'Urgent' },
                  { label: 'Normal', value: 'Normal' }
                ]}
                setOpen={setUrgencyOpen} // Update the open state
                setValue={setUrgency}
                style={[styles.dropdownStyle, {width:220, marginLeft:-55, marginBottom:20}]}
                dropDownContainerStyle={styles.dropDownContainerStyle}
              />
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Base Hours :</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={baseHours} 
              onChangeText={setBaseHours} 
              placeholder="Enter Base Hours" 
            />
          </View>

          {/* Select Service to Enter Alternative */}
          <View style={styles.serviceContainer}>
            <Text style={styles.sectionTitle}>Select Work Package to Enter Alternative</Text>
            <View style={styles.serviceListContainer}>
              {serviceNames.map((service, index) => (
                <ServiceListItem 
                  key={index} 
                  service={service} 
                  onPress={() => handleServicePress(service)} 
                />
              ))}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  dropdownStyle: { borderWidth: 1, borderColor: '#ccc', height: 40, borderRadius: 5 },
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
    marginBottom: 5,
  },
  label: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 0,
    borderRadius: 15,
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
