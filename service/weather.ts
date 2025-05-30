import axios from 'axios';
import { OPENWEATHER_API_KEY } from 'constant';
import { create } from 'zustand';
import * as Location from 'expo-location';

// You'll need to sign up for a free API key at https://openweathermap.org/
// and add it to your constants file

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  city: string;
}

interface WeatherStore {
  weather: WeatherData | null;
  loadingWhether: boolean;
  errorWhether: string | null;
  fetchWeather: () => Promise<void>;
}

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric', // Use metric units (Celsius)
        lang: 'id', // Get weather descriptions in Bahasa Indonesia
      },
    });

    const data = response.data;
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

export const useWhetherStore = create<WeatherStore>((set) => ({
  weather: null,
  loadingWhether: false,
  errorWhether: null,
  fetchWeather: async () => {
    set({ loadingWhether: true, errorWhether: null });
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        set({ errorWhether: 'Permission to access location was denied' });
        return;
      }

      try {
        // Get current location
        let location = await Location.getCurrentPositionAsync({});

        // Fetch weather data
        const weatherData = await fetchWeather(location.coords.latitude, location.coords.longitude);
        set({ weather: weatherData, errorWhether: null });
      } catch (error) {
        console.error('Error fetching data:', error);
        set({ errorWhether: 'Failed to fetch location or weather data' });
      } finally {
        set({ loadingWhether: false });
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      set({ weather: null, errorWhether: 'Failed to load weather data' });
    } finally {
      set({ loadingWhether: false });
    }
  },
}));
