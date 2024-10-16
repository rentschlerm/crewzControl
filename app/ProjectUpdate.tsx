import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  ImageBackground, 
  Image 
} from 'react-native';
import { JobsContext, Job } from '../components/JobContext'; // Import the context and Job type
import { useRouter, useLocalSearchParams } from 'expo-router'; // Import useRouter and useLocalSearchParams

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

  const [name, setName] = useState(jobObj.name);
  const [address, setAddress] = useState(jobObj.info);
  const [city, setCity] = useState('Sample City');
  const [urgency, setUrgency] = useState('High');
  const [baseHours, setBaseHours] = useState('');
  const [selectedService, setSelectedService] = useState('');

  const serviceNames = ['Service Name 1', 'Service Name 2', 'Service Name 3', 'Service Name 4', 'Service Name 5', 'Service Name 6'];

  const handleSave = () => {
    const updatedJob: Job = {
      ...jobObj,
      name,
      info: address,
      city,
      urgency,
      baseHours,
      extra: selectedService,
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
        style={styles.logoImage}
        resizeMode="contain"
      />
      <View style={styles.mainDiv}>
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Project Update</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.row}>
              <Text style={styles.label}>Name :</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Enter Name" 
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Address :</Text>
              <TextInput 
                style={styles.input} 
                value={address} 
                onChangeText={setAddress} 
                placeholder="Enter Address" 
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>City :</Text>
              <TextInput 
                style={styles.input} 
                value={city} 
                onChangeText={setCity} 
                placeholder="Enter City" 
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Urgency :</Text>
              <TextInput 
                style={styles.input} 
                value={urgency} 
                onChangeText={setUrgency} 
                placeholder="Enter Urgency" 
              />
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
              <Text style={styles.sectionTitle}>Select Service to Enter Alternative</Text>
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
  logoImage: {
    width: '90%',
    height: 80,
    position: 'absolute',
    top: 20,
    alignSelf: 'center', // Center the logo
  },
  mainDiv: {
    flex: 1,
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginTop: 150, // Space for the logo
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
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  input: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
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
