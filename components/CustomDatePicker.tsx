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

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value = '',
  onChange,
  placeholder = 'Select',
  readOnly = false,
  labelStyle,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [showYearPicker, setShowYearPicker] = useState(false);

  const yearsToDisplay = Array.from({ length: 15 }, (_, index) => currentYear - 7 + index);

  const toggleDatePicker = () => {
    if (!readOnly) {
      setShowPicker(!showPicker);
    }
  };

  const daysInMonth = (month: number, year: number) =>
    new Date(year, month + 1, 0).getDate();

  const handleDateSelect = (day: number, month: number) => {
    const newDate = new Date(currentYear, month, day);
    setSelectedDate(newDate);
    setShowPicker(false);
    const formattedDate = formatDate(newDate); // Format the selected date
    onChange(formattedDate); // Pass the formatted date to the parent
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
          <Text>{value || placeholder}</Text>
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
    marginBottom: 20,
    marginVertical: 8,
  },
  row: {
    // flexDirection: 'row', // Arrange label and input horizontally
    alignItems: 'center', // Vertically align elements
    // marginBottom: 10,
    flexDirection: 'row', // Keep the label and date picker in the same row
    justifyContent: 'space-between', // Align the items to the right
    width: '100%', // Ensure the row takes full width
  },
  label: {
    marginRight: 8, // Space between label and input
    fontSize: 14,
    fontWeight: 'bold',
    justifyContent: 'space-between',
    flex: 1,
  },
  input: {
    height: 40,
    minWidth: 30,
    maxWidth: '40%',
    width: 'auto',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 18,
    textAlign: 'right',
    paddingVertical: 8, 
    lineHeight: 18,
    flex: 1,
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
