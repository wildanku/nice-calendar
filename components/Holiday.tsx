import { useEffect, useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { Holiday as HolidayType, useCalendarStore } from 'service/calendar';

const Holiday = () => {
  const [todayHolidays, setTodayHolidays] = useState<HolidayType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { holidays } = useCalendarStore();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        // Fetch holidays
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD

        // Find all holidays for today
        const todaysHolidays = holidays.filter((h) => {
          const holidayDate = h.date.split('T')[0]; // Handle if date includes time part
          return holidayDate === todayString;
        });

        setTodayHolidays(todaysHolidays);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [holidays]);

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
