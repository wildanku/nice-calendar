import axios from 'axios';
import { GOOGLE_API_KEY } from 'constant';
import { create } from 'zustand';

export interface Holiday {
  name: string;
  date: string;
  description?: string;
}

interface CalendarStore {
  holidays: Holiday[];
  selectedDate: Date;
  isLoading: boolean;
  getHolidays: () => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setIsLoading: (loading: boolean) => void;
}

export const fetchIndonesianHolidays = async (year: number): Promise<Holiday[]> => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/calendar/v3/calendars/id.indonesian%23holiday%40group.v.calendar.google.com/events`,
      {
        params: {
          key: GOOGLE_API_KEY,
          timeMin: `${year}-01-01T00:00:00Z`,
          timeMax: `${year}-12-31T23:59:59Z`,
          singleEvents: true,
          orderBy: 'startTime',
        },
      }
    );

    return response.data.items.map((item: any) => ({
      name: item.summary,
      date: item.start.date,
      description: item.description || '',
    }));
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return [];
  }
};

export const useCalendarStore = create<CalendarStore>((set) => ({
  holidays: [] as Holiday[],
  selectedDate: new Date(),
  isLoading: true,
  getHolidays: async () => {
    const currentYear = new Date().getFullYear();
    const fetchedHolidays = await fetchIndonesianHolidays(currentYear);
    set({ holidays: fetchedHolidays, isLoading: false });
  },
  setSelectedDate: (date: Date) => set({ selectedDate: date }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
}));
