import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  TextStyle,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

interface CustomDatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  labelStyle?: TextStyle;
}

// MG 1-15-2026: Helper function to parse MM/DD/YYYY format correctly
// Problem: new Date("01/16/2026") doesn't parse reliably across all systems
// Solution: Parse the string manually and construct Date object
const parseDate = (dateString: string): Date | undefined => {
  if (!dateString || dateString.trim() === '') return undefined;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return undefined;
  
  const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (isNaN(month) || isNaN(day) || isNaN(year)) return undefined;
  
  return new Date(year, month, day);
};

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value = '',
  onChange,
  readOnly = false,
  labelStyle,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  
  // MG 1-26-2026: Track selected date in ISO format for Calendar component
  const [selectedDateISO, setSelectedDateISO] = useState<string>('');

  // MG 1-26-2026: Convert MM/DD/YYYY to YYYY-MM-DD for Calendar component
  const convertToISO = (dateStr: string): string => {
    if (!dateStr || dateStr.trim() === '') return '';
    const parsed = parseDate(dateStr);
    if (!parsed) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // MG 1-26-2026: Update selected date when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDateISO(convertToISO(value));
    } else {
      setSelectedDateISO('');
    }
  }, [value]);

  const toggleDatePicker = () => {
    if (!readOnly) {
      setShowPicker(!showPicker);
    }
  };

  // Function to format the date as MM/DD/YYYY
  const formatDate = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // MG 1-26-2026: Handle date selection from Calendar component
  const handleDayPress = (day: { dateString: string }) => {
    const selectedDate = new Date(day.dateString);
    
    // Check if clicking on already-selected date to deselect it
    if (selectedDateISO === day.dateString) {
      // Deselect - clear the date
      setSelectedDateISO('');
      setShowPicker(false);
      onChange(''); // Pass empty string to clear the field
    } else {
      // Select new date
      setSelectedDateISO(day.dateString);
      setShowPicker(false);
      const formattedDate = formatDate(selectedDate);
      onChange(formattedDate);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, labelStyle]}>{label}</Text>
        <TouchableOpacity
          style={[styles.input, readOnly && styles.readOnly]}
          onPress={toggleDatePicker}
        >
          <Text>{value}</Text>
        </TouchableOpacity>
      </View>
      {showPicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showPicker}
          onRequestClose={toggleDatePicker}
        >
          <View style={styles.modalContainer}>
            <Calendar
              minDate={new Date().toISOString().split('T')[0]} // MG 1-26-2026: Disable past dates - only today and future dates can be selected
              enableSwipeMonths={true}
              markedDates={
                selectedDateISO
                  ? { [selectedDateISO]: { selected: true, marked: true } }
                  : {}
              }
              onDayPress={handleDayPress}
              theme={{
                calendarBackground: 'white',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#00adf5',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#00adf5',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                arrowColor: '#00adf5',
                monthTextColor: 'black',
                textMonthFontWeight: 'bold',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={toggleDatePicker}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
  
};



const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    // M.G. 10/1/2025 - Added width: '100%' to make container occupy full width for proper alignment
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    // M.G. 10/1/2025 - Added width: '100%' for proper alignment with main input fields
    width: '100%',
  },
  label: {
    // M.G. 10/1/2025 - Responsive flexbox layout to match main input fields alignment
    flex: 0.4, // Takes 40% of available width
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
    marginRight: 10,
  },
  input: {
    // M.G. 10/1/2025 - Responsive flexbox layout to match main input fields alignment
    flex: 0.6, // Takes 60% of available width
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readOnly: {
    backgroundColor: '#f0f0f0',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CustomDatePicker;
