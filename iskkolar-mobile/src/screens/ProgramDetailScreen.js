import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { documentDirectory, downloadAsync } from "expo-file-system";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { openURL } from "expo-linking";
import api from "../services/api";
import { getPublicFormTemplates } from "../services/formTemplateService";
import { getApplicationSettings } from "../services/settingsService";
import ApplicationsClosedGuard from "../components/ApplicationsClosedGuard";

const eligibility = [
  "Filipino Citizen",
  "Incoming or Current College Student",
  "GWA 85% and above",
  "Public University / State University",
  "Family income should not exceed Thirty Thousand Pesos (₱30,000) monthly",
];

export default function ProgramDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const program = route.params?.program || "tertiary";

  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState(null);
  const [downloadingIds, setDownloadingIds] = useState({});

  const handleApplyPress = async (program, option) => {
    navigation.navigate("ProgramApply", option ? { program, option } : { program });
  };

  useEffect(() => {
    let active = true;
    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true);
        setTemplatesError(null);
        const data = await getPublicFormTemplates();
        if (!active) return;
        
        const targetCategory = program === 'vocational' ? 'vocational' : 'tertiary';
        const filtered = data.filter(
          (item) => String(item.category || '').toLowerCase() === targetCategory
        );
        setTemplates(filtered);
      } catch (err) {
        if (active) {
          setTemplatesError(err || 'Failed to load form templates.');
        }
      } finally {
        if (active) {
          setTemplatesLoading(false);
        }
      }
    };
    void loadTemplates();
    
    return () => {
      active = false;
    };
  }, [program]);

  const formatFileSize = (size) => {
    if (!size) return 'Unknown size';
    if (typeof size === 'string') {
      if (size.toLowerCase().includes('kb') || size.toLowerCase().includes('mb')) return size;
      const parsed = parseFloat(size);
      if (isNaN(parsed)) return size;
      size = parsed;
    }
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = api.defaults.baseURL || '';
    const domain = base.replace(/\/api\/?$/, '');
    const cleanedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${domain}${cleanedUrl}`;
  };

  const handleDownload = async (item) => {
    const rawUrl = item.file_url || item.fileUrl;
    if (!rawUrl) {
      Alert.alert('Error', 'This form does not have a valid download link.');
      return;
    }

    const fullUrl = getFullFileUrl(rawUrl);
    const fileName = item.file_name || item.fileName || `form_${item.id || Date.now()}.pdf`;
    
    if (!documentDirectory) {
      try {
        await openURL(fullUrl);
      } catch {
        Alert.alert('Error', 'Unable to open form link.');
      }
      return;
    }

    const localUri = `${documentDirectory}${fileName}`;
    setDownloadingIds((prev) => ({ ...prev, [item.id]: true }));

    try {
      const downloadResult = await downloadAsync(fullUrl, localUri);
      if (downloadResult.status !== 200) {
        throw new Error(`Server returned status code ${downloadResult.status}`);
      }

      const canShare = await isAvailableAsync();
      if (canShare) {
        await shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Open ${item.name || 'Scholarship Form'}`,
        });
      } else {
        await openURL(fullUrl);
      }
    } catch (err) {
      console.warn('Local download failed, falling back to openURL:', err);
      try {
        await openURL(fullUrl);
      } catch {
        Alert.alert('Error', 'Unable to download or open the scholarship form.');
      }
    } finally {
      setDownloadingIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  useEffect(() => {
    if (!isFocused) return;

    const checkSettings = async () => {
      setLoading(true);
      const settings = await getApplicationSettings();
      // Application settings is open & applicant limit has not been met
      const open = settings.is_open && !settings.is_limit_reached;
      setIsOpen(open);
      setLoading(false);
    };
    checkSettings();
  }, [isFocused]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#5b5f97" />
      </View>
    );
  }

  if (!isOpen) {
    return (
      <ApplicationsClosedGuard onBack={() => navigation.navigate("Home")} />
    );
  }

  const employeeChildOptions = [
    {
      id: 1,
      option: "Option 1",
      title: "Self-Advancement",
      bullets: [
        { icon: "person", text: "Must be a regular employee of KKFI at the time of application" },
        { icon: "school", text: "Personal educational advancement or professional development" },
        { icon: "ribbon", text: "Maintain good academic standing" },
      ],
    },
    {
      id: 2,
      option: "Option 2",
      title: "Child Designation",
      bullets: [
        { icon: "people", text: "May designate benefit to a qualified relative (child)" },
        { icon: "person-add", text: "Limited to one slot only for the duration of employment" },
        { icon: "time", text: "Assistance automatically ends if the KKFI staff member resigns" },
      ],
    },
  ];

  const renderEmployeeChildContent = () => (
    <>
      <Text style={styles.sectionTitle}>KKFI Employee-Child Education Grant</Text>

      <View style={[styles.card, styles.backgroundCard]}>
        <View style={styles.cardIndicator}>
          <Ionicons name="information-circle" size={18} color="#4754c5" />
          <Text style={styles.cardIndicatorTitle}>BACKGROUND</Text>
        </View>
        <Text style={styles.cardText}>
          KKFI believes the growth of its personnel is central to its mission. The Staff and Dependents Educational Assistance (SDEA) empowers staff to enhance their skills while supporting the educational aspirations of their families.
        </Text>
      </View>

      {employeeChildOptions.map((item) => (
        <View key={item.id} style={styles.optionCard}>
          <View style={styles.optionLabel}>
            <Text style={styles.optionLabelText}>{item.option}</Text>
          </View>
          <Text style={styles.optionTitle}>{item.title}</Text>

          {item.bullets.map((bullet, idx) => (
            <View key={idx} style={styles.listItem}>
              <Ionicons name={bullet.icon} size={18} color="#4c60d1" style={styles.bullet} />
              <Text style={styles.listText}>{bullet.text}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => handleApplyPress("employeeChild", item.option)}
          >
            <Text style={styles.applyBtnText}>Apply Now!</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const renderVocationalContent = () => (
    <>
      <Text style={styles.sectionTitle}>TESDA-Accredited Pathways</Text>

      <View style={styles.card}>
        <View style={styles.cardIndicator}>
          <Ionicons name="information-circle" size={18} color="#4754c5" />
          <Text style={styles.cardIndicatorTitle}>BACKGROUND</Text>
        </View>
        <Text style={styles.cardText}>
          Designed for individuals seeking employment-ready skills. We partner with TESDA-accredited institutions to provide National Certificates (NC I, NC II) that are highly valued in the labor market.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardIndicator}>
          <Ionicons name="document" size={18} color="#4754c5" />
          <Text style={styles.cardIndicatorTitle}>ELIGIBILITY</Text>
        </View>
        {[
          { icon: "person", text: "Filipino Citizen (Ages 18 Above)" },
          { icon: "school", text: "High School Graduate (or equivalent)" },
          { icon: "cash", text: "Family Income ≤ ₱20,000/month" },
        ].map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Ionicons name={item.icon} size={18} color="#4c60d1" style={styles.bullet} />
            <Text style={styles.listText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardIndicator}>
          <Ionicons name="school" size={18} color="#4754c5" />
          <Text style={styles.cardIndicatorTitle}>ELIGIBLE TRACKS (NOT LIMITED TO)</Text>
        </View>
        <View style={styles.tracksGrid}>
          {["Automotive", "Cookery", "Bookkeeping", "Agriculture", "ICT Servicing", "Caregiving"].map((track, idx) => (
            <View key={idx} style={styles.trackChip}>
              <Text style={styles.trackChipText}>{track}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardIndicator}>
          <Ionicons name="checkmark-circle" size={18} color="#4754c5" />
          <Text style={styles.cardIndicatorTitle}>HOW TO APPLY</Text>
        </View>
        <View style={styles.timeline}>
          {[
            "Download Required Forms",
            "Fill Out & Have Forms Signed",
            "Submit Application Online",
            "Wait for Review",
          ].map((step, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineIconRow}>
                <View style={styles.stepCircle}><Text style={styles.stepNumber}>{index + 1}</Text></View>
                {index < 3 && <View style={styles.stepLine} />}
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.subTitle}>DOWNLOAD FORMS</Text>
        {templatesLoading ? (
          <ActivityIndicator size="small" color="#4d61d8" style={{ marginVertical: 12 }} />
        ) : templatesError ? (
          <Text style={{ color: '#e94e4e', fontSize: 13, fontWeight: '600', marginVertical: 8 }}>
            {templatesError}
          </Text>
        ) : templates.length === 0 ? (
          <Text style={{ color: '#6873a6', fontSize: 13, fontWeight: '500', marginVertical: 8 }}>
            No scholarship forms uploaded for this program.
          </Text>
        ) : (
          templates.map((item, index) => {
            const isDownloading = !!downloadingIds[item.id];
            return (
              <View key={item.id || index} style={styles.formRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.formLabel} numberOfLines={1}>
                    {item.name || item.file_name}
                  </Text>
                  {!!item.file_size && (
                    <Text style={{ color: '#848baf', fontSize: 11, fontWeight: '600' }}>
                      {formatFileSize(item.file_size)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={[styles.downloadBtn, isDownloading && { backgroundColor: '#e2e6f4' }]}
                  onPress={() => handleDownload(item)}
                  disabled={isDownloading}
                  activeOpacity={0.8}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#4d61d8" />
                  ) : (
                    <Text style={styles.downloadBtnText}>Download Form</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      <TouchableOpacity style={[styles.applyBtn, { flexDirection: "row", paddingHorizontal: 16, justifyContent: "center" }]} onPress={() => handleApplyPress("vocational")}>
        <Ionicons name="document" size={20} color="#fff" style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.applyBtnText}>Apply Now!</Text>
          <Text style={styles.applySub}>Make sure you&apos;ve downloaded the forms first</Text>
        </View>
      </TouchableOpacity>
    </>
  );

  const renderTertiaryContent = () => (
    <>
      <Text style={styles.sectionTitle}>KKFI Tertiary Program</Text>

      <View style={styles.card}>
        <View style={styles.cardIndicator}>
          <Ionicons name="information-circle" size={18} color="#4754c5" />
          <Text style={styles.cardIndicatorTitle}>BACKGROUND</Text>
        </View>
        <Text style={styles.cardText}>
          Supporting students across the Philippines to overcome financial barriers and reach higher education in public state universities.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardIndicator}>
          <Ionicons name="clipboard" size={18} color="#4754c5" />
          <Text style={styles.cardIndicatorTitle}>ELIGIBILITY</Text>
        </View>
        {eligibility.map((item, index) => {
          const iconMap = ["flag", "school", "ribbon", "business", "cash"];
          return (
            <View key={index} style={styles.listItem}>
              <Ionicons name={iconMap[index] || "checkmark-circle"} size={18} color="#4c60d1" style={styles.bullet} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.subTitle}>HOW TO APPLY</Text>
        <View style={styles.timeline}>
          {[
            "Download Required Forms",
            "Fill Out & Have Forms Signed",
            "Submit Application Online",
            "Wait for Review",
          ].map((step, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineIconRow}>
                <View style={styles.stepCircle}><Text style={styles.stepNumber}>{index + 1}</Text></View>
                {index < 3 && <View style={styles.stepLine} />}
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.subTitle}>DOWNLOAD FORMS</Text>
        {templatesLoading ? (
          <ActivityIndicator size="small" color="#4d61d8" style={{ marginVertical: 12 }} />
        ) : templatesError ? (
          <Text style={{ color: '#e94e4e', fontSize: 13, fontWeight: '600', marginVertical: 8 }}>
            {templatesError}
          </Text>
        ) : templates.length === 0 ? (
          <Text style={{ color: '#6873a6', fontSize: 13, fontWeight: '500', marginVertical: 8 }}>
            No scholarship forms uploaded for this program.
          </Text>
        ) : (
          templates.map((item, index) => {
            const isDownloading = !!downloadingIds[item.id];
            return (
              <View key={item.id || index} style={styles.formRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.formLabel} numberOfLines={1}>
                    {item.name || item.file_name}
                  </Text>
                  {!!item.file_size && (
                    <Text style={{ color: '#848baf', fontSize: 11, fontWeight: '600' }}>
                      {formatFileSize(item.file_size)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={[styles.downloadBtn, isDownloading && { backgroundColor: '#e2e6f4' }]}
                  onPress={() => handleDownload(item)}
                  disabled={isDownloading}
                  activeOpacity={0.8}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#4d61d8" />
                  ) : (
                    <Text style={styles.downloadBtnText}>Download Form</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      <TouchableOpacity style={[styles.applyBtn, { flexDirection: "row", paddingHorizontal: 16, justifyContent: "center" }]} onPress={() => handleApplyPress("tertiary")}>
        <Ionicons name="document" size={20} color="#fff" style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.applyBtnText}>Apply Now!</Text>
          <Text style={styles.applySub}>Make sure you&apos;ve downloaded the forms first</Text>
        </View>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#4c60d1" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {program === "employeeChild"
            ? "KKFI Employee-Child Education Grant"
            : program === "vocational"
              ? "VOCATIONAL AND TECHNOLOGY SCHOLARSHIP"
              : "Tertiary Scholarship Program"}
        </Text>
        <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate("Notifications")}>
          <Ionicons name="notifications-outline" size={22} color="#131b3e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {program === "employeeChild"
          ? renderEmployeeChildContent()
          : program === "vocational"
            ? renderVocationalContent()
            : renderTertiaryContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fb" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, paddingHorizontal: 18 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  title: { fontSize: 18, fontWeight: "900", color: "#131b3e", flex: 1, textAlign: "center", letterSpacing: -0.3 },
  content: { padding: 18 },
  sectionTitle: { color: "#131b3e", fontWeight: "900", fontSize: 26, marginBottom: 20, marginTop: 8, letterSpacing: -0.5, lineHeight: 32 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: "#1d2e57", shadowOpacity: 0.04, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 5 },
  cardIndicator: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardIndicatorTitle: { marginLeft: 8, fontSize: 12, fontWeight: "800", color: "#4d61d8", letterSpacing: 0.5 },
  cardText: { color: "#6873a6", lineHeight: 24, fontSize: 14, fontWeight: "500" },
  subTitle: { marginBottom: 16, color: "#131b3e", fontWeight: "900", fontSize: 16 },
  listItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  bullet: { marginRight: 10, marginTop: 2 },
  listText: { flex: 1, color: "#4a4f75", fontSize: 14, lineHeight: 20, fontWeight: "500" },
  timeline: { marginTop: 4 },
  timelineItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  timelineIconRow: { width: 34, alignItems: "center" },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#4d61d8", justifyContent: "center", alignItems: "center", marginBottom: 4 },
  stepLine: { width: 2, flex: 1, backgroundColor: "#e2e6f4", marginTop: 4, marginBottom: 2 },
  stepNumber: { color: "#fff", fontSize: 12, fontWeight: "800" },
  stepText: { color: "#4a4f75", fontSize: 14, fontWeight: "600", flex: 1, marginTop: 4 },
  formRow: { marginBottom: 14 },
  formLabel: { color: "#131b3e", fontSize: 14, fontWeight: "700", marginBottom: 8 },
  downloadBtn: { backgroundColor: "#eef2fc", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  downloadBtnText: { color: "#4d61d8", fontWeight: "800", fontSize: 13 },
  applyBtn: { marginTop: 10, borderRadius: 100, backgroundColor: "#2ecb9b", paddingVertical: 18, alignItems: "center", shadowColor: "#2ecb9b", shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  applyBtnText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: -0.2 },
  applySub: { color: "#e3fbf2", fontSize: 12, marginTop: 4, fontWeight: "600" },
  backgroundCard: { backgroundColor: "#fff" },
  optionCard: { backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: "#1d2e57", shadowOpacity: 0.04, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 5 },
  optionLabel: { alignSelf: "flex-start", backgroundColor: "#fff0f0", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 12 },
  optionLabelText: { color: "#e94e4e", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  optionTitle: { fontSize: 22, fontWeight: "900", color: "#131b3e", marginBottom: 16, letterSpacing: -0.5 },
  tracksGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  trackChip: { backgroundColor: "#f5f7fa", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  trackChipText: { color: "#4d61d8", fontSize: 13, fontWeight: "800" },
});