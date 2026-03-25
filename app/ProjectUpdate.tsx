import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  ImageBackground,
  Image,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { JobsContext, Job } from '../components/JobContext';
import { useQuotes } from "../components/QuoteContext"; 
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import LogoStyles from '../components/LogoStyles';
import DropDownPicker from 'react-native-dropdown-picker';
import CustomDatePicker from '../components/CustomDatePicker';
import { getDeviceInfo } from '../components/DeviceUtils';
import { XMLParser } from 'fast-xml-parser';
import CryptoJS from 'crypto-js';
import { FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; 
import useLocation from '@/hooks/useLocation';
// import { useFocusEffect } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars'; 
import DateTimePicker from '../components/DateTimePicker';
import { useRoute } from '@react-navigation/native';
import { useJobs } from '../components/JobContext';

interface WorkPackageAlternate {
  AlternateName: string;
  AlternatePriority: number;
  AlternateStatus: number;
  AlternateHour: number;
  AlternateSerial: number;
}
interface QuoteWorkPackageAlternate {
  QuoteAlternateName: string;
  QuoteAlternatePriority: number;
  QuoteAlternateStatus: number;
  QuoteAlternateHour: number;
  QuoteAlternateSerial: number;
}

interface WorkPackage {
  WorkPackage: any;
  WorkPackages: any;
  WorkPackageName: string;
  WorkPackageSerial: number;
  WorkPackageAlternates: WorkPackageAlternate[] | WorkPackageAlternate;
}
interface QuoteWorkPackage {
  QuoteWorkPackage: any;
  QuoteWorkPackages: any;
  QuoteWorkPackageName: string;
  QuoteWorkPackageSerial: number;
  QuoteWorkPackageAlternates: QuoteWorkPackageAlternate[] | QuoteWorkPackageAlternate;
}

interface QuoteDetailNote {
  '#text'?: string;
}

interface Service {
  ServiceSerial: number;
  QuoteDetailName: string;
  QuoteDetailNote: string | QuoteDetailNote;
  Quantity?: string;
  WorkPackages: WorkPackage | WorkPackage[] | undefined;
}

//M.G. 1-16-2026
// Removed Multi-Day button components - replaced with DayCount field approach

const ProjectUpdate: React.FC = () => {
   const { fetchJobs } = useJobs();
  const router = useRouter();
  // const { job, quoteSerial } = useLocalSearchParams();
  const { job, quoteSerial } = useLocalSearchParams<{ job?: string; quoteSerial?: string }>();
  
  // const jobObj: Job = typeof job === 'string' ? JSON.parse(job) : job;
  const jobObj: Job = typeof job === 'string' ? JSON.parse(job) : job;
  console.log("quoteSerial param:", quoteSerial);
  console.log("jobObj.Serial:", jobObj?.Serial);
  // const quoteSerial = jobObj?.Serial;
  const { updateJob, authorizationCode } = useContext(JobsContext)!;
  const { width: deviceWidth } = Dimensions.get('window');
  const [jobData, setJobData] = useState<Job | null>(null);
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);
  
  const [customerName, setName] = useState(jobObj?.Name);
  // MG 1-6-2026: Check both uppercase 'Amount' (from raw API) and lowercase 'amount' (from Job interface)
  // to handle case sensitivity when jobObj is passed from Project.tsx fetchQuoteDetails
  const [amount, setAmount] = useState((jobObj as any)?.Amount || (jobObj as any)?.amount || '');
  // const [expense, setExpense] = useState(jobObj?.Expense);
  const [expense, setExpense] = useState<string>(
  jobObj?.Expense !== undefined ? String(jobObj.Expense) : "0"
);
  const [multidayhour, setMultidayhour] = useState((jobObj as any)?.MultiDayHour);
  const [address, setAddress] = useState(jobObj?.Address);
  const [city, setCity] = useState(jobObj?.City);
  const [quoteNum, setQuoteNum] = useState(jobObj?.QuoteNum);
  const [serial, setserial] = useState(jobObj?.Serial);
  // MG 1-6-2026: Initialize hours with .toFixed(2) to ensure decimal places are always shown (e.g., "2.00" not "2")
  // This prevents hours from displaying without decimals when quote is first opened
  const [quoteHours, setQuoteHours] = useState(() => {
  const initial = parseFloat(jobObj?.Hour);
  return !isNaN(initial) ? initial.toFixed(2) : '';
});
  
  // MG 1-8-2026: Initialize urgency from jobObj.Priority to avoid blank dropdown on load
  // Project.tsx already fetches this data before navigation, so use it immediately
  const [urgency, setUrgency] = useState((jobObj as any)?.Priority || '');
  const [urgencyOpen, setUrgencyOpen] = useState(false);
  const [multiDayOpen, setMultiDayOpen] = useState(false);
  const [quoteWorkPackages, setQuoteWorkPackages] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<{
    softwareVersion: string | number | boolean;
    id: string;
    type: string;
    model: string;
    version: string;
  } | null>(null);

  const { location, fetchLocation } = useLocation(); // custom hook

  // MG 1-16-2026: NEW - DayCount replaces MultiDayFlag approach
  // This state tracks the number of days for the job (minimum 1)
  // Used to dynamically render "Day 1 Hours", "Day 2 Hours", etc. input fields
  // and to determine how many day selection chips to show for resources
  const [dayCount, setDayCount] = useState<number>(() => {
    // Initialize from jobObj.DayCount if available, default to 1
    const initialValue = (jobObj as any)?.DayCount || 1;
    console.log('🔢 [INIT] DayCount initialized:', initialValue);
    return initialValue;
  });
  // MG 1-16-2026: Separate state for input display to allow empty field while editing
  // This allows users to delete/clear the field temporarily while typing
  // The actual dayCount state (used by UI logic) always maintains minimum value of 1
  const [dayCountInput, setDayCountInput] = useState<string>(() => {
    return String((jobObj as any)?.DayCount || 1);
  });
  const [multiDayHours, setMultiDayHours] = useState<{ [key: number]: string }>({});
  
  // Parse multidayhour string into multiDayHours state when component loads
  useEffect(() => {
    if (multidayhour) {
      const parsedHours: { [key: number]: string } = {};
      multidayhour.split("|").forEach((pair: string) => {
        const [day, hour] = pair.split("-");
        parsedHours[parseInt(day, 10)] = hour;
      });
      setMultiDayHours(parsedHours);
      console.log('🔄 Loaded saved MultiDayHours:', parsedHours);
    }
  }, [multidayhour]);

  const [mustCompleteDate, setMustCompleteDate] = useState(jobObj?.MustCompleteBy);
  const [minCrew, setMinCrew] = useState<string>(
    jobObj?.MinCrew !== undefined ? String(jobObj.MinCrew) : '0'
  );
  const [blackoutDate, setBlackoutDate] = useState<string | undefined>(jobObj?.BlackoutDate);
  const [notBefore, setNotBefore] = useState(jobObj?.NotBefore);
  
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  
  
  
  const [availableDate, setAvailableDate] = useState(jobObj?.availableDate);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSkillModalVisible, setSkillModalVisible] = useState(false);
  const [isEquipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; serial: string } | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<{ name: string; serial: string } | null>(null);
  const [selectedWorkPackage, setSelectedWorkPackage] = useState<{ name: string; serial: string } | null>(null);

  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [selected, setSelected] = useState('');
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isPickerVisible, setIsPickerVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  // MG 1-6-2026: Track if this is the first time loading the quote to prevent duplicate API call
  // Data is already fetched by Project.tsx, so we skip the initial useFocusEffect fetch
  const isFirstMountRef = useRef<boolean>(true);


  const hoursInputRef = useRef<TextInput>(null);
  const multiDayInputRefs = useRef<{ [key: number]: TextInput | null }>({});
  const handleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef<boolean>(false);
  // MG 12-26-2025: Track shown error messages to prevent duplicate alerts
  const shownErrorsRef = useRef<Set<string>>(new Set());
  const previousSerialRef = useRef<string | number | null>(null);
  // MG 12-26-2025: Track if user made any edits to show errors only for user actions
  const userEditedRef = useRef<boolean>(false);
  // MG 1-8-2026: Track when data is being loaded from API to prevent dropdown onChange from triggering saves
  const isLoadingDataRef = useRef<boolean>(false);
  // MG 1-20-2026: Track last saved priority to prevent duplicate API calls on re-render
  const lastSavedPriorityRef = useRef<string>('');

  // MG 12-26-2025: Helper function to show error only once per session and only for user edits
  const showErrorOnce = (message: string) => {
    // Only show error if user actually made an edit
    if (userEditedRef.current && !shownErrorsRef.current.has(message)) {
      shownErrorsRef.current.add(message);
      Alert.alert('Error', message, [{ text: 'OK' }]);
    }
  };

  // MG 12-26-2025: Reset shown errors and edit flag when opening a DIFFERENT quote (not when navigating away)
  useEffect(() => {
    const currentSerial = jobObj?.Serial;
    if (currentSerial && previousSerialRef.current !== null && previousSerialRef.current !== currentSerial) {
      // Serial changed to a different valid quote - clear errors and reset edit flag
      shownErrorsRef.current.clear();
      userEditedRef.current = false;
      // MG 1-6-2026: Reset first mount flag so we skip duplicate API call when opening a new quote
      // This ensures data from Project.tsx is used without refetching
      isFirstMountRef.current = true;
    }
    previousSerialRef.current = currentSerial;
  }, [jobObj?.Serial]);

  // MG 12-26-2025: Reset edit flag when screen first loads
  useEffect(() => {
    userEditedRef.current = false;
    // MG 1-20-2026: Initialize lastSavedPriority with current value to prevent duplicate saves on mount
    lastSavedPriorityRef.current = (jobObj as any)?.Priority || '';
  }, []);

  // Function to format a specific day's input
  const formatDayInput = (day: number) => {
    const currentValue = multiDayHours[day] || "";
    if (currentValue.trim() !== "" && !isNaN(parseFloat(currentValue))) {
      const numericValue = parseFloat(currentValue);
      const formattedValue = numericValue.toFixed(2);
      setMultiDayHours(prev => ({
        ...prev,
        [day]: formattedValue
      }));
    }
  };

  // Format all fields when multiDayHours changes (backup formatting)
  useEffect(() => {
    const timer = setTimeout(() => {
      Object.keys(multiDayHours).forEach(dayKey => {
        const dayNum = parseInt(dayKey);
        const value = multiDayHours[dayNum];
        if (value && value.trim() !== "" && !isNaN(parseFloat(value)) && !value.includes('.')) {
          // Only format if it's a whole number without decimals
          formatDayInput(dayNum);
        }
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [multiDayHours]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (handleSaveTimeoutRef.current) {
        clearTimeout(handleSaveTimeoutRef.current);
      }
    };
  }, []);

  // MG 1-8-2026: Moved before useFocusEffect and wrapped in useCallback
  // This prevents function recreation and ensures stable reference for useFocusEffect dependency
  const performFetchQuoteDetails = useCallback(async () => {
    if (!deviceInfo || !location) {
      return;
    }

    // Set fetching flag
    isFetchingRef.current = true;
    // MG 1-8-2026: Set loading flag to prevent dropdown onChange from triggering saves
    isLoadingDataRef.current = true;
    console.log('🔄 Starting GetQuote API call...');

    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(
      2,
      '0'
    )}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
    const crewzControlVersion = '1';
    // const serial = jobObj.Serial || quoteSerial
    const url = `https://CrewzControl.com/dev/CCService/GetQuote.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&Serial=${jobObj.Serial}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}`;

    console.log('Fetching Quote on Focus: ', url);

    try {
      const response = await fetch(url);
      const data = await response.text();
      const parser = new XMLParser();
      const result = parser.parse(data);
      console.log('GetQuote Data from ProjectUpdate: ', data);
      if (result.ResultInfo?.Result === 'Success') {
        const quote = result.ResultInfo.Selections?.Quote || {};

        console.log('Fetched Quote Data: ', quote);

        // MG 1-6-2026: Use parseFloat().toFixed(2) instead of .toString() to preserve decimal places
        // This ensures hours display as "2.00" instead of "2" when refetching data
        setQuoteHours(quote.Hour ? parseFloat(quote.Hour).toFixed(2) : '0.00');
        setAmount(quote.Amount ? quote.Amount.toString() : '');
        setMustCompleteDate(quote.MustCompleteBy || '');
        setMinCrew(quote.MinCrew !== undefined ? String(quote.MinCrew) : '0');
        
        // MG 1-16-2026: Parse DayCount from API response (replaces MultiDayFlag)
        const fetchedDayCount = quote.DayCount ? parseInt(String(quote.DayCount), 10) : 1;
        const validDayCount = fetchedDayCount >= 1 ? fetchedDayCount : 1;
        console.log('🔢 [API GET] DayCount received from backend:', quote.DayCount, '→ parsed:', validDayCount);
        setDayCount(validDayCount);
        setDayCountInput(String(validDayCount));
        
        // MG 1-12-2026: BUG FIX - Blackout dates need to update both singular and array states
        // Problem: When refetching from API, only blackoutDate (string) was updated, but blackoutDates (array) was never updated
        // Impact: DateTimePicker component uses the array state, so it showed stale/incorrect dates
        // Solution: Parse the API response string and update both states to keep them in sync
        const fetchedBlackoutDate = quote.BlackoutDate || '';
        setBlackoutDate(fetchedBlackoutDate);
        if (fetchedBlackoutDate) {
          const blackoutDatesArray = fetchedBlackoutDate.split(',').map((date: string) => date.trim());
          setBlackoutDates(blackoutDatesArray);
        } else {
          setBlackoutDates([]);
        }
        
        setAvailableDate(quote.AvailableDate || '');
        
        // MG 1-12-2026: BUG FIX - NotBefore was never being updated from API
        // Problem: All other date fields (MustCompleteBy, AvailableDate, etc.) were updated on refetch, but NotBefore was missing
        // Impact: User changes to "Do Not Schedule Before" date would appear to save but revert to old value on screen navigation
        // Solution: Added setNotBefore() to update state when API returns fresh data
        setNotBefore(quote.NotBefore || '');
        
        // MG 1-12-2026: BUG FIX - Expense was never being updated from API
        // Problem: Similar to NotBefore, Expense field was never updated when refetching quote data
        // Impact: User changes to Expense would revert to initial value after navigating away and back
        // Solution: Added setExpense() to update state when API returns fresh data
        setExpense(quote.Expense !== undefined ? String(quote.Expense) : '0');
        
        // MG 1-20-2026: Update both state and ref to prevent duplicate API calls
        const priority = quote.Priority || '';
        setUrgency(priority);
        lastSavedPriorityRef.current = priority;

        // MG 1-20-2026: Restore Skills with Day selections
        // Groups skills by Serial and combines day_number values into comma-separated string
        // Handles case where backend returns multiple rows (one per day) for the same skill
        if (quote.Skills) {
          const fetchedSkills = normalizeToArray(quote.Skills.Skill);
          console.log('📥 Restoring Skills - Raw data:', JSON.stringify(fetchedSkills, null, 2));
          
          // Group skills by Serial and combine day_number values
          // Backend may return multiple rows (one per day) for the same skill
          const skillMap = new Map<number, any>();
          fetchedSkills.forEach((skill: any) => {
            const serial = skill.SkillSerial;
            if (skillMap.has(serial)) {
              // Combine day values
              const existing = skillMap.get(serial);
              const existingDays = existing.selectedNumber ? existing.selectedNumber.split(',') : [];
              const newDay = skill.SkillDay ? String(skill.SkillDay) : '';
              if (newDay && !existingDays.includes(newDay)) {
                existingDays.push(newDay);
              }
              existing.selectedNumber = existingDays.sort((a: string, b: string) => parseInt(a) - parseInt(b)).join(',');
            } else {
              // First occurrence of this skill
              const dayValue = skill.SkillDay ? String(skill.SkillDay) : '';
              skillMap.set(serial, {
                ...skill,
                selectedNumber: dayValue
              });
            }
          });
          
          const combinedSkills = Array.from(skillMap.values());
          combinedSkills.forEach(skill => {
            console.log(`  Skill "${skill.SkillName}" - Combined SkillDays: ${skill.selectedNumber}`);
          });
          setSkills(combinedSkills);
        }

        // MG 1-20-2026: Restore Equipments with Day selections
        // Groups equipment by Serial and combines day_number values into comma-separated string
        // Handles case where backend returns multiple rows (one per day) for the same equipment
        if (quote.Equipments) {
          const fetchedEquipments = normalizeToArray(quote.Equipments.Equipment);
          console.log('📥 Restoring Equipments - Raw data:', JSON.stringify(fetchedEquipments, null, 2));
          
          // Group equipment by Serial and combine day_number values
          // Backend may return multiple rows (one per day) for the same equipment
          const equipmentMap = new Map<number, any>();
          fetchedEquipments.forEach((equipment: any) => {
            const serial = equipment.EquipmentSerial;
            if (equipmentMap.has(serial)) {
              // Combine day values
              const existing = equipmentMap.get(serial);
              const existingDays = existing.selectedNumber ? existing.selectedNumber.split(',') : [];
              const newDay = equipment.EquipmentDay ? String(equipment.EquipmentDay) : '';
              if (newDay && !existingDays.includes(newDay)) {
                existingDays.push(newDay);
              }
              existing.selectedNumber = existingDays.sort((a: string, b: string) => parseInt(a) - parseInt(b)).join(',');
            } else {
              // First occurrence of this equipment
              const dayValue = equipment.EquipmentDay ? String(equipment.EquipmentDay) : '';
              equipmentMap.set(serial, {
                ...equipment,
                selectedNumber: dayValue
              });
            }
          });
          
          const combinedEquipments = Array.from(equipmentMap.values());
          combinedEquipments.forEach(equipment => {
            console.log(`  Equipment "${equipment.EquipmentName}" - Combined EquipmentDays: ${equipment.selectedNumber}`);
          });
          setEquipments(combinedEquipments);
        }

        // MG 1-20-2026: Restore Work Packages with Day selections
        // Groups work packages by Serial and combines day_number values into comma-separated string
        // Handles case where backend returns multiple rows (one per day) for the same work package
        // NOTE: As of 1-21-2026, backend does not yet return QuoteWorkPackageDay field (pending fix)
        if (quote.QuoteWorkPackages) {
          const fetchedWorkPackages = normalizeToArray(quote.QuoteWorkPackages.QuoteWorkPackage);
          console.log('📥 Restoring Work Packages - Raw data:', JSON.stringify(fetchedWorkPackages, null, 2));
          
          // Group work packages by Serial and combine day_number values
          // Backend may return multiple rows (one per day) for the same work package
          const workPackageMap = new Map<number, any>();
          fetchedWorkPackages.forEach((qwp: any) => {
            const serial = qwp.QuoteWorkPackageSerial;
            if (workPackageMap.has(serial)) {
              // Combine day values
              const existing = workPackageMap.get(serial);
              const existingDays = existing.selectedNumber ? existing.selectedNumber.split(',') : [];
              const newDay = qwp.QuoteWorkPackageDay ? String(qwp.QuoteWorkPackageDay) : '';
              if (newDay && !existingDays.includes(newDay)) {
                existingDays.push(newDay);
              }
              existing.selectedNumber = existingDays.sort((a: string, b: string) => parseInt(a) - parseInt(b)).join(',');
            } else {
              // First occurrence of this work package
              const dayValue = qwp.QuoteWorkPackageDay ? String(qwp.QuoteWorkPackageDay) : '';
              workPackageMap.set(serial, {
                ...qwp,
                selectedNumber: dayValue
              });
            }
          });
          
          const combinedWorkPackages = Array.from(workPackageMap.values());
          combinedWorkPackages.forEach(qwp => {
            console.log(`  WorkPackage "${qwp.QuoteWorkPackageName}" - Combined QuoteWorkPackageDays: ${qwp.selectedNumber}`);
          });
          setQuoteWorkPackages(combinedWorkPackages);
        }
      } else {
        // MG 12-26-2025
        // Display API error message only once (prevents duplicate alerts)
        if (result.ResultInfo?.Message) {
          showErrorOnce(result.ResultInfo.Message);
        }
      }
    } catch (error) {
      console.error('Error fetching quote details:', error);
    } finally {
      // Clear fetching flag
      isFetchingRef.current = false;
      console.log('✅ GetQuote API call completed');
      // MG 1-8-2026: Clear loading flag after state updates complete
      // Use setTimeout to ensure React has processed all state updates (including setUrgency)
      setTimeout(() => {
        isLoadingDataRef.current = false;
      }, 100);
    }
  }, [deviceInfo, location, authorizationCode, jobObj.Serial]);

  // MG 1-8-2026: Wrapped in useCallback to prevent function recreation on every render
  // This ensures useFocusEffect cleanup properly removes old handlers and prevents handler accumulation
  const fetchQuoteDetails = useCallback(async (immediate = false) => {
    if (!deviceInfo || !location || !authorizationCode || !jobObj.Serial) {
      return; // Exit early if prerequisites are not ready or API was already called
    }

    // For immediate calls (like after removing items), skip debouncing
    if (immediate) {
      await performFetchQuoteDetails();
      return;
    }

    // Debounce multiple rapid calls (for useFocusEffect)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(async () => {
      if (isFetchingRef.current) {
        console.log('🔄 Already fetching, skipping duplicate call');
        return;
      }
      await performFetchQuoteDetails();
    }, 100); // MG 1-6-2026: Reduced debounce from 500ms to 100ms for faster data loading when refetching
  }, [deviceInfo, location, authorizationCode, jobObj.Serial, performFetchQuoteDetails]);

  // MG 1-6-2026: Modified useFocusEffect to prevent duplicate API call on initial load
  // Project.tsx already fetched the data, so we use that until user leaves and returns
  useFocusEffect(
  useCallback(() => {
    // Skip API call on first mount since data is already loaded from Project.tsx
    if (isFirstMountRef.current) {
      console.log("🔄 ProjectUpdate initial load, using existing data");
      return () => {
        // MG 1-6-2026: Only mark as no longer first mount when leaving the screen
        // This prevents the flag from being reset by dependency changes (deviceInfo, location)
        isFirstMountRef.current = false;
      };
    }

    // On subsequent focuses, refresh the data
    console.log("🔄 ProjectUpdate focused, refreshing quote...");
    fetchQuoteDetails();

    // optional cleanup when screen loses focus
    return () => {
      console.log("👋 ProjectUpdate unfocused");
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Clear fetching flag
      isFetchingRef.current = false;
    };
  }, [jobObj?.Serial, deviceInfo, location, authorizationCode, fetchQuoteDetails]) // MG 1-8-2026: Added fetchQuoteDetails to dependencies to prevent handler accumulation
  );

  useEffect(() => {
    if (jobObj?.BlackoutDate) {
      const blackoutDatesArray = jobObj.BlackoutDate.split(',').map(date => date.trim());
      setBlackoutDates(blackoutDatesArray);
    }
  }, [jobObj?.BlackoutDate]);

  const formattedMarkedDates = blackoutDates.reduce((acc, date) => {
    if (date) {
      acc[date] = { selected: true, marked: true };
    }
    return acc;
  }, {} as Record<string, { selected: boolean; marked: boolean }>);

  const generateHours = () => {
    const items = [];
    for (let i = 0; i <= 80; i += 0.25) {
      items.push(
        <Picker.Item key={i} label={i.toFixed(2)} value={i.toString()} />
      );
    }
    return items;
  };

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
      fetchLocation();
    };

    fetchDeviceInfo();
    // Parse Skills and Equipments
    const parsedSkills = jobObj?.Skills ? normalizeToArray(jobObj.Skills.Skill) : [];
    const parsedEquipments = jobObj?.Equipments ? normalizeToArray(jobObj.Equipments.Equipment) : [];
    const parsedQuoteWorkPackages = jobObj?.QuoteWorkPackages ? normalizeToArray(jobObj.QuoteWorkPackages.QuoteWorkPackage) : []; 
    setSkills(parsedSkills);
    setEquipments(parsedEquipments);
    setQuoteWorkPackages(parsedQuoteWorkPackages);
  }, []);

  const normalizeToArray = <T,>(data: T | T[] | undefined): T[] => {
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  };

  const normalizeWorkPackages = (
    workPackages: WorkPackage | WorkPackage[] | undefined
  ): WorkPackage[] => {
    try {
      if (!workPackages) return [];
      return Array.isArray(workPackages) ? workPackages : [workPackages];
    } catch (error) {
      console.error('Error parsing Work Packages:', error);
      return [];
    }
  };

  const normalizeQuoteWorkPackages = (
    quoteWorkPackages: QuoteWorkPackage | QuoteWorkPackage[] | undefined
  ): QuoteWorkPackage[] => {
    try {
      if (!quoteWorkPackages) return [];
      return Array.isArray(quoteWorkPackages) ? quoteWorkPackages : [quoteWorkPackages];
    } catch (error) {
      console.error('Error parsing Work Packages:', error);
      return [];
    }
  };

  // const services: Service[] = (() => {
  //   try {
  //     const parsedServices =
  //       typeof jobObj.Services === 'string' ? JSON.parse(jobObj.Services) : jobObj.Services;
  //       console.log('Services: ',parsedServices)
  //     return normalizeToArray(parsedServices?.Service);
  //   } catch (error) {
  //     console.error('Error parsing Services:', error);
  //     return [];
  //   }
  // })();

  const services: Service[] = (() => {
    try {
      const rawServices = jobObj?.Services;
  
      if (!rawServices || (typeof rawServices === 'string' && rawServices.trim() === '')) {
        return []; // Handle undefined, null, or empty string
      }
  
      const parsedServices = typeof rawServices === 'string'
        ? JSON.parse(rawServices)
        : rawServices;
  
      console.log('Parsed Services:', parsedServices);
  
      return normalizeToArray(parsedServices?.Service);
    } catch (error) {
      console.error('Error parsing Services:', error, jobObj?.Services);
      return [];
    }
  })();
  

  const handleSave = async (updated: string | string[], type: string, isUserAction: boolean = false) => {
  console.log('🔍 handleSave called - type:', type, 'isUserAction:', isUserAction, 'isSaving:', isSavingRef.current);
  
  // MG 12-26-2025: Mark that user made an edit only if it's a user action
  if (isUserAction) {
    userEditedRef.current = true;
  }
  
  // Clear any existing timeout
  if (handleSaveTimeoutRef.current) {
    clearTimeout(handleSaveTimeoutRef.current);
    handleSaveTimeoutRef.current = null;
  }
  
  // Debounce the handleSave call by 200ms
  handleSaveTimeoutRef.current = setTimeout(async () => {
    if (!deviceInfo || !location || (!jobObj.Serial && !quoteSerial)) {
      console.error('Device, location, or quote serial information is missing');
      return;
    }

    // Prevent multiple simultaneous saves
    if (isSavingRef.current) {
      console.log('🚫 handleSave skipped - already saving');
      return;
    }
    
    isSavingRef.current = true;
    console.log('🚀 Starting UpdateQuote API call...');

  const crewzControlVersion = '1';
  const currentDate = new Date();
  const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
    currentDate.getDate()
  ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(
    2,
    '0'
  )}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

  const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
  const key = CryptoJS.SHA1(keyString).toString();

  const serial = jobObj.Serial || quoteSerial;

  // 🔹 Blackout Dates Handling
  const validBlackoutDates = blackoutDates.filter(date => date.trim() !== "");
  const formattedBlackoutDates = validBlackoutDates.length > 0 
    ? validBlackoutDates.join(",") 
    : "";

  // MG 1-12-2026: BUG FIX - Blackout dates save logic was appending instead of replacing
  // Problem: Old code did [...blackoutDates, updated] which APPENDED new dates to existing ones
  //          But DateTimePicker sends the COMPLETE list of dates (e.g., "01/15/2026,01/20/2026")
  //          So it was treating the comma-separated string as ONE element: ["01/15/2026", "01/15/2026,01/20/2026"] (corrupted!)
  // Impact: Blackout dates would get duplicated and malformed in the database
  // Solution: REPLACE the entire array instead of appending. Parse the comma-separated string properly.
  let updatedBlackoutDates = blackoutDates;
  if (type === 'BlackoutDate') {
    if (Array.isArray(updated)) {
      updatedBlackoutDates = updated;
    } else if (typeof updated === 'string') {
      // Parse the comma-separated string into an array
      updatedBlackoutDates = updated.split(',').map((date: string) => date.trim()).filter((date: string) => date !== '');
    }
  }
  const uniqueBlackoutDates = [...new Set(updatedBlackoutDates)].join(',');

  // 🔹 Expense Handling
  let expenseValue = expense;
  if (type === "Expense") {
    if (!updated || updated === "" || isNaN(Number(updated))) {
      expenseValue = "0";
    } else {
      expenseValue = updated.toString();
    }
  }

  // 🔹 MultiDayHour + DayCount (MG 1-16-2026: Replaced MultiDayFlag with DayCount)
  let multiDayHourValue = multidayhour; // keep state value (string)
  let dayCountValue = dayCount; // keep state value (integer)
  
  console.log('🔍 [DEBUG] Before processing - dayCount state:', dayCount);
  console.log('🔍 [DEBUG] Before processing - updated param:', updated);
  console.log('🔍 [DEBUG] Before processing - type:', type);

  if (type === "MultiDayHour") {
    multiDayHourValue = Array.isArray(updated) ? updated.join("|") : updated;
    console.log('💾 [SAVE] MultiDayHour value:', multiDayHourValue);
  }
  if (type === "DayCount") {
    console.log('🔍 [DEBUG] Inside DayCount block - updated:', updated);
    const countValue = Array.isArray(updated) ? updated[0] : updated;
    console.log('🔍 [DEBUG] countValue after array check:', countValue);
    dayCountValue = parseInt(String(countValue), 10);
    console.log('🔍 [DEBUG] dayCountValue after parseInt:', dayCountValue);
    // Ensure minimum value is 1
    if (isNaN(dayCountValue) || dayCountValue < 1) {
      console.log('🔍 [DEBUG] dayCountValue was invalid, setting to 1');
      dayCountValue = 1;
    }
    console.log('💾 [SAVE] DayCount value to send:', dayCountValue);
  }
  
  console.log('🔍 [DEBUG] Final dayCountValue for URL:', dayCountValue);

  // 🔹 MG 1-20-2026: Removed WorkPackageDay from generic handler - now uses handleUpdateResourceGroupDay
  // Day selections for Skills and Equipment are handled by their specific API handlers (handleUpdateSkillDay, handleUpdateEquipmentDay)
  // This generic handler is only for MultiDayHour updates from the main quote form

  // Strip out carriage returns and newlines from all values
  const cleanValue = (val: any) => String(val || '').replace(/[\r\n]/g, '');
  
  const priorityValue = cleanValue(type === 'Priority' ? updated : urgency);
  const mustCompleteValue = cleanValue(type === 'MustCompleteBy' ? updated : mustCompleteDate);
  const notBeforeValue = cleanValue(type === 'NotBefore' ? updated : notBefore);
  const hoursValue = cleanValue(type === 'Hours' ? updated : (quoteHours || '0.00'));
  const blackoutValue = cleanValue(uniqueBlackoutDates);
  
  // MG 1-12-2026: BUG FIX - Expense validation logic was computed but never used
  // Problem: Lines 727-735 compute expenseValue with proper validation (check for NaN, default to "0")
  //          But this line was doing: type === 'Expense' ? expense : expense (SAME value on both sides!)
  //          So the validation logic above was completely bypassed
  // Impact: Invalid expense values could be sent to API, and the computed expenseValue variable was wasted code
  // Solution: Use the expenseValue that was already computed with validation above
  const expenseClean = cleanValue(expenseValue);
  
  const multiDayHourClean = cleanValue(multiDayHourValue);
  
  // Minimum Crew handling
  let minCrewValue = minCrew;
  if (type === 'MinCrew') {
    if (!updated || updated === '' || isNaN(Number(updated))) {
      minCrewValue = '0';
    } else {
      minCrewValue = String(parseInt(String(updated), 10));
    }
  }
  const minCrewClean = cleanValue(minCrewValue);

  console.log('🔍 [URL BUILD] About to build URL with dayCountValue:', dayCountValue, 'type:', typeof dayCountValue);

  const url = `https://CrewzControl.com/dev/CCService/UpdateQuote.php?DeviceID=${deviceInfo.id}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&Serial=${serial}&CrewzControlVersion=${crewzControlVersion}&Priority=${priorityValue}&MustCompleteBy=${mustCompleteValue}&MinCrew=${minCrewClean}&BlackoutDate=${blackoutValue}&NotBefore=${notBeforeValue}&Hours=${hoursValue}&Expense=${expenseClean}&MultiDayHour=${multiDayHourClean}&DayCount=${dayCountValue}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
  console.log('📤 [API UPDATE] Sending to backend:');
  console.log('   - DayCount:', dayCountValue);
  console.log('   - MultiDayHour:', multiDayHourValue);
  console.log('   - Hours:', hoursValue);
  console.log('   - Full URL:', url);

  try {
    const response = await fetch(url);
    const data = await response.text();
    console.log('API Response:', data);

    const parser = new XMLParser();
    const result = parser.parse(data);

    if (result.ResultInfo?.Result === 'Success') {
      console.log('✅ [API UPDATE] Quote updated successfully!');
      if (type === 'DayCount') {
        console.log('✅ [API UPDATE] DayCount saved to backend:', dayCountValue);
      }
      console.log('✅ Dates Array: ', uniqueBlackoutDates);
      setBlackoutDates(updatedBlackoutDates);
      
      // MG 1-12-2026: BUG FIX - Update singular blackoutDate string state after successful save
      // Problem: When saving blackout dates, only setBlackoutDates(array) was called, but setBlackoutDate(string) was not
      // Impact: The two states (blackoutDate and blackoutDates) would be out of sync after saving
      // Solution: Update both states to keep them synchronized
      if (type === 'BlackoutDate') {
        setBlackoutDate(uniqueBlackoutDates);
      }
      
      // MG 1-16-2026: Update DayCount if that was the type being saved
      if (type === "DayCount") {
        setDayCount(dayCountValue);
      }
    } else {
      // MG 12-26-2025
      // Display API error message only once (prevents duplicate alerts)
      if (result.ResultInfo?.Message) {
        showErrorOnce(result.ResultInfo.Message);
      }
    }
  } catch (error) {
    console.error('❌ Error updating quote:', error);
  } finally {
    isSavingRef.current = false;
  }
  }, 200); // 200ms debounce
};

  // const handleRemoveResources = async (quoteWorkPackages:string) => {
  //   if (deviceInfo || location || authorizationCode || jobObj.Serial){
  //     Alert.alert('Error', 'Device info, location. authorization code, or quote serial is missing.');
  //     return;
  //   }
    
  // }
  
  //M.G. 1-29-2026
  //Show confirmation popup before deleting equipment group
  //Prevents accidental deletion when user taps minus button
  const handleRemoveQuoteWorkPackage = async (quoteWorkPackageSerial: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => console.log('Delete cancelled')
        },
        {
          text: 'Yes',
          onPress: () => performRemoveQuoteWorkPackage(quoteWorkPackageSerial)
        }
      ]
    );
  };

  const performRemoveQuoteWorkPackage = async (quoteWorkPackageSerial: number) => {
    if (!deviceInfo || !location || !authorizationCode || !jobObj.Serial) {
      console.error('Error', 'Device info, location, authorization code, or quote serial is missing.');
      return;
    }
  
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(
      2,
      '0'
    )}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
    const crewzControlVersion = '1';
  
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuoteResourceGroup.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}&Action=remove&List=${quoteWorkPackageSerial}&Quote=${jobObj.Serial}`;
  
    console.log('Remove Quote Work Package URL:', url);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      const parser = new XMLParser();
      const result = parser.parse(data);
  
      if (result.ResultInfo?.Result === 'Success') {
        // Alert.alert('Success', 'Quote Work Package removed successfully.');
        setQuoteWorkPackages((prev) =>
          prev.filter((qwp) => qwp.QuoteWorkPackageSerial !== quoteWorkPackageSerial)
        );
        fetchQuoteDetails(true); // Immediate call after removing work package
      } else {
        // MG 12-26-2025
        // Display API error message only if message exists (prevents empty alerts)
        if (result.ResultInfo?.Message) {
          Alert.alert('Error', result.ResultInfo.Message);
        }
      }
    } catch (error) {
      console.error('Error removing Quote Work Package:', error);
    }
  };

  // MG 1-16-2026: Removed handleMultiDayPress - no longer needed with DayCount approach

  const handleRemoveSkill = async (skillSerial: number ) => {
    if (!deviceInfo || !location || !authorizationCode || !skillSerial || !jobObj.Serial) {
      console.error('Error', 'Device info, location, authorization code, or quote serial is missing.');
      return;
    }
  
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(2, '0')}:${String(
      currentDate.getMinutes()
    ).padStart(2, '0')}`;
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuoteSkill.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=1&Action=remove&List=${skillSerial}&Quote=${jobObj.Serial}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
    console.log('Update Skills:', url);
    try {
      const response = await fetch(url);
      const data = await response.text();
      const parser = new XMLParser();
      const result = parser.parse(data);
  
      if (result.ResultInfo?.Result === 'Success') {
        // Alert.alert('Success', 'Skill removed successfully.');
        // setSkillModalVisible(false);
        // setSelectedSkill(null);
        setSkills((prev) =>
        prev.filter((Skill) => Skill.skillSerial !== skillSerial)
      );
        fetchQuoteDetails(true); // Immediate call after removing skill
      } else {
        // MG 12-26-2025
        // Display API error message only if message exists (prevents empty alerts)
        if (result.ResultInfo?.Message) {
          Alert.alert('Error', result.ResultInfo.Message);
        }
      }
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };
  
  
  const handleRemoveEquipment = async (equipmentSerial: number) => {
    if (!deviceInfo || !location || !authorizationCode || !equipmentSerial || !jobObj.Serial) {
      console.error('Error', 'Device info, location, authorization code, or quote serial is missing.');
      return;
    }
  
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(2, '0')}:${String(
      currentDate.getMinutes()
    ).padStart(2, '0')}`;
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuoteEquipment.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=1&Action=remove&List=${equipmentSerial}&Quote=${jobObj.Serial}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
    console.log('Update Equipment', url);
    try {
      const response = await fetch(url);
      const data = await response.text();
      const parser = new XMLParser();
      const result = parser.parse(data);
  
      if (result.ResultInfo?.Result === 'Success') {
        // Alert.alert('Success', 'Equipment removed successfully.');
        // setEquipmentModalVisible(false);
        setEquipments((prev) =>
          prev.filter((equipment) => equipment.equipmentSerial !== equipmentSerial)
        );
        fetchQuoteDetails(true); // Immediate call after removing equipment
      } else {
        // MG 12-26-2025
        // Display API error message only if message exists (prevents empty alerts)
        if (result.ResultInfo?.Message) {
          Alert.alert('Error', result.ResultInfo.Message);
        }
      }
    } catch (error) {
      console.error('Error removing equipment:', error);
    }
  };
  
  

  // const handleRemovePress = (workPackageName: string | undefined) => {
  //   setSelectedWorkPackage(workPackageName || 'Unnamed Work Package');
  //   setModalVisible(true);
  // };

  const handleCancelResource = () => {
    setModalVisible(false);
    setSelectedWorkPackage(null);
  };

  const handleProceed = async (ResourceGroupSerial: string | undefined) => {
    if (!deviceInfo || !location || !authorizationCode || !jobObj.Serial ||!ResourceGroupSerial) {
      console.error('Error', 'Device, location, authorization code, or quote serial information is missing.');
      return;
    }
  
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(
      currentDate.getHours()
    ).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
    const crewzControlVersion = '1'; // Hardcoded version as per the specification
  
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuoteResourceGroup.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Action=remove&List=${
      ResourceGroupSerial
    }&Quote=${jobObj.Serial}&Longitude=${location.longitude}&Latitude=${location.latitude}&Language=EN`;
  
    console.log('Request URL2:', url);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
  
      const parser = new XMLParser();
      const result = parser.parse(data);
  
      if (result.ResultInfo?.Result === 'Success') {
        // Alert.alert(
        //   'Resource Removed',
        //   `${selectedWorkPackage.name || 'Unnamed Work Package'} has been removed successfully.`
        // );
        setSelectedWorkPackage(null);
        setModalVisible(false);
        fetchQuoteDetails(true); // Immediate call after removing resource group
      } else {
        // MG 12-26-2025
        // Display API error message only if message exists (prevents empty alerts)
        if (result.ResultInfo?.Message) {
          Alert.alert('Error', result.ResultInfo.Message);
        }
      }
    } catch (error) {
      console.error('Error removing Equipment:', error);
    }
  };

  //M.G. 1-29-2026
  //Handle skill quantity update with confirmation popup when deleting (quantity = 0)
  //Prevents accidental deletion when user reduces quantity to zero
  const handleUpdateSkill = async (skillSerial: number, newCount: number) => {
    if (!deviceInfo || !location || !jobObj.Serial) {
      console.error('Missing Information', 'Device, location, or quote serial is missing');
      return;
    }

    if (newCount === 0) {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this item?',
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => console.log('Delete cancelled')
          },
          {
            text: 'Yes',
            onPress: () => performUpdateSkill(skillSerial, newCount)
          }
        ]
      );
      return;
    }

    // If not deleting, proceed directly
    await performUpdateSkill(skillSerial, newCount);
  };

  const performUpdateSkill = async (skillSerial: number, newCount: number) => {
    const action = newCount > 0 ? "update" : "remove"; //  Use 'update' or 'remove'
    const crewzControlVersion = '1';
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(
      2,
      '0'
    )}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    const serial = jobObj.Serial;
  
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuoteSkill.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Action=${action}&List=${skillSerial}&Quote=${serial}&Count=${newCount}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
  
    console.log('Request URL:', url);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      console.log('API Response:', data);
  
      const parser = new XMLParser();
      const result = parser.parse(data);
  
      if (result.ResultInfo?.Result === 'Success') {
        console.log('✅ Skill updated successfully');
        //  Update state for the UI
        setSkills(prevSkills =>
          prevSkills.map(skill =>
            skill.SkillSerial === skillSerial
              ? { ...skill, SkillCount: newCount }
              : skill
          ).filter(skill => skill.SkillCount > 0) //  Remove if quantity is 0
        );
      } else {
        // MG 12-26-2025
        // Display API error message only if message exists (prevents empty alerts)
        if (result.ResultInfo?.Message) {
          Alert.alert('Error', result.ResultInfo.Message);
        }
      }
    } catch (error) {
      console.error('❌ Error updating skill:', error);
    }
  };


  //M.G. 1-29-2026
  //Handle equipment quantity update with confirmation popup when deleting (quantity = 0)
  //Prevents accidental deletion when user reduces quantity to zero
  const handleUpdateEquipment = async (equipmentSerial: number, newCount: number) => {
    if (!deviceInfo || !location || !jobObj.Serial) {
      console.error('Missing Information', 'Device, location, or quote serial is missing');
      return;
    }

    if (newCount === 0) {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this item?',
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => console.log('Delete cancelled')
          },
          {
            text: 'Yes',
            onPress: () => performUpdateEquipment(equipmentSerial, newCount)
          }
        ]
      );
      return;
    }

    // If not deleting, proceed directly
    await performUpdateEquipment(equipmentSerial, newCount);
  };

  const performUpdateEquipment = async (equipmentSerial: number, newCount: number) => {
    const action = newCount > 0 ? "update" : "remove"; //  Use 'update' or 'remove'
    const crewzControlVersion = '1';
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(
      2,
      '0'
    )}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    const serial = jobObj.Serial;
  
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuoteEquipment.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Action=${action}&List=${equipmentSerial}&Quote=${serial}&Count=${newCount}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
  
    console.log('Request URL:', url);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      console.log('API Response:', data);
  
      const parser = new XMLParser();
      const result = parser.parse(data);
  
      if (result.ResultInfo?.Result === 'Success') {
        console.log('✅ Equipment updated successfully');
        fetchQuoteDetails(true); // Immediate call after updating equipment
        // Update state for the UI
        setEquipments(prevEquipments =>
          prevEquipments.map(equipment =>
            equipment.EquipmentSerial === equipmentSerial
              ? { ...equipment, EquipmentCount: newCount }
              : equipment
          ).filter(equipment => equipment.EquipmentCount > 0) //  Remove if quantity is 0
          
        );
        
      } else {
        // MG 12-26-2025
        // Display API error message only if message exists (prevents empty alerts)
        if (result.ResultInfo?.Message) {
          Alert.alert('Error', result.ResultInfo.Message);
        }
      }
    } catch (error) {
      console.error('❌ Error updating equipment:', error);
    }
  };

  // Update Equipment Day Selection using UpdateQuoteEquipment API
  // MG 1-20-2026: FIXED - Send separate API calls for each day to work with backend's INT column
  // MG 1-20-2026: WORKAROUND - Backend UPDATE replaces instead of adding. Clear all days first, then add each one.
  // MG 1-21-2026: Update Equipment Day Selection using UpdateQuoteEquipment API
  // Sends a single API call with comma-separated days (e.g., "1,2,3,4") per API specification
  // This allows equipment to be assigned to multiple days in one request
  // Parameters: equipmentSerial (item ID), dayString (e.g., "1,3,5"), count (quantity)
  const handleUpdateEquipmentDay = async (equipmentSerial: number, dayString: string, count: number) => {
    if (!deviceInfo || !location || !jobObj.Serial) {
      console.error('Missing Information', 'Device, location, or quote serial is missing');
      return;
    }
  
    // Ensure count has a valid value (default to 1 if undefined/zero)
    const validCount = count && count > 0 ? count : 1;
    
    console.log('📤 [EQUIPMENT API] Updating equipment day selection:');
    console.log('   - Equipment Serial:', equipmentSerial);
    console.log('   - Selected Days:', dayString);
    console.log('   - Count:', validCount);
    console.log('   - ✅ Sending ONE API call with comma-separated days');
  
    const crewzControlVersion = '1';
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(
      2,
      '0'
    )}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    const serial = jobObj.Serial;
  
    // MG 1-21-2026: Send ONE API call with comma-separated days (per API spec)
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuoteEquipment.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Action=update&List=${equipmentSerial}&Quote=${serial}&Count=${validCount}&Day=${dayString}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
  
    console.log(`📅 UpdateQuoteEquipment URL:`, url);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      console.log(`📅 Equipment Day API Response:`, data);
  
      const parser = new XMLParser();
      const result = parser.parse(data);
      
      console.log(`📅 Parsed Equipment Day Result:`, JSON.stringify(result, null, 2));
  
      if (result.ResultInfo?.Result === 'Success') {
        console.log(`✅ Equipment days updated successfully: ${dayString}`);
      } else {
        const errorCode = result.ResultInfo?.ErrorNumber || 'Unknown';
        const errorMessage = result.ResultInfo?.Message;
        console.error(`❌ Equipment Day API Error Code:`, errorCode);
        console.error(`❌ Equipment Day API Error Message:`, errorMessage);
        if (errorMessage) {
          showErrorOnce(errorMessage);
        }
      }
    } catch (error) {
      console.error(`❌ Error updating equipment days:`, error);
    }
    console.log('✅ Equipment day update completed');
  };

  // MG 1-21-2026: Update Resource Group (Work Package) Day Selection using UpdateQuoteResourceGroup API
  // Sends a single API call with comma-separated days (e.g., "1,2,3,4") per API specification
  // This allows work packages to be assigned to multiple days in one request
  // Parameters: resourceGroupSerial (QuoteWorkPackageSerial), dayString (e.g., "1,3,5")
  // Fixed Error 104 by matching exact parameter order from API spec (Longitude/Latitude before Action)
  const handleUpdateResourceGroupDay = async (resourceGroupSerial: number, dayString: string) => {
    if (!deviceInfo || !location || !jobObj.Serial) {
      console.error('Missing Information', 'Device, location, or quote serial is missing');
      return;
    }
  
    console.log('📤 [RESOURCEGROUP API] Updating work package day selection:');
    console.log('   - Resource Group Serial:', resourceGroupSerial);
    console.log('   - Selected Days:', dayString);
    console.log('   - ✅ Sending ONE API call with comma-separated days');
  
    const crewzControlVersion = '1';
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(
      2,
      '0'
    )}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    const serial = jobObj.Serial;
  
    // MG 1-21-2026: Send ONE API call with comma-separated days (per API spec)
    // MG 1-21-2026: Parameter order matches EXACT example from API spec
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuoteResourceGroup.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}&Action=update&List=${resourceGroupSerial}&Day=${dayString}&Quote=${serial}`;
  
    console.log(`📅 UpdateQuoteResourceGroup URL:`, url);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      console.log(`📅 ResourceGroup Day API Response:`, data);
  
      const parser = new XMLParser();
      const result = parser.parse(data);
      
      console.log(`📅 Parsed ResourceGroup Day Result:`, JSON.stringify(result, null, 2));
  
      if (result.ResultInfo?.Result === 'Success') {
        console.log(`✅ Work package days updated successfully: ${dayString}`);
      } else {
        const errorCode = result.ResultInfo?.ErrorNumber || 'Unknown';
        const errorMessage = result.ResultInfo?.Message;
        console.error(`❌ Work package Day API Error Code:`, errorCode);
        console.error(`❌ Work package Day API Error Message:`, errorMessage);
        if (errorMessage) {
          showErrorOnce(errorMessage);
        }
      }
    } catch (error) {
      console.error(`❌ Error updating work package days:`, error);
    }
    console.log('✅ Work package day update completed');
  };

  // MG 1-21-2026: Update Skill Day Selection using UpdateQuoteSkill API
  // Sends a single API call with comma-separated days (e.g., "1,2,3,4") per API specification
  // This allows skills to be assigned to multiple days in one request
  // Parameters: skillSerial (item ID), dayString (e.g., "1,3,5"), count (quantity)
  const handleUpdateSkillDay = async (skillSerial: number, dayString: string, count: number) => {
    if (!deviceInfo || !location || !jobObj.Serial) {
      console.error('Missing Information', 'Device, location, or quote serial is missing');
      return;
    }
  
    // Ensure count has a valid value (default to 1 if undefined/zero)
    const validCount = count && count > 0 ? count : 1;
    
    console.log('📤 [SKILL API] Updating skill day selection:');
    console.log('   - Skill Serial:', skillSerial);
    console.log('   - Selected Days:', dayString);
    console.log('   - Count:', validCount);
    console.log('   - ✅ Sending ONE API call with comma-separated days');
  
    const crewzControlVersion = '1';
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(
      2,
      '0'
    )}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    const serial = jobObj.Serial;
  
    // MG 1-21-2026: Send ONE API call with comma-separated days (per API spec)
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuoteSkill.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Action=update&List=${skillSerial}&Quote=${serial}&Count=${validCount}&Day=${dayString}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
  
    console.log(`📅 UpdateQuoteSkill URL:`, url);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      console.log(`📅 Skill Day API Response:`, data);
  
      const parser = new XMLParser();
      const result = parser.parse(data);
      
      console.log(`📅 Parsed Skill Day Result:`, JSON.stringify(result, null, 2));
  
      if (result.ResultInfo?.Result === 'Success') {
        console.log(`✅ Skill days updated successfully: ${dayString}`);
      } else {
        const errorCode = result.ResultInfo?.ErrorNumber || 'Unknown';
        const errorMessage = result.ResultInfo?.Message;
        console.error(`❌ Skill Day API Error Code:`, errorCode);
        console.error(`❌ Skill Day API Error Message:`, errorMessage);
        if (errorMessage) {
          showErrorOnce(errorMessage);
        }
      }
    } catch (error) {
      console.error(`❌ Error updating skill days:`, error);
    }
    console.log('✅ Skill day update completed');
  };
  

  // useFocusEffect(
  //   useCallback(() => {
  //     let didCallAPI = false;
  
  //     const fetchQuoteDetails = async () => {
  //       if (!deviceInfo || !location || !authorizationCode || !jobObj.Serial || quoteSerial || didCallAPI) {
  //         return; // Exit early if prerequisites are not ready or API was already called
  //       }
  
  //       const currentDate = new Date();
  //       const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
  //         currentDate.getDate()
  //       ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(currentDate.getHours()).padStart(
  //         2,
  //         '0'
  //       )}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  //       const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
  //       const key = CryptoJS.SHA1(keyString).toString();
  //       const crewzControlVersion = '1';
  //       // const serial = jobObj.Serial || quoteSerial
  //       const url = `https://CrewzControl.com/dev/CCService/GetQuote.php?DeviceID=${encodeURIComponent(
  //         deviceInfo.id
  //       )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&Serial=${jobObj.Serial}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
  
  //       console.log('Fetching Quote on Focus: ', url);
  
  //       try {
  //         const response = await fetch(url);
  //         const data = await response.text();
  //         const parser = new XMLParser();
  //         const result = parser.parse(data);
  
  //         if (result.ResultInfo?.Result === 'Success') {
  //           const quote = result.ResultInfo.Selections?.Quote || {};
  
  //           console.log('Fetched Quote Data: ', quote);
  
  //           setQuoteHours(quote.Hour ? quote.Hour.toString() : '0.00');
  //           setMustCompleteDate(quote.MustCompleteBy || '');
  //           setNiceToHaveDate(quote.NiceToHaveBy || '');
  //           setBlackoutDate(quote.BlackoutDate || '');
  //           setNotBefore(quote.NotBefore || '');
  //           setUrgency(quote.Priority || 'Normal');
  //         } else {
  //           Alert.alert('Error', result.ResultInfo?.Message || 'Failed to fetch quote details.');
  //         }
  //       } catch (error) {
  //         console.error('Error fetching quote details:', error);
  //         Alert.alert('Error', 'An error occurred while fetching quote details.');
  //       } finally {
  //         didCallAPI = true; // Ensure we do not call the API again during this focus
  //       }
  //     };
  
  //     fetchQuoteDetails();
  
  //     return () => {
  //       didCallAPI = false; // Reset flag on component unmount or focus change
  //     };
  //   }, [deviceInfo, location, authorizationCode, jobObj.Serial, quoteSerial])
  // );

  //--------------------------------------------------------------------------------------
