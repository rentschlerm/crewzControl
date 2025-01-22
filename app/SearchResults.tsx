import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { JobsContext } from '@/components/JobContext';
import { XMLParser } from 'fast-xml-parser';
import useLocation from '@/hooks/useLocation';
import CryptoJS from 'crypto-js';
import { getDeviceInfo } from '@/components/DeviceUtils';
// Job type definition (adjust based on your actual job structure)
interface Job {
  id: number;
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
  const {authorizationCode} = useContext(JobsContext);
  const jobList: Job[] = jobs ? JSON.parse(jobs as string) : [];
  const { refreshJobs } = useContext(JobsContext);
  const [deviceInfo, setDeviceInfo] = useState<{
    softwareVersion: string | number | boolean; id: string; type: string; model: string; version: string 
} | null>(null);
  const { location, fetchLocation } = useLocation();
console.log(jobList);
useEffect(() => {
  const fetchDeviceInfo = async () => {
    const info = await getDeviceInfo();
    setDeviceInfo(info);
  };

  fetchDeviceInfo();
  fetchLocation();
}, []);
  const handleTryAgain = async () => {
    try {
      refreshJobs(); // Refresh the jobs
      router.back(); // Navigate back
    } catch (error) {
      console.error('Error refreshing jobs:', error);
      Alert.alert('Error', 'Failed to refresh jobs.');
    }
  };

  const fetchQuoteDetails = async (jobId: number) => {
    if (!deviceInfo || !location) {
      Alert.alert('Device or location information is loading');
      return null;
    }
  
    const crewzControlVersion = '1'; // Hard-coded as per specification
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    const url = `https://CrewzControl.com/dev/CCService/GetQuote.php?DeviceID=${encodeURIComponent(deviceInfo.id)}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Serial=${jobId}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
    console.log(`${url}`);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      const parser = new XMLParser();
      const result = parser.parse(data);
  console.log('GetQuote Data: ', data);
      if (result.ResultInfo?.Result === 'Success') {
        return result.ResultInfo.Selections?.Quote;
      } else {
        Alert.alert('Error', result.ResultInfo?.Message || 'Failed to fetch quote details.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching quote details:', error);
      Alert.alert('Error', 'An error occurred while fetching quote details.');
      return null;
    }
  };


  const handleJobPress = async (job: Job) => {
    const quoteDetails = await fetchQuoteDetails(job.id);
    if (quoteDetails) {
      // Navigate with pre-fetched details
      router.push({
        pathname: '/ProjectUpdate',
        params: { job: JSON.stringify(quoteDetails) },
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
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.header}>Search Results for "{searchTerm}"</Text>

        {/* Results List */}
        {jobList.length > 0 ? (
          <FlatList
            data={jobList}
            renderItem={({ item }) => (
              <JobListItem job={item} onPress={handleJobPress} />
            )}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.flatListContent} // For padding/margin
          />
        ) : (
          <Text style={styles.noResults}>No jobs found matching your search.</Text>
        )}
      </View>

      {/* Try Again Button anchored to the bottom */}
      <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};


const styles = StyleSheet.create({
  
  firstRow: {
    flexDirection: 'row',
    
    justifyContent: 'space-between',
    marginRight: 5
  },
  secondRow: {
    flexDirection: 'row',
    
    justifyContent: 'space-between',
  },
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffff",
    // marginTop: 150,
    // borderRadius: 20,
    overflow: 'hidden',
  },

  backText: {
    fontSize: 16,
    color: '#007AFF',
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
  flatListContent: {
    paddingBottom: 80, // Space for the "Try Again" button
  },
  tryAgainButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1E90FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SearchResults;
