import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { useWhetherStore } from 'service/weather';
import IonIons from 'react-native-vector-icons/Ionicons';

const Weather = () => {
  const { weather, errorWhether, fetchWeather, loadingWhether } = useWhetherStore();

  return (
    <View className="w-full">
      {errorWhether ? (
        <Text className="text-center text-white opacity-80">{errorWhether}</Text>
      ) : weather ? (
        <View className="flex-row items-center justify-between ">
          {loadingWhether ? (
            <View className="flex-1 flex-row items-center justify-center">
              <View className="flex-row items-center gap-4">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white opacity-80">Sedang meramal cuaca untuk kamu</Text>
              </View>
            </View>
          ) : (
            <>
              <View className="flex-1 flex-row items-center">
                {/* Weather icon and temperature */}
                <View className="mr-3 flex-row items-center">
                  <Image
                    source={{
                      uri: `https://openweathermap.org/img/wn/${weather.icon}@4x.png`,
                    }}
                    className="h-[90px] w-[90px]"
                  />
                  <Text className="-ml-2 text-5xl font-bold text-white">
                    {weather.temperature}°C
                  </Text>
                </View>

                {/* Weather description and details */}
                <View className="flex-1">
                  <Text className="text-xl font-semibold capitalize text-white">
                    {weather.description}
                  </Text>
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center">
                      <Text className="text-base text-white opacity-80">Feels like: </Text>
                      <Text className="text-base font-semibold text-white">
                        {weather.feelsLike}°C
                      </Text>
                    </View>
                    <View className="flex-row items-center ">
                      <Text className="text-base text-white opacity-80">Humidity: </Text>
                      <Text className="text-base font-semibold text-white">
                        {weather.humidity}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Refresh button */}
          <TouchableOpacity
            className="rounded-full bg-white/20 p-3"
            onPress={fetchWeather}
            activeOpacity={0.7}>
            <IonIons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <ActivityIndicator size="small" color="#fff" />
      )}
    </View>
  );
};

export default Weather;
