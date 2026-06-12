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

  // ─── Manual Review Warning Card (AI/OCR disabled) ───────────────────────────
  const renderManualReviewCard = () => {
    const reportSummary =
      aiSummary ||
      qualificationReport?.qualification_report?.summary ||
      qualificationReport?.summary ||
      "AI verification was bypassed by system administrator settings. Application has been passed directly to manual review.";

    return (
      <View style={styles.manualReviewReport}>
        <View style={styles.manualReviewBanner}>
          <Ionicons
            name="information-circle"
            size={24}
            color="#b45309"
            style={styles.manualReviewBannerIcon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.manualReviewBannerTitle}>
              Referred for Manual Staff Review
            </Text>
            <Text style={styles.manualReviewBannerText}>
              Some documents or eligibility details require a manual check by
              our staff. Your application is safely submitted and will be
              reviewed shortly.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>EVALUATION SUMMARY</Text>
        <View style={styles.manualReviewSummaryCard}>
          <Text style={styles.manualReviewSummaryText}>{reportSummary}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.manualReviewFooter}>
          <Text style={styles.manualReviewFooterLabel}>Confidence Level:</Text>
          <View style={styles.manualReviewFooterBadge}>
            <Text style={styles.manualReviewFooterBadgeText}>
              AI CHECKING IS OFF
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // ─── Full AI Report (structured rules + smart eval) ─────────────────────────
  const renderAiReport = () => {
    const reportData =
      qualificationReport?.qualification_report || qualificationReport;
    const detailedAiSummary = reportData?.extracted_data?.ai_detailed_summary;

    // Filter out internal / fraud scoring rules
    const qualificationRuleEntries = Object.entries(
      reportData?.rule_results || {}
    ).filter(
      ([ruleCode]) =>
        !["fraud_score", "confidence_score", "income_doc_match", "income_documents_valid"].some(
          (exclude) => ruleCode.toLowerCase().includes(exclude)
        )
    );

    const isQualified = reportData?.final_result === "qualified";
    const isReview =
      reportData?.final_result !== "qualified" &&
      reportData?.final_result !== "not_qualified";

    const finalStatusText = isQualified
      ? "Qualified"
      : reportData?.final_result === "not_qualified"
        ? "Not Qualified"
        : "For Review of Staff";

    const statusColor = isQualified
      ? "#059669"
      : isReview
        ? "#d97706"
        : "#dc2626";
    const statusBg = isQualified
      ? "#ecfdf5"
      : isReview
        ? "#fffbeb"
        : "#fef2f2";
    const statusBorder = isQualified
      ? "#6ee7b7"
      : isReview
        ? "#fcd34d"
        : "#fca5a5";
    const statusIcon = isQualified
      ? "ribbon"
      : isReview
        ? "time-outline"
        : "close-circle";

    return (
      // Main report card
      <View style={styles.reportCard}>
        {/* Card header */ }
        < View style = { styles.reportCardHeader } >
          <View style={styles.reportCardTitleRow}>
            <View style={styles.reportCardIconWrap}>
              <Ionicons name="sparkles" size={16} color="#fff" />
            </View>
            <Text style={styles.reportCardTitle}>AI Qualification Report</Text>
          </View>
    {
      !!reportData?.summary && (
        <Text style={styles.reportCardSub}>{reportData.summary}</Text>
      )
    }
          </View >

    {/* Card body */ }
    < View style = { styles.reportCardBody } >

      {/* ── Smart Eval Section ── */ }
  {
    detailedAiSummary && (
      <View style={styles.smartEvalContainer}>
        <Text style={styles.smartEvalTitle}>🤖 AI Smart Evaluation</Text>

        {/* Strengths */}
        {(detailedAiSummary?.strengths || []).length > 0 && (
          <View style={styles.evalSection}>
            <View style={styles.evalSectionHeader}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#059669"
              />
              <Text style={styles.evalHeadingStrengths}>Strengths</Text>
            </View>
            {detailedAiSummary.strengths.map((item, index) => (
              <View key={`s-${index}`} style={styles.evalBulletRow}>
                <View
                  style={[
                    styles.evalBulletDot,
                    { backgroundColor: "#059669" },
                  ]}
                />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Red Flags */}
        {(detailedAiSummary?.red_flags || []).length > 0 && (
          <View style={styles.evalSection}>
            <View style={styles.evalSectionHeader}>
              <Ionicons name="warning" size={14} color="#dc2626" />
              <Text style={styles.evalHeadingFlags}>Red Flags</Text>
            </View>
            {detailedAiSummary.red_flags.map((item, index) => (
              <View key={`f-${index}`} style={styles.evalBulletRow}>
                <View
                  style={[
                    styles.evalBulletDot,
                    { backgroundColor: "#dc2626" },
                  ]}
                />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary + Recommendation – stacked vertically */}
        {(detailedAiSummary?.summary ||
          detailedAiSummary?.recommendation) && (
            <View style={styles.evalInfoStack}>
              {detailedAiSummary?.summary ? (
                <View style={styles.evalInfoCard}>
                  <Text style={styles.evalInfoLabel}>Summary</Text>
                  <Text style={styles.evalInfoText}>
                    {detailedAiSummary.summary}
                  </Text>
                </View>
              ) : null}
              {detailedAiSummary?.recommendation ? (
                <View
                  style={[styles.evalInfoCard, { borderColor: "#c7d2fe" }]}
                >
                  <Text
                    style={[styles.evalInfoLabel, { color: "#4338ca" }]}
                  >
                    Recommendation
                  </Text>
                  <Text style={styles.evalInfoText}>
                    {detailedAiSummary.recommendation}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
      </View>
    )
  }

  {/* ── Empty state ── */ }
  {
    qualificationRuleEntries.length === 0 && !detailedAiSummary && (
      <View style={styles.emptyState}>
        <Ionicons
          name="document-text-outline"
          size={48}
          color="#e0e7f5"
        />
        <Text style={styles.emptyStateText}>
          Application submitted successfully.
        </Text>
      </View>
    )
  }

  {/* ── Rule Cards (vertical, mobile-safe) ── */ }
  {
    qualificationRuleEntries.length > 0 && (
      <View>
        <Text style={styles.sectionLabel}>QUALIFICATION RULES</Text>
        {qualificationRuleEntries.map(([ruleCode, result], idx) => {
          const passed = Boolean(result?.passed);
          const state =
            result?.status || (passed ? "passed" : "failed");

          let pillBg, pillText, pillIcon, accentColor;
          if (state === "for_review") {
            pillBg = "#fffbeb";
            pillText = "#b45309";
            pillIcon = "time-outline";
            accentColor = "#d97706";
          } else if (passed) {
            pillBg = "#ecfdf5";
            pillText = "#059669";
            pillIcon = "checkmark-circle";
            accentColor = "#059669";
          } else {
            pillBg = "#fef2f2";
            pillText = "#dc2626";
            pillIcon = "close-circle";
            accentColor = "#dc2626";
          }

          const formattedCode = ruleCode
            .split("_")
            .map(
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
            .join(" ");

          return (
            <View
              key={ruleCode}
              style={[
                styles.ruleCard,
                { borderLeftColor: accentColor },
              ]}
            >
              <View style={styles.ruleCardHeader}>
                <Text style={styles.ruleCardName} numberOfLines={2}>
                  {formattedCode}
                </Text>
                <View
                  style={[
                    styles.ruleStatusPill,
                    { backgroundColor: pillBg },
                  ]}
                >
                  <Ionicons
                    name={pillIcon}
                    size={12}
                    color={pillText}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[styles.ruleStatusText, { color: pillText }]}
                  >
                    {state === "for_review"
                      ? "Review"
                      : state.charAt(0).toUpperCase() + state.slice(1)}
                  </Text>
                </View>
              </View>
              {!!result?.message && (
                <Text style={styles.ruleCardFeedback}>
                  {result.message}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    )
  }
          </View >

    {/* Final Status Footer */ }
    < View
  style = {
    [
      styles.reportFooter,
      { backgroundColor: statusBg, borderTopColor: statusBorder },
            ]}
    >
            <View
              style={[
                styles.reportFooterIconWrap,
                { backgroundColor: statusColor },
              ]}
            >
              <Ionicons name={statusIcon} size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportFooterLabel}>Final Status</Text>
              <Text style={[styles.reportFooterValue, { color: statusColor }]}>
                {finalStatusText}
              </Text>
            </View>
          </View >
        </View >
    );
};

// ─── Simple AI Summary Card (renewals / grade compliance) ───────────────────
const renderAiSummaryCard = () => (
  <View style={styles.aiSummaryCard}>
    <View style={styles.aiSummaryHeader}>
      <View style={styles.aiSummaryIconWrap}>
        <Ionicons name="sparkles" size={16} color="#fff" />
      </View>
      <Text style={styles.aiSummaryTitle}>AI ANALYSIS &amp; ADVICE</Text>
    </View>
    <Text style={styles.aiSummaryText}>{`"${aiSummary}"`}</Text>
    <View style={styles.aiSummaryFooter}>
      <Text style={styles.aiSummaryFooterLeft}>
        Generated by Iskkolar AI Assistant
      </Text>
      <Text style={styles.aiSummaryFooterRight}>Verified Analysis</Text>
    </View>
  </View>
);

// ─── Root render ────────────────────────────────────────────────────────────
return (
  <ScrollView
    style={styles.container}
    contentContainerStyle={styles.contentContainer}
    showsVerticalScrollIndicator={false}
  >
    {/* ── Success hero ── */}
    <View style={styles.successCentered}>
      <View style={styles.checkIconOuter}>
        <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
      </View>
      <Text style={styles.successTitleText}>{successTitle}</Text>
      <Text style={styles.successSubtitleText}>{successMessage}</Text>
    </View>

    {/* ── Report content ── */}
    {!aiCheckingEnabled ? (
      renderManualReviewCard()
    ) : (
      <>
        {qualificationReport && renderAiReport()}
        {!qualificationReport && aiSummary && renderAiSummaryCard()}
      </>
    )}

    {/* ── CTA button ── */}
    <TouchableOpacity style={styles.actionBtn} onPress={onViewApplications}>
      <Ionicons
        name="grid-outline"
        size={18}
        color="#fff"
        style={{ marginRight: 8 }}
      />
      <Text style={styles.actionBtnText}>{viewApplicationsText}</Text>
    </TouchableOpacity>
  </ScrollView>
);
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 60,
  },

  // Success hero
  successCentered: {
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  checkIconOuter: {
    marginBottom: 14,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  successTitleText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  successSubtitleText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  // Action button
  actionBtn: {
    backgroundColor: "#4f5fc5",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    flexDirection: "row",
    shadowColor: "#4f5fc5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Shared section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 16,
  },

  // ─── Manual Review Card ──────────────────────────────────────────────
  manualReviewReport: { marginBottom: 20 },
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
  manualReviewBannerIcon: { marginRight: 12, marginTop: 2 },
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
  manualReviewSummaryCard: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  manualReviewSummaryText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 22,
  },
  manualReviewFooter: { flexDirection: "row", alignItems: "center" },
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

  // ─── AI Report wrapper ───────────────────────────────────────────────
  aiReportContainer: { marginBottom: 4 },

  // Eval-complete banner
  successBanner: {
    backgroundColor: "#eef0ff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  successIconOuter: {
    backgroundColor: "#4f5fc5",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#4f5fc5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  successBannerTitle: {
    color: "#2d3a7c",
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 2,
  },
  successBannerText: { color: "#5b6095", fontSize: 12, lineHeight: 17 },

  // Report card shell
  reportCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dbe2f6",
    overflow: "hidden",
    shadowColor: "#3d4fa0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 4,
  },
  reportCardHeader: {
    padding: 16,
    backgroundColor: "#f7f8ff",
    borderBottomWidth: 1,
    borderBottomColor: "#eef0fc",
  },
  reportCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reportCardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#4f5fc5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  reportCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2d3a7c",
  },
  reportCardSub: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 19,
  },
  reportCardBody: { padding: 14 },

  // ─── Smart Eval ──────────────────────────────────────────────────────
  smartEvalContainer: {
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8eaf6",
    backgroundColor: "#fcfcff",
    padding: 14,
  },
  smartEvalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3730a3",
    marginBottom: 12,
  },
  evalSection: { marginBottom: 14 },
  evalSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  evalHeadingStrengths: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
    marginLeft: 6,
  },
  evalHeadingFlags: {
    fontSize: 13,
    fontWeight: "700",
    color: "#dc2626",
    marginLeft: 6,
  },
  evalBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingLeft: 4,
  },
  evalBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    lineHeight: 19,
  },
  evalInfoStack: { gap: 8 },
  evalInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
  },
  evalInfoLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  evalInfoText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
  },

  // ─── Empty state ─────────────────────────────────────────────────────
  emptyState: { alignItems: "center", paddingVertical: 28 },
  emptyStateText: {
    color: "#8a94b5",
    marginTop: 10,
    fontWeight: "600",
    fontSize: 14,
  },

  // ─── Rule cards (vertical, mobile-safe) ──────────────────────────────
  ruleCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ruleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ruleCardName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  ruleStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ruleStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  ruleCardFeedback: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
  },

  // ─── Report footer ────────────────────────────────────────────────────
  reportFooter: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reportFooterIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
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
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  // ─── AI Summary card (simpler form, used in renewals etc.) ───────────
  aiSummaryCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4e8f8",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#4f5fc5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  aiSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  aiSummaryIconWrap: {
    backgroundColor: "#4f5fc5",
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  aiSummaryTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4f5fc5",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  aiSummaryText: {
    fontSize: 14,
    color: "#3d4076",
    fontStyle: "italic",
    lineHeight: 22,
    marginBottom: 14,
  },
  aiSummaryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f3fa",
    paddingTop: 10,
  },
  aiSummaryFooterLeft: { fontSize: 11, color: "#8a90ba" },
  aiSummaryFooterRight: { fontSize: 11, fontWeight: "700", color: "#2cae57" },
});
