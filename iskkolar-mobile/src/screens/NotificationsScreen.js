import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getScholarAnnouncements } from '../services/announcementService';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Returns a relative time string like "2h ago" or "Jan 15, 2026" */
const getRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Returns formatted date string like "January 15, 2026" */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const getPreviewHtml = (content, description) => {
  const source = content || description || "";
  return source
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#\*_~`]{1,3}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 150);
};

/** Converts basic HTML tags to markdown-like markers for our parser */
const convertHtmlToMarkdown = (content) => {
  if (!content) return '';
  
  // Deep decode entities to handle double-escaped tags
  let decoded = content
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<') // Second pass for &amp;lt;
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"');

  return decoded
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, '') // Remove style/script content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '__$1__')
    .replace(/<s[^>]*>([\s\S]*?)<\/s>/gi, '~~$1~~')
    .replace(/<strike[^>]*>([\s\S]*?)<\/strike>/gi, '~~$1~~')
    .replace(/<del[^>]*>([\s\S]*?)<\/del>/gi, '~~$1~~')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<[^>]+>/g, '') // Strip remaining tags safely
    .trim();
};

/** Formats inline text for bold, italic, underline, and strikethrough */
const formatInlineText = (text, style) => {
  if (!text) return null;
  // Match the markers but ignore those that are actually just text
  const parts = text.split(/(\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|__[\s\S]*?__|~~[\s\S]*?~~)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} style={[style, { fontWeight: 'bold', color: '#1a1d2d' }]}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <Text key={i} style={[style, { fontStyle: 'italic' }]}>{part.slice(1, -1)}</Text>;
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return <Text key={i} style={[style, { textDecorationLine: 'underline' }]}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <Text key={i} style={[style, { textDecorationLine: 'line-through', color: '#a3a9c7' }]}>{part.slice(2, -2)}</Text>;
    }
    return part;
  });
};

/** Parses and renders formatted content (Headings, Lists, Paragraphs) */
const renderParsedContent = (content, baseStyle) => {
  if (!content) return null;

  // Convert HTML structure to markdown and clean remaining tags
  const cleanContent = convertHtmlToMarkdown(content);

  const blocks = cleanContent.split('\n\n').filter(b => b.trim());

  return blocks.map((block, index) => {
    const trimmed = block.trim();
    
    // Headings
    if (trimmed.startsWith('# ')) {
      return <Text key={index} style={styles.h1}>{formatInlineText(trimmed.replace('# ', ''), styles.h1)}</Text>;
    }
    if (trimmed.startsWith('## ')) {
      return <Text key={index} style={styles.h2}>{formatInlineText(trimmed.replace('## ', ''), styles.h2)}</Text>;
    }
    if (trimmed.startsWith('### ')) {
      return <Text key={index} style={styles.h3}>{formatInlineText(trimmed.replace('### ', ''), styles.h3)}</Text>;
    }

    // Lists
    if (trimmed.includes('\n- ') || trimmed.startsWith('- ')) {
      const lines = trimmed.split('\n');
      return (
        <View key={index} style={styles.listBlock}>
          {lines.map((line, i) => {
            const lContent = line.trim().replace(/^- /, '');
            if (!lContent) return null;
            return (
              <View key={i} style={styles.listItem}>
                <Text style={baseStyle}>• </Text>
                <Text style={[baseStyle, { flex: 1 }]}>{formatInlineText(lContent, baseStyle)}</Text>
              </View>
            );
          })}
        </View>
      );
    }

    // Numbered Lists
    if (/^\d+\./.test(trimmed)) {
        const lines = trimmed.split('\n');
        return (
          <View key={index} style={styles.listBlock}>
            {lines.map((line, i) => {
              const lContent = line.trim().replace(/^\d+\.\s*/, '');
              const numMatch = line.trim().match(/^\d+\./);
              const num = numMatch ? numMatch[0] : '1.';
              if (!lContent) return null;
              return (
                <View key={i} style={styles.listItem}>
                  <Text style={baseStyle}>{num} </Text>
                  <Text style={[baseStyle, { flex: 1 }]}>{formatInlineText(lContent, baseStyle)}</Text>
                </View>
              );
            })}
          </View>
        );
    }

    // Regular Paragraph
    return <Text key={index} style={[baseStyle, { marginBottom: 16 }]}>{formatInlineText(trimmed, baseStyle)}</Text>;
  });
};

