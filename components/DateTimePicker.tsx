import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextStyle } from 'react-native';
import { Calendar } from 'react-native-calendars';

interface DateTimePickerProps {
  label: string;
  initialDates: string | undefined; // Blackout dates from API (comma-separated)
  onChange: (updatedDates: string[]) => void; // Passes an array of strings to parent
  labelStyle?: TextStyle;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  initialDates,
  labelStyle,
  onChange,
}) => {
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // 🔹 Initialize blackout dates from API response
  useEffect(() => {
    if (initialDates) {
      const formattedDates = initialDates
        .split(',')
        .map(date => date.trim())
        .filter(date => /^\d{2}\/\d{2}\/\d{4}$/.test(date)); // ✅ Only valid MM/DD/YYYY
      setSelectedDates([...new Set(formattedDates)]); // 🔥 Ensure unique dates
    }
  }, [initialDates]);

  // 🔹 Handles selecting/deselecting dates
  const handleDayPress = (day: { dateString: string }) => {
    const selectedDate = new Date(day.dateString);
    const today = new Date();

    if (selectedDate < today) {
      alert('You cannot select past dates.');
      return;
    }

    // Convert to MM/DD/YYYY
    const formattedDate = `${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${String(
      selectedDate.getDate()
    ).padStart(2, '0')}/${selectedDate.getFullYear()}`;

    setSelectedDates(prevDates => {
      let updatedDates;
      if (prevDates.includes(formattedDate)) {
        // 🔸 Remove if already selected
        updatedDates = prevDates.filter(date => date !== formattedDate);
      } else {
        // 🔸 Add if not present (ensuring uniqueness)
        updatedDates = [...new Set([...prevDates, formattedDate])];
      }

      onChange(updatedDates); // Pass updated array to parent
      return updatedDates;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>

      {/* 📅 Show Calendar Button */}
      <TouchableOpacity
        style={styles.showCalendarButton}
        onPress={() => setIsCalendarVisible(true)}
      >
        <Text style={styles.showCalendarText}>Show Calendar</Text>
      </TouchableOpacity>
      </View>
      {/* 📅 Calendar Modal */}
      {isCalendarVisible && (
        <Modal transparent animationType="slide" visible={isCalendarVisible}>
          <View style={styles.modalContainer}>
            <Calendar
              minDate={new Date().toISOString().split('T')[0]} // Disable past dates
              enableSwipeMonths={true} // 🔹 Swipeable calendar
              markedDates={selectedDates.reduce((acc, date) => {
                if (date.includes('/')) {
                  const [month, day, year] = date.split('/');
                  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                  acc[isoDate] = { selected: true, marked: true };
                }
                return acc;
              }, {} as Record<string, { selected: boolean; marked: boolean }>)}
              onDayPress={handleDayPress} // Select/Deselect dates
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsCalendarVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, marginLeft: 71, },
  showCalendarButton: {
    backgroundColor: '#20D5FF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  row: {
    // flexDirection: 'row', // Arrange label and input horizontally
    alignItems: 'center', // Vertically align elements
    // marginBottom: 10,
    flexDirection: 'row', // Keep the label and date picker in the same row
    justifyContent: 'space-between', // Align the items to the right
    width: '100%', // Ensure the row takes full width
  },
  showCalendarText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  closeButton: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: { color: 'white', fontSize: 16 },
});

export default DateTimePicker;
