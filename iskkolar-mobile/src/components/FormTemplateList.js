import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import api from '../services/api';
import { getPublicFormTemplates } from '../services/formTemplateService';

/**
 * Shared component to list and download/open form templates.
 * 
 * @param {Object} props
 * @param {string} props.category - 'tertiary' or 'vocational'
 * @param {string} props.themeColor - Hex color for the theme (e.g., #5b5f97)
 * @param {string} props.lightThemeBg - Hex color for light background accents (e.g., #ede9fe)
 */
export default function FormTemplateList({ category, themeColor = '#5b5f97', lightThemeBg = '#ede9fe' }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingIds, setDownloadingIds] = useState({});

  const fetchTemplates = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await getPublicFormTemplates();
      // Filter by the provided category (e.g. 'tertiary' or 'vocational')
      const filtered = data.filter(
        (item) => String(item.category || '').toLowerCase() === category.toLowerCase()
      );
      setTemplates(filtered);
    } catch (err) {
      setError(err || 'Failed to load scholarship forms.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTemplates(true);
  };

  // Helper to format file sizes safely
  const formatFileSize = (size) => {
    if (!size) return 'Unknown size';
    if (typeof size === 'string') {
      if (size.toLowerCase().includes('kb') || size.toLowerCase().includes('mb')) {
        return size;
      }
      const parsed = parseFloat(size);
      if (isNaN(parsed)) return size;
      size = parsed;
    }
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper to format dates cleanly
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '--';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '--';
    }
  };

  // Helper to get full download URL resolving relative server paths
  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const base = api.defaults.baseURL || '';
    // Strip trailing /api or /api/ to get domain root
    const domain = base.replace(/\/api\/?$/, '');
    const cleanedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${domain}${cleanedUrl}`;
  };

  // Safe file opening/downloading routine
  const handleDownload = async (item) => {
    const rawUrl = item.file_url || item.fileUrl;
    if (!rawUrl) {
      Alert.alert('Error', 'This form does not have a valid download link.');
      return;
    }

    const fullUrl = getFullFileUrl(rawUrl);
    const fileName = item.file_name || item.fileName || `form_${item.id || Date.now()}.pdf`;
    
    // Fallback: If FileSystem download is not available, use openURL directly
    if (!FileSystem.documentDirectory) {
      try {
        await Linking.openURL(fullUrl);
      } catch (err) {
        Alert.alert('Error', 'Unable to open form link.');
      }
      return;
    }

    const localUri = `${FileSystem.documentDirectory}${fileName}`;
    
    // Set downloading state for this item
    setDownloadingIds((prev) => ({ ...prev, [item.id]: true }));

    try {
      // Download the file locally
      const downloadResult = await FileSystem.downloadAsync(fullUrl, localUri);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Server returned status code ${downloadResult.status}`);
      }

      // Check if native sharing/viewing sheet is available
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Open ${item.name || 'Scholarship Form'}`,
        });
      } else {
        // Safe fallback if share sheets aren't supported on device
        await Linking.openURL(fullUrl);
      }
    } catch (err) {
      console.warn('Local download/sharing failed, falling back to browser URL:', err);
      // Fail-safe: Always fallback to opening URL directly so user is never blocked
      try {
        await Linking.openURL(fullUrl);
      } catch (linkErr) {
        Alert.alert('Error', 'Unable to download or open the scholarship form.');
      }
    } finally {
      // Clear downloading state for this item
      setDownloadingIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  // ── Render States ──

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={themeColor} />
        <Text style={styles.statusText}>Fetching form templates...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: themeColor }]}
          onPress={() => fetchTemplates()}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (templates.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-text-outline" size={54} color="#a2aab8" />
        <Text style={styles.emptyText}>No scholarship form templates available for this category.</Text>
        <TouchableOpacity
          style={[styles.refreshBtn, { borderColor: themeColor }]}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={16} color={themeColor} style={{ marginRight: 6 }} />
          <Text style={[styles.refreshBtnText, { color: themeColor }]}>Check Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={templates}
      keyExtractor={(item) => String(item.id || item.template_id)}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColor]} tintColor={themeColor} />
      }
      renderItem={({ item }) => {
        const isDownloading = !!downloadingIds[item.id];
        return (
          <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: lightThemeBg }]}>
              <Ionicons name="document-text" size={24} color={themeColor} />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.fileName} numberOfLines={2}>
                {item.name || item.file_name}
              </Text>
              
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="file-tray-full-outline" size={12} color="#848baf" style={styles.metaIcon} />
                  <Text style={styles.metaText}>{formatFileSize(item.file_size)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={12} color="#848baf" style={styles.metaIcon} />
                  <Text style={styles.metaText}>Updated {formatDate(item.uploaded_at || item.created_at)}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: isDownloading ? '#f3f4f6' : themeColor }
              ]}
              disabled={isDownloading}
              onPress={() => handleDownload(item)}
              activeOpacity={0.7}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#848baf" />
              ) : (
                <Ionicons name="download-outline" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 300,
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    color: '#848baf',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#848baf',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 1,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  refreshBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1d2e57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#edf0f8',
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#131b3e',
    marginBottom: 6,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#848baf',
    fontWeight: '500',
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