// ─── DETAIL VIEW ──────────────────────────────────────────────────────────────

const AnnouncementDetail = ({ item, onBack }) => {
  const insets = useSafeAreaInsets();
  const isActivity = item.type === 'activity';
  const accentColor = isActivity ? '#3b82f6' : '#8b5cf6';
  const accentBg   = isActivity ? '#eff6ff'  : '#f5f3ff';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#1a1d2d" />
        </TouchableOpacity>
        <Text style={[styles.title, { flex: 1 }]} numberOfLines={1}>
          {item.title?.replace(/<[^>]+>/g, '').replace(/[\*_~]{1,2}/g, '')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        {/* Type & Priority Row */}
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: accentBg }]}>
            <Ionicons
              name={isActivity ? 'calendar-outline' : 'megaphone-outline'}
              size={14}
              color={accentColor}
            />
            <Text style={[styles.typeBadgeText, { color: accentColor }]}>
              {isActivity ? 'Activity' : 'Announcement'}
            </Text>
          </View>

          {item.priority === 'urgent' && (
            <View style={[styles.priorityBadge, { backgroundColor: '#fee2e2' }]}>
              <Text style={[styles.priorityBadgeText, { color: '#ef4444' }]}>Urgent</Text>
            </View>
          )}
          {item.priority === 'high' && (
            <View style={[styles.priorityBadge, { backgroundColor: '#ffedd5' }]}>
              <Text style={[styles.priorityBadgeText, { color: '#f97316' }]}>Important</Text>
            </View>
          )}
          {item.pinned && (
            <View style={[styles.priorityBadge, { backgroundColor: '#f3f4f6' }]}>
              <Ionicons name="pin" size={10} color="#4b5563" />
              <Text style={[styles.priorityBadgeText, { color: '#4b5563' }]}>Pinned</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.detailTitle}>{item.title}</Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#6e7798" />
          <Text style={styles.metaText}>Posted {formatDate(item.publishDate || item.createdAt)}</Text>
          {item.createdBy ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Ionicons name="person-outline" size={14} color="#6e7798" />
              <Text style={styles.metaText}>By {item.createdBy}</Text>
            </>
          ) : null}
        </View>

        {/* Accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        {/* Content — Render formatted block content */}
        <View style={styles.detailBodyContainer}>
          {renderParsedContent(item.content || item.description, styles.detailBody)}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [announcements, setAnnouncements]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [readIds, setReadIds]               = useState([]);
  const [selected, setSelected]             = useState(null); // detail view

  // Fetch announcements on mount
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getScholarAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  // Open detail and mark as read
  const handlePress = (item) => {
    setSelected(item);
    if (!readIds.includes(item.id)) setReadIds(prev => [...prev, item.id]);
  };

  // Show detail view
  if (selected) {
    return <AnnouncementDetail item={selected} onBack={() => setSelected(null)} />;
  }

  // ── List view ──────────────────────────────────────────────────────────────
  const sorted = [...announcements].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20, paddingBottom: 20 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Announcements</Text> 
            <Text style={styles.subtitle}>Stay updated with announcements</Text>
          </View>
          {/* Unread badge */}
          {announcements.filter(a => !readIds.includes(a.id)).length > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {announcements.filter(a => !readIds.includes(a.id)).length}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4f5ec4" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAnnouncements}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="megaphone-outline" size={48} color="#a3a9c7" />
          <Text style={styles.emptyTitle}>No announcements yet</Text>
          <Text style={styles.emptyText}>Check back later for updates</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {sorted.map((item) => {
            const isActivity = item.type === 'activity';
            const isRead     = readIds.includes(item.id);
            const iconName   = isActivity ? 'calendar' : 'notifications';
            const iconColor  = isActivity ? '#3b82f6'  : '#4f5ec4';
            const iconBg     = isActivity ? '#eff6ff'   : '#ebedfa';

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, !isRead && styles.cardUnread]}
                activeOpacity={0.75}
                onPress={() => handlePress(item)}
              >
                {/* Unread indicator */}
                {!isRead && <View style={styles.unreadBar} />}

                <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                  <Ionicons name={iconName} size={20} color={iconColor} />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.cardTitle, isRead && styles.cardTitleRead]} numberOfLines={1}>
                        {item.title?.replace(/<[^>]+>/g, '').replace(/[\*_~]{1,2}/g, '')}
                      </Text>
                      {item.pinned && <Ionicons name="pin" size={12} color="#f59e0b" style={{ marginLeft: 4 }} />}
                    </View>
                    {!isRead && <View style={styles.unreadDot} />}
                  </View>
                  
                  <Text style={styles.cardMessage} numberOfLines={2}>
                    {convertHtmlToMarkdown(item.description || item.content)
                      .replace(/[#\*_~]{1,3}/g, '') // Strip all markers for plain text preview
                      .replace(/\s+/g, ' ')
                      .trim()
                      .substring(0, 150)}
                  </Text>
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                      <View style={[styles.typePill, { backgroundColor: isActivity ? '#eff6ff' : '#f5f3ff' }]}>
                        <Text style={[styles.typePillText, { color: isActivity ? '#3b82f6' : '#8b5cf6' }]}>
                          {isActivity ? 'Activity' : 'Announcement'}
                        </Text>
                      </View>
                      
                      {item.priority === 'urgent' && (
                        <View style={[styles.typePill, { backgroundColor: '#fee2e2', marginLeft: 6 }]}>
                          <Text style={[styles.typePillText, { color: '#ef4444' }]}>Urgent</Text>
                        </View>
                      )}
                      {item.priority === 'high' && (
                        <View style={[styles.typePill, { backgroundColor: '#ffedd5', marginLeft: 6 }]}>
                          <Text style={[styles.typePillText, { color: '#f97316' }]}>Important</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardTimestamp}>{getRelativeTime(item.createdAt)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff2f9',
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 10,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f4f5fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: { flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1d2d',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6e7798',
    marginTop: 4,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#e96e5e',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },

  // ── States ──────────────────────────────────────────────────────────────────
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#6e7798',
    fontWeight: '500',
  },
  errorText: {
    color: '#e96e5e',
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1d2d',
    marginTop: 16,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#6e7798',
    textAlign: 'center',
  },

  // ── List ────────────────────────────────────────────────────────────────────
  content: {
    padding: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  cardUnread: {
    backgroundColor: '#f8f9ff',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#4f5ec4',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1d2d',
    flex: 1,
    letterSpacing: -0.2,
    marginRight: 8,
  },
  cardTitleRead: {
    fontWeight: '600',
    color: '#4a4f6a',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e96e5e',
  },
  cardMessage: {
    fontSize: 14,
    color: '#6e7798',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTimestamp: {
    fontSize: 12,
    color: '#a3a9c7',
    fontWeight: '700',
  },

  // ── Detail ──────────────────────────────────────────────────────────────────
  detailContent: {
    padding: 24,
    paddingTop: 12,
    paddingBottom: 80,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  accentBar: {
    height: 3,
    borderRadius: 2,
    marginBottom: 24,
    width: 60,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1a1d2d',
    marginBottom: 12,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 24,
  },
  metaText: {
    fontSize: 13,
    color: '#6e7798',
    fontWeight: '500',
  },
  metaDot: {
    color: '#a3a9c7',
    fontWeight: '700',
    marginHorizontal: 2,
  },
  detailBodyContainer: {
    marginTop: 8,
  },
  detailBody: {
    fontSize: 16,
    color: '#3d4369',
    lineHeight: 26,
    fontWeight: '400',
  },
  h1: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1d2d',
    marginBottom: 12,
    marginTop: 8,
  },
  h2: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1a1d2d',
    marginBottom: 10,
    marginTop: 6,
  },
  h3: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1d2d',
    marginBottom: 8,
    marginTop: 4,
  },
  listBlock: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
