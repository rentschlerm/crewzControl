import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

export const getDeviceInfo = async () => {
  return {
    id: Constants.sessionId || 'UnknownDeviceID', // Use session ID or fallback
    type: Platform.OS === 'ios' ? 'iOS' : 'Android', // Determine platform type
    model: '', // Use model name or fallback
    version: Platform.Version.toString() || 'UnknownVersion', // Get the OS version
    softwareVersion: Device.osVersion || 'UnknownSoftwareVersion', // Add software version
  };
};
