import { useEffect, useContext } from 'react';
import { Platform, PermissionsAndroid, Alert, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AuthContext } from '../context/AuthContext';
import { registerPushToken } from '../services/pushNotificationService';
import { NotificationContext } from '../context/NotificationContext';
import { registerForPushNotificationsAsync, showNativeNotification } from '../services/nativeNotificationService';
import { navigationRef } from '../navigation/navigationRef';

const isFirebaseAvailable = !!NativeModules.RNFBAppModule;

// Helper to safely fetch the messaging module
const getMessaging = () => {
  if (isFirebaseAvailable) {
    try {
      return require('@react-native-firebase/messaging').default;
    } catch (e) {
      console.warn('FCM: Failed to import @react-native-firebase/messaging:', e);
    }
  }
  return null;
};

/**
 * Custom hook to initialize Firebase Cloud Messaging (FCM).
 * Handles runtime permissions, retrieves the device token, sets up foreground listeners,
 * and automatically registers the token to the backend when a user is authenticated.
 */
export const usePushNotifications = () => {
  const { user } = useContext(AuthContext);
  const { fetchAnnouncements } = useContext(NotificationContext);

  // 1. Request Permission
  const requestUserPermission = async () => {
    if (!isFirebaseAvailable) return false;
    try {
      const messaging = getMessaging();
      if (!messaging) return false;

      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
      } else if (Platform.OS === 'android' && Platform.Version >= 33) {
        // Request POST_NOTIFICATIONS runtime permission on Android 13+ (API 33+)
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // Android < 13 gets permissions automatically on installation
    } catch (error) {
      console.warn('FCM: Failed to request notification permissions:', error);
      return false;
    }
  };

  // 2. Fetch and register token
  const fetchAndRegisterToken = async () => {
    if (!isFirebaseAvailable) return null;
    try {
      const messaging = getMessaging();
      if (!messaging) return null;

      // Check user preferences first
      const storedPreference = await AsyncStorage.getItem('push_notifications_enabled');
      if (storedPreference === 'false') {
        console.log('FCM: Push notifications are disabled in user settings.');
        return null;
      }

      const hasPermission = await requestUserPermission();
      if (!hasPermission) {
        console.log('FCM: User did not grant push notification permission.');
        return null;
      }

      // Get device FCM token
      const token = await messaging().getToken();
      if (token) {
        console.log('FCM Device Token:', token);
        
        // If a user is logged in, register it with the backend
        if (user && user.id) {
          await registerPushToken(token, Platform.OS);
          console.log('FCM: Successfully registered push token to backend for user:', user.id);
        }
        return token;
      }
    } catch (error) {
      console.warn('FCM: Error retrieving or registering token:', error);
    }
    return null;
  };

  useEffect(() => {
    if (!isFirebaseAvailable) {
      console.log('FCM: Firebase Native Modules are not linked. Push notifications are disabled in this environment (e.g. Expo Go).');
      return;
    }

    const messaging = getMessaging();
    if (!messaging) return;

    // Fetch and register token on mount or when the user logged-in state changes
    if (user && user.id) {
      registerForPushNotificationsAsync();
      fetchAndRegisterToken();
    }

    // Listen to token refresh events
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM: Token refreshed:', newToken);
      if (user && user.id) {
        try {
          await registerPushToken(newToken, Platform.OS);
          console.log('FCM: Successfully registered refreshed push token to backend.');
        } catch (error) {
          console.warn('FCM: Failed to register refreshed token on backend:', error);
        }
      }
    });

    // 3. Foreground Message Listener
    const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      if (!user) {
        console.log('FCM: Foreground message ignored because user is logged out.');
        return;
      }
      console.log('FCM: Foreground message received:', remoteMessage);
      
      const title = remoteMessage.notification?.title || 'New Announcement';
      const body = remoteMessage.notification?.body || '';

      // Instantly trigger announcement reload so the dynamic popup banner shows up immediately
      void fetchAnnouncements();

      // Dispatch a native system notification in the status bar/lock screen notification center
      void showNativeNotification(title, body, remoteMessage.data);
    });

    // 4. Handle native local status bar notification clicks
    const nativeNotificationResponseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('FCM: Native status bar notification clicked:', response);
      if (!user) {
        console.log('FCM: Native notification click ignored because user is logged out.');
        return;
      }
      if (navigationRef.isReady()) {
        navigationRef.navigate('Notifications');
      }
    });

    // 5. Handle FCM notification clicks that open the app from background state
    const unsubscribeNotificationOpen = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('FCM: Notification caused app to open from background state:', remoteMessage);
      if (!user) {
        console.log('FCM: Notification background click ignored because user is logged out.');
        return;
      }
      if (navigationRef.isReady()) {
        navigationRef.navigate('Notifications');
      }
    });

    // Check if the app was opened from a completely killed state via an FCM notification click
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('FCM: Notification caused app to open from quit state:', remoteMessage);
          setTimeout(() => {
            if (!user) {
              console.log('FCM: Notification quit-state click ignored because user is logged out.');
              return;
            }
            if (navigationRef.isReady()) {
              navigationRef.navigate('Notifications');
            }
          }, 800);
        }
      })
      .catch((error) => console.warn('FCM: Error getting initial notification:', error));

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeOnMessage();
      unsubscribeNotificationOpen();
      nativeNotificationResponseSubscription.remove();
    };
  }, [user]);

  return {
    requestUserPermission,
    getFcmToken: fetchAndRegisterToken,
  };
};
