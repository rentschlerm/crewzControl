import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CustomDateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  labelStyle?: object;
  containerStyle?: object;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  label,
  value,
  onChange,
  labelStyle,
  containerStyle,
}) => {
  const [isPickerVisible, setPickerVisible] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setPickerVisible(false); // Hide the picker
    if (selectedDate) {
      onChange(selectedDate); // Update the date
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <TouchableOpacity
        style={styles.dateValueContainer}
        onPress={() => setPickerVisible(true)}
      >
        <Text style={styles.dateValue}>
          {value
            ? value.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Select a date'}
        </Text>
      </TouchableOpacity>
      {isPickerVisible && (
        <DateTimePicker
          value={value || new Date()} // Use selected date or fallback to today
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  dateValueContainer: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateValue: {
    fontSize: 16,
    color: '#555',
  },
});

export default CustomDateTimePicker;
