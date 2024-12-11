import React, { createContext, useState, ReactNode, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { XMLParser } from 'fast-xml-parser';
import { getDeviceInfo } from '../components/DeviceUtils';

// Define the Job type
export interface Job {
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
  amount: string;
  urgency?: string;
  baseHours?: string;
  mustCompleteDate?: string;
  niceToHaveDate?: string;
  blackoutDate?: string;
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
  refreshJobs: () => void;
}

// Create a default context value
const defaultContext: JobsContextType = {
  jobs: [],
  updateJob: () => {},
  jobsReady: false,
  deviceInfo: null,
  authorizationCode: null,
  setAuthorizationCode: () => {},
  refreshJobs:  async () => {},
};

export const JobsContext = createContext<JobsContextType>(defaultContext);

export const JobsProvider = ({ children }: { children: ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsReady, setJobsReady] = useState<boolean>(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [authorizationCode, setAuthorizationCode] = useState<string | null>(null); // Add this
  const [jobsFetched, setJobsFetched] = useState<boolean>(false); // Track if jobs are already fetched

  // Fetch device info and initialize it in context
  useEffect(() => {
    const initializeDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
    };

    initializeDeviceInfo();
  }, []);

  
    const fetchJobs = async () => {
      if (!deviceInfo || !authorizationCode || jobsFetched) return; // Exit if jobs are already fetched or data is missing

      try {
        const crewzControlVersion = '10';
        const longitude = '123.456';
        const latitude = '78.910';

        // Get current date in the required format
        const currentDate = new Date();
        const formattedDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}-${currentDate.getHours()}:${currentDate.getMinutes()}`;

        // Generate the key for the request
        const keyString = `${deviceInfo.id}${formattedDate}`;
        // const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
        const key = CryptoJS.SHA1(keyString).toString();

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
            customerName: quote.Name || '-',
            address: quote.Address || '-',
            city: quote.City || '-',
            amount: quote.Amount || '-',
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
          }));

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
      value={{ jobs, updateJob, jobsReady, deviceInfo, authorizationCode, setAuthorizationCode,  refreshJobs: fetchJobs,  }}
    >
      {children}
    </JobsContext.Provider>
  );
};
