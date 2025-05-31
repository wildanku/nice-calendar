import { useEffect, useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { Holiday as HolidayType, useCalendarStore } from 'service/calendar';

const Holiday = () => {
  const [todayHolidays, setTodayHolidays] = useState<HolidayType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDateString, setCurrentDateString] = useState('');

  const { holidays } = useCalendarStore();

  // Update the current date string every minute
  useEffect(() => {
    // Set initial date string
    const today = new Date();
    setCurrentDateString(today.toISOString().split('T')[0]);

    // Check for date changes every minute
    const dateCheckInterval = setInterval(() => {
      const newDate = new Date();
      const newDateString = newDate.toISOString().split('T')[0];

      // Only update if the date has changed
      if (newDateString !== currentDateString) {
        setCurrentDateString(newDateString);
      }
    }, 60000); // Check every minute

    return () => clearInterval(dateCheckInterval);
  }, [currentDateString]);

  // Process holidays when either the holidays array or the date changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        // Use the tracked date string instead of creating a new Date
        // This ensures consistency with the date tracking logic

        // Find all holidays for today
        const todaysHolidays = holidays.filter((h) => {
          const holidayDate = h.date.split('T')[0]; // Handle if date includes time part
          return holidayDate === currentDateString;
        });

        setTodayHolidays(todaysHolidays);
        console.log(`Checking holidays for ${currentDateString}, found: ${todaysHolidays.length}`);
      } catch (error) {
        console.error('Error processing holidays:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only run if we have the date string and holidays data
    if (currentDateString && holidays) {
      loadData();
    }
  }, [holidays, currentDateString]);

  return (
    <>
      {todayHolidays.length > 0 && (
        <View className="absolute bottom-5 left-0 right-0 z-10 p-12">
          <ScrollView>
            {todayHolidays.map((holiday, index) => (
              <View
                key={`holiday-${index}`}
                className={`w-full rounded-xl ${index > 0 ? 'mt-3' : ''} bg-yellow-500/80 p-4`}>
                <Text className="text-center text-2xl font-bold text-white">
                  ✨ {holiday.name} ✨
                </Text>
                {holiday.description && (
                  <Text className="mt-1 text-center text-base text-white opacity-90">
                    {holiday.description}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

export default Holiday;
