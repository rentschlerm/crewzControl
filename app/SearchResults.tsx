import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router'; // Correct import for useSearchParams
import { Job } from '@/components/JobContext';
import Carousel from 'react-native-snap-carousel';

const SearchResults: React.FC = () => {
  const router = useRouter();
  const { searchTerm, jobs } = useLocalSearchParams();

  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchTermState, setSearchTermState] = useState<string>(searchTerm as string || ''); // State for search term

  useEffect(() => {
    if (searchTermState && jobs) {
      try {
        const parsedJobs: Job[] = JSON.parse(jobs as string); // Parse jobs passed from the previous screen
        const searchFilteredJobs = parsedJobs.filter((job) =>
          (job.quoteName && job.quoteName.toLowerCase().includes(searchTermState.toLowerCase())) ||
          (job.customerName && job.customerName.toLowerCase().includes(searchTermState.toLowerCase())) ||
          (job.address && job.address.toLowerCase().includes(searchTermState.toLowerCase())) ||
          (job.city && job.city.toLowerCase().includes(searchTermState.toLowerCase()))
        );
        setFilteredJobs(searchFilteredJobs);
      } catch (error) {
        console.error("Error parsing jobs data:", error);
      }
    }
  }, [searchTermState, jobs]);

  const handleJobPress = (job: Job) => {
    router.push({
      pathname: '/ProjectUpdate',
      params: { job: JSON.stringify(job) }, // Pass job as a JSON string
    });
  };

  return (
    <ImageBackground
      source={require('../assets/images/background.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        {/* <TextInput
          style={styles.searchInput}
          placeholder="Search by Quote, Customer, Address, or City"
          value={searchTermState}
          onChangeText={setSearchTermState} // Update the search term using state setter
        /> */}
        <Text style={styles.sectionTitle}>Search Results for "{searchTermState}":</Text>

        {/* List of Jobs */}
        {filteredJobs.length > 0 ? (
          <FlatList
            data={filteredJobs}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleJobPress(item)}
                style={styles.jobRow}
              >
                {/* First row for Quote and Customer Name */}
                <View style={styles.firstRow}>
                  <Text style={styles.column1}>{item.quoteName}</Text>
                  <Text style={styles.column2}>{item.customerName}</Text>
                  <Text style={styles.column2}>{'-'}</Text>
                </View>

                {/* Second row for Address and City */}
                <View style={styles.secondRow}>
                  <Text style={styles.column3}>{item.address}</Text>
                  <Text style={styles.column4}>{item.city}</Text>
                  <Text style={styles.column4}>{item.amount}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        ) : (
          <Text>No matching results found</Text>
        )}

        {/* Try Again Button */}
        <TouchableOpacity
          style={styles.tryAgainButton}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};


const styles = StyleSheet.create({
  background: {
    flex: 1,
    padding: 20,
  },
  firstRow: {
    flexDirection: 'row',
    
    justifyContent: 'space-between',
    marginRight: 5
  },
  secondRow: {
    flexDirection: 'row',
    
    justifyContent: 'space-between',
  },
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginTop: 250,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  jobRow: {
    
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  column1: { flex: 1, color: 'grey' },
  column2: { flex: 1, color: 'grey' },
  column3: { flex: 1, color: 'grey' },
  column4: { flex: 1, color: 'grey' },
  tryAgainButton: {
    backgroundColor: '#1E90FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 20,
  },
});

export default SearchResults;
