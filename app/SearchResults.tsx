import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router'; // Correct import: useLocalSearchParams

// Define types for the Job and the props of the JobListItem component
interface Job {
  id: number;
  name: string;
  info: string;
  email: string;
  extra: string;
}

interface JobListItemProps {
  job: Job;
  onPress: (job: Job) => void;
}

const JobListItem: React.FC<JobListItemProps> = ({ job, onPress }) => (
  <TouchableOpacity onPress={() => onPress(job)} style={styles.jobRow}>
    <Text style={styles.column1}>{job.name}</Text>
    <Text style={styles.column2}>{job.info}</Text>
    <Text style={styles.column3}>{job.email}</Text>
    <Text style={styles.column4}>{job.extra}</Text>
  </TouchableOpacity>
);

const SearchResults: React.FC = () => {
  const router = useRouter(); // Initialize the router
  const { searchTerm, jobs } = useLocalSearchParams(); // Correct hook for search parameters

  // Ensure that jobs and searchTerm are treated as strings
  const jobsString = Array.isArray(jobs) ? jobs[0] : jobs; // Handle the case where jobs might be an array
  const searchTermString = Array.isArray(searchTerm) ? searchTerm[0] : searchTerm;

  // Parse the jobs JSON string to an array of jobs
  const jobsArray: Job[] = jobsString ? JSON.parse(jobsString) : [];

  // Filter the jobs based on the search term
  const filteredJobs = jobsArray.filter(job =>
    job.name.toLowerCase().includes(searchTermString?.toLowerCase() || '')
  );

  const handleJobPress = (job: Job) => {
    // Navigate to ProjectUpdate screen with the job details
    router.push({ pathname: '/ProjectUpdate', params: { job: JSON.stringify(job) } }); // Use router.push instead of navigation.navigate
  };

  return (
    <ImageBackground
      source={require('../assets/images/background.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Search Results for "{searchTermString}":</Text>

        {/* List of Jobs */}
        {filteredJobs.length > 0 ? (
          <FlatList
            data={filteredJobs}
            renderItem={({ item }) => <JobListItem job={item} onPress={handleJobPress} />}
            keyExtractor={(item) => item.id.toString()}
          />
        ) : (
          <Text>No jobs found</Text>
        )}

        {/* Try Again Button */}
        <TouchableOpacity
          style={styles.tryAgainButton}
          onPress={() => router.back()} // Use router.back() to go back
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  column1: { flex: 1, color: 'blue' },
  column2: { flex: 1, color: 'grey' },
  column3: { flex: 1, color: 'purple' },
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
});

export default SearchResults;
