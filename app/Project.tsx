import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ImageBackground,
  Image,
} from 'react-native';
import { JobsContext, Job } from '@/components/JobContext'; // Import the context and Job type
import { useRouter } from 'expo-router'; // Import useRouter

// JobListItem component
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

// Project component
const Project: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const jobsContext = useContext(JobsContext); // Safely get context
  const router = useRouter(); // Initialize the router

  if (!jobsContext) {
    return <Text>Error: JobsContext not available</Text>;
  }

  const { jobs, jobsReady } = jobsContext; // Destructure jobs and jobsReady from context

  // Show a loading state while jobs are being loaded
  if (!jobsReady) {
    return <Text>Loading jobs...</Text>; // Use a loader component if necessary
  }

  const handleSearch = () => {
    // Filter jobs based on the search term
    const filteredJobs = jobs.filter((job) =>
      job.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Serialize filtered jobs when navigating
    router.push({
      pathname: '/SearchResults',
      params: { searchTerm, jobs: JSON.stringify(filteredJobs) }, // Pass filtered jobs as a JSON string
    });
  };

  const handleJobPress = (job: Job) => {
    // Navigate to ProjectUpdate screen with job data serialized as JSON
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
      {/* Logo Image */}
      <Image
        source={require('../assets/images/crewzControlIcon.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />

      {/* Main Div (Wrapper for Close to and Recent Sections) */}
      <View style={styles.mainDiv}>
        
        {/* Close to Section */}
        <View style={styles.sectionDiv}>
          <Text style={styles.sectionTitle}>Close to:</Text>
          <FlatList
            data={jobs.slice(0, 1)}  // Display only the first job
            renderItem={({ item }) => <JobListItem job={item} onPress={handleJobPress} />}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>

        {/* Recent Section */}
        <View style={styles.sectionDiv}>
          <Text style={styles.sectionTitle}>Recent:</Text>
          <FlatList
            data={jobs.slice(0, 4)}  // Display only the first 4 jobs
            renderItem={({ item }) => <JobListItem job={item} onPress={handleJobPress} />}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>

        {/* Search Section */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter job name"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    padding: 20,
  },
  logoImage: {
    width: '90%',
    height: 150,
    alignSelf: 'center',
    marginBottom: 20,
  },
  mainDiv: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 20, // Spacing for the sections
  },
  sectionDiv: {
    marginBottom: 20, // Space between each section
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
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  column1: {
    flex: 1,
    color: 'blue',
  },
  column2: {
    flex: 1,
    color: 'grey',
  },
  column3: {
    flex: 1,
    color: 'purple',
  },
  column4: {
    flex: 1,
    color: 'grey',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
  },
  searchButton: {
    backgroundColor: '#1E90FF',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Project;
