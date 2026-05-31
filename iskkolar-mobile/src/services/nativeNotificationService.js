import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 1. Configure foreground notification presentation rules
// By default, if the app is in the foreground, we still want the OS system notification
// to display and play a sound to alert the user outside our in-app custom banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request system permissions for notifications and configure Android notification channels.
 */
export const registerForPushNotificationsAsync = async () => {
  let isGranted = false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    isGranted = finalStatus === 'granted';

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4f5ec4',
      });
    }
  } catch (error) {
    console.warn('NativeNotificationService: Failed to configure permissions/channels:', error);
  }
  return isGranted;
};

/**
 * Dispatch a native system notification immediately.
 * @param {string} title 
 * @param {string} body 
 * @param {object} payload 
 */
export const showNativeNotification = async (title, body, payload = {}) => {
  try {
    // Ensure permission is granted before trying to present the system alert
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const granted = await registerForPushNotificationsAsync();
      if (!granted) return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: title || 'Iskkolar Mobile Alert',
        body: body || '',
        data: payload,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // trigger immediately
    });
    
    return identifier;
  } catch (error) {
    console.warn('NativeNotificationService: Failed to present native notification:', error);
    return null;
  }
};
