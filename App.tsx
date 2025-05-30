import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StatusBar,
  ImageBackground,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

import './global.css';
import Weather from 'components/Weather';
import Holiday from 'components/Holiday';
import Calendar from 'components/Calendar';
import { useCalendarStore } from 'service/calendar';
import { useWhetherStore } from 'service/weather';
import { UNSPLASH } from 'constant';

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = UNSPLASH.ACCESS_KEY;
const UNSPLASH_COLLECTION_ID = '317099';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [backgroundImage, setBackgroundImage] = useState('');
  const [isLoadingBackground, setIsLoadingBackground] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { getHolidays, holidays } = useCalendarStore();
  const { fetchWeather } = useWhetherStore();

  // Fetch background from Unsplash
  const fetchBackgroundImage = async (forceRefresh = false) => {
    try {
      setIsLoadingBackground(true);

      // Get today's date in YYYY-MM-DD format for caching
      const today = new Date().toISOString().split('T')[0];

      // Check if we already have an image for today
      const cachedImageData = await AsyncStorage.getItem(`background_${today}`);

      if (cachedImageData && !forceRefresh) {
        console.log('Using cached background image');
        setBackgroundImage(JSON.parse(cachedImageData).imageUrl);
      } else {
        console.log('Fetching new background image from Unsplash');

        // Fetch a random nature image from Unsplash
        const response = await fetch(
          `https://api.unsplash.com/photos/random?collections=${UNSPLASH_COLLECTION_ID}&orientation=landscape`,
          {
            headers: {
              Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch from Unsplash');
        }

        const data = await response.json();
        const imageUrl = data.urls.regular;

        // Save to cache
        await AsyncStorage.setItem(`background_${today}`, JSON.stringify({ imageUrl }));

        // Update state
        setBackgroundImage(imageUrl);
      }
    } catch (error) {
      console.error('Error fetching background:', error);
      // Use default background if fetch fails
      setBackgroundImage('');
    } finally {
      setIsLoadingBackground(false);
    }
  };

  // Check if we need to update the background (at midnight)
  const scheduleBackgroundRefresh = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Time until midnight in ms
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    console.log(
      `Scheduling background refresh in ${Math.floor(timeUntilMidnight / 60000)} minutes`
    );

    // Schedule update at midnight
    const timer = setTimeout(() => {
      fetchBackgroundImage();
      // Recursively setup the next day's timer
      scheduleBackgroundRefresh();
    }, timeUntilMidnight);

    return timer;
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      // Refresh all data
      await Promise.all([
        fetchWeather(),
        getHolidays(),
        fetchBackgroundImage(true), // Force new background
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchWeather, getHolidays]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch and schedule background image refresh
  useEffect(() => {
    fetchBackgroundImage();
    const midnightTimer = scheduleBackgroundRefresh();

    return () => clearTimeout(midnightTimer);
  }, []);

  // Format time in HH:MM:SS
  const formatTime = () => {
    // Get hours, minutes, and seconds with leading zeros
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');

    // Return with custom spacing around colons
    return `${hours}:${minutes}:${seconds}`;
  };

  // Format day of month (tanggal)
  const formatDayOfMonth = () => {
    return currentDate.getDate().toString();
  };

  // Format month name only
  const formatMonth = () => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
    };
    return currentDate.toLocaleDateString('id-ID', options);
  };

  // Format year only
  const formatYear = () => {
    return currentDate.getFullYear().toString();
  };

  // Format day name only
  const formatDayName = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
    };
    return currentDate.toLocaleDateString('id-ID', options);
  };

  // Check if today is a holiday or Sunday
  const isTodayHoliday = () => {
    // Check if it's Sunday (0 = Sunday, 1 = Monday, etc.)
    const isSunday = currentDate.getDay() === 0;

    // Return true immediately if it's Sunday
    if (isSunday) {
      return true;
    }

    // Otherwise check for holiday as before
    if (!holidays || holidays.length === 0) return false;

    // Format today's date as YYYY-MM-DD
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    // Check if today's date matches any holiday date
    return holidays.some((holiday) => {
      // Handle both date formats (with or without time component)
      const holidayDate = holiday.date.split('T')[0];
      return holidayDate === todayString;
    });
  };

  useEffect(() => {
    StatusBar.setHidden(true);

    return () => {
      // Make status bar visible again when component unmounts
      StatusBar.setHidden(false);
    };
  }, []);

  useEffect(() => {
    // Fetch holidays when the app starts
    getHolidays();
  }, [getHolidays]);

  useEffect(() => {
    // Fetch weather immediately when component mounts
    fetchWeather();

    // Then fetch every 30 minutes (30 * 60 * 1000 milliseconds)
    const weatherInterval = setInterval(
      () => {
        fetchWeather();
        console.log('Refreshing weather data');
      },
      30 * 60 * 1000
    );

    // Clear interval when component unmounts
    return () => clearInterval(weatherInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      // For Android
      import('react-native').then(({ NativeModules }) => {
        const { KeepScreenOn } = NativeModules;
        if (KeepScreenOn) {
          KeepScreenOn.activate();
        }
      });

      return () => {
        import('react-native').then(({ NativeModules }) => {
          const { KeepScreenOn } = NativeModules;
          if (KeepScreenOn) {
            KeepScreenOn.deactivate();
          }
        });
      };
    } else if (Platform.OS === 'ios') {
      // For iOS
      import('react-native').then(({ NativeModules }) => {
        const { ScreenManager } = NativeModules;
        if (ScreenManager) {
          ScreenManager.keepScreenOn(true);
        }
      });

      return () => {
        import('react-native').then(({ NativeModules }) => {
          const { ScreenManager } = NativeModules;
          if (ScreenManager) {
            ScreenManager.keepScreenOn(false);
          }
        });
      };
    }
  }, []);

  // Get the appropriate text color class based on holiday status
  const dateTextColorClass = isTodayHoliday() ? 'text-red-500 stroke-white' : 'text-white';

  return (
    <>
      <ImageBackground
        source={
          backgroundImage ? { uri: backgroundImage } : require('./assets/backgrounds/default.jpg')
        }
        className="h-full w-full"
        resizeMode="cover">
        <BlurView
          intensity={20}
          tint="dark"
          className="h-full w-full"
          experimentalBlurMethod="dimezisBlurView">
          <SafeAreaView className="flex-1">
            <ScrollView
              className="h-full w-full"
              contentContainerStyle={{ flexGrow: 1 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#ffffff"
                  title="Refreshing..."
                  titleColor="#ffffff"
                />
              }>
              <View className="flex-1 items-center justify-center bg-black/20 p-5">
                <View className="mb-12 w-full flex-row gap-3 p-8">
                  <View className="w-[64%] rounded-3xl bg-black/40 p-8">
                    <Weather />
                    <View className="items-star -mt-4 flex-row">
                      <Text className={`text-left text-[100px] font-bold ${dateTextColorClass}`}>
                        {`${formatDayName()},`}
                      </Text>
                      <View className="ml-4 flex-row items-center justify-center gap-3">
                        <Text className={`text-[100px] font-bold ${dateTextColorClass}`}>
                          {`${formatDayOfMonth()}`}
                        </Text>
                        <View>
                          <Text className={`text-[35px] font-bold ${dateTextColorClass}`}>
                            {`${formatMonth()}`}
                          </Text>
                          <Text className={`-mt-2 text-[35px] font-bold ${dateTextColorClass}`}>
                            {`${formatYear()}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text className="-mt-5 text-[120px] font-bold text-white">{formatTime()}</Text>
                  </View>
                  <View className="h-[400px] w-[35%] rounded-3xl bg-white/80">
                    <Calendar currentDate={new Date()} />
                  </View>
                </View>
              </View>
            </ScrollView>
            {/* Holiday section */}
            <Holiday />
          </SafeAreaView>
        </BlurView>
      </ImageBackground>
    </>
  );
}
