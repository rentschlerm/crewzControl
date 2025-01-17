import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { JobsContext, Job } from '@/components/JobContext'; // Import the context and Job type
import { useRouter } from 'expo-router'; // Import useRouter
import LogoStyles from '../components/LogoStyles';
import { getDeviceInfo } from '../components/DeviceUtils';
import { XMLParser } from 'fast-xml-parser';
import CryptoJS from 'crypto-js';
import useLocation from '@/hooks/useLocation';

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

// Project component
const Project: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const jobsContext = useContext(JobsContext); // Safely get context
  const {authorizationCode} = useContext(JobsContext);
  const router = useRouter(); // Initialize the router
  const [deviceInfo, setDeviceInfo] = useState<{
    softwareVersion: string | number | boolean; id: string; type: string; model: string; version: string 
} | null>(null);
  const { location, fetchLocation } = useLocation(); // Use the custom hook

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
    };

    fetchDeviceInfo();
    fetchLocation();
  }, []);
  
  if (!jobsContext) {
    return <Text>Error: JobsContext not available</Text>;
  }

  const { jobs, jobsReady } = jobsContext; // Destructure jobs and jobsReady from context

  // Show a loading state while jobs are being loaded
  if (!jobsReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading quotes...</Text>
      </View>
    );
  }

  // Handle the case where no jobs are available
  if (jobs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noQuotesText}>No quotes available</Text>
      </View>
    );
  }

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

  const fetchQuoteList = async () => {
    if (!deviceInfo || !location) {
      Alert.alert('Device or location information is loading');
      return null;
    }
  
    const crewzControlVersion = '1'; // Hard-coded as per specification
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    const keyString = `${deviceInfo.id}${formattedDate}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    const url = `https://crewzcontrol.com/dev/CCService/GetQuoteList.php?DeviceID=${encodeURIComponent(deviceInfo.id)}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}&Language=EN`;
    console.log(`${url}`);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      const parser = new XMLParser();
      const result = parser.parse(data);
      console.log('GetQuoteList Data: ', data);
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

  const handleSearch = async () => {
    if (!deviceInfo || !location) {
      Alert.alert('Device or location information is loading');
      return null;
    }
  
    // setLoading(true);
  
    try {
      const crewzControlVersion = '1'; // Hard-coded as per specification
      const currentDate = new Date();
      const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
      const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
      const key = CryptoJS.SHA1(keyString).toString();
  
      const search = encodeURIComponent(searchTerm);
      const url = `https://crewzcontrol.com/dev/CCService/GetQuoteList.php?DeviceID=${encodeURIComponent(deviceInfo.id)}&Date=${formattedDate}&Key=${key}&Search=${search}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}&Language=EN`;
      console.log(`${url}`);
  
      const response = await fetch(url);
      const data = await response.text();
      const parser = new XMLParser();
      const result = parser.parse(data);
      console.log('Search Data: ', data);
  
      if (result.ResultInfo?.Result === 'Success') {
        const enrichedJobs = result.ResultInfo.Selections?.Quote.map((quote: { Name: any; Address: any; City: any; Amount: any; Status: any; Hours: any; Serial: any; }) => ({
          quoteName: quote.Name,
          address: quote.Address,
          city: quote.City,
          amount: quote.Amount,
          status: quote.Status,
          hours: quote.Hours,
          id: quote.Serial, // Serial as unique ID
        }));
        
        // Navigate to SearchResults screen with results
        router.push({
          pathname: '/SearchResults',
          params: { searchTerm, jobs: JSON.stringify(enrichedJobs) },
        });
      } else {
        Alert.alert('Error', result.ResultInfo?.Message || 'Failed to fetch search results.');
      }
    } catch (error) {
      console.error('Error performing search:', error);
      Alert.alert('Error', 'An error occurred while searching. Please try again.');
    } finally {
      // setLoading(false);
    }
  };
  
  

  const handleJobPress = async (job: Job) => {
  const quoteDetails = await fetchQuoteDetails(job.id);
  if (quoteDetails) {
    router.push({
      pathname: '/ProjectUpdate',
      params: { job: JSON.stringify(quoteDetails) },
    });
  }
};
  

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          <View style={styles.sectionDiv}>
            <Text style={styles.sectionTitle}>Close to:</Text>
            <FlatList
              data={jobs.slice(0, 1)} // Display only the first job
              renderItem={({ item }) => <JobListItem job={item} onPress={handleJobPress} />}
              keyExtractor={(item) => item.id.toString()}
              // keyExtractor={(item, index) => `${item.id}-${index}`}
            />
          </View>

          <View style={styles.sectionDiv}>
            <Text style={styles.sectionTitle}>Recent:</Text>
            <FlatList
              data={jobs.slice(1, 4)} // Display only the first 4 jobs
              renderItem={({ item }) => <JobListItem job={item} onPress={handleJobPress} />}
              keyExtractor={(item) => item.id.toString()}
              // keyExtractor={(item, index) => `${item.id}-${index}`}
            />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter quote customer name"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onFocus={() => setSearchTerm(searchTerm)}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    padding: 20,
  },
  mainDiv: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 20, // Spacing for the sections
    marginTop: 140
  },
  loadingText: {
    fontSize: 18,
    color: 'gray',
  },
  noQuotesText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    padding: 20,
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
  firstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginBottom: 0, // Add space between the rows
  },
  secondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column1: {
    flex: 1,
    color: 'grey',
  },
  column2: {
    flex: 1,
    color: 'grey',
  },
  column3: {
    flex: 1,
    color: 'grey',
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
