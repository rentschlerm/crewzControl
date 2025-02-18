import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  Image,
  Modal,
} from 'react-native';
import { JobsContext, Job } from '../components/JobContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LogoStyles from '../components/LogoStyles';
import DropDownPicker from 'react-native-dropdown-picker';
import CustomDatePicker from '../components/CustomDatePicker';
import { getDeviceInfo } from '../components/DeviceUtils';
import { XMLParser } from 'fast-xml-parser';
import CryptoJS from 'crypto-js';
import { FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; 
import useLocation from '@/hooks/useLocation';
import { useFocusEffect } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface WorkPackageAlternate {
  AlternateName: string;
  AlternatePriority: number;
  AlternateStatus: number;
  AlternateHour: number;
  AlternateSerial: number;
}

interface WorkPackage {
  WorkPackage: any;
  WorkPackages: any;
  WorkPackageName: string;
  WorkPackageSerial: number;
  WorkPackageAlternates: WorkPackageAlternate[] | WorkPackageAlternate;
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

const ProjectUpdate: React.FC = () => {
  const router = useRouter();
  const { job, quoteSerial } = useLocalSearchParams();


  const jobObj: Job = typeof job === 'string' ? JSON.parse(job) : job;
  const { updateJob, authorizationCode } = useContext(JobsContext)!;
  const { width: deviceWidth } = Dimensions.get('window');
  const [jobData, setJobData] = useState<Job | null>(null);
  
  const [customerName, setName] = useState(jobObj?.Name);
  const [address, setAddress] = useState(jobObj?.Address);
  const [city, setCity] = useState(jobObj?.City);
  const [serial, setserial] = useState(jobObj?.serial);
  const [quoteHours, setQuoteHours] = useState("0.00");
  
  const [urgency, setUrgency] = useState('');
  const [urgencyOpen, setUrgencyOpen] = useState(false);
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


  const [mustCompleteDate, setMustCompleteDate] = useState(jobObj?.mustCompleteDate);
  const [niceToHaveDate, setNiceToHaveDate] = useState(jobObj?.niceToHaveDate);
  const [blackoutDate, setBlackoutDate] = useState(jobObj?.blackoutDate);
  const [availableDate, setAvailableDate] = useState(jobObj?.availableDate);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSkillModalVisible, setSkillModalVisible] = useState(false);
  const [isEquipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; serial: string } | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<{ name: string; serial: string } | null>(null);
  const [selectedWorkPackage, setSelectedWorkPackage] = useState<{ name: string; serial: string } | null>(null);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  // const fetchQuoteDetails = async () => {
  //   if (!deviceInfo || !location || !authorizationCode || !(job || quoteSerial)) {
  //     Alert.alert('Error', 'Missing required data to fetch quote details.');
  //     return;
  //   }

  //   const currentDate = new Date();
  //   const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
  //     currentDate.getDate()
  //   ).padStart(2, '0')}/${currentDate.getFullYear()}-${String(
  //     currentDate.getHours()
  //   ).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  //   const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
  //   const key = CryptoJS.SHA1(keyString).toString();

  //   // const serial = job?.Serial || quoteSerial;

  //   const url = `https://CrewzControl.com/dev/CCService/GetQuote.php?DeviceID=${encodeURIComponent(
  //     deviceInfo.id
  //   )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&Serial=13070&CrewzControlVersion=1&Longitude=${location.longitude}&Latitude=${location.latitude}`;

  //   console.log("Fetching Quote on Focus: ", url);

  //   try {
  //     const response = await fetch(url);
  //     const data = await response.text();
  //     const parser = new XMLParser();
  //     const result = parser.parse(data);

  //     if (result.ResultInfo?.Result === 'Success') {
  //       const quote = result.ResultInfo.Selections?.Quote || {};
  //       console.log("Fetched Quote Data: ", quote);

  //       setJobData(quote);
  //       setQuoteHours(quote.Hour ? quote.Hour.toString() : "0.00");
  //       setMustCompleteDate(quote.MustCompleteBy || '');
  //       setNiceToHaveDate(quote.NiceToHaveBy || '');
  //       setBlackoutDate(quote.BlackoutDate || '');
  //       setAvailableDate(quote.AvailableDate || '');
  //       setUrgency(quote.Priority || 'Normal');
  //     } else {
  //       Alert.alert('Error', result.ResultInfo?.Message || 'Failed to fetch quote details.');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching quote details:', error);
  //     Alert.alert('Error', 'An error occurred while fetching quote details.');
  //   }
  // };

  
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
    setSkills(parsedSkills);
    setEquipments(parsedEquipments);
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

  const services: Service[] = (() => {
    try {
      const parsedServices =
        typeof jobObj.Services === 'string' ? JSON.parse(jobObj.Services) : jobObj.Services;
        console.log(parsedServices)
      return normalizeToArray(parsedServices?.Service);
    } catch (error) {
      console.error('Error parsing Services:', error);
      return [];
    }
  })();

  const handleSave = async (updated: string, type: string) => {
    if (!deviceInfo || !location || !jobObj.Serial) {
      Alert.alert('Device, location, or quote serial information is missing');
      return;
    }
  
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
  
    const url = `https://CrewzControl.com/dev/CCService/UpdateQuote.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&Serial=${serial}&CrewzControlVersion=${crewzControlVersion}&Priority=${urgency}&MustCompleteBy=${
      type === 'MustCompleteBy' ? updated : mustCompleteDate
    }&NiceToHaveBy=${
      type === 'NiceToHaveBy' ? updated : niceToHaveDate
    }&BlackoutDate=${
      type === 'BlackoutDate' ? updated : blackoutDate
    }&AvailableDate=${
      type === 'AvailableDate' ? updated : availableDate
    }&Hours=${ type === 'Hours' ? updated: quoteHours || ''}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
  
    console.log('Request URL:', url);
  
    try {
      const response = await fetch(url);
      const data = await response.text();
      console.log('API Response:', data);
  
      const parser = new XMLParser();
      const result = parser.parse(data);
  
      if (result.ResultInfo?.Result === 'Success') {

        // JCM 01/15/2025: Commented the alert to remove the updated popup as it's not necessary
        // Alert.alert('Success', 'Quote updated successfully.');

      } else {
        Alert.alert('Error', result.ResultInfo?.Message || 'Failed to update the quote.');
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      Alert.alert('Error', 'An error occurred while updating the quote.');
    }
  };
  
  
  const handleRemoveSkill = async (skillSerial: string | undefined) => {
    if (!deviceInfo || !location || !authorizationCode || !skillSerial || !jobObj.Serial) {
      Alert.alert('Error', 'Device info, location, authorization code, or quote serial is missing.');
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
        setSkillModalVisible(false);
        setSelectedSkill(null);
      } else {
        Alert.alert('Error', result.ResultInfo?.Message || 'Failed to remove skill.');
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      Alert.alert('Error', 'An error occurred while removing the skill.');
    }
  };
  
  
  const handleRemoveEquipment = async (equipmentSerial: string | undefined) => {
    if (!deviceInfo || !location || !authorizationCode || !equipmentSerial || !jobObj.Serial) {
      Alert.alert('Error', 'Device info, location, authorization code, or quote serial is missing.');
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
        setEquipmentModalVisible(false);
        setSelectedEquipment(null);
      } else {
        Alert.alert('Error', result.ResultInfo?.Message || 'Failed to remove equipment.');
      }
    } catch (error) {
      console.error('Error removing equipment:', error);
      Alert.alert('Error', 'An error occurred while removing the equipment.');
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
      Alert.alert('Error', 'Device, location, authorization code, or quote serial information is missing.');
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
        
      } else {
        Alert.alert('Error', result.ResultInfo?.Message || 'Failed to remove the resource.');
      }
    } catch (error) {
      console.error('Error removing resource:', error);
      Alert.alert('Error', 'An error occurred while removing the resource.');
    }
  };
  

  useFocusEffect(
    useCallback(() => {
      let didCallAPI = false;
  
      const fetchQuoteDetails = async () => {
        if (!deviceInfo || !location || !authorizationCode || !jobObj.Serial || quoteSerial || didCallAPI) {
          return; // Exit early if prerequisites are not ready or API was already called
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
  
          if (result.ResultInfo?.Result === 'Success') {
            const quote = result.ResultInfo.Selections?.Quote || {};
  
            console.log('Fetched Quote Data: ', quote);
  
            setQuoteHours(quote.Hour ? quote.Hour.toString() : '0.00');
            setMustCompleteDate(quote.MustCompleteBy || '');
            setNiceToHaveDate(quote.NiceToHaveBy || '');
            setBlackoutDate(quote.BlackoutDate || '');
            setAvailableDate(quote.AvailableDate || '');
            setUrgency(quote.Priority || 'Normal');
          } else {
            Alert.alert('Error', result.ResultInfo?.Message || 'Failed to fetch quote details.');
          }
        } catch (error) {
          console.error('Error fetching quote details:', error);
          Alert.alert('Error', 'An error occurred while fetching quote details.');
        } finally {
          didCallAPI = true; // Ensure we do not call the API again during this focus
        }
      };
  
      fetchQuoteDetails();
  
      return () => {
        didCallAPI = false; // Reset flag on component unmount or focus change
      };
    }, [deviceInfo, location, authorizationCode, jobObj.Serial, quoteSerial])
  );
  

  const handleCancel = () => {
    // Alert.alert('Exit Without Saving?', 'Are you sure you want to exit without saving?', [
    //   { text: 'No', style: 'cancel' },
    //   { text: 'Yes', onPress: () =>  },
    // ]);
    router.back()
  };
 
  
  if (!job) {
    return <Text>Error: No job data found</Text>;
  }
  
  return (
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
              <TouchableOpacity onPress={() => router.back()}>
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
              {/* Roll Picker */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.label}>Hours:</Text>
                <View style={[styles.pickerContainer, { zIndex: 1000 }]}>
                  
                  <Picker
                    selectedValue={quoteHours}
                    onValueChange={(newValue) => {
                      console.log("Selected Hour: ", newValue);
                      setQuoteHours(newValue);
                      handleSave(newValue, "Hours");
                    }}
                    style={styles.compactPicker}
                    itemStyle={styles.pickerItem}
                  >
                    {generateHours()}
                  </Picker>
                </View>
                </View>
             

              <View style={styles.row}>
                <Text style={styles.label}>Priority:</Text>
                <View style={[styles.dropdownWrapper, { zIndex: 1000 }]}>
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
                    style={[styles.dropdownStyle, { width: 220, marginLeft: -55, marginBottom: 20 }]}
                    dropDownContainerStyle={[styles.dropDownContainerStyle, { zIndex: 1000 }]}
                    modalProps={{
                      transparent: false, 
                    }}
                    zIndex={1000}
                  />
                </View>

              </View>
              <View style={styles.dateSection}>
                <CustomDatePicker
                  label="Must Be Complete By:"
                  value={mustCompleteDate || ''} // Value from the state
                  labelStyle={{ textAlign: 'right', fontSize: 16 }}
                  onChange={(date) => {
                    console.log('MustCompleteBy Updated:', date);
                    setMustCompleteDate(date); // Updates the state
                    handleSave(date, 'MustCompleteBy');
                  }}
                />
                <CustomDatePicker
                  label="Nice To Have By:"
                  value={niceToHaveDate || ''} // Value from the state
                  labelStyle={{ textAlign: 'right', fontSize: 16 }}
                  onChange={(date) => {
                    console.log('NiceToHaveBy Updated:', date);
                    setNiceToHaveDate(date); // Updates the state
                    handleSave(date, 'NiceToHaveBy');
                  }}
                />
                <CustomDatePicker
                  label="Blackout Date:"
                  value={blackoutDate || ''} // Value from the state
                  labelStyle={{ textAlign: 'right', fontSize: 16 }}
                  onChange={(date) => {
                    console.log('BlackoutDate Updated:', date);
                    setBlackoutDate(date); // Updates the state
                    handleSave(date, 'BlackoutDate');
                  }}
                />
                <CustomDatePicker
                  label="Available Date:"
                  value={availableDate || ''} // Value from the state
                  labelStyle={{ textAlign: 'right', fontSize: 16 }}
                  onChange={(date) => {
                    console.log('AvailableDate Updated:', date);
                    setAvailableDate(date); // Updates the state
                    handleSave(date, 'AvailableDate');
                  }}
                />
              </View>
  
              {/* Services Section */}
              <Text style={styles.sectionTitle}>Services</Text>
              {services.map((service, index) => {
                const workPackages = normalizeWorkPackages(service.WorkPackages);

                return (
                  <View key={index} style={styles.serviceContainer}>
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
                                      <Text style={styles.modalHeader}>Remove Resource Group</Text>

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
                      <Text style={styles.sectionTitle}>Resource Groups</Text>
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
                    </View>
              {/* Skills Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Skills</Text>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() =>
                    router.push({
                      pathname: '/AddSkillsGroup',
                      params: { quoteSerial: jobObj.Serial },
                    })
                  }
                >
                  <Text><Icon name="plus" size={16} color="#fff" /> {/* Icon only */}</Text>
                </TouchableOpacity>
              </View>
                {skills.length > 0 ? (
                  skills.map((skill, skillIndex) => (
                    <View key={skillIndex} style={styles.workPackageContainer}>
                      <View style={styles.rowContainer}>
                        <Text style={styles.workPackageTitle}>{skill.SkillName}</Text>
                        <View style={styles.buttonGroup}>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => {
                              setSelectedSkill({ name: skill.SkillName, serial: skill.SkillSerial });
                              setSkillModalVisible(true);
                            }}
                          >
                            <Text>
                              <Icon name="minus" size={24} color="#fff" />
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No skills available.</Text>
                )}
              

              {/* Equipment Section */}
              <View style={styles.sectionContainer}>
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
                    <Icon name="plus" size={16} color="#fff" /> {/* Smaller plus icon */}
                  </Text>
                </TouchableOpacity>
                </View>
                {equipments.length > 0 ? (
                  equipments.map((equipment, equipmentIndex) => (
                    <View key={equipmentIndex} style={styles.workPackageContainer}>
                      <View style={styles.headerRow}>
                        <Text style={styles.workPackageTitle}>{equipment.EquipmentName}</Text>
                        <View style={styles.buttonGroup}>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => {
                              setSelectedEquipment({
                                name: equipment.EquipmentName,
                                serial: equipment.EquipmentSerial,
                              });
                              setEquipmentModalVisible(true);
                            }}
                          >
                            <Text>
                              <Icon name="minus" size={24} color="#fff" />
                            </Text>
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
              </View>

          {/* Footer (Buttons) */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
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
  },
  iconButton: {
    backgroundColor: '#20D5FF',
    borderRadius: 20, // Circular button
    padding: 10, // Padding for the icon
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    gap: 10, // Add space between buttons
  },
  workPackageTitle: {
    flex: 1, // Take up available space for wrapping
    fontSize: 16,
    color: '#000',
    marginRight: 10, // Add space between text and buttons
    lineHeight: 20, // Add space between lines for better readability
    flexWrap: 'wrap', // Ensure text wraps properly
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
  serviceTitle: { fontWeight: 'bold', marginBottom: 5 },
  workPackagesSection: { marginTop: 10 },
  workPackageContainer: { marginBottom: 10, padding: 10, backgroundColor: '#e9e9e9', borderRadius: 5 },
  alternateContainer: { marginTop: 5, paddingLeft: 10 },
  alternateTitle: { fontWeight: 'bold' },
  dropdownStyle: { borderWidth: 1, borderColor: '#ccc', height: 40, borderRadius: 5, color:'white' },
  dropDownContainerStyle: { backgroundColor: '#fafafa' },
  dropdownWrapper: { flex: 1 }, 
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
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
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

