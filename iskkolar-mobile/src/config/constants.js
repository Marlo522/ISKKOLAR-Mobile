import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getLocalhostIp = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':').shift();
  }
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

export const API_URL = 'https://iskkolar-backend.onrender.com/api';



