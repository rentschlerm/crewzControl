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
  // M.G. 10/1/2025 - Added width: '100%' to make container occupy full width for proper alignment
  container: { marginBottom: 10, width: '100%' },
  label: { 
    // M.G. 10/1/2025 - Responsive flexbox layout to match main input fields alignment
    flex: 0.4, // Takes 40% of available width
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
    marginRight: 10,
  },
  showCalendarButton: {
    // M.G. 10/1/2025 - Responsive flexbox layout to match main input fields alignment
    flex: 0.6, // Takes 60% of available width
    height: 40,
    backgroundColor: '#20D5FF',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    // M.G. 10/1/2025 - Added width: '100%' and removed problematic justifyContent/width for proper alignment
    width: '100%',
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