//   const handleBackPress = () => {
//   if (parseFloat(quoteHours) === 0) {
//     Alert.alert(
//       'Warning',
//       'A quote with 0 hours will not be scheduled. Do you wish to leave this quote with 0 Hours?',
//       [
//         {
//           text: 'No',
//           onPress: () => {
//             // Focus the TextInput again
//             if (hoursInputRef.current) {
//               hoursInputRef.current.focus();
//             }
//           },
//           style: 'cancel',
//         },
//         {
//           text: 'Yes',
//           onPress: () => {
//             router.push('/Project');
//           },
//         },
//       ],
//       { cancelable: false }
//     );
//   } else {
//     router.push('/Project');
//   }
// };
  

//   const handleCancel = () => {
//     // Alert.alert('Exit Without Saving?', 'Are you sure you want to exit without saving?', [
//     //   { text: 'No', style: 'cancel' },
//     //   { text: 'Yes', onPress: () =>  },
//     // ]);
//     router.back()
//   };
 //--------------------------------------------------------------------------------------
  const handleBackPress = () => {
    // MG 1-8-2026: Set loading flag FIRST to prevent dropdown onChange from firing during navigation/unmount
    isLoadingDataRef.current = true;
    
    // MG 1-16-2026: Save MultiDayHour data before navigating away (use dayCount instead of multiDayFlag)
    if (dayCount > 1 && multiDayHours) {
      const dayHourPairs = Object.entries(multiDayHours)
        .filter(([day, hour]) => hour && hour !== "0.00" && hour !== "")
        .map(([day, hour]) => `${day}-${hour}`)
        .join("|");
      
      if (dayHourPairs) {
        setMultidayhour(dayHourPairs);
        handleSave(dayHourPairs, "MultiDayHour");
      }
    }
    
    // Removed validation alert - let API handle validation
    router.push('/Project');
  };

  const handleCancel = async () => {
    // MG 1-8-2026: Set loading flag FIRST to prevent dropdown onChange from firing during navigation/unmount
    isLoadingDataRef.current = true;
    
    // MG 1-16-2026: Save MultiDayHour data before navigating away (use dayCount instead of multiDayFlag)
    if (dayCount > 1 && multiDayHours) {
      const dayHourPairs = Object.entries(multiDayHours)
        .filter(([day, hour]) => hour && hour !== "0.00" && hour !== "")
        .map(([day, hour]) => `${day}-${hour}`)
        .join("|");
      
      if (dayHourPairs) {
        setMultidayhour(dayHourPairs);
        handleSave(dayHourPairs, "MultiDayHour");
      }
    }
    
    router.push('/Project');
  };
  
  if (!job) {
    return <Text>Error: No job data found</Text>;
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    <ImageBackground
      source={require('../assets/images/background.png')}
      style={styles.background}
    >
      <Image
        source={require('../assets/images/crewzControlIcon.png')}
        style={LogoStyles.logo}
        resizeMode="contain"
      />
      <FlatList
        data={[1]} // wrapper for the static content
        keyExtractor={(item, index) => index.toString()}
        renderItem={() => (
          <View style={[styles.mainDiv,  { width: deviceWidth }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBackPress}>
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Quote Update</Text>
            </View>
  
            {/* Form */}
            <View style={styles.form}>
              <View style={styles.row}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.textValue}>{customerName || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.textValue}>{address || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>City:</Text>
                <Text style={styles.textValue}>{city || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Amount:</Text>
                <Text style={styles.textValue}>{amount}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Quote#:</Text>
                <Text style={styles.textValue}>{serial +'-'+ quoteNum || '-'}</Text>
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>
                  Expense:
                </Text>
                <TextInput
                  value={expense}
                  onChangeText={(text) => {
                    setExpense(text); // always string
                  }}
                  onBlur={() => {
                    const inputValue = parseInt(expense);
                    if (!isNaN(inputValue)) {
                      const normalized = inputValue.toString();
                      setExpense(normalized);
                      handleSave(normalized, "Expense", true);
                    } else {
                      setExpense("0");
                      handleSave("0", "Expense", true);
                    }
                  }}
                  placeholder="0"
                  keyboardType="number-pad"
                  style={styles.inputField}
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>
                  Minimum Crew:
                </Text>
                <TextInput
                  value={minCrew}
                  onChangeText={(text) => setMinCrew(text)}
                  onBlur={() => {
                    const inputValue = parseInt(minCrew);
                    if (!isNaN(inputValue)) {
                      const normalized = inputValue.toString();
                      setMinCrew(normalized);
                      handleSave(normalized, 'MinCrew', true);
                    } else {
                      setMinCrew('0');
                      handleSave('0', 'MinCrew', true);
                    }
                  }}
                  placeholder="0"
                  keyboardType="number-pad"
                  style={styles.inputField}
                />
              </View>

              {/* MG 1-16-2026: NEW - Number of Days Input */}
              {/* Allows user to specify how many days the job will take (minimum 1) */}
              {/* Dynamically controls how many "Day X Hours" fields are shown below */}
              {/* Also controls how many day selection chips appear for skills/equipment/work packages */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>
                  Number of Days:
                </Text>
                <TextInput
                  value={dayCountInput}
                  onChangeText={(text) => {
                    console.log('🔢 [INPUT] User typing:', text);
                    // Update display immediately (allows empty field)
                    setDayCountInput(text);
                    
                    // Update actual dayCount for UI logic
                    if (text === '') {
                      console.log('🔢 [INPUT] Empty field, keeping dayCount=1 for UI');
                      // Keep dayCount at 1 while field is empty to prevent UI breaking
                      setDayCount(1);
                    } else {
                      const numValue = parseInt(text, 10);
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 999) {
                        console.log('🔢 [INPUT] Valid number, setting dayCount:', numValue);
                        setDayCount(numValue);
                      }
                    }
                  }}
                  onBlur={() => {
                    console.log('🔢 [BLUR] User left field, input value:', dayCountInput);
                    // When user clicks away, ensure valid value
                    if (dayCountInput === '' || parseInt(dayCountInput, 10) < 1) {
                      // Empty or invalid = default to 1
                      console.log('🔢 [BLUR] Empty/invalid, defaulting to 1');
                      setDayCount(1);
                      setDayCountInput('1');
                      handleSave('1', "DayCount", true);
                    } else {
                      const finalValue = parseInt(dayCountInput, 10);
                      console.log('🔢 [BLUR] Valid value, saving:', finalValue);
                      setDayCount(finalValue);
                      setDayCountInput(String(finalValue));
                      handleSave(String(finalValue), "DayCount", true);
                    }
                  }}
                  placeholder="1"
                  keyboardType="number-pad"
                  style={styles.inputField}
                  selectTextOnFocus={true}
                />
              </View>

            {/* MG 1-16-2026: Dynamic Hours Input Rendering */}
            {/* If dayCount = 1, shows single "Hours" field */}
            {/* If dayCount > 1, shows multiple "Day 1 Hours", "Day 2 Hours", etc. fields */}
            {dayCount === 1 ? (
              // 🔹 Single Hours input (default)
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>
                  Hours:
                </Text>
                <TextInput
                  ref={hoursInputRef}
                  value={quoteHours}
                  onChangeText={(text) => {
                    setQuoteHours(text); // Store as string
                  }}
                  onBlur={() => {
                    const inputValue = parseFloat(quoteHours);
                    if (!isNaN(inputValue)) {
                      const rounded = Math.round(inputValue * 4) / 4;
                      const formatted = rounded.toFixed(2);
                      setQuoteHours(formatted);
                      handleSave(formatted, "Hours", true);
                    }
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.inputField}
                />
              </View>
            ) : (
              // 🔹 Multi-day Hours inputs (Day 1 → Day N based on dayCount)
              <View style={{ marginTop: 15 }}>
                 {Array.from({ length: dayCount }, (_, i) => i + 1).map(day => (
                    <View key={day} style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Day {day} Hours:</Text>
                      <TextInput
                        ref={(ref) => {
                          multiDayInputRefs.current[day] = ref;
                        }}
                        value={multiDayHours[day] || ""}
                        onChangeText={(text) => {
                          // Simple - just update the state, no formatting while typing
                          setMultiDayHours(prev => ({
                            ...prev,
                            [day]: text
                          }));
                        }}
                        onFocus={() => {
                          // Format all other fields when focusing on this one
                          Object.keys(multiDayHours).forEach(dayKey => {
                            const dayNum = parseInt(dayKey);
                            if (dayNum !== day) {
                              formatDayInput(dayNum);
                            }
                          });
                        }}
                        onBlur={() => {
                          // Format the value to 2 decimal places when user finishes editing
                          const currentValue = multiDayHours[day] || "";
                          let formattedValue;
                          
                          if (currentValue.trim() === "") {
                            // If empty, set to 0.00
                            formattedValue = "0.00";
                          } else {
                            // Format the value to 2 decimal places
                            const numericValue = parseFloat(currentValue);
                            formattedValue = isNaN(numericValue) ? "0.00" : numericValue.toFixed(2);
                          }

                          // Update state with formatted value
                          setMultiDayHours(prev => ({
                            ...prev,
                            [day]: formattedValue
                          }));

                          // Build MultiDayHour string for only days with values
                          const dayHourPairs = Object.entries(multiDayHours)
                            .filter(([day, hour]) => hour && hour !== "0.00" && hour !== "")
                            .map(([day, hour]) => `${day}-${hour}`)
                            .join("|");

                          setMultidayhour(dayHourPairs);
                          handleSave(dayHourPairs, "MultiDayHour", true);
                        }}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        style={styles.inputField}
                      />
                    </View>
                  ))}
                </View>
              )}
              <View style={[styles.inputRow, { zIndex: 1000 }]}>
                <Text style={styles.inputLabel}>Priority:</Text>
                <View style={styles.dropdownWrapper}>
                  <DropDownPicker
                    open={urgencyOpen}
                    value={urgency}
                    items={[
                      { label: 'Emergency', value: 'Emergency' },
                      { label: 'Urgent', value: 'Urgent' },
                      { label: 'Normal', value: 'Normal' },
                    ]}
                    setOpen={setUrgencyOpen}
                    setValue={setUrgency}
                    onChangeValue={(value) => {
                      if (value) {
                        // MG 1-8-2026: Skip handleSave if data is being loaded from API
                        if (isLoadingDataRef.current) {
                          console.log('🚫 Priority onChange skipped - data loading from API');
                          return;
                        }
                        // MG 1-20-2026: FIX - Only save if value actually changed from last saved value
                        // DropDownPicker can trigger onChangeValue during re-renders even if value didn't change
                        if (value === lastSavedPriorityRef.current) {
                          console.log('🚫 Priority onChange skipped - value unchanged:', value);
                          return;
                        }
                        console.log('✅ Priority onChange - saving new value:', value, '(was:', lastSavedPriorityRef.current, ')');
                        lastSavedPriorityRef.current = value;
                        // MG 1-8-2026: Removed duplicate setUrgency call (setValue already handles it)
                        // MG 1-8-2026: Removed dynamic key prop to prevent component remounting
                        // Only call handleSave to update the API
                        handleSave(value, "Priority", true);
                      }
                    }}
                    style={[styles.dropdownStyle, styles.inputField]}
                    dropDownContainerStyle={[styles.dropDownContainerStyle, { zIndex: 1000 }]}
                    zIndex={1000}
                    placeholder=""
                  />
                </View>
              </View>
              <View style={styles.dateSection}>
              <CustomDatePicker
                  label="Do Not Schedule Before:"
                  value={notBefore || ''} // Value from the state
                  onChange={(date) => {
                    console.log('Not Before Updated:', date);
                    setNotBefore(date); // Updates the state
                    handleSave(date, 'NotBefore', true);
                  }}
                />
                {/* Removed Nice To Have By field per API update */}
                <CustomDatePicker
                  label="Must Be Complete By:"
                  value={mustCompleteDate || ''} // Value from the state
                  onChange={(date) => {
                    console.log('MustCompleteBy Updated:', date);
                    setMustCompleteDate(date); // Updates the state
                    handleSave(date, 'MustCompleteBy', true);
                  }}
                />
                            <DateTimePicker
                              label="Blackout Date(s): "
                              initialDates={blackoutDate} // 🔹 Persist blackout dates from API
                              onChange={(updatedDates) => {
                                const cleanedDates = updatedDates.filter(date => /^\d{2}\/\d{2}\/\d{4}$/.test(date)); // ✅ Filter valid dates
                                
                                // MG 1-12-2026: BUG FIX - Update local state IMMEDIATELY before saving (standard React pattern)
                                // Problem: onChange handler only called handleSave but never updated state
                                //          Compare to "Must Complete By" (lines 1749-1753) which does: setMustCompleteDate(date) THEN handleSave()
                                // Impact: UI state was out of sync with DateTimePicker's internal state
                                //         If save failed or user navigated quickly, changes would be lost
                                // Solution: Update both state variables immediately for optimistic UI update, then save to API
                                setBlackoutDates(cleanedDates);
                                setBlackoutDate(cleanedDates.join(','));
                                
                                handleSave(cleanedDates.join(','), 'BlackoutDate', true); // Send to API
                              }}
                            />

                          {/* <TouchableOpacity style={styles.viewButton} onPress={handleViewDates}>
                            <Text style={styles.viewButtonText}>View Dates</Text>
                          </TouchableOpacity> */}

                          <Modal transparent animationType="slide" visible={isCalendarVisible}>
                            <View style={styles.modalContainer}>
                              <Calendar
                                minDate={new Date().toISOString().split('T')[0]} // Disable past dates
                                markedDates={blackoutDates.reduce<Record<string, { selected: boolean; marked: boolean }>>(
                                  (acc, date) => {
                                    if (date) {
                                      acc[date.split('/').reverse().join('-')] = { selected: true, marked: true };
                                    }
                                    return acc;
                                  },
                                  {} // Initial value as an empty object
                                )}
                              />
                              <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setCalendarVisible(false)}
                              >
                                <Text style={styles.closeButtonText}>Close</Text>
                              </TouchableOpacity>
                            </View>
                          </Modal>

                          {/*// RHCM Removed Available Date as instructed
                             // Will keep this here for now in case Kirby wants it back*/}
                {/* <CustomDatePicker
                  label="Available Date:"
                  value={availableDate || ''} // Value from the state
                  labelStyle={{ textAlign: 'right', fontSize: 16 }}
                  onChange={(date) => {
                    console.log('AvailableDate Updated:', date);
                    setAvailableDate(date); // Updates the state
                    handleSave(date, 'AvailableDate', true);
                  }}
                /> */}
                
              </View>
  
              {/* Services Section */}
              
              {services.map((service, index) => {
                const workPackages = normalizeWorkPackages(service.WorkPackages);
                
                return (
                  <View key={index} style={styles.serviceContainer}>
                    <Text style={styles.sectionTitle}>Services</Text>
                    <Text style={styles.serviceTitle}>
                      {service.QuoteDetailName || 'Unnamed Service'}
                    </Text>
                    <Text style={styles.serviceTitle}>Quantity: {service.Quantity || '-'}</Text>
                    <Text style={styles.note}>
                      Note:{' '}
                      {typeof service.QuoteDetailNote === 'object'
                        ? service.QuoteDetailNote['#text']
                        : service.QuoteDetailNote || 'N/A'}
                    </Text>

                    {/* Loop through Work Packages */}
                    {workPackages.map((wp, wpIndex) => {
                      const workPackageList = Array.isArray(wp.WorkPackage)
                        ? wp.WorkPackage
                        : [wp.WorkPackage]; // Normalize to array

                      return workPackageList.map((workPackage, index) => {
                        const alternates = normalizeToArray(
                          workPackage?.WorkPackageAlternates?.WorkPackageAlternate || []
                        );

                        return (
                          <View key={`${wpIndex}-${index}`} style={styles.workPackageContainer}>
                          <View style={styles.headerRow}>
                            <Text style={styles.workPackageTitle}>
                              {workPackage?.WorkPackageName || 'Undefined Work Package'}
                            </Text>
                              
                              {/* Button Container */}
                              <View style={styles.buttonGroup}>
                                {/* Alternatives Button */}
                                {alternates.length > 0 && (
                                  <TouchableOpacity
                                    style={styles.alternateButton}
                                    onPress={() =>
                                      router.push({
                                        pathname: '/AlternativeSelection',
                                        params: {
                                          workPackageName: workPackage?.WorkPackageName,
                                          workPackageAlternates: JSON.stringify(alternates),
                                          quoteSerial: jobObj?.Serial,
                                        },
                                      })
                                    }
                                  >
                                    <Image
                                      source={require('@/assets/images/list-icon.png')}
                                      style={styles.icon}
                                    />
                                  </TouchableOpacity>
                                )}

                                {/* Remove Button */}
                                <TouchableOpacity
                                  style={styles.removeButton}
                                  onPress={() => {
                                    setSelectedWorkPackage({
                                      name: workPackage.WorkPackageName,
                                      serial: workPackage.WorkPckageSerial,
                                    });
                                    setModalVisible(true);
                                  }}
                                >
                                  <Text>
                                    <Icon name="minus" size={24} color="#fff" />
                                  </Text>
                                </TouchableOpacity>
                                
                              
                                {/* Modal */}
                                <Modal
                                  transparent
                                  animationType="fade"
                                  visible={isModalVisible}
                                  onRequestClose={handleCancelResource} // Close the modal on back press (Android)
                                >
                                  <View style={styles.modalOverlay}>
                                    <View style={styles.modalContent}>
                                      {/* Header */}
                                      <Text style={styles.modalHeader}>Remove Equipment Group</Text>

                                      {/* Body */}
                                      <Text style={styles.modalBody}>
                                        Are you sure you want to remove {selectedWorkPackage?.name} from this quote?
                                      </Text>

                                      {/* Buttons */}
                                      <View style={styles.footer}>
                                        <TouchableOpacity
                                          style={styles.cancelButton}
                                          onPress={() => setModalVisible(false)}
                                        >
                                          <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={styles.saveButton}
                                          onPress={() => {
                                            handleProceed(selectedWorkPackage?.serial);
                                            router.push('/Project');
                                          }}
                                        >
                                          <Text style={styles.saveButtonText}>Proceed</Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  </View>
                                </Modal>
                              </View>
                            </View>
                             {Array.isArray(workPackage?.WorkPackageDetail?.WorkPackageItem) &&
                              workPackage.WorkPackageDetail.WorkPackageItem.map((item: string, idx: number) => (
                                <Text key={idx} style={[styles.workPackageSubTitle, { paddingLeft: 20 }]}>
                                  {item}
                                </Text>
                              ))}
                          </View>
                        );
                      });
                    })}
                  </View>
                );
              })}
                {/* Work Packages */}
                    <View style={styles.sectionContainer}>
                    <View style={styles.headerRow}>
                      <Text style={styles.sectionTitle}>Equipment Groups</Text>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() =>
                          router.push({
                            pathname: '/AddResourceGroup',
                            params: { quoteSerial: jobObj.Serial },
                          })
                        }
                      >
                        <Text>
                          <Icon name="plus" size={16} color="#fff" /> {/* Smaller plus icon */}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {quoteWorkPackages.length > 0 ? (
                      quoteWorkPackages.map((qwp, index) => {
                        const alternates = normalizeToArray(
                          qwp.QuoteWorkPackageAlternates?.QuoteWorkPackageAlternate || []
                        );
                        
                        // RHCM 8/8/2025 Get only selected alternates
                      const selectedAlternates = alternates.filter(
                        (alt) => alt.WPAlternateStatus === 1
                      );
                      const pickerZ = !!qwp.open ? 9999 : 1000 - index;
  return (
    <View key={index} style={[styles.workPackageContainer, { zIndex: pickerZ, overflow: 'visible' }]}>
      <View style={[styles.rowContainer, { alignItems: 'center', zIndex: pickerZ, overflow: 'visible' }]}>
        <View style={[styles.leftGroup, { zIndex: pickerZ, overflow: 'visible', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }]}>
          {/* MG 1-20-2026: Multi-select day chips for work packages */}
          {/* Displays clickable chips (1, 2, 3, etc.) allowing users to select multiple days */}
          {/* Selected days are highlighted in blue, unselected in gray */}
          {dayCount > 1 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                Select Days (Blue = Selected):
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array.from({ length: dayCount }, (_, i) => i + 1).map(day => {
                const selectedDays = qwp.selectedNumber ? String(qwp.selectedNumber).split(',').map((d: string) => d.trim()) : [];
                const isSelected = selectedDays.includes(String(day));
                
                return (
                  <TouchableOpacity
                    key={day}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      marginRight: 4,
                      marginBottom: 4,
                      borderRadius: 4,
                      backgroundColor: isSelected ? '#007BFF' : '#f0f0f0',
                      borderWidth: 1,
                      borderColor: isSelected ? '#007BFF' : '#ccc',
                    }}
                    onPress={() => {
                      console.log(`📦 [WORKPACKAGE CHIP] User tapped day ${day} for work package "${qwp.QuoteWorkPackageName}"`);
                      console.log(`📦 [WORKPACKAGE CHIP] Currently selected days:`, selectedDays);
                      let updatedDays: string[];
                      if (isSelected) {
                        // Remove day
                        updatedDays = selectedDays.filter((d: string) => d !== String(day));
                        console.log(`📦 [WORKPACKAGE CHIP] Removing day ${day}`);
                      } else {
                        // Add day
                        updatedDays = [...selectedDays, String(day)].sort((a: string, b: string) => parseInt(a) - parseInt(b));
                        console.log(`📦 [WORKPACKAGE CHIP] Adding day ${day}`);
                      }
                      // Ensure at least one day is selected
                      if (updatedDays.length === 0) {
                        updatedDays = ['1'];
                        console.log(`📦 [WORKPACKAGE CHIP] No days selected, defaulting to day 1`);
                      }
                      const dayString = updatedDays.join(',');
                      console.log(`📦 [WORKPACKAGE CHIP] Final selected days:`, dayString);
                      qwp.selectedNumber = dayString;
                      setQuoteWorkPackages([...quoteWorkPackages]);
                      // MG 1-20-2026: Call specific API for work package day updates
                      handleUpdateResourceGroupDay(qwp.QuoteWorkPackageSerial, dayString);
                    }}
                  >
                    <Text style={{ fontSize: 11, color: isSelected ? '#fff' : '#000', fontWeight: 'bold' }}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              </View>
            </View>
          )}
                   <Text
            style={[styles.workPackageTitle, { marginRight: 8 }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {qwp.QuoteWorkPackageName || 'Unnamed Quote Work Package'}
          </Text>
        </View>
                             
                            {/* Button Group */}
                          <View style={[styles.buttonGroup, { marginLeft: 0 }]}>
                            {/* Alternates Button */}
                            {alternates.length > 0 && (
                              <Pressable
                                style={({ pressed }) => [
                                  styles.alternateButton,
                                  { opacity: pressed ? 0.7 : 1 }
                                ]}
                                onPress={() =>
                                  router.push({
                                    pathname: '/AlternativeSelection',
                                    params: {
                                      workPackageName: qwp.QuoteWorkPackageName,
                                      workPackageAlternates: JSON.stringify(alternates),
                                      quoteSerial: jobObj?.Serial,
                                    },
                                  })
                                }
                                hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
                              >
                                <Image
                                  source={require('@/assets/images/list-icon.png')}
                                  style={styles.icon}
                                />
                              </Pressable>
                            )}
                            {/* Remove Button */}
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => handleRemoveQuoteWorkPackage(qwp.QuoteWorkPackageSerial)}
                              activeOpacity={0.7}
                              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            >
                                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>−</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        {/* </View> */}
                        {Array.isArray(qwp?.QuoteWorkPackageDetail?.QuoteWorkPackageItem) &&
                              qwp.QuoteWorkPackageDetail.QuoteWorkPackageItem.map((item: string, idx: number) => (
                                <Text key={idx} style={[styles.workPackageSubTitle, { paddingLeft: 20 }]}>
                                  {item}
                                </Text>
                              ))
                        }
                        {/*RHCM 8/8/2025 */}
                        {/* Display selected alternates if any */}
                         {/* Selected Alternates Section */}
                        {selectedAlternates.length > 0 && (
                          <View style={{ marginTop: 4, paddingLeft: 20 }}>
                            <Text style={styles.selectedAltHeader}>Selected Alternates</Text>
                            {selectedAlternates.map((alt, altIndex) => (
                              <Text key={altIndex} style={styles.selectedAltItem}>
                                {alt.WPAlternateName}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    );

        })
                    ) : (
                      <Text style={styles.emptyText}>No Equipment Groups Selected.</Text>
                    )}
                    </View>
              {/* Skills Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Skills</Text>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => {
                    router.push({
                      pathname: '/AddSkillsGroup',
                      params: { quoteSerial: jobObj.Serial },
                    });

                    // 🔹 Update existing skill's count to 1 if it's already in the list
                    setSkills(prevSkills =>
                      prevSkills.map(skill =>
                        skill.SkillSerial === quoteSerial
                          ? { ...skill, SkillCount: 1 } // ✅ Set count to 1 when selected
                          : skill
                      )
                    );
                  }}
                >
                  <Text>
                    <Icon name="plus" size={16} color="#fff" /> {/* Icon only */}
                  </Text>
                </TouchableOpacity>

              </View>
                {skills.length > 0 ? (
                  skills.map((skill, skillIndex) => (
                    <View key={skillIndex} style={styles.workPackageContainer}>
                      <View style={styles.rowContainer}>
                        <View style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                          {/* MG 1-20-2026: Multi-select day chips for skills */}
                          {/* Displays clickable chips (1, 2, 3, etc.) allowing users to select multiple days */}
                          {/* Selected days are highlighted in blue, unselected in gray */}
                          {dayCount > 1 && (
                          <View style={{ marginBottom: 8 }}>
                            <Text style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                              Select Days (Blue = Selected):
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                              {Array.from({ length: dayCount }, (_, i) => i + 1).map(day => {
                              const selectedDays = skill.selectedNumber ? skill.selectedNumber.split(',').map((d: string) => d.trim()) : [];
                              const isSelected = selectedDays.includes(String(day));
                              
                              return (
                                <TouchableOpacity
                                  key={day}
                                  style={{
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    marginRight: 4,
                                    marginBottom: 4,
                                    borderRadius: 4,
                                    backgroundColor: isSelected ? '#007BFF' : '#f0f0f0',
                                    borderWidth: 1,
                                    borderColor: isSelected ? '#007BFF' : '#ccc',
                                  }}
                                  onPress={() => {
                                    console.log(`🎯 [SKILL CHIP] User tapped day ${day} for skill "${skill.SkillName}"`);
                                    console.log(`🎯 [SKILL CHIP] Currently selected days:`, selectedDays);
                                    let updatedDays: string[];
                                    if (isSelected) {
                                      // Remove day
                                      updatedDays = selectedDays.filter((d: string) => d !== String(day));
                                      console.log(`🎯 [SKILL CHIP] Removing day ${day}`);
                                    } else {
                                      // Add day
                                      updatedDays = [...selectedDays, String(day)].sort((a: string, b: string) => parseInt(a) - parseInt(b));
                                      console.log(`🎯 [SKILL CHIP] Adding day ${day}`);
                                    }
                                    // Ensure at least one day is selected
                                    if (updatedDays.length === 0) {
                                      updatedDays = ['1'];
                                      console.log(`🎯 [SKILL CHIP] No days selected, defaulting to day 1`);
                                    }
                                    const dayString = updatedDays.join(',');
                                    console.log(`🎯 [SKILL CHIP] Final selected days:`, dayString);
                                    skill.selectedNumber = dayString;
                                    setSkills([...skills]);
                                    handleUpdateSkillDay(skill.SkillSerial, dayString, skill.SkillCount);
                                  }}
                                >
                                  <Text style={{ fontSize: 11, color: isSelected ? '#fff' : '#000', fontWeight: 'bold' }}>
                                    {day}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                            </View>
                          </View>
                                )}
                          <Text style={[styles.workPackageTitle, { marginRight: 8 }]} numberOfLines={2} ellipsizeMode="tail">{skill.SkillName}</Text>
                        </View>
                        <View style={[styles.buttonGroup, { marginLeft: 0 }]}>
                        {/* 🔻 Decrease Quantity or Remove Skill */}
                        <TouchableOpacity
                          style={styles.removeSkillsButton}
                          onPress={() => handleUpdateSkill(skill.SkillSerial, skill.SkillCount - 1)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>−</Text>
                        </TouchableOpacity>

                        {/* 🔹 Quantity Display */}
                        <Text style={styles.skillsQuantityLabel}>{skill.SkillCount}</Text>

                        {/* 🔺 Increase Quantity */}
                        <TouchableOpacity
                          style={styles.addSkillsButton}
                          onPress={() => handleUpdateSkill(skill.SkillSerial, skill.SkillCount + 1)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No Skills Selected.</Text>
                )}
              </View>

              {/* MG 1-15-2026: Equipment Section - HIDDEN - Change false to true to show */}
              {false && <>
              <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Equipment</Text>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() =>
                    router.push({
                      pathname: '/AddEquipmentsGroup',
                      params: { quoteSerial: jobObj.Serial },
                    })
                  }
                >
                  <Text>
                    <Icon name="plus" size={16} color="#fff" />
                  </Text>
                </TouchableOpacity>
                </View>
                {equipments.length > 0 ? (
                  equipments.map((equipment, equipmentIndex) => (
                    <View key={equipmentIndex} style={styles.workPackageContainer}>
                      <View style={styles.headerRow}>
                        <View style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                          {/* MG 1-20-2026: Multi-select day chips for equipment */}
                          {/* Displays clickable chips (1, 2, 3, etc.) allowing users to select multiple days */}
                          {/* Selected days are highlighted in blue, unselected in gray */}
                          {dayCount > 1 && (
                          <View style={{ marginBottom: 8 }}>
                            <Text style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                              Select Days (Blue = Selected):
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                              {Array.from({ length: dayCount }, (_, i) => i + 1).map(day => {
                              const selectedDays = equipment.selectedNumber ? equipment.selectedNumber.split(',').map((d: string) => d.trim()) : [];
                              const isSelected = selectedDays.includes(String(day));
                              
                              return (
                                <TouchableOpacity
                                  key={day}
                                  style={{
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    marginRight: 4,
                                    marginBottom: 4,
                                    borderRadius: 4,
                                    backgroundColor: isSelected ? '#007BFF' : '#f0f0f0',
                                    borderWidth: 1,
                                    borderColor: isSelected ? '#007BFF' : '#ccc',
                                  }}
                                  onPress={() => {
                                    console.log(`🔧 [EQUIPMENT CHIP] User tapped day ${day} for equipment "${equipment.EquipmentName}"`);
                                    console.log(`🔧 [EQUIPMENT CHIP] Currently selected days:`, selectedDays);
                                    let updatedDays: string[];
                                    if (isSelected) {
                                      // Remove day
                                      updatedDays = selectedDays.filter((d: string) => d !== String(day));
                                      console.log(`🔧 [EQUIPMENT CHIP] Removing day ${day}`);
                                    } else {
                                      // Add day
                                      updatedDays = [...selectedDays, String(day)].sort((a: string, b: string) => parseInt(a) - parseInt(b));
                                      console.log(`🔧 [EQUIPMENT CHIP] Adding day ${day}`);
                                    }
                                    // Ensure at least one day is selected
                                    if (updatedDays.length === 0) {
                                      updatedDays = ['1'];
                                      console.log(`🔧 [EQUIPMENT CHIP] No days selected, defaulting to day 1`);
                                    }
                                    const dayString = updatedDays.join(',');
                                    console.log(`🔧 [EQUIPMENT CHIP] Final selected days:`, dayString);
                                    equipment.selectedNumber = dayString;
                                    setEquipments([...equipments]);
                                    handleUpdateEquipmentDay(equipment.EquipmentSerial, dayString, equipment.EquipmentCount);
                                  }}
                                >
                                  <Text style={{ fontSize: 11, color: isSelected ? '#fff' : '#000', fontWeight: 'bold' }}>
                                    {day}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                            </View>
                          </View>
                                )}
                          <Text style={[styles.workPackageTitle, { marginRight: 8 }]} numberOfLines={2} ellipsizeMode="tail">{equipment.EquipmentName}</Text>
                        </View>
                        <View style={[styles.buttonGroup, { marginLeft: 0 }]}>
                          {/*//🔻 Decrease Quantity or Remove Skill*/}
                        <TouchableOpacity
                          style={styles.removeSkillsButton}
                          onPress={() => handleUpdateEquipment(equipment.EquipmentSerial, equipment.EquipmentCount - 1)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>−</Text>
                        </TouchableOpacity>

                        {/*//🔹 Quantity Display*/}
                        <Text style={styles.skillsQuantityLabel}>{equipment.EquipmentCount}</Text>

                        {/*//🔺 Increase Quantity*/}
                        <TouchableOpacity
                          style={styles.addEquipmentButton}
                          onPress={() => handleUpdateEquipment(equipment.EquipmentSerial, equipment.EquipmentCount + 1)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>+</Text>
                        </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No Equipment Selected.</Text>
                )}
              </>}
              {/* MG 1-15-2026: END Equipment Section */}
              
              </View>

          {/* Footer (Buttons) */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleCancel} style={[styles.cancelButton, { flex: 1 }]}>
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      )}
    />
  </ImageBackground>
  </SafeAreaView>
);
};
const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // plus:{
  //   alignItems: 'flex-start',
  // },
  selectedAltHeader: {
  fontSize: 8,
  fontWeight: 'bold',
  color: '#000',
  marginTop: 2,
},
selectedAltItem: {
  fontSize: 8,
  color: '#555',
  paddingLeft: 10,
},
  container: { padding: 20, marginTop: -60, },
  viewButton: {
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 5,
  },
  viewButtonText: { color: 'black', fontWeight: 'bold' },
  resourceContainer: {
    flexDirection: 'row', // Ensures items are laid out horizontally
    alignItems: 'center', // Vertically align the text and button

    //JCM 01/15/2025: Added the lines below for justifying the + button to the right
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 5,
    paddingRight: 10,
    paddingBottom: 5
    
    // justifyContent: 'space-between', // Optional: Space them out if needed
  }, 
  compactPicker: {
    width: "100%", // Full width of the container
  },
  pickerItem: {
    fontSize: 16, // Adjust font size for readability
    textAlign: "center", // Center align the items
  },
  sectionContainer: {
    marginVertical: 15,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  dateFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    marginLeft: 10,   
    backgroundColor: '#20D5FF',
    borderRadius: 20,
    padding: 10,
  },
  addButtonText: { color: 'white', fontSize: 18 },
  viewDatesButton: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#20D5FF',
    borderRadius: 5,
  },
  viewDatesButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  closeButton: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: { color: 'white', fontSize: 16 },
  iconButton: {
    backgroundColor: '#20D5FF',
    borderRadius: 20, // Circular button
    padding: 10, // Padding for the icon
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pickerWrapper: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5,
  overflow: 'hidden',
  marginLeft: 10,
},
pickerContainer: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 5,
  marginLeft: 10,
  marginTop: 5,
  overflow: "hidden",
  width: "70%", // Ensure consistent width
},
picker: {
  height: 50,
  width: "100%"
},
selectedHours: {
  fontSize: 16,
  marginTop: 10,
  color: "gray",
},
  buttonGroup: {
    marginLeft: -80,
    flexDirection: 'row',
    gap: 10, // Add space between buttons
  },
  workPackageSubTitle:{
  flexDirection: 'row',
  fontSize: 14,
  color: '#000',
  flex: 1,
  },
  workPackageTitle: {
    flex: 1, // Take up available space for wrapping
    fontSize: 16,
    color: '#000',
    marginRight: 8, // Proper spacing between text and buttons
    lineHeight: 20, // Add space between lines for better readability
    flexWrap: 'wrap', // Ensure text wraps properly
  },
  skillsQuantityLabel: {
    // flex: 1, // Take up available space for wrapping
    fontSize: 20,
    color: '#000',
    marginRight: 10, // Add space between text and buttons
    marginLeft: 10,
    marginTop: 10,
    lineHeight: 20, // Add space between lines for better readability
    flexWrap: 'wrap', // Ensure text wraps properly
    alignItems: 'center',
    
  },
  leftGroup: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,            // label can take the remaining space
  paddingRight: 8,    // small gap before the right-side buttons
  justifyContent: 'flex-start',
  zIndex: 1000,           // <-- Add this
  overflow: 'visible',    // <-- Add this
},
  dayPicker: {
  height: 36,
  width: 88,              // compact picker width so it doesn't hog space
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e6e6e6',
  backgroundColor: '#fff',
  justifyContent: 'center',
  zIndex: 1000,       // iOS
  elevation: 1000,    // Android
},
dayPickerText: {
  fontSize: 13,
  textAlign: 'center',
  color: '#000',
},
dayPickerDropDown: {
  width: 96,
  borderWidth: 1,
  borderColor: '#e6e6e6',
  zIndex: 1000,       // iOS
  elevation: 1000,    // Android
},
dayPickerListLabel: {
  fontSize: 13,
  textAlign: 'center',
},
  alternateButton: {
    padding: 8,
    backgroundColor: '#20D5FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  removeButton: {
    padding: 8,
    backgroundColor: '#20D5FF',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSkillsButton: {
    padding: 8,
    backgroundColor: '#20D5FF',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10
  },
  addSkillsButton: {
    padding: 8,
    backgroundColor: '#20D5FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10
  },
  addEquipmentButton: {
    padding: 8,
    backgroundColor: '#20D5FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  skillContainer: {
    marginBottom: 5,
    padding: 10,
    backgroundColor: '#e9e9e9',
    borderRadius: 5,
  },
  equipmentContainer: {
    marginBottom: 5,
    padding: 10,
    backgroundColor: '#e9e9e9',
    borderRadius: 5,
  },
  equipmentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  skillText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  // icon: {
  //   width: 24,
  //   height: 24,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    elevation: 5,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 16,
    marginBottom: 20,
  },
  // alternateButton: {
  //   padding: 8,
  //   backgroundColor: '#20D5FF',
  //   borderRadius: 15,
  //   marginLeft: 15,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  // removeButton: {
  //   padding: 8,
  //   backgroundColor: '#20D5FF',
  //   borderRadius: 15,
  //   marginLeft: -115,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  alternateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  note: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginBottom: 50,
    gap: 10,
  },
  serviceSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Space below the row
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginLeft: -39, // Add a bit of space between name and quantity
    marginTop: 15,
  },
  // workPackageTitle: {
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   marginBottom: 5,
  // },
  workPackage: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  alternate: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
  },
  serviceTitle: {  marginBottom: 5 },
  workPackagesSection: { marginTop: 10 },
  workPackageContainer: { marginBottom: 10, padding: 10, backgroundColor: '#e9e9e9', borderRadius: 5 },
  alternateContainer: { marginTop: 5, paddingLeft: 10 },
  alternateTitle: { fontWeight: 'bold' },
  dropdownStyle: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    height: 40, 
    borderRadius: 5, 
    backgroundColor: '#fff',
    minHeight: 40,
  },
  dropDownContainerStyle: { backgroundColor: '#fafafa' },
  // M.G. 10/1/2025 - Fixed dropdown width to match other input fields
  dropdownWrapper: { flex: 0.65 }, 
  mainDiv: {
    flex: 1,
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginTop: 75, // Space for the logo
    overflow: 'hidden',
  }, 
  column: {
    flex: 1, // Ensures each column takes up equal space
    paddingRight: 10, // Adjusts spacing between columns
  },
  scrollViewContent: {
    flexGrow: 1, // Ensures the ScrollView can grow and the content will remain scrollable
    padding: 16, // Adds padding around the content for better spacing
    justifyContent: 'flex-start', // Aligns content at the top
  },
  dateSection: {
    marginTop: 20,
    marginBottom: 20,
    // M.G. 10/1/2025 - Removed padding to align date fields with main input fields
    flexDirection: 'column',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  textValue: {
    flex: 2,
    fontSize: 16,
    color: '#333',  // Color for the plain text
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 90,
    color: '#7B7B7B',
  },
  form: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    marginRight: 15,
    alignItems: 'center'
  },
  label: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'left',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    // M.G. 10/1/2025 - Responsive flexbox layout for consistent alignment across all screen sizes
    flex: 0.4, // Takes 40% of available width
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
    marginRight: 10,
  },
  inputField: {
    // M.G. 10/1/2025 - Responsive flexbox layout for consistent alignment across all screen sizes
    flex: 0.6, // Takes 60% of available width
    height: 40,
    paddingHorizontal: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  input: {
    flex: 2,
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16, // Adjust input font size
    // borderWidth: 1,
    // borderColor: '#ccc',
    padding: 0,
    // borderRadius: 15,
  },
  // picker: {
  //   width: '68%',
  //   borderRadius: 15,
  // },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    marginRight: 2,
  },
  sectionTitleDates: {
    marginRight: 8, // Space between label and input
    fontSize: 14,
    fontWeight: 'bold',
    justifyContent: 'space-between',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#20D5FF',
    paddingVertical: 10,
    paddingHorizontal: 50,
    borderRadius: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  serviceContainer: {
    marginVertical: 20, // Add some spacing
    padding: 10, // Optional padding for better touch targets
    backgroundColor: "#f9f9f9", 
    borderRadius: 8, 
    marginTop: -5,
    marginBottom: -5,
  },
  serviceListContainer: {
    marginTop: 10, // Add spacing between title and list
    
  },
  serviceRow: {
    padding: 10,
    backgroundColor: "#e0e0e0", 
    marginVertical: 5, // Space between items
    borderRadius: 4,
  },
  serviceName: {
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#20D5FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProjectUpdate;
function setIsScreenFocused(arg0: boolean) {
  throw new Error('Function not implemented.');
}

