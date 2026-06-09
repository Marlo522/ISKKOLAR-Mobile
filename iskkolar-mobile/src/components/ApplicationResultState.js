import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ApplicationResultState({
  aiCheckingEnabled = true,
  successTitle = "Submission Successful!",
  successMessage = "Your documents have been submitted securely.",
  qualificationReport = null,
  aiSummary = null,
  onViewApplications,
  viewApplicationsText = "Return to Dashboard",
}) {
  
  // Render the Manual Review Warning Card (when AI/OCR is disabled)
  const renderManualReviewCard = () => {
    const reportSummary = aiSummary || qualificationReport?.qualification_report?.summary || qualificationReport?.summary || "AI verification was bypassed by system administrator settings. Application has been passed directly to manual review.";
    
    return (
      <View style={styles.manualReviewReport}>
        {/* Warning Banner */}
        <View style={styles.manualReviewBanner}>
          <Ionicons name="information-circle" size={24} color="#b45309" style={styles.manualReviewBannerIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.manualReviewBannerTitle}>Referred for Manual Staff Review</Text>
            <Text style={styles.manualReviewBannerText}>
              Some documents or eligibility details require a manual check by our staff. Your application is safely submitted and will be reviewed shortly.
            </Text>
          </View>
        </View>

        {/* Evaluation Summary */}
        <Text style={styles.manualReviewSectionTitle}>EVALUATION SUMMARY</Text>
        <View style={styles.manualReviewSummaryCard}>
          <Text style={styles.manualReviewSummaryText}>
            {reportSummary}
          </Text>
        </View>

        {/* Separator Line */}
        <View style={styles.manualReviewSeparator} />

        {/* Footer */}
        <View style={styles.manualReviewFooter}>
          <Text style={styles.manualReviewFooterLabel}>Confidence Level:</Text>
          <View style={styles.manualReviewFooterBadge}>
            <Text style={styles.manualReviewFooterBadgeText}>AI CHECKING IS OFF</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render the AI report structure (like in ProgramApplyScreen)
  const renderAiReport = () => {
    const reportData = qualificationReport?.qualification_report || qualificationReport;
    const detailedAiSummary = reportData?.extracted_data?.ai_detailed_summary;

    // Filter out internal/fraud rules
    const qualificationRuleEntries = Object.entries(reportData?.rule_results || {}).filter(
      ([ruleCode]) => !['fraud_score', 'confidence_score', 'income_doc_match', 'income_documents_valid'].some(exclude => ruleCode.toLowerCase().includes(exclude))
    );

    const isQualified = reportData?.final_result === "qualified";
    const isReview = reportData?.final_result !== "qualified" && reportData?.final_result !== "not_qualified";

    const finalStatusText =
      isQualified ? "Qualified" :
        reportData?.final_result === "not_qualified" ? "Not Qualified" :
          "For Review of Staff";

    const statusColor = isQualified ? "#1a9e6a" : (isReview ? "#e8a030" : "#e03a3a");
    const statusBg = isQualified ? "#e6fff5" : (isReview ? "#fff7e6" : "#fff0f0");

    return (
      <View style={styles.aiReportContainer}>
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <View style={styles.successIconOuter}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.successBannerTitle}>Evaluation Complete</Text>
            <Text style={styles.successBannerText}>
              Your application has been successfully parsed and evaluated by our AI.
            </Text>
          </View>
        </View>

        {/* AI Report Card */}
        <View style={styles.reportCard}>
          <View style={styles.reportCardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Ionicons name="sparkles" size={20} color="#4f5ec4" style={{ marginRight: 8 }} />
              <Text style={styles.reportCardTitle}>AI Qualification Report</Text>
            </View>
            <Text style={styles.reportCardSub}>
              {reportData?.summary || 'No qualification report summary available.'}
            </Text>
          </View>

          <View style={{ padding: 16 }}>
            {detailedAiSummary && (
              <View style={styles.smartEvalContainer}>
                <Text style={styles.smartEvalTitle}>AI Smart Evaluation</Text>

                <View style={{ marginBottom: 14 }}>
                  <Text style={styles.smartEvalHeadingStrengths}>Strengths</Text>
                  {(detailedAiSummary?.strengths || []).map((item, index) => (
                    <View key={`strength-${index}`} style={{ flexDirection: 'row', marginBottom: 6 }}>
                      <Text style={styles.bulletStrength}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ marginBottom: 14 }}>
                  <Text style={styles.smartEvalHeadingFlags}>Red Flags</Text>
                  {(detailedAiSummary?.red_flags || []).map((item, index) => (
                    <View key={`red-flag-${index}`} style={{ flexDirection: 'row', marginBottom: 6 }}>
                      <Text style={styles.bulletFlag}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <View style={styles.smartEvalHalfBlock}>
                    <Text style={styles.smartEvalHalfLabel}>Summary</Text>
                    <Text style={styles.smartEvalHalfText}>{detailedAiSummary?.summary || 'No summary available.'}</Text>
                  </View>
                  <View style={styles.smartEvalHalfBlock}>
                    <Text style={styles.smartEvalHalfLabel}>Recommendation</Text>
                    <Text style={styles.smartEvalHalfText}>{detailedAiSummary?.recommendation || 'No recommendation available.'}</Text>
                  </View>
                </View>
              </View>
            )}

            {qualificationRuleEntries.length === 0 && !detailedAiSummary && (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Ionicons name="document-text-outline" size={48} color="#e4e8f6" />
                <Text style={{ color: "#8a94b5", marginTop: 10, fontWeight: "600" }}>Application submitted successfully.</Text>
              </View>
            )}

            {qualificationRuleEntries.length > 0 && (
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Rule</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Feedback</Text>
                </View>

                {/* Table Body */}
                {qualificationRuleEntries.map(([ruleCode, result], idx) => {
                  const passed = Boolean(result?.passed);
                  const state = result?.status || (passed ? 'passed' : 'failed');

                  let badgeBg = "#fff0f0";
                  let badgeText = "#e03a3a";
                  if (state === 'for_review') {
                    badgeBg = "#fffbeb";
                    badgeText = "#b45309";
                  } else if (passed) {
                    badgeBg = "#ecfdf5";
                    badgeText = "#047857";
                  }

                  const formattedRuleCode = ruleCode
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');

                  return (
                    <View key={ruleCode} style={[styles.tableRow, idx === qualificationRuleEntries.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={{ flex: 1.5, paddingRight: 8 }}>
                        <Text style={styles.tableCellRule}>{formattedRuleCode}</Text>
                      </View>
                      <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start", paddingRight: 8 }}>
                        <View style={[styles.badgePill, { backgroundColor: badgeBg }]}>
                          <Text style={[styles.badgeText, { color: badgeText }]}>{state}</Text>
                        </View>
                      </View>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.tableCellFeedback}>{result?.message || 'No feedback available'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Final Status Footer */}
          <View style={[styles.reportFooter, { backgroundColor: statusBg }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportFooterLabel}>Final Status</Text>
              <Text style={[styles.reportFooterValue, { color: statusColor }]}>{finalStatusText}</Text>
            </View>
            <Ionicons name={isQualified ? "ribbon" : (isReview ? "time" : "close-circle")} size={36} color={statusColor} style={{ opacity: 0.8 }} />
          </View>
        </View>
      </View>
    );
  };

  // Render a simpler textual AI paragraph/advice report (like in renewals, compliant, financial records)
  const renderAiSummaryCard = () => {
    return (
      <View style={styles.aiSummaryCard}>
        <View style={styles.aiSummaryHeader}>
          <View style={styles.aiSummaryIconWrap}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
          <Text style={styles.aiSummaryTitle}>AI ANALYSIS & ADVICE</Text>
        </View>
        <Text style={styles.aiSummaryText}>
          {`"${aiSummary}"`}
        </Text>
        <View style={styles.aiSummaryFooter}>
          <Text style={styles.aiSummaryFooterLeft}>Generated by Iskkolar AI Assistant</Text>
          <Text style={styles.aiSummaryFooterRight}>Verified Analysis</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Standard checkmark success banner at the very top */}
      <View style={styles.successCentered}>
        <View style={styles.checkIconOuter}>
          <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
        </View>
        <Text style={styles.successTitleText}>{successTitle}</Text>
        <Text style={styles.successSubtitleText}>{successMessage}</Text>
      </View>

      {/* Switching Logic: Manual Warning Card vs AI Report Panels */}
      {!aiCheckingEnabled ? (
        renderManualReviewCard()
      ) : (
        <>
          {qualificationReport && renderAiReport()}
          {!qualificationReport && aiSummary && renderAiSummaryCard()}
        </>
      )}

      {/* Return / Navigation Action Button */}
      <TouchableOpacity style={styles.actionBtn} onPress={onViewApplications}>
        <Text style={styles.actionBtnText}>{viewApplicationsText}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 60,
  },
  successCentered: {
    alignItems: "center",
    marginBottom: 24,
  },
  checkIconOuter: {
    marginBottom: 16,
  },
  successTitleText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 6,
  },
  successSubtitleText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },

  // Manual Review warning card
  manualReviewCard: {
    backgroundColor: "#fffbeb",
    borderWidth: 1.5,
    borderColor: "#fbbf24",
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  manualReviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  warningIcon: {
    marginRight: 10,
  },
  manualReviewTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#78350f",
  },
  manualReviewText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 22,
    fontWeight: "500",
  },

  // Action Button
  actionBtn: {
    backgroundColor: "#4f5fc5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  // AI Report structure
  aiReportContainer: {
    marginBottom: 20,
  },
  successBanner: {
    backgroundColor: "#eef0ff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbe2f6",
  },
  successIconOuter: {
    backgroundColor: "#4f5fc5",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  successBannerTitle: {
    color: "#2d3a7c",
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 2,
  },
  successBannerText: {
    color: "#5b6095",
    fontSize: 12,
    lineHeight: 16,
  },
  reportCard: {
    backgroundColor: "#f7f8ff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbe2f6",
    overflow: "hidden",
  },
  reportCardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eff1f8",
  },
  reportCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3d4fa0",
  },
  reportCardSub: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  smartEvalContainer: {
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    padding: 14,
  },
  smartEvalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3d4076",
    marginBottom: 10,
  },
  smartEvalHeadingStrengths: {
    fontSize: 13,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 6,
  },
  smartEvalHeadingFlags: {
    fontSize: 13,
    fontWeight: "700",
    color: "#be123c",
    marginBottom: 6,
  },
  bulletStrength: {
    color: "#047857",
    marginRight: 6,
    fontWeight: "bold",
  },
  bulletFlag: {
    color: "#be123c",
    marginRight: 6,
    fontWeight: "bold",
  },
  bulletText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    lineHeight: 18,
  },
  smartEvalHalfBlock: {
    width: '48%',
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  smartEvalHalfLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  smartEvalHalfText: {
    fontSize: 12,
    color: "#374151",
    lineHeight: 16,
  },
  tableContainer: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b5563",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  tableCellRule: {
    color: "#1f2937",
    fontWeight: "600",
    fontSize: 12,
  },
  tableCellFeedback: {
    color: "#4b5563",
    fontSize: 12,
    lineHeight: 16,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontWeight: "700",
    fontSize: 10,
    textTransform: "uppercase",
  },
  reportFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eff1f8",
    flexDirection: "row",
    alignItems: "center",
  },
  reportFooterLabel: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reportFooterValue: {
    fontSize: 16,
    fontWeight: "800",
  },

  // AI Summary Card style
  aiSummaryCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4e8f8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#4f5fc5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  aiSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  aiSummaryIconWrap: {
    backgroundColor: "#4f5fc5",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  aiSummaryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4f5fc5",
    letterSpacing: 0.5,
  },
  aiSummaryText: {
    fontSize: 14,
    color: "#3d4076",
    fontStyle: "italic",
    lineHeight: 20,
    marginBottom: 12,
  },
  aiSummaryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f3fa",
    paddingTop: 10,
  },
  aiSummaryFooterLeft: {
    fontSize: 11,
    color: "#8a90ba",
  },
  aiSummaryFooterRight: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2cae57",
  },
  manualReviewReport: {
    marginBottom: 20,
  },
  manualReviewBanner: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  manualReviewBannerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  manualReviewBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#b45309",
    marginBottom: 4,
  },
  manualReviewBannerText: {
    fontSize: 13,
    color: "#b45309",
    lineHeight: 18,
    opacity: 0.9,
  },
  manualReviewSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 10,
    textTransform: "uppercase",
  },
  manualReviewSummaryCard: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  manualReviewSummaryText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 22,
  },
  manualReviewSeparator: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 16,
  },
  manualReviewFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  manualReviewFooterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginRight: 8,
  },
  manualReviewFooterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
  },
  manualReviewFooterBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#b91c1c",
  },
});
