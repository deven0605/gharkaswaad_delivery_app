import React, { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import BackButton from '../components/BackButton';
import { PhoneCallIcon } from '../components/Icons';
import { callNumber } from '../services/mapsLink';
import { extractApiErrorMessage } from '../store/authApi';
import {
  IssueCategory,
  useGetDeliveryHistoryQuery,
  useGetFaqsQuery,
  useGetMyIssuesQuery,
  useGetSupportConfigQuery,
  useReportIssueMutation,
} from '../store/deliveryApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'HelpSupport'>;

type Tab = 'FAQ' | 'REPORT';

const TABS: { key: Tab; label: string }[] = [
  { key: 'FAQ', label: 'FAQs' },
  { key: 'REPORT', label: 'Report an Issue' },
];

const CATEGORY_OPTIONS: { key: IssueCategory; label: string }[] = [
  { key: 'PAYOUT', label: 'Payout' },
  { key: 'COD_REMITTANCE', label: 'COD Remittance' },
  { key: 'DOCUMENT_REUPLOAD', label: 'Document Re-upload' },
  { key: 'APP_PERMISSIONS', label: 'App Permissions' },
  { key: 'DELIVERY_ISSUE', label: 'Delivery Issue' },
  { key: 'OTHER', label: 'Other' },
];

const CATEGORY_LABEL: Record<IssueCategory, string> = CATEGORY_OPTIONS.reduce(
  (acc, opt) => ({ ...acc, [opt.key]: opt.label }),
  {} as Record<IssueCategory, string>
);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// M13 — Help & Support. FAQ tab (FR-13.1) and Report an Issue tab (FR-13.2,
// optionally tied to a recent delivery), plus a Call Support shortcut that
// backs the SOS button on the M5/M6 in-delivery screens (FR-13.3).
export default function HelpSupportScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('FAQ');
  const { data: faqs, isLoading: isFaqsLoading } = useGetFaqsQuery();
  const { data: supportConfig } = useGetSupportConfigQuery();
  const { data: recentDeliveries } = useGetDeliveryHistoryQuery(0);
  const { data: myIssues, isLoading: isIssuesLoading } = useGetMyIssuesQuery();
  const [reportIssue, { isLoading: isSubmitting }] = useReportIssueMutation();

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [category, setCategory] = useState<IssueCategory | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isValid = category !== null && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || !category || isSubmitting) return;
    setError(null);
    setSubmitted(false);
    try {
      await reportIssue({ category, description: description.trim(), assignmentId: assignmentId ?? undefined }).unwrap();
      setSubmitted(true);
      setCategory(null);
      setAssignmentId(null);
      setDescription('');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not submit your report. Please try again.'));
    }
  };

  const handleCallSupport = () => {
    if (supportConfig?.supportPhoneNumber) callNumber(supportConfig.supportPhoneNumber);
  };

  return (
    <ImageBackground source={require('../../assets/images/bg-pattern.png')} style={styles.root} resizeMode="cover">
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Help & Support</Text>

          <View style={styles.tabRow}>
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, tab === t.key && styles.tabActive]}
                activeOpacity={0.85}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'FAQ' ? (
            isFaqsLoading ? (
              <ActivityIndicator color={Colors.primary} style={styles.loading} />
            ) : (
              <View style={styles.faqWrap}>
                {faqs?.map((faq) => {
                  const expanded = expandedFaq === faq.id;
                  return (
                    <TouchableOpacity
                      key={faq.id}
                      style={styles.faqCard}
                      activeOpacity={0.85}
                      onPress={() => setExpandedFaq(expanded ? null : faq.id)}
                    >
                      <View style={styles.faqHeaderRow}>
                        <View style={styles.faqQuestionWrap}>
                          <Text style={styles.faqCategory}>{faq.category}</Text>
                          <Text style={styles.faqQuestion}>{faq.question}</Text>
                        </View>
                        <Text style={styles.faqChevron}>{expanded ? '−' : '+'}</Text>
                      </View>
                      {expanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          ) : (
            <>
              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={styles.chipRow}>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.chip, category === opt.key && styles.chipActive]}
                      activeOpacity={0.85}
                      onPress={() => setCategory(opt.key)}
                    >
                      <Text style={[styles.chipText, category === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {!!recentDeliveries?.content.length && (
                  <>
                    <Text style={styles.fieldLabel}>Related delivery (optional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deliveryScroll}>
                      {recentDeliveries.content.map((d) => (
                        <TouchableOpacity
                          key={d.assignmentId}
                          style={[styles.deliveryChip, assignmentId === d.assignmentId && styles.chipActive]}
                          activeOpacity={0.85}
                          onPress={() => setAssignmentId(assignmentId === d.assignmentId ? null : d.assignmentId)}
                        >
                          <Text
                            style={[styles.chipText, assignmentId === d.assignmentId && styles.chipTextActive]}
                            numberOfLines={1}
                          >
                            #{d.orderId} · {d.kitchenName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                <Text style={styles.fieldLabel}>Description *</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Tell us what happened..."
                  placeholderTextColor={Colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                  maxLength={1000}
                />

                {error && <Text style={styles.errorText}>{error}</Text>}
                {submitted && <Text style={styles.successText}>Your report was submitted. Thank you.</Text>}

                <TouchableOpacity
                  style={[styles.submitBtn, (!isValid || isSubmitting) && styles.submitBtnDisabled]}
                  activeOpacity={0.85}
                  disabled={!isValid || isSubmitting}
                  onPress={handleSubmit}
                >
                  {isSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Submit Report</Text>}
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>My Reports</Text>
              {isIssuesLoading ? (
                <ActivityIndicator color={Colors.primary} style={styles.loading} />
              ) : !myIssues || myIssues.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>You haven't reported any issues yet.</Text>
                </View>
              ) : (
                <View style={styles.issuesWrap}>
                  {myIssues.map((issue) => (
                    <View key={issue.id} style={styles.issueRow}>
                      <View style={styles.issueHeaderRow}>
                        <Text style={styles.issueCategory}>{CATEGORY_LABEL[issue.category]}</Text>
                        <Text style={styles.issueDate}>{formatDate(issue.createdAt)}</Text>
                      </View>
                      <Text style={styles.issueDescription}>{issue.description}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* FR-13.3 — same Call Support action the SOS button uses mid-delivery. */}
          <TouchableOpacity style={styles.callSupportBtn} activeOpacity={0.85} onPress={handleCallSupport}>
            <PhoneCallIcon size={16} color={Colors.white} />
            <Text style={styles.callSupportBtnText}>Call Support</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
  },
  loading: {
    marginTop: 24,
    marginBottom: 24,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brandGreen,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginBottom: 16,
  },

  tabRow: {
    flexDirection: 'row',
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.brandGreen,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },

  faqWrap: {
    width: SW - 48,
  },
  faqCard: {
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 16,
    marginBottom: 10,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  faqQuestionWrap: {
    flex: 1,
    marginRight: 10,
  },
  faqCategory: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.brandGreenMuted,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  faqQuestion: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  faqChevron: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.brandGreen,
  },
  faqAnswer: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 10,
  },

  formCard: {
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 16,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
  },
  chipActive: {
    borderColor: Colors.brandGreen,
    backgroundColor: Colors.brandGreen,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },

  deliveryScroll: {
    marginBottom: 4,
  },
  deliveryChip: {
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    marginRight: 8,
    maxWidth: 180,
  },

  textArea: {
    width: '100%',
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 10,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12.5,
    marginBottom: 8,
  },
  successText: {
    color: Colors.online,
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 8,
  },

  submitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.white,
  },

  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: Colors.brandGreen,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginBottom: 10,
  },
  emptyCard: {
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  issuesWrap: {
    width: SW - 48,
  },
  issueRow: {
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    padding: 14,
    marginBottom: 10,
  },
  issueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  issueCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brandGreen,
  },
  issueDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  issueDescription: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },

  callSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: SW - 48,
    backgroundColor: Colors.error,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  callSupportBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
