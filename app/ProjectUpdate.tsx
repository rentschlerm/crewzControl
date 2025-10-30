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

//M.G. 10/6/2025
// Fixed Multi-Day functionality: replaced broken dropdowns with Alert dialogs, 
// fixed text truncation and UI layout issues, added separate MultiDayButton component

// Two separate buttons - no re-rendering, just show/hide
const MultiDayOffButton: React.FC<{
  isUpdatingMultiDay: boolean;
  onPress: () => void;
  style?: any;
}> = ({ isUpdatingMultiDay, onPress, style }) => {
  return (
    <TouchableOpacity 
      onPress={() => {
        console.log('🚨 MultiDay OFF button pressed!');
        onPress();
      }}
      disabled={isUpdatingMultiDay}
      style={[
        styles.cancelButton,
        isUpdatingMultiDay && { opacity: 0.7 },
        style
      ]}>
      <Text style={styles.cancelButtonText}>
        {isUpdatingMultiDay ? "Updating..." : "Multi-Day OFF"}
      </Text>
    </TouchableOpacity>
  );
};

const MultiDayOnButton: React.FC<{
  isUpdatingMultiDay: boolean;
  onPress: () => void;
  style?: any;
}> = ({ isUpdatingMultiDay, onPress, style }) => {
  return (
    <TouchableOpacity 
      onPress={() => {
        console.log('🚨 MultiDay ON button pressed!');
        onPress();
      }}
      disabled={isUpdatingMultiDay}
      style={[
        styles.cancelButton,
        { backgroundColor: '#007BFF' },
        isUpdatingMultiDay && { opacity: 0.7 },
        style
      ]}>
      <Text style={[styles.cancelButtonText, { color: 'white' }]}>
        {isUpdatingMultiDay ? "Updating..." : "Multi-Day ON"}
      </Text>
    </TouchableOpacity>
  );
};

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
  const [amount, setAmount] = useState(jobObj?.amount || '');
  // const [expense, setExpense] = useState(jobObj?.Expense);
  const [expense, setExpense] = useState<string>(
  jobObj?.Expense !== undefined ? String(jobObj.Expense) : "0"
);
  const [multidayhour, setMultidayhour] = useState((jobObj as any)?.MultiDayHour);
  const [isUpdatingMultiDay, setIsUpdatingMultiDay] = useState(false);
  
  // Initialize multi-day mode based on received MultiDayFlag
  useEffect(() => {
      const initialMultiDayFlag = (jobObj as any)?.MultiDayFlag === 1 ? 1 : 0;
    console.log('🔄 Initializing Multi-Day mode:', { 
        jobObjMultiDayFlag: (jobObj as any)?.MultiDayFlag, 
      initialMultiDayFlag,
      currentLocalFlag: localMultiDayFlag,
      isUpdatingMultiDay
      });
      
    // Only initialize if we're not currently updating (to prevent overriding manual changes)
    if (!isUpdatingMultiDay) {
      setMultiDayFlag(initialMultiDayFlag);
      // Only update localMultiDayFlag if it's different from the initial value
      if (localMultiDayFlag !== initialMultiDayFlag) {
      setLocalMultiDayFlag(initialMultiDayFlag);
      }
      setIsMultiDay(initialMultiDayFlag === 1);
    }
  }, [jobObj?.Serial]); // Only depend on Serial to prevent loops
  const [address, setAddress] = useState(jobObj?.Address);
  const [city, setCity] = useState(jobObj?.City);
  const [quoteNum, setQuoteNum] = useState(jobObj?.QuoteNum);
  const [serial, setserial] = useState(jobObj?.Serial);
  // const [quoteHours, setQuoteHours] = useState(jobObj?.Hour ?? '0.00');
  const [quoteHours, setQuoteHours] = useState(() => {
  const initial = parseFloat(jobObj?.Hour);
  return !isNaN(initial) ? initial.toFixed(2) : '';
});
  
  const [urgency, setUrgency] = useState('');
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

  const [isMultiDay, setIsMultiDay] = useState(false);//track Multi-Day button
  const [multiDayFlag, setMultiDayFlag] = useState<0 | 1>(0);
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
  
  const [forceRender, setForceRender] = useState(0);
  const [localMultiDayFlag, setLocalMultiDayFlag] = useState<0 | 1>(() => {
    const initialFlag = (jobObj as any)?.MultiDayFlag === 1 ? 1 : 0;
    console.log('🔄 Initializing localMultiDayFlag:', initialFlag);
    return initialFlag;
  });
  const [buttonRenderKey, setButtonRenderKey] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [componentKey, setComponentKey] = useState(0);
  const [showMultiDayUI, setShowMultiDayUI] = useState(() => {
    const initialFlag = (jobObj as any)?.MultiDayFlag === 1 ? 1 : 0;
    return initialFlag === 1;
  });
  const buttonRef = useRef<any>(null);
  const stateRef = useRef({ localMultiDayFlag, isUpdatingMultiDay });
  const [buttonClickCount, setButtonClickCount] = useState(0);
  const [buttonState, setButtonState] = useState(() => {
    const initialFlag = (jobObj as any)?.MultiDayFlag === 1 ? 1 : 0;
    return {
      flag: initialFlag,
      text: initialFlag === 1 ? "Multi-Day ON" : "Multi-Day OFF",
      buttonStyle: initialFlag === 1 ? { backgroundColor: '#007BFF' } : {},
      textStyle: initialFlag === 1 ? { color: 'white' } : {}
    };
  });

  // Debug state changes
  useEffect(() => {
    console.log('🔄 State changed - multiDayFlag:', multiDayFlag, 'isMultiDay:', isMultiDay);
  }, [multiDayFlag, isMultiDay]);

  // Keep ref updated with current state
  useEffect(() => {
    stateRef.current = { localMultiDayFlag, isUpdatingMultiDay };
  }, [localMultiDayFlag, isUpdatingMultiDay]);

  const [selectedDays, setSelectedDays] = useState<number[]>([1]);
  const getDayNumber = (val: string | undefined): number => {
  if (!val) return 0;
  const match = val.match(/DAY (\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};
const maxDaySelected = Math.max(
  ...quoteWorkPackages.map(qwp => getDayNumber(qwp.selectedNumber)),
  ...skills.map(skill => parseInt(skill.selectedNumber || "0")),
  ...equipments.map(eq => parseInt(eq.selectedNumber || "0")),
  1 // minimum 1 day
);
const safeMaxDaySelected = Math.max(1, maxDaySelected || 1);
Array.from({ length: safeMaxDaySelected }, (_, i) => i + 1)
  // const [multiDayHours, setMultiDayHours] = useState<Record<string, string>>({
  //   "1": "",
  //   "2": "",
  //   "3": "",
  //   "4": "",
  //   "5": ""
  // });

  const [mustCompleteDate, setMustCompleteDate] = useState(jobObj?.MustCompleteBy);
  const [niceToHaveDate, setNiceToHaveDate] = useState(jobObj?.NiceToHaveBy);
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


  const hoursInputRef = useRef<TextInput>(null);
  const multiDayInputRefs = useRef<{ [key: number]: TextInput | null }>({});
  const handleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef<boolean>(false);

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

  useFocusEffect(
  useCallback(() => {
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
  }, [jobObj?.Serial, deviceInfo, location, authorizationCode]) // Keep dependencies but use debouncing
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
  

  const handleSave = async (updated: string | string[], type: string) => {
  console.log('🔍 handleSave called - type:', type, 'isSaving:', isSavingRef.current);
  
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

  let updatedBlackoutDates = blackoutDates;
  if (type === 'BlackoutDate') {
    updatedBlackoutDates = Array.isArray(updated)
      ? [...blackoutDates, ...updated]
      : [...blackoutDates, updated];
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

  // 🔹 MultiDayHour + MultiDayFlag
  let multiDayHourValue = multidayhour; // keep state value (string)
  let multiDayFlagValue = multiDayFlag; // keep state value (0 or 1)

  if (type === "MultiDayHour") {
    multiDayHourValue = Array.isArray(updated) ? updated.join("|") : updated;
  }
  if (type === "MultiDayFlag") {
    const flagValue = Array.isArray(updated) ? updated[0] : updated;
    multiDayFlagValue = (flagValue === "1" || flagValue === "1") ? 1 : 0;
    // When toggling Multi-Day flag, ensure multiDayHourValue is a proper string
    if (multiDayFlagValue === 0) {
      multiDayHourValue = ""; // Clear MultiDayHour when disabling Multi-Day
    }
  }

  // 🔹 Day Selection Handling
  if (type === "WorkPackageDay" || type === "SkillDay" || type === "EquipmentDay") {
    // For day selections, we need to rebuild the MultiDayHour string
    // The day selection is stored in local state and will be handled by the server
    // when the quote is saved or when specific APIs are called
    console.log(`📅 Day selection updated: ${type} = ${updated}`);
    
    // Rebuild MultiDayHour string from current state
    const dayHourPairs = Object.entries(multiDayHours)
      .filter(([day, hour]) => hour && hour !== "0.00" && hour !== "")
      .map(([day, hour]) => `${day}-${hour}`)
      .join("|");
    
    multiDayHourValue = dayHourPairs;
    setMultidayhour(dayHourPairs);
  }

  // Strip out carriage returns and newlines from all values
  const cleanValue = (val: any) => String(val || '').replace(/[\r\n]/g, '');
  
  const priorityValue = cleanValue(type === 'Priority' ? updated : urgency);
  const mustCompleteValue = cleanValue(type === 'MustCompleteBy' ? updated : mustCompleteDate);
  const niceToHaveValue = cleanValue(type === 'NiceToHaveBy' ? updated : niceToHaveDate);
  const notBeforeValue = cleanValue(type === 'NotBefore' ? updated : notBefore);
  const hoursValue = cleanValue(type === 'Hours' ? updated : (quoteHours || '0.00'));
  const blackoutValue = cleanValue(uniqueBlackoutDates);
  const expenseClean = cleanValue(type === 'Expense' ? expense : expense || '0');
  const multiDayHourClean = cleanValue(multiDayHourValue);
  
  const url = `https://CrewzControl.com/dev/CCService/UpdateQuote.php?DeviceID=${deviceInfo.id}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&Serial=${serial}&CrewzControlVersion=${crewzControlVersion}&Priority=${priorityValue}&MustCompleteBy=${mustCompleteValue}&NiceToHaveBy=${niceToHaveValue}&BlackoutDate=${blackoutValue}&NotBefore=${notBeforeValue}&Hours=${hoursValue}&Expense=${expenseClean}&MultiDayHour=${multiDayHourClean}&MultiDayFlag=${multiDayFlagValue}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
  console.log('MukltidayHour Value:', multiDayHourValue);
  console.log('Request URL:', url);

  try {
    const response = await fetch(url);
    const data = await response.text();
    console.log('API Response:', data);

    const parser = new XMLParser();
    const result = parser.parse(data);

    if (result.ResultInfo?.Result === 'Success') {
      console.log('✅ Quote updated successfully.');
      console.log('✅ Dates Array: ', uniqueBlackoutDates);
      setBlackoutDates(updatedBlackoutDates);
      // Only update MultiDayFlag if it's not already set by the button handler
      if (type !== "MultiDayFlag") {
        setMultiDayFlag(multiDayFlagValue);
      }
    } else {
      console.error('Error', result.ResultInfo?.Message || 'Failed to update the quote.');
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
  
  const handleRemoveQuoteWorkPackage = async (quoteWorkPackageSerial: number) => {
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
        console.error('Error', result.ResultInfo?.Message || 'Failed to remove Quote Work Package.');
      }
    } catch (error) {
      console.error('Error removing Quote Work Package:', error);
    }
  };

  // Handle Multi-Day button press - simple function without useCallback
  const handleMultiDayPress = async () => {
    console.log('🚨 BUTTON CLICKED - handleMultiDayPress called!');
    console.log('🚨 Current state:', { isUpdatingMultiDay, buttonState });
    
    if (isUpdatingMultiDay) {
      console.log('🚨 Blocked - already updating');
      return; // Prevent multiple clicks
    }
    
    const newMultiDayFlag = buttonState.flag === 1 ? 0 : 1;
    
    console.log('🔄 Multi-Day button pressed:', { 
      currentFlag: buttonState.flag, 
      newFlag: newMultiDayFlag 
    });
    
    // Update button state atomically
    const newButtonState = {
      flag: newMultiDayFlag,
      text: newMultiDayFlag === 1 ? "Multi-Day ON" : "Multi-Day OFF",
      buttonStyle: newMultiDayFlag === 1 ? { backgroundColor: '#007BFF' } : {},
      textStyle: newMultiDayFlag === 1 ? { color: 'white' } : {}
    };
    
    // Update all states immediately - simple and direct
    setButtonState(newButtonState);
    setLocalMultiDayFlag(newMultiDayFlag);
    setMultiDayFlag(newMultiDayFlag);
    setIsMultiDay(newMultiDayFlag === 1);
    setShowMultiDayUI(newMultiDayFlag === 1);
    setIsUpdatingMultiDay(true);
    
    console.log('🔄 All states updated immediately:', newButtonState);
    console.log('🔄 isMultiDay set to:', newMultiDayFlag === 1);
    console.log('🔄 isUpdatingMultiDay set to true');
    
    // Add a delay to ensure "Updating..." is visible
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Call UpdateQuote API with the new MultiDayFlag value
      // Also preserve existing hours when toggling Multi-Day
      if (newMultiDayFlag === 1 && quoteHours && parseFloat(quoteHours) > 0) {
        // If enabling Multi-Day and there are existing hours, preserve them
        console.log(`🔄 Preserving existing hours: ${quoteHours}`);
      }
      await handleSave(newMultiDayFlag.toString(), "MultiDayFlag");
      console.log(`✅ Multi-Day flag updated to: ${newMultiDayFlag}`);
    } catch (error) {
      console.error('❌ Failed to update Multi-Day flag:', error);
      // Simple revert - just flip the flag back
      const revertedFlag = newMultiDayFlag === 1 ? 0 : 1;
      const revertedButtonState = {
        flag: revertedFlag,
        text: revertedFlag === 1 ? "Multi-Day ON" : "Multi-Day OFF",
        buttonStyle: revertedFlag === 1 ? { backgroundColor: '#007BFF' } : {},
        textStyle: revertedFlag === 1 ? { color: 'white' } : {}
      };
      
      // Revert all states immediately
      setButtonState(revertedButtonState);
      setLocalMultiDayFlag(revertedFlag);
      setMultiDayFlag(revertedFlag);
      setIsMultiDay(revertedFlag === 1);
      setShowMultiDayUI(revertedFlag === 1);
      console.error('Error', 'Failed to update Multi-Day setting. Please try again.');
    } finally {
      setIsUpdatingMultiDay(false);
      console.log('🔄 isUpdatingMultiDay set to false');
    }
  };

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
        console.error('Error', result.ResultInfo?.Message || 'Failed to remove skill.');
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
        console.error('Error', result.ResultInfo?.Message || 'Failed to remove equipment.');
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
        console.error('Error', result.ResultInfo?.Message || 'Failed to remove the Equipment.');
      }
    } catch (error) {
      console.error('Error removing Equipment:', error);
    }
  };
  
  const fetchQuoteDetails = async (immediate = false) => {
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
    }, 500); // 500ms debounce to handle dependency changes
  };

  const performFetchQuoteDetails = async () => {
    if (!deviceInfo || !location) {
      return;
    }

    // Set fetching flag
    isFetchingRef.current = true;
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

        setQuoteHours(quote.Hour ? quote.Hour.toString() : '0.00');
        setAmount(quote.Amount ? quote.Amount.toString() : '');
        setMustCompleteDate(quote.MustCompleteBy || '');
        setNiceToHaveDate(quote.NiceToHaveBy || '');
        setBlackoutDate(quote.BlackoutDate || '');
        setAvailableDate(quote.AvailableDate || '');
        setUrgency(quote.Priority || '');

        // 🔄 Restore Skills with Day selections
        if (quote.Skills) {
          const fetchedSkills = normalizeToArray(quote.Skills.Skill);
          console.log('📥 Restoring Skills - Raw data:', JSON.stringify(fetchedSkills, null, 2));
          setSkills(fetchedSkills.map((skill: any) => {
            const dayValue = skill.SkillDay || '';
            console.log(`  Skill "${skill.SkillName}" - SkillDay: ${dayValue}`);
            return {
              ...skill,
              selectedNumber: dayValue
            };
          }));
        }

        // 🔄 Restore Equipments with Day selections
        if (quote.Equipments) {
          const fetchedEquipments = normalizeToArray(quote.Equipments.Equipment);
          console.log('📥 Restoring Equipments - Raw data:', JSON.stringify(fetchedEquipments, null, 2));
          setEquipments(fetchedEquipments.map((equipment: any) => {
            const dayValue = equipment.EquipmentDay || '';
            console.log(`  Equipment "${equipment.EquipmentName}" - EquipmentDay: ${dayValue}`);
            return {
              ...equipment,
              selectedNumber: dayValue
            };
          }));
        }

        // 🔄 Restore Work Packages with Day selections
        if (quote.QuoteWorkPackages) {
          const fetchedWorkPackages = normalizeToArray(quote.QuoteWorkPackages.QuoteWorkPackage);
          console.log('📥 Restoring Work Packages - Raw data:', JSON.stringify(fetchedWorkPackages, null, 2));
          setQuoteWorkPackages(fetchedWorkPackages.map((qwp: any) => {
            const dayValue = qwp.QuoteWorkPackageDay || '';
            console.log(`  WorkPackage "${qwp.QuoteWorkPackageName}" - QuoteWorkPackageDay: ${dayValue}`);
            return {
              ...qwp,
              selectedNumber: dayValue
            };
          }));
        }
      } else {
        console.error('Error', result.ResultInfo?.Message || 'Failed to fetch quote details.');
      }
    } catch (error) {
      console.error('Error fetching quote details:', error);
    } finally {
      // Clear fetching flag
      isFetchingRef.current = false;
      console.log('✅ GetQuote API call completed');
    }
  };

  const handleUpdateSkill = async (skillSerial: number, newCount: number) => {
    if (!deviceInfo || !location || !jobObj.Serial) {
      console.error('Missing Information', 'Device, location, or quote serial is missing');
      return;
    }
  
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
        console.error('Error', result.ResultInfo?.Message || 'Failed to update the skill.');
      }
    } catch (error) {
      console.error('❌ Error updating skill:', error);
    }
  };


  const handleUpdateEquipment = async (equipmentSerial: number, newCount: number) => {
    if (!deviceInfo || !location || !jobObj.Serial) {
      console.error('Missing Information', 'Device, location, or quote serial is missing');
      return;
    }
  
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
        console.error('Error', result.ResultInfo?.Message || 'Failed to update the equipment.');
      }
    } catch (error) {
      console.error('❌ Error updating equipment:', error);
    }
  };

  // Update Equipment Day Selection using UpdateQuoteEquipment API
  const handleUpdateEquipmentDay = async (equipmentSerial: number, day: string, count: number) => {
    if (!deviceInfo || !location || !jobObj.Serial) {
      console.error('Missing Information', 'Device, location, or quote serial is missing');
      return;
    }
  
    // Ensure count has a valid value (default to 1 if undefined/zero)
    const validCount = count && count > 0 ? count : 1;
    console.log('📅 Equipment Day Update - Serial:', equipmentSerial, 'Day:', day, 'Count:', validCount);
  
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
  
    // API expects: Action=update, List, Quote, Count, Day (not EquipmentDay)
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuoteEquipment.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Action=update&List=${equipmentSerial}&Quote=${serial}&Count=${validCount}&Day=${day}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
  
    console.log('📅 UpdateQuoteEquipment Day URL:', url);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      console.log('📅 Equipment API Response:', data);
  
      const parser = new XMLParser();
      const result = parser.parse(data);
      
      console.log('📅 Parsed Equipment Result:', JSON.stringify(result, null, 2));
  
      if (result.ResultInfo?.Result === 'Success') {
        console.log('✅ Equipment day selection updated successfully');
      } else {
        const errorCode = result.ResultInfo?.ErrorCode || 'Unknown';
        const errorMessage = result.ResultInfo?.Message || 'Failed to update equipment day.';
        console.error('❌ Equipment API Error Code:', errorCode);
        console.error('❌ Equipment API Error Message:', errorMessage);
      }
    } catch (error) {
      console.error('❌ Error updating equipment day:', error);
    }
  };

  // Update Skill Day Selection using UpdateQuoteSkill API
  const handleUpdateSkillDay = async (skillSerial: number, day: string, count: number) => {
    if (!deviceInfo || !location || !jobObj.Serial) {
      console.error('Missing Information', 'Device, location, or quote serial is missing');
      return;
    }
  
    // Ensure count has a valid value (default to 1 if undefined/zero)
    const validCount = count && count > 0 ? count : 1;
    console.log('📅 Skill Day Update - Serial:', skillSerial, 'Day:', day, 'Count:', validCount);
  
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
  
    // API expects: Action=update, List, Quote, Count, Day (not SkillDay)
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuoteSkill.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Action=update&List=${skillSerial}&Quote=${serial}&Count=${validCount}&Day=${day}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
  
    console.log('📅 UpdateQuoteSkill Day URL:', url);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      console.log('📅 Skill API Response:', data);
  
      const parser = new XMLParser();
      const result = parser.parse(data);
      
      console.log('📅 Parsed Skill Result:', JSON.stringify(result, null, 2));
  
      if (result.ResultInfo?.Result === 'Success') {
        console.log('✅ Skill day selection updated successfully');
      } else {
        const errorCode = result.ResultInfo?.ErrorCode || 'Unknown';
        const errorMessage = result.ResultInfo?.Message || 'Failed to update skill day.';
        console.error('❌ Skill API Error Code:', errorCode);
        console.error('❌ Skill API Error Message:', errorMessage);
      }
    } catch (error) {
      console.error('❌ Error updating skill day:', error);
    }
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
    // Save MultiDayHour data before navigating away
    // Use multiDayFlag instead of isMultiDay to avoid timing issues
    if (multiDayFlag === 1 && multiDayHours) {
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
    // Save MultiDayHour data before navigating away
    // Use multiDayFlag instead of isMultiDay to avoid timing issues
    if (multiDayFlag === 1 && multiDayHours) {
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
    <SafeAreaView key={`multiday-${componentKey}`} style={{ flex: 1, backgroundColor: '#fff' }}>
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
                      handleSave(normalized, "Expense");
                    } else {
                      setExpense("0");
                      handleSave("0", "Expense");
                    }
                  }}
                  placeholder="0"
                  keyboardType="number-pad"
                  style={styles.inputField}
                />
              </View> 
            {Number(multiDayFlag) === 0 ? (
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
                      handleSave(formatted, "Hours");
                    }
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.inputField}
                />
              </View>
            ) : (
              // 🔹 Multi-day Hours inputs (Day 1 → Day N depending on dropdowns)
              <View style={{ marginTop: 15 }}>
                 {Array.from({ length: maxDaySelected }, (_, i) => i + 1).map(day => (
                    <View key={day} style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Hours Day {day}:</Text>
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
                          handleSave(dayHourPairs, "MultiDayHour");
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
                    key={`priority-${urgency}`}
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
                        setUrgency(value); // Update state first
                        handleSave(value, "Priority");
                      }
                    }}
                    style={[styles.dropdownStyle, styles.inputField]}
                    dropDownContainerStyle={[styles.dropDownContainerStyle, { zIndex: 1000 }]}
                    zIndex={1000}
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
                    handleSave(date, 'NotBefore');
                  }}
                />
                <CustomDatePicker
                  label="Nice To Have By:"
                  value={niceToHaveDate || ''} // Value from the state
                  onChange={(date) => {
                    console.log('NiceToHaveBy Updated:', date);
                    setNiceToHaveDate(date); // Updates the state
                    handleSave(date, 'NiceToHaveBy');
                  }}
                />
                <CustomDatePicker
                  label="Must Be Complete By:"
                  value={mustCompleteDate || ''} // Value from the state
                  onChange={(date) => {
                    console.log('MustCompleteBy Updated:', date);
                    setMustCompleteDate(date); // Updates the state
                    handleSave(date, 'MustCompleteBy');
                  }}
                />
                            <DateTimePicker
                              label="Blackout Date(s): "
                              initialDates={blackoutDate} // 🔹 Persist blackout dates from API
                              onChange={(updatedDates) => {
                                const cleanedDates = updatedDates.filter(date => /^\d{2}\/\d{2}\/\d{4}$/.test(date)); // ✅ Filter valid dates
                                
                                handleSave(cleanedDates.join(','), 'BlackoutDate'); // Send to API
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
                    handleSave(date, 'AvailableDate');
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
        <View style={[styles.leftGroup, { zIndex: pickerZ, overflow: 'visible' }]}>
          {showMultiDayUI && (
            <TouchableOpacity 
              style={{ 
                marginRight: 8, 
                minWidth: 80,
                height: 30,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f0f0f0',
                borderRadius: 4,
                paddingHorizontal: 4,
                borderWidth: 1,
                borderColor: '#ccc'
              }}
              onPress={() => {
                Alert.alert(
                  'Select Day',
                  'Choose the day for this work package:',
                  [
                    { text: 'DAY 1', onPress: () => { 
                      qwp.selectedNumber = '1'; 
                      setQuoteWorkPackages([...quoteWorkPackages]);
                      handleSave('1', 'WorkPackageDay');
                    } },
                    { text: 'DAY 2', onPress: () => { 
                      qwp.selectedNumber = '2'; 
                      setQuoteWorkPackages([...quoteWorkPackages]);
                      handleSave('2', 'WorkPackageDay');
                    } },
                    { text: 'DAY 3', onPress: () => { 
                      qwp.selectedNumber = '3'; 
                      setQuoteWorkPackages([...quoteWorkPackages]);
                      handleSave('3', 'WorkPackageDay');
                    } },
                    { text: 'DAY 4', onPress: () => { 
                      qwp.selectedNumber = '4'; 
                      setQuoteWorkPackages([...quoteWorkPackages]);
                      handleSave('4', 'WorkPackageDay');
                    } },
                    { text: 'DAY 5', onPress: () => { 
                      qwp.selectedNumber = '5'; 
                      setQuoteWorkPackages([...quoteWorkPackages]);
                      handleSave('5', 'WorkPackageDay');
                    } },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={{ fontSize: 12, color: '#000' }}>
                DAY {qwp.selectedNumber ?? '1'}
              </Text>
            </TouchableOpacity>
          )}
                   <Text
            style={[styles.workPackageTitle, { flex: 1, marginRight: 8 }]}
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
                      <Text style={styles.emptyText}>No Equipment available.</Text>
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
                        {showMultiDayUI && (
                        <TouchableOpacity 
                          style={{ 
                            marginRight: 8, 
                            minWidth: 80,
                            height: 30,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#f0f0f0',
                            borderRadius: 4,
                            paddingHorizontal: 4,
                            borderWidth: 1,
                            borderColor: '#ccc'
                          }}
                          onPress={() => {
                            Alert.alert(
                              'Select Day',
                              'Choose the day for this skill:',
                              [
                                { text: 'DAY 1', onPress: () => { 
                                  skill.selectedNumber = '1'; 
                                  setSkills([...skills]);
                                  handleUpdateSkillDay(skill.SkillSerial, '1', skill.SkillCount);
                                } },
                                { text: 'DAY 2', onPress: () => { 
                                  skill.selectedNumber = '2'; 
                                  setSkills([...skills]);
                                  handleUpdateSkillDay(skill.SkillSerial, '2', skill.SkillCount);
                                } },
                                { text: 'DAY 3', onPress: () => { 
                                  skill.selectedNumber = '3'; 
                                  setSkills([...skills]);
                                  handleUpdateSkillDay(skill.SkillSerial, '3', skill.SkillCount);
                                } },
                                { text: 'DAY 4', onPress: () => { 
                                  skill.selectedNumber = '4'; 
                                  setSkills([...skills]);
                                  handleUpdateSkillDay(skill.SkillSerial, '4', skill.SkillCount);
                                } },
                                { text: 'DAY 5', onPress: () => { 
                                  skill.selectedNumber = '5'; 
                                  setSkills([...skills]);
                                  handleUpdateSkillDay(skill.SkillSerial, '5', skill.SkillCount);
                                } },
                                { text: 'Cancel', style: 'cancel' }
                              ]
                            );
                          }}
                        >
                          <Text style={{ fontSize: 12, color: '#000' }}>
                            DAY {skill.selectedNumber || '1'}
                          </Text>
                        </TouchableOpacity>
                              )}
                        <Text style={[styles.workPackageTitle, { flex: 1, marginRight: 8 }]} numberOfLines={2} ellipsizeMode="tail">{skill.SkillName}</Text>
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
                  <Text style={styles.emptyText}>No skills available.</Text>
                )}
              

              {/*// Equipment Section*/}
              
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
                    <Icon name="plus" size={16} color="#fff" /> {/*//Smaller plus icon}*/}
                  </Text>
                </TouchableOpacity>
                </View>
                {equipments.length > 0 ? (
                  equipments.map((equipment, equipmentIndex) => (
                    <View key={equipmentIndex} style={styles.workPackageContainer}>
                      <View style={styles.headerRow}>
                        {showMultiDayUI && (
                        <TouchableOpacity 
                          style={{ 
                            marginRight: 8, 
                            minWidth: 80,
                            height: 30,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#f0f0f0',
                            borderRadius: 4,
                            paddingHorizontal: 4,
                            borderWidth: 1,
                            borderColor: '#ccc'
                          }}
                          onPress={() => {
                            Alert.alert(
                              'Select Day',
                              'Choose the day for this equipment:',
                              [
                                { text: 'DAY 1', onPress: () => { 
                                  equipment.selectedNumber = '1'; 
                                  setEquipments([...equipments]);
                                  handleUpdateEquipmentDay(equipment.EquipmentSerial, '1', equipment.EquipmentCount);
                                } },
                                { text: 'DAY 2', onPress: () => { 
                                  equipment.selectedNumber = '2'; 
                                  setEquipments([...equipments]);
                                  handleUpdateEquipmentDay(equipment.EquipmentSerial, '2', equipment.EquipmentCount);
                                } },
                                { text: 'DAY 3', onPress: () => { 
                                  equipment.selectedNumber = '3'; 
                                  setEquipments([...equipments]);
                                  handleUpdateEquipmentDay(equipment.EquipmentSerial, '3', equipment.EquipmentCount);
                                } },
                                { text: 'DAY 4', onPress: () => { 
                                  equipment.selectedNumber = '4'; 
                                  setEquipments([...equipments]);
                                  handleUpdateEquipmentDay(equipment.EquipmentSerial, '4', equipment.EquipmentCount);
                                } },
                                { text: 'DAY 5', onPress: () => { 
                                  equipment.selectedNumber = '5'; 
                                  setEquipments([...equipments]);
                                  handleUpdateEquipmentDay(equipment.EquipmentSerial, '5', equipment.EquipmentCount);
                                } },
                                { text: 'Cancel', style: 'cancel' }
                              ]
                            );
                          }}
                        >
                          <Text style={{ fontSize: 12, color: '#000' }}>
                            DAY {equipment.selectedNumber || '1'}
                          </Text>
                        </TouchableOpacity>
                              )}
                        <Text style={[styles.workPackageTitle, { flex: 1, marginRight: 8 }]} numberOfLines={2} ellipsizeMode="tail">{equipment.EquipmentName}</Text>
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
                  <Text style={styles.emptyText}>No equipment available.</Text>
                )}
              
              </View>
              </View>

          {/* Footer (Buttons) */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                console.log('🚨 Direct button pressed!');
                handleMultiDayPress();
              }}
              disabled={isUpdatingMultiDay}
              style={[
                styles.cancelButton,
                buttonState.buttonStyle,
                isUpdatingMultiDay && { opacity: 0.7 }
              ]}>
              <Text style={[styles.cancelButtonText, buttonState.textStyle]}>
                {isUpdatingMultiDay ? "Updating..." : buttonState.text}
              </Text>
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
    marginBottom: 50
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
    marginTop: 150, // Space for the logo
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
    paddingHorizontal: 50,
    borderRadius: 15,
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

