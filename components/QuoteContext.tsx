import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import CryptoJS from 'crypto-js';
import { XMLParser } from 'fast-xml-parser';
import * as Location from 'expo-location';
import { useJobs } from './JobContext'; // deviceInfo + authorizationCode

// ----------------------
// Types
// ----------------------
interface Quote {
  QuoteID: string;
  Description: string;
  Amount: string;
  // 👆 adjust keys based on actual XML response
}

interface QuoteContextType {
  quotes: Record<string, Quote[] | null>; // store quotes per jobId
  fetchQuoteDetailsFromAPI : (jobId: string) => Promise<Quote[] | null>;
  loadingQuote: boolean;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

// ----------------------
// Helper
// ----------------------
const formatDate = (date: Date): string => {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(
    2,
    '0'
  )}/${date.getFullYear()}-${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
};

// ----------------------
// Provider
// ----------------------
export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const { deviceInfo, authorizationCode } = useJobs(); 
  const [quotes, setQuotes] = useState<Record<number, Quote[] | null>>({});
  const [loadingQuote, setLoadingQuote] = useState(false);

  const fetchQuoteDetailsFromAPI  = async (jobId: string): Promise<Quote[] | null> => {
    if (!deviceInfo || !authorizationCode) {
      console.error('Missing device information or authorization code');
      return null;
    }

    try {
      setLoadingQuote(true);

      // 🔹 get location
      const { coords } = await Location.getCurrentPositionAsync({});
      const location = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      const crewzControlVersion = '1';
      const formattedDate = formatDate(new Date());
      const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
      const key = CryptoJS.SHA1(keyString).toString();

      const url = `https://CrewzControl.com/dev/CCService/GetQuote.php?DeviceID=${encodeURIComponent(
        deviceInfo.id
      )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Serial=${jobId}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
      
      console.log('📡 Fetching Quote URL:', url);

      const response = await fetch(url);
      const data = await response.text();

      console.log('📩 Raw GetQuote response:', data);

      const parser = new XMLParser();
      const result = parser.parse(data);

      if (result.ResultInfo?.Result === 'Success') {
        let rawQuotes = result.ResultInfo.Selections?.Quote;

        // 🔹 Normalize to array
        const parsedQuotes: Quote[] = Array.isArray(rawQuotes) ? rawQuotes : rawQuotes ? [rawQuotes] : [];

        setQuotes((prev) => ({ ...prev, [jobId]: parsedQuotes }));
        return parsedQuotes;
      } else {
        // MG 12-29-2025
        // Display API error message to user only if API provides a message
        // This ensures users see actual errors from the backend, not hardcoded messages
        if (result.ResultInfo?.Message) {
          Alert.alert('Error', result.ResultInfo.Message, [{ text: 'OK' }]);
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching quote details:', error);
      return null;
    } finally {
      setLoadingQuote(false);
    }
  };

  return (
    <QuoteContext.Provider value={{ quotes, fetchQuoteDetailsFromAPI , loadingQuote }}>
      {children}
    </QuoteContext.Provider>
  );
};
// Custom hook for easier use
export const useQuotes = (): QuoteContextType => {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuoteProvider');
  }
  return context;
};
// -
