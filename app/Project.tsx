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
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JobsContext, Job } from '@/components/JobContext'; // Import the context and Job type
import { useRouter, useFocusEffect } from 'expo-router'; // Import useRouter and useFocusEffect
import LogoStyles from '../components/LogoStyles';
import { getDeviceInfo } from '../components/DeviceUtils';
import { XMLParser } from 'fast-xml-parser';
import CryptoJS from 'crypto-js';
import useLocation from '@/hooks/useLocation';

// JobListItem component
interface JobListItemProps {
  job: Job;
  onPress: (job: Job) => void;
  isLoading?: boolean;
}

const JobListItem: React.FC<JobListItemProps> = ({ job, onPress, isLoading = false }) => (
  <TouchableOpacity 
    onPress={() => onPress(job)} 
    style={[styles.jobRow, isLoading && styles.jobRowLoading]}
    disabled={isLoading}
    activeOpacity={0.7}
  >
    {/* First row for Quote and Customer Name */}
    <View style={styles.firstRow}>
      <Text style={[styles.column1, isLoading && styles.textLoading]}>{job.customerName || '-'}</Text>
      <Text style={[styles.column2, isLoading && styles.textLoading]}>{job.serial +'-'+ job.QuoteNum || '-'}</Text>
      <Text style={[styles.column2, isLoading && styles.textLoading]}>{job.status || '-'}</Text>
    </View>

    {/* Second row for Address, City, and Amount */}
    <View style={styles.secondRow}>
      <Text style={[styles.column3, isLoading && styles.textLoading]}>{job.address || '-'}</Text>
      <Text style={[styles.column4, isLoading && styles.textLoading]}>{job.city || '-'}</Text>
      <Text style={[styles.column4, isLoading && styles.textLoading]}>${job.amount ? Number(job.amount).toLocaleString() : '-'}</Text>
    </View>
    
    {/* Loading indicator */}
    {isLoading && (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    )}
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

  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingQuoteId, setLoadingQuoteId] = useState<number | null>(null);
  
  // Modal state for search popup
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState<string>('');


  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
    };

    fetchDeviceInfo();
    fetchLocation();
  }, []);

  // M.G. 10/1/2025
  // Fetch quotes every time the screen is focused (when user navigates back to this screen)
  useFocusEffect(
    React.useCallback(() => {
      if (jobsContext?.fetchJobs) {
        jobsContext.fetchJobs();
      }
    }, []) // Empty dependency array to prevent infinite loop
  );
  
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
        console.error('Error', result.ResultInfo?.Message || 'Failed to fetch quote details.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching quote details:', error);
      return null;
    }
  };

  const fetchQuoteList = async () => {
    if (!deviceInfo || !location) {
      console.error('Device or location information is loading');
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
        console.error('Error', result.ResultInfo?.Message || 'Failed to fetch quote details.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching quote details:', error);
      return null;
    }
  };

  const handleOpenSearchModal = () => {
    setModalSearchTerm(searchTerm); // Pre-fill with current search term if any
    setIsSearchModalVisible(true);
  };

  const handleCloseSearchModal = () => {
    setIsSearchModalVisible(false);
    Keyboard.dismiss();
  };

  const handleSearchFromModal = async () => {
    if (!deviceInfo || !location) {
      return null;
    }
  
    setLoading(true); // Start loading spinner immediately
    setSearchTerm(modalSearchTerm); // Save the search term
  
    try {
      const crewzControlVersion = '10'; // Hard-coded as per specification
      const currentDate = new Date();
      const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
      const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
      const key = CryptoJS.SHA1(keyString).toString();
  
      const search = encodeURIComponent(modalSearchTerm);
      const url = `https://crewzcontrol.com/dev/CCService/GetQuoteList.php?DeviceID=${encodeURIComponent(deviceInfo.id)}&Date=${formattedDate}&Key=${key}&Search=${search}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}&Language=EN`;
      console.log(`${url}`);
  
      const response = await fetch(url);
      const data = await response.text();
      const parser = new XMLParser();
      const result = parser.parse(data);
      console.log('Search Data: ', data);

      const quotes = result.ResultInfo.Selections?.Quote;

      // RHCM 6/24/2025 Normalize to array. This will handle both single quote and multiple quotes.
      const normalizedQuotes = Array.isArray(quotes) ? quotes : [quotes];
  
      if (result.ResultInfo?.Result === 'Success') {
        const enrichedJobs = normalizedQuotes.map((quote: any) => ({
          quoteName: quote.Name,
          customerName: quote.CustomerName,
          address: quote.Address,
          city: quote.City,
          amount: quote.Amount,
          status: quote.Status,
          hours: quote.Hours,
          id: quote.Serial, // Serial as unique ID
          serial: quote.Serial, 
          QuoteNum: quote.QuoteNum,
        }));
        
        // Close modal before navigating
        setIsSearchModalVisible(false);
        
        // Navigate to SearchResults screen with results
        router.push({
          pathname: '/SearchResults',
          params: { searchTerm: modalSearchTerm, jobs: JSON.stringify(enrichedJobs) },
        });
      } else {
        setIsSearchModalVisible(false);
        console.error('Error', result.ResultInfo?.Message || 'Failed to fetch search results.');
      }
    } catch (error) {
      // JCM 03/21/2025: Corrected the error message when no quotes is found on the list based on the provided term.
      //console.error('Error performing search:', error);
      // Alert.alert('Error', 'An error occurred while searching. Please try again.');
      setIsSearchModalVisible(false);
      console.error('', 'No matching quotes found.');
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };
  
  

  const handleJobPress = async (job: Job) => {
  // Prevent multiple taps
  if (loadingQuoteId !== null) {
    return;
  }
  
  setLoadingQuoteId(job.id);
  
  try {
    const quoteDetails = await fetchQuoteDetails(job.id);
    if (quoteDetails) {
      router.push({
        pathname: '/ProjectUpdate',
        params: { job: JSON.stringify(quoteDetails), quoteSerial: job.id.toString() },
      });
    }
  } catch (error) {
    console.error('Error loading quote:', error);
  } finally {
    // Reset loading state after a short delay to prevent rapid re-tapping
    setTimeout(() => {
      setLoadingQuoteId(null);
    }, 500);
  }
};
return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require('../assets/images/background.png')}
          style={styles.background}
        >
          <Image
            source={require('../assets/images/crewzControlIcon.png')}
            style={LogoStyles.logo}
            resizeMode="contain"
          />
          {isLoadingQuote && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text>Loading quote details...</Text>
            </View>
          )}
          <View style={styles.mainDiv}>
            <View style={styles.sectionDiv}>
              <Text style={styles.sectionTitle}>Close to:</Text>
              <JobListItem 
                job={jobs[0]} 
                onPress={handleJobPress} 
                isLoading={loadingQuoteId === jobs[0].id}
              />
            </View>

            <View style={styles.sectionDiv}>
              <Text style={styles.sectionTitle}>Recent:</Text>
              {/* M.G. 10/1/2025 - Display up to 5 quotes in recent list */}
              {jobs.slice(1, 6).map((item) => (
                <JobListItem 
                  key={item.id.toString()} 
                  job={item} 
                  onPress={handleJobPress}
                  isLoading={loadingQuoteId === item.id}
                />
              ))}
            </View>

            <View style={styles.searchContainer}>
              <TouchableOpacity 
                style={styles.searchInputTouchable}
                onPress={handleOpenSearchModal}
                disabled={loading}
              >
                <Text style={[styles.searchInputText, !searchTerm && styles.placeholderText]}>
                  {searchTerm || 'Enter quote customer name'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Modal */}
          <Modal
            visible={isSearchModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCloseSearchModal}
          >
            <TouchableWithoutFeedback onPress={handleCloseSearchModal}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContent}
                  >
                    <Text style={styles.modalTitle}>Search Quote</Text>
                    
                    <View style={styles.modalInputContainer}>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Enter quote customer name"
                        placeholderTextColor="#999"
                        value={modalSearchTerm}
                        onChangeText={setModalSearchTerm}
                        autoFocus={true}
                        returnKeyType="search"
                        onSubmitEditing={handleSearchFromModal}
                      />
                      <TouchableOpacity
                        style={[styles.modalSearchButton, loading && { opacity: 0.6 }]}
                        onPress={handleSearchFromModal}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.searchButtonText}>Search</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  </SafeAreaView>
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  mainDiv: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 20, // Spacing for the sections
    // M.G. 10/1/2025 - Adjusted marginTop to position quote container closer to header
    marginTop: 85 // Adjusted to avoid covering the CREWZ CONTROL header
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
    // M.G. 10/1/2025 - Reduced spacing for more compact layout
    marginBottom: 10, // Reduced space between each section
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  jobRow: {
    
    justifyContent: 'space-between',
    // M.G. 10/1/2025 - Reduced padding and margins for more compact quote items
     paddingVertical: 8, // Reduced from 10
    padding: 12, // Reduced from 15
    backgroundColor: '#fff',
     borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 6, // Reduced from 10
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  firstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    // marginBottom: 0, // Add space between the rows
  },
  secondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column1: {
    flex: 2,
    flexWrap: 'wrap',
    color: 'grey',
    marginRight: 5,
  },
  column2: {
    flex: 1.2,
    textAlign: 'right',
    color: 'grey',
  },
  column3: {
    flex: 1,
    color: 'grey',
    textAlign: 'left',
  },
  column4: {
    flex: 1,
    color: 'grey',
    textAlign: 'right',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // M.G. 10/1/2025 - Reduced marginTop for more compact layout
    marginTop: 10, // Reduced from 20
  },
  searchInputTouchable: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  searchInputText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#999',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'transparent',
    color: '#000',
  },
  modalSearchButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    height: 50,
  },
  jobRowLoading: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  textLoading: {
    color: '#999',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});

export default Project;
