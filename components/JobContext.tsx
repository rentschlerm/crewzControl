import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import CryptoJS from 'crypto-js';
import { XMLParser } from 'fast-xml-parser';
import { getDeviceInfo } from '../components/DeviceUtils';
import useLocation from '../hooks/useLocation';

// JCM 01/17/2025: Import AsyncStorage to be used for getting the user's location if null once Project screen is redirected automatically (if has autorizationCode already)
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Job type
export interface Job {
  Expense: number,
  NotBefore?: string;
  QuoteWorkPackages: any;
  Serial: any;
  QuoteNum: any;
  Hour: string;
  Equipments: any;
  Skills: any;
  WorkPackageName: string,
  WorkPackages?: string;  
  Quantity?: string;
  Services?: string;
  QuoteDetailName?: string;
  Address: string;
  City: string;
  Name: string;
  serial: number;
  id: number;
  quoteName: string;
  customerName: string;
  address: string;
  city: string;
  status: string;
  amount: number;
  urgency?: string;
  baseHours?: string;
  MustCompleteBy?: string;
  NiceToHaveBy?: string;
  BlackoutDate?: string;
  availableDate?: string;
}

// Define deviceInfo type
interface DeviceInfo {
  id: string;
  type: string;
  model: string;
  version: string;
}

// Define the context type
interface JobsContextType {
  jobs: Job[];
  updateJob: (job: Job) => void;
  jobsReady: boolean;
  deviceInfo: DeviceInfo | null;
  authorizationCode: string | null;
  setAuthorizationCode: (code: string) => void; 
  refreshJobs: () => Promise<void>;
   fetchJobs: () => Promise<void>;
}

// Create a default context value
const defaultContext: JobsContextType = {
  jobs: [],
  updateJob: () => { },
  jobsReady: false,
  deviceInfo: null,
  authorizationCode: null,
  setAuthorizationCode: () => { },
  refreshJobs: async () => { },
  fetchJobs: function (): Promise<void> {
    throw new Error('Function not implemented.');
  }
};

export const JobsContext = createContext<JobsContextType>(defaultContext);

export const JobsProvider = ({ children }: { children: ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsReady, setJobsReady] = useState<boolean>(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [authorizationCode, setAuthorizationCode] = useState<string | null>(null); 
  const [jobsFetched, setJobsFetched] = useState<boolean>(false); // Track if jobs are already fetched
  const { location, fetchLocation } = useLocation();

  // Fetch device info and initialize it in context
  useEffect(() => {
    const initializeDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
    };

    initializeDeviceInfo();
    fetchLocation();
  }, []);

  
    const fetchJobs = async () => {
      // JCM 01/18/2025: Removed the !location condition as it was created separately
      if (!deviceInfo || !authorizationCode || jobsFetched) return; // Exit if jobs are already fetched or data is missing

      // JCM 01/18/2025: Make variables for location's longitude and latitude to be used for the API URL
      let longitude = location?.longitude;
      let latitude = location?.latitude;

      // JCM 01/18/2025: If location is null (fetchLocation returns null), retrieve it from AsyncStorage
      if (!longitude || !latitude) {
        const storedLocation = await AsyncStorage.getItem('location');
        if (storedLocation) {
          const parsedLocation = JSON.parse(storedLocation);
          longitude = parsedLocation.longitude;
          latitude = parsedLocation.latitude;
        }
      }

      //  JCM 01/18/2025: Ensure longitude and latitude are available
      // if (!longitude || !latitude) {
      //   console.log('Location data is missing. Unable to fetch jobs.');
      //   return;
      // }

      try {
        const crewzControlVersion = '10';
     

        // Get current date in the required format
        const currentDate = new Date();
        const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    
        // Generate the key for the request
        // const keyString = `${deviceInfo.id}${formattedDate}`;
        const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
        const key = CryptoJS.SHA1(keyString).toString();
        console.log(`Authorization Code: ${authorizationCode}`)
        
        //  JCM 01/18/2025: Updated the URL value for Longitude and Latitude from location.longitude and location.latitude to longittude and latitude
        const url = `https://crewzcontrol.com/dev/CCService/GetQuoteList.php?DeviceID=${encodeURIComponent(deviceInfo.id)}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Longitude=${longitude}&Latitude=${latitude}&Language=EN`;
        console.log(`Request URL: ${url}`);

        const response = await fetch(url);
        const data = await response.text();
        console.log(`Response Data: ${data}`);

        // Parse XML response
        const parser = new XMLParser();
        const result = parser.parse(data);
        const resultInfo = result?.ResultInfo;

        if (resultInfo && resultInfo.Result === 'Success') {
          // Extract the quotes
          const quotes = resultInfo.Selections?.Quote || [];
          const normalizedQuotes = Array.isArray(quotes) ? quotes : [quotes]; // Normalize single object to array

          const fetchedJobs = normalizedQuotes.map((quote: any) => ({
            id: parseInt(quote.Serial, 10) ,
            quoteName: quote.QName || '-',
            QuoteNum: quote.QuoteNum || '_',
            customerName: quote.Name || '-',
            address: quote.Address || '-',
            city: quote.City || '-',
            Expense: quote.Expense || '0',
            // JCM 01/15/2025: Replace - with 0 on quote amount. When quote.Amount is equal to 0, it should display 0 not - to avoid $NaN issue on the UI
            amount: quote.Amount || '0',
            status: quote.Status || '-',
            serial: parseInt(quote.Serial, 10) || -1, // Map `Serial`
            Name: quote.Name || '-',
            Address: quote.Address || '-',
            City: quote.City || '-',
            QuoteDetailName: quote.QuoteDetailName || '-',
            Services: quote.QuoteDetailName || '-',
            Quantity: quote.Quantity || '-',
            WorkPackages: quote.WorkPackages || '-',
            WorkPackageName: quote.WorkPackageName || '-',
            QuoteWorkPackageName: quote.QuoteWorkPackageName || '-',
            QuoteWorkPackage: quote.QuoteWorkPackage || '-',
            QuoteWorkPackages: quote.QuoteWorkPackages || '-',
            QuoteWorkPackageSerial: quote.QuoteWorkPackageSerial || '-',
            QuoteWorkPackageAlternates: quote.QuoteWorkPackageAlternates || '-',

            Serial: quote.Serial || '-',     
            Hour: quote.Hour || '0',         
            Equipments: quote.Equipments || '-', 
            Skills: quote.Skills || '-',   
          }));

          // Log `amount` for each job
          // fetchedJobs.forEach((job) => {
          //   console.log(`Job Amount: ${job.amount}`);
          // });

          setJobs(fetchedJobs);
          setJobsReady(true);
          setJobsFetched(true); // Mark jobs as fetched
        } else {
          console.warn('Failed to fetch quotes:', resultInfo?.Message);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };

    useEffect(() => {
      const initialize = async () => {
        const info = await getDeviceInfo();
        setDeviceInfo(info);
      };
      initialize();
    }, []);
  
    useEffect(() => {
      if (deviceInfo && authorizationCode) {
        fetchJobs();
      }
    }, [deviceInfo, authorizationCode]);

  const updateJob = (updatedJob: Job) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    );
  };

  return (
    <JobsContext.Provider
      value={{ jobs, updateJob, jobsReady, deviceInfo, authorizationCode, setAuthorizationCode,  refreshJobs: fetchJobs, fetchJobs,   }}
    >
      {children}
    </JobsContext.Provider>
  );
  
};

export const useJobs = () => {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
}