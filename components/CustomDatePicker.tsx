import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  TextStyle,
} from 'react-native';

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
  
  // MG 1-15-2026: Initialize year/month from value prop if it exists, otherwise use today
  // This ensures when calendar opens, it shows the month of the selected date, not always current month
  const initialDate = value ? (parseDate(value) || new Date()) : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? parseDate(value) : undefined
  );
  const [showYearPicker, setShowYearPicker] = useState(false);

  const yearsToDisplay = Array.from({ length: 15 }, (_, index) => currentYear - 7 + index);

  // MG 1-15-2026: Update calendar year/month and selected date when value prop changes from parent
  // This ensures if the date is changed externally (like from API refetch), the calendar shows the correct month
  useEffect(() => {
    if (value) {
      const newDate = parseDate(value);
      if (newDate) {
        setSelectedDate(newDate);
        setCurrentYear(newDate.getFullYear());
        setCurrentMonth(newDate.getMonth());
      }
    } else {
      setSelectedDate(undefined);
    }
  }, [value]);

  const toggleDatePicker = () => {
    if (!readOnly) {
      setShowPicker(!showPicker);
    }
  };

  const daysInMonth = (month: number, year: number) =>
    new Date(year, month + 1, 0).getDate();

  // MG 1-15-2026: Added ability to deselect date by clicking on already-selected date
  // Problem: User couldn't clear/remove a date once selected
  // Solution: If clicking on the same date that's already selected, clear it and pass empty string to parent
  const handleDateSelect = (day: number, month: number) => {
    const newDate = new Date(currentYear, month, day);
    
    // Check if clicking on the already-selected date to deselect it
    if (selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === currentYear) {
      // Deselect - clear the date
      setSelectedDate(undefined);
      setShowPicker(false);
      onChange(''); // Pass empty string to clear the field
    } else {
      // Select new date
      setSelectedDate(newDate);
      setShowPicker(false);
      const formattedDate = formatDate(newDate);
      onChange(formattedDate);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setShowYearPicker(false);
  };

  // Function to format the date as MM/DD/YY
  const formatDate = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear(); // Get the last two digits of the year
    return `${month}/${day}/${year}`;
  };

  const renderCalendar = () => {
    const days = Array.from(
      { length: daysInMonth(currentMonth, currentYear) },
      (_, index) => index + 1
    );

    return (
      <View style={styles.monthContainer}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={handlePreviousMonth}>
            <Text style={styles.arrowText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthName}>
            {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })}
          </Text>
          <TouchableOpacity onPress={() => setShowYearPicker(true)}>
            <Text style={styles.monthName}>{currentYear}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextMonth}>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={days}
          keyExtractor={(item) => item.toString()}
          numColumns={7}
          renderItem={({ item: day }) => (
            <TouchableOpacity
              style={[
                styles.dayButton,
                selectedDate?.getDate() === day && selectedDate.getMonth() === currentMonth
                  ? styles.selectedDayButton
                  : null,
              ]}
              onPress={() => handleDateSelect(day, currentMonth)}
            >
              <Text
                style={[
                  styles.dayText,
                  selectedDate?.getDate() === day && selectedDate.getMonth() === currentMonth
                    ? styles.selectedDayText
                    : null,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderYearPicker = () => {
    return (
      <Modal
        transparent={true}
        animationType="slide"
        visible={showYearPicker}
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <FlatList
              data={yearsToDisplay}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.yearOption}
                  onPress={() => handleYearSelect(item)}
                >
                  <Text style={styles.yearText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowYearPicker(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
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
            <View style={styles.pickerContainer}>
              {renderCalendar()}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={toggleDatePicker}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {renderYearPicker()}
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
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: width * 0.9,
    maxHeight: height * 0.75,
  },
  monthContainer: {
    alignItems: 'center',
    marginVertical: 5,
    width: '100%',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  monthName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: '#007bff',
  },
  dayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    padding: 10,
    width: 38,
    height: 38,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  selectedDayButton: {
    backgroundColor: '#007bff',
  },
  dayText: {
    fontSize: 16,
  },
  selectedDayText: {
    color: 'white',
  },
  yearOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  yearText: {
    fontSize: 25,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
  },
});

export default CustomDatePicker;
