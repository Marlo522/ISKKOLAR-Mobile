import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';
import { getScholarAnnouncements } from '../services/announcementService';
import { showNativeNotification } from '../services/nativeNotificationService';
import { navigationRef } from '../navigation/AppNavigator';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [archivedIds, setArchivedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeBanner, setActiveBanner] = useState(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const loadedAnnouncementsRef = useRef([]);
  const hasShownInitialBannerRef = useRef(false);

  // Use refs to avoid re-triggering fetchAnnouncements when read/archive lists change
  const readIdsRef = useRef([]);
  const archivedIdsRef = useRef([]);

  useEffect(() => {
    readIdsRef.current = readIds;
  }, [readIds]);

  useEffect(() => {
    archivedIdsRef.current = archivedIds;
  }, [archivedIds]);

  // Load readIds and archivedIds from AsyncStorage
  const loadReadIds = useCallback(async () => {
    try {
      const userId = user?.id || user?.uid || user?.userId || user?.user_id;
      if (user && userId) {
        
        // Load Read IDs
        const storedRead = await AsyncStorage.getItem(`read_announcements_${userId}`);
        if (storedRead) {
          const parsed = JSON.parse(storedRead);
          setReadIds(parsed);
          readIdsRef.current = parsed;
        } else {
          setReadIds([]);
          readIdsRef.current = [];
        }

        // Load Archived IDs
        const storedArchived = await AsyncStorage.getItem(`archived_announcements_${userId}`);
        if (storedArchived) {
          const parsed = JSON.parse(storedArchived);
          setArchivedIds(parsed);
          archivedIdsRef.current = parsed;
        } else {
          setArchivedIds([]);
          archivedIdsRef.current = [];
        }
      } else {
        setReadIds([]);
        setArchivedIds([]);
        readIdsRef.current = [];
        archivedIdsRef.current = [];
      }
    } catch (e) {
      console.warn("NotificationContext: Failed to load read or archived announcement IDs", e);
    }
  }, [user]);

  // Slide down banner popup animation
  const showBannerPopup = useCallback((announcement) => {
    setActiveBanner(announcement);
    // Slide down to 50px (comfortably below header status bar)
    Animated.spring(slideAnim, {
      toValue: 50,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    // Automatically slide back up after 6 seconds
    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setActiveBanner(null);
      });
    }, 6000);
  }, [slideAnim]);

  // Fetch announcements from server
  const fetchAnnouncements = useCallback(async () => {
    if (!user) return;

    // Guard: ensure we actually have a token before hitting the API
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      if (!parsed?.token) return; // No token yet — silently skip
    } catch (_) {
      return; // AsyncStorage error — skip this cycle
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getScholarAnnouncements();
      
      const allAnnouncements = data || [];

      // Show banner for the latest unread announcement on initial startup load
      if (!hasShownInitialBannerRef.current) {
        const unreadItems = allAnnouncements.filter(
          item => !readIdsRef.current.includes(item.id) &&
                  !archivedIdsRef.current.includes(item.id)
        );
        if (unreadItems.length > 0) {
          // Show the most recent unread announcement
          showBannerPopup(unreadItems[0]);

          // Dispatch a native system notification
          const item = unreadItems[0];
          const cleanTitle = item.title?.replace(/<[^>]+>/g, '').replace(/[\*_~]{1,2}/g, '') || '';
          const cleanBody = (item.description || item.content)?.replace(/<[^>]+>/g, '').replace(/[\*_~]{1,2}/g, '').trim() || '';
          void showNativeNotification(`New Announcement: ${cleanTitle}`, cleanBody, { announcementId: item.id });
        }
        hasShownInitialBannerRef.current = true;
      } else {
        // Compare to detect new arrivals while app is active
        const newItems = allAnnouncements.filter(
          item => !loadedAnnouncementsRef.current.includes(item.id) &&
                  !readIdsRef.current.includes(item.id) &&
                  !archivedIdsRef.current.includes(item.id)
        );
        if (newItems.length > 0) {
          showBannerPopup(newItems[0]);

          // Dispatch a native system notification for the new arrival
          const item = newItems[0];
          const cleanTitle = item.title?.replace(/<[^>]+>/g, '').replace(/[\*_~]{1,2}/g, '') || '';
          const cleanBody = (item.description || item.content)?.replace(/<[^>]+>/g, '').replace(/[\*_~]{1,2}/g, '').trim() || '';
          void showNativeNotification(`New Announcement: ${cleanTitle}`, cleanBody, { announcementId: item.id });
        }
      }

      // Sync refs and state
      loadedAnnouncementsRef.current = allAnnouncements.map(a => a.id);
      setAnnouncements(allAnnouncements);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [user, showBannerPopup]);

  // Mark an announcement as read
  const markAsRead = useCallback(async (id) => {
    if (!user) return;
    const userId = user.id || user.uid || user.userId || user.user_id;
    if (!userId) return;

    try {
      if (readIds.includes(id)) return;
      const updated = [...readIds, id];
      setReadIds(updated);
      await AsyncStorage.setItem(`read_announcements_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn("NotificationContext: Failed to mark announcement as read", e);
    }
  }, [user, readIds]);

  // Mark all current announcements as read
  const markAllAnnouncementsAsRead = useCallback(async () => {
    if (!user) return;
    const userId = user.id || user.uid || user.userId || user.user_id;
    if (!userId) return;

    try {
      console.log("markAllAnnouncementsAsRead triggered for userId:", userId);
      console.log("Context announcements in markAll:", announcements);
      console.log("Current readIds:", readIds);
      console.log("Current archivedIds:", archivedIds);

      const unreadIds = announcements
        .filter((item) => !readIds.includes(item.id) && !archivedIds.includes(item.id))
        .map((item) => item.id);

      console.log("Computed unread IDs to mark:", unreadIds);

      if (unreadIds.length === 0) {
        console.log("No unread IDs found, returning early.");
        return;
      }

      const updated = [...readIds, ...unreadIds];
      setReadIds(updated);
      await AsyncStorage.setItem(`read_announcements_${userId}`, JSON.stringify(updated));
      console.log("Successfully updated read IDs locally:", updated);
    } catch (e) {
      console.warn("NotificationContext: Failed to mark all announcements as read", e);
    }
  }, [user, announcements, readIds, archivedIds]);

  // Archive an announcement
  const archiveAnnouncement = useCallback(async (id) => {
    if (!user) return;
    const userId = user.id || user.uid || user.userId || user.user_id;
    if (!userId) return;

    try {
      if (archivedIds.includes(id)) return;
      const updated = [...archivedIds, id];
      setArchivedIds(updated);
      await AsyncStorage.setItem(`archived_announcements_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn("NotificationContext: Failed to archive announcement", e);
    }
  }, [user, archivedIds]);

  // Unarchive an announcement
  const unarchiveAnnouncement = useCallback(async (id) => {
    if (!user) return;
    const userId = user.id || user.uid || user.userId || user.user_id;
    if (!userId) return;

    try {
      if (!archivedIds.includes(id)) return;
      const updated = archivedIds.filter(x => x !== id);
      setArchivedIds(updated);
      await AsyncStorage.setItem(`archived_announcements_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn("NotificationContext: Failed to unarchive announcement", e);
    }
  }, [user, archivedIds]);

  // Load read IDs and fetch announcements when user changes
  useEffect(() => {
    if (user) {
      hasShownInitialBannerRef.current = false;
      loadReadIds().then(() => {
        void fetchAnnouncements();
      });

      // Poll for new announcements every 8 seconds automatically for real-time popups
      const timer = setInterval(() => {
        void fetchAnnouncements();
      }, 8000);

      return () => clearInterval(timer);
    } else {
      setAnnouncements([]);
      setReadIds([]);
      setArchivedIds([]);
      loadedAnnouncementsRef.current = [];
      hasShownInitialBannerRef.current = false;
      setActiveBanner(null);
    }
  }, [user, loadReadIds, fetchAnnouncements]);

  // Exclude archived announcements from unread count
  const unreadCount = announcements.filter(
    a => !readIds.includes(a.id) && !archivedIds.includes(a.id)
  ).length;

  return (
    <NotificationContext.Provider value={{
      announcements,
      readIds,
      archivedIds,
      unreadCount,
      loading,
      error,
      fetchAnnouncements,
      markAsRead,
      markAllAnnouncementsAsRead,
      archiveAnnouncement,
      unarchiveAnnouncement
    }}>
      {children}

      {/* Floating In-App Top Notification Banner Popup */}
      {user && activeBanner && (
        <Animated.View style={[
          styles.bannerContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}>
          <TouchableOpacity 
            style={styles.bannerContent}
            activeOpacity={0.9}
            onPress={() => {
              void markAsRead(activeBanner.id);
              // Dismiss banner
              Animated.timing(slideAnim, {
                toValue: -150,
                duration: 250,
                useNativeDriver: true,
              }).start(() => {
                setActiveBanner(null);
              });

              // Route to the Notifications tab screen
              if (navigationRef.isReady()) {
                navigationRef.navigate("Notifications");
              }
            }}
          >
            <View style={styles.bannerIconBox}>
              <Ionicons name="megaphone" size={20} color="#fff" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerLabel}>NEW ANNOUNCEMENT</Text>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {activeBanner.title?.replace(/<[^>]+>/g, '').replace(/[\*_~]{1,2}/g, '')}
              </Text>
              <Text style={styles.bannerDesc} numberOfLines={1}>
                {(activeBanner.description || activeBanner.content)
                  ?.replace(/<[^>]+>/g, '')
                  .replace(/[\*_~]{1,2}/g, '')
                  .trim()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#a3a9c7" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 99999,
    shadowColor: '#4f5ec4',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 24,
  },
  bannerContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(79, 94, 196, 0.15)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#4f5ec4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f5ec4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4f5ec4',
    letterSpacing: 1,
    marginBottom: 2,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1d2d',
    marginBottom: 1,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#6e7798',
  },
});
