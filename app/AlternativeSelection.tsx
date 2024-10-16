import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  ImageBackground 
} from 'react-native';
import { Checkbox } from 'react-native-paper'; // Import Checkbox from react-native-paper
import { useRouter } from 'expo-router'; 
import { useRoute } from '@react-navigation/native'; 

interface Alternative {
  name: string;
  hours: string;
  checked?: boolean;
}

const AlternativeSelection: React.FC = () => {
  const router = useRouter(); 
  const route = useRoute(); 
  const { selectedService, saveAlternatives } = route.params as {
    selectedService: string;
    saveAlternatives: (alternatives: Alternative[]) => void;
  }; 

  const alternativesData: Alternative[] = [
    { name: 'Service Name 1', hours: '' },
    { name: 'Service Name 2', hours: '' },
    { name: 'Service Name 3', hours: '' },
    { name: 'Service Name 4', hours: '' },
    { name: 'Service Name 5', hours: '' },
    { name: 'Service Name 6', hours: '' },
    { name: 'Service Name 7', hours: '' },
  ];

  const [alternatives, setAlternatives] = useState<Alternative[]>(alternativesData);

  const toggleCheckbox = (index: number) => {
    const updatedAlternatives = [...alternatives];
    updatedAlternatives[index].checked = !updatedAlternatives[index].checked;
    setAlternatives(updatedAlternatives);
  };

  const updateHours = (index: number, hours: string) => {
    const updatedAlternatives = [...alternatives];
    updatedAlternatives[index].hours = hours;
    setAlternatives(updatedAlternatives);
  };

  const handleSave = () => {
    const selectedAlternatives = alternatives.filter((item) => item.checked);
    saveAlternatives(selectedAlternatives); 
    router.back(); 
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
            <Text style={styles.title}>Get Alternatives</Text>
          </View>

          <Text style={styles.serviceLabel}>Service: {selectedService}</Text>

          <Text style={styles.sectionTitle}>Select Alternatives</Text>

          {alternatives.map((alt, index) => (
            <View key={index} style={styles.row}>
              <Checkbox
                status={alt.checked ? 'checked' : 'unchecked'}
                onPress={() => toggleCheckbox(index)}
              />
              <Text style={styles.altText}>{alt.name}</Text>
              <TextInput
                style={styles.hoursInput}
                value={alt.hours}
                onChangeText={(text) => updateHours(index, text)}
                placeholder="Add Hours"
                keyboardType="numeric"
              />
            </View>
          ))}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
  logoImage: {
    width: '90%',
    height: 120,
    alignSelf: 'center',
    marginBottom: 20,
  },
  mainDiv: {
    width: '90%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
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
