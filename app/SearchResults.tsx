import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ImageBackground,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { JobsContext } from '@/components/JobContext';

// Job type definition (adjust based on your actual job structure)
interface Job {
  id: string;
  quoteName: string;
  customerName: string;
  address: string;
  city: string;
  amount: string;
  status: string;
  details?: any; // Additional details from the API, if available
}

// JobListItem component
interface JobListItemProps {
  job: Job;
  onPress: (job: Job) => void;
}

const JobListItem: React.FC<JobListItemProps> = ({ job, onPress }) => (
  <TouchableOpacity onPress={() => onPress(job)} style={styles.jobRow}>
    {/* First row for Quote and Customer Name */}
    <View style={styles.firstRow}>
      <Text style={styles.column1}>{job.quoteName || '-'}</Text>
      <Text style={styles.column2}>{job.customerName || '-'}</Text>
      <Text style={styles.column2}>{job.status || '-'}</Text>
    </View>

    {/* Second row for Address, City, and Amount */}
    <View style={styles.secondRow}>
      <Text style={styles.column3}>{job.address || '-'}</Text>
      <Text style={styles.column4}>{job.city || '-'}</Text>
      <Text style={styles.column4}>${job.amount ? Number(job.amount).toLocaleString() : '-'}</Text>
    </View>
  </TouchableOpacity>
);

const SearchResults: React.FC = () => {
  const router = useRouter();
  const { searchTerm, jobs } = useLocalSearchParams();
  const jobList: Job[] = jobs ? JSON.parse(jobs as string) : [];
  const { refreshJobs } = useContext(JobsContext);

  const handleTryAgain = async () => {
    try {
      refreshJobs(); // Refresh the jobs
      router.back(); // Navigate back
    } catch (error) {
      console.error('Error refreshing jobs:', error);
      Alert.alert('Error', 'Failed to refresh jobs.');
    }
  };

  const handleJobPress = (job: Job) => {
    if (job.details) {
      // Navigate with pre-fetched details
      router.push({
        pathname: '/ProjectUpdate',
        params: { job: JSON.stringify(job.details) },
      });
    } else {
      Alert.alert('No additional details', 'This job has no extra details available.');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/background.png')}
      style={styles.background}
    >
    <View style={styles.container}>
      <Text style={styles.header}>Search Results for "{searchTerm}"</Text>
      {jobList.length > 0 ? (
        <FlatList
          data={jobList}
          renderItem={({ item }) => <JobListItem job={item} onPress={handleJobPress} />}
          keyExtractor={(item) => item.id.toString()}
        />
      ) : (
        <Text style={styles.noResults}>No jobs found matching your search.</Text>
      )}
       {/* Try Again Button */}
       <TouchableOpacity
          style={styles.tryAgainButton}
          onPress={handleTryAgain}
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
  noResults: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
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
