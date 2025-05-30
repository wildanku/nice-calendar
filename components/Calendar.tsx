import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Holiday, useCalendarStore } from 'service/calendar';
import IonIons from 'react-native-vector-icons/Ionicons';

interface CalendarProps {
  currentDate: Date;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);

  const { holidays } = useCalendarStore();

  // Get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  // Check if a date has a holiday - FIX: Handle timezone issues
  const isHoliday = (date: Date): Holiday | null => {
    // Format the date to YYYY-MM-DD without timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // Find matching holiday
    const holiday = holidays.find((h) => {
      // If we still have timezone issues, normalize both formats
      const hDate = h.date.split('T')[0]; // Handle if date includes time part
      return hDate === dateString;
    });

    return holiday || null;
  };

  // Is the date today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Format to short day names
  const renderDayNames = () => {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    return (
      <View className="mb-2 flex-row">
        {dayNames.map((day, index) => (
          <View key={index} className="flex-1 items-center py-1">
            <Text className="text-xs font-bold text-gray-800">{day}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render the calendar grid
  const renderCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // Get days from previous month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);

    // Add cells for days from previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevMonthDay = daysInPrevMonth - firstDayOfMonth + i + 1;
      const date = new Date(prevMonthYear, prevMonth, prevMonthDay);
      const holiday = isHoliday(date);
      const textColor = holiday ? 'text-red-300' : 'text-gray-500';

      days.push(
        <TouchableOpacity
          key={`prev-${prevMonthDay}`}
          className="flex-1 items-center justify-center opacity-40"
          onPress={() => {
            setSelectedDate(date);
          }}>
          <View className="h-8 w-8 items-center justify-center">
            <Text className={`text-sm ${textColor}`}>{prevMonthDay}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Add cells for each day of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const holiday = isHoliday(date);
      const todayStyle = isToday(date) ? 'bg-blue-100 rounded-full' : '';
      const textColor = holiday ? 'text-red-600 font-bold' : 'text-gray-800';

      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          className="flex-1 items-center justify-center"
          onPress={() => setSelectedDate(date)}>
          <View className={`h-8 w-8 items-center justify-center ${todayStyle}`}>
            <Text className={`text-sm ${textColor}`}>{day}</Text>
            {holiday && <View className="absolute bottom-0 h-1 w-1 rounded-full bg-red-600" />}
          </View>
        </TouchableOpacity>
      );
    }

    // Calculate how many next month days we need
    const totalDaysShown = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
    const nextMonthDaysToShow = totalDaysShown - (firstDayOfMonth + daysInMonth);

    // Add cells for days from next month
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;

    for (let day = 1; day <= nextMonthDaysToShow; day++) {
      const date = new Date(nextMonthYear, nextMonth, day);
      const holiday = isHoliday(date);
      const textColor = holiday ? 'text-red-300' : 'text-gray-500';

      days.push(
        <TouchableOpacity
          key={`next-${day}`}
          className="flex-1 items-center justify-center opacity-40"
          onPress={() => {
            setSelectedDate(date);
          }}>
          <View className="h-8 w-8 items-center justify-center">
            <Text className={`text-sm ${textColor}`}>{day}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Group days into weeks (rows of 7)
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7);
      weeks.push(
        <View key={`week-${i}`} className="flex-row py-1">
          {week}
        </View>
      );
    }

    return weeks;
  };

  // Format month and year
  const formatMonthYear = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
    };
    return selectedDate.toLocaleDateString('id-ID', options);
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const previousMonth = new Date(selectedDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setSelectedDate(previousMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(selectedDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setSelectedDate(nextMonth);
  };

  return (
    <View className="h-full p-4">
      {/* Calendar Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={goToPreviousMonth}>
          <IonIons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold">{formatMonthYear()}</Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <IonIons name="arrow-forward" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Days of week header */}
      {renderDayNames()}

      {/* Calendar grid */}
      <View className="flex-1">{renderCalendarDays()}</View>

      {/* Current holidays this month */}
      <ScrollView className="mt-2 max-h-24">
        {holidays
          .filter((holiday) => {
            // Fix filtering by normalizing date formats
            const holidayDateParts = holiday.date.split('-');
            if (holidayDateParts.length < 3) return false;

            const year = parseInt(holidayDateParts[0], 10);
            const month = parseInt(holidayDateParts[1], 10) - 1; // Convert to 0-based month

            return month === selectedDate.getMonth() && year === selectedDate.getFullYear();
          })
          .map((holiday, index) => {
            // Get date parts directly from holiday.date string
            const [year, month, day] = holiday.date.split('-').map(Number);
            // day will be the date number to display (with no timezone issues)

            return (
              <View key={index} className="flex-row items-center py-1">
                <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-red-100">
                  <Text className="text-xs font-bold text-red-600">{day}</Text>
                </View>
                <Text className="flex-1 text-xs font-medium text-gray-700">{holiday.name}</Text>
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
};

export default Calendar;
