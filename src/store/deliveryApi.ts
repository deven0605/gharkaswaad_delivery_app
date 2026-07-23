import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../config/env';
import type { RootState } from './store';
import { PartnerLifecycleState } from './authSlice';

export type VehicleType = 'BICYCLE' | 'BIKE' | 'ON_FOOT';
export type DocumentType = 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VEHICLE_RC';
export type DocumentSide = 'FRONT' | 'BACK';
export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type DutyStatus = 'OFFLINE' | 'ONLINE' | 'ON_DELIVERY';
export type PaymentMethod = 'PREPAID' | 'COD';
export type RemittanceMethod = 'UPI' | 'SUPPORT_POINT';
export type EarningsPeriod = 'TODAY' | 'WEEK' | 'MONTH';
export type PayoutStatus = 'PROCESSING' | 'PAID' | 'FAILED';
// M13 — Help & Support (FR-13.2).
export type IssueCategory = 'PAYOUT' | 'COD_REMITTANCE' | 'DOCUMENT_REUPLOAD' | 'APP_PERMISSIONS' | 'DELIVERY_ISSUE' | 'OTHER';
export type AssignmentStatus =
  | 'OFFERED'
  | 'ACCEPTED'
  | 'ARRIVED_AT_KITCHEN'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED_AT_DROP'
  | 'DELIVERED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED_BY_PARTNER'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_KITCHEN'
  | 'COMPLETED';

export interface DocumentResponse {
  id: string;
  type: DocumentType;
  side: DocumentSide | null;
  fileUrl: string;
  status: DocumentStatus;
  rejectReason: string | null;
  uploadedAt: string;
}

export interface PartnerProfileResponse {
  id: string;
  phone: string;
  name: string | null;
  dob: string | null;
  gender: string | null;
  email: string | null;
  profilePhotoUrl: string | null;
  vehicleType: VehicleType | null;
  vehicleNumber: string | null;
  vehicleModel: string | null;
  bankAccountHolderName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  upiId: string | null;
  lifecycleState: PartnerLifecycleState;
  registrationComplete: boolean;
  dutyStatus: DutyStatus;
  rating: number | null;
  documents: DocumentResponse[];
}

export interface ActiveDeliveryResponse {
  assignmentId: string;
  orderId: string;
  status: string;
  kitchenName: string;
  dropLocality: string;
  estimatedPayoutPaise: number;
  estimatedDistanceKm: number;
  itemCount: number;
  kitchenLatitude: number;
  kitchenLongitude: number;
  kitchenContactNumber: string;
  dropLatitude: number;
  dropLongitude: number;
  customerContactNumber: string;
}

// M4 — FR-4.1/FR-4.2. Same shape whether it arrives via the
// /topic/partner/{id}/request STOMP push or the GET .../assignments/current
// resume call.
export interface AssignmentResponse {
  id: string;
  orderId: string;
  kitchenName: string;
  kitchenDistanceKm: number;
  dropLocality: string;
  estimatedPayoutPaise: number;
  estimatedDistanceKm: number;
  itemCount: number;
  // M5 — Pickup Navigation & Verification. pickupCode is intentionally not
  // part of this shape (FR-5.5): the kitchen shows it to the partner, the
  // app never fetches it.
  kitchenLatitude: number;
  kitchenLongitude: number;
  kitchenContactNumber: string;
  arrivedAtKitchenAt: string | null;
  pickedUpAt: string | null;
  // M6 — Drop Navigation & Delivery Confirmation. deliveryOtp is intentionally
  // not part of this shape (FR-6.4): it reaches the customer via SMS/push,
  // the app never fetches it.
  dropLatitude: number;
  dropLongitude: number;
  customerContactNumber: string;
  outForDeliveryAt: string | null;
  arrivedAtDropAt: string | null;
  contactlessDrop: boolean;
  proofOfDeliveryPhotoUrl: string | null;
  deliveredAt: string | null;
  // M7 — Cash on Delivery (COD) Collection. deliveryOtp-style secrecy doesn't
  // apply here — codAmountPaise is meant to be shown to the partner (FR-7.1).
  paymentMethod: PaymentMethod;
  codAmountPaise: number | null;
  codCollected: boolean;
  codCollectedAt: string | null;
  status: AssignmentStatus;
  offeredAt: string;
  expiresAt: string;
}

// M7/FR-7.3
export interface CashInHandResponse {
  cashInHandPaise: number;
  remittanceThresholdPaise: number;
  canRemit: boolean;
}

// M8.1/FR-8.2 — per-delivery breakdown row.
export interface DeliveryEarningResponse {
  assignmentId: string;
  orderId: string;
  kitchenName: string;
  dropLocality: string;
  deliveredAt: string;
  baseFarePaise: number;
  distanceFarePaise: number;
  incentivePaise: number;
  totalPayoutPaise: number;
}

// M8.1/FR-8.1
export interface EarningsSummaryResponse {
  period: EarningsPeriod;
  periodStart: string;
  periodEnd: string;
  totalEarningsPaise: number;
  deliveryCount: number;
  averagePayoutPaise: number;
  deliveries: DeliveryEarningResponse[];
}

// M8.2/FR-8.4
export interface PayoutResponse {
  id: string;
  amountPaise: number;
  destinationReference: string;
  status: PayoutStatus;
  periodStart: string;
  periodEnd: string;
  initiatedAt: string;
  paidAt: string | null;
}

// M9 — Delivery History (FR-9.1). Only terminal statuses ever appear here —
// DECLINED/EXPIRED offers were never engaged with, so they're not "deliveries".
export type DeliveryHistoryStatus = 'DELIVERED' | 'CANCELLED_BY_PARTNER' | 'CANCELLED_BY_CUSTOMER' | 'CANCELLED_BY_KITCHEN';

export interface DeliveryHistoryItemResponse {
  assignmentId: string;
  orderId: string;
  kitchenName: string;
  dropLocality: string;
  payoutPaise: number;
  status: DeliveryHistoryStatus;
  completedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

// M9 — Delivery History detail (FR-9.2).
export interface DeliveryHistoryDetailResponse {
  assignmentId: string;
  orderId: string;
  status: DeliveryHistoryStatus;
  kitchenName: string;
  kitchenLatitude: number;
  kitchenLongitude: number;
  dropLocality: string;
  dropLatitude: number;
  dropLongitude: number;
  estimatedDistanceKm: number;
  itemCount: number;
  offeredAt: string;
  acceptedAt: string | null;
  arrivedAtKitchenAt: string | null;
  pickedUpAt: string | null;
  outForDeliveryAt: string | null;
  arrivedAtDropAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  baseFarePaise: number;
  distanceFarePaise: number;
  incentivePaise: number;
  totalPayoutPaise: number;
  paymentMethod: PaymentMethod;
  codAmountPaise: number | null;
}

// M12 — Notifications (FR-12.1-FR-12.3).
export type NotificationType =
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'NEW_ASSIGNMENT'
  | 'ORDER_CANCELLED'
  | 'PAYOUT_PROCESSED'
  | 'RATING_ALERT'
  | 'ANNOUNCEMENT';

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

// M13 — Help & Support (FR-13.1).
export interface FaqResponse {
  id: string;
  category: string;
  question: string;
  answer: string;
}

// M13 — Help & Support (FR-13.3). Backs the SOS/"Call Support" shortcut.
export interface SupportConfigResponse {
  supportPhoneNumber: string;
  supportEmail: string;
}

// M13 — Help & Support (FR-13.2).
export interface SupportIssueResponse {
  id: string;
  category: IssueCategory;
  description: string;
  assignmentId: string | null;
  createdAt: string;
}

export interface ReportIssuePayload {
  category: IssueCategory;
  description: string;
  assignmentId?: string;
}

export interface DashboardSummaryResponse {
  dutyStatus: DutyStatus;
  todayDeliveries: number;
  todayEarningsPaise: number;
  rating: number | null;
  // FR-10.3 — true once `rating` drops below the server's configurable
  // advisory threshold; drives the Home dashboard's advisory banner.
  lowRatingWarning: boolean;
  activeDelivery: ActiveDeliveryResponse | null;
}

// M10 — Ratings & Feedback (FR-10.2). Recent customer feedback tied to an
// individual delivery, read-only.
export interface DeliveryFeedbackResponse {
  assignmentId: string;
  orderId: string;
  kitchenName: string;
  dropLocality: string;
  rating: number;
  feedback: string | null;
  ratedAt: string;
}

/**
 * A file picked via expo-image-picker/expo-document-picker. Sent to the
 * backend as base64 JSON rather than multipart/form-data — see toBase64Part.
 */
export interface PickedFile {
  uri: string;
  name: string;
  type: string;
  base64: string;
}

export interface PersonalDetailsPayload {
  fullName: string;
  dob: string; // ISO yyyy-MM-dd
  gender?: string;
  email?: string;
  profilePhoto: PickedFile;
}

// M11/FR-11.3 — both fields optional and independent, unlike PersonalDetailsPayload.
export interface EditProfilePayload {
  email?: string;
  profilePhoto?: PickedFile;
}

export interface VehicleDetailsPayload {
  vehicleType: VehicleType;
  vehicleNumber?: string;
  vehicleModel?: string;
}

export interface BankDetailsPayload {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

export interface UploadDocumentPayload {
  type: DocumentType;
  side?: DocumentSide;
  file: PickedFile;
}
/**
 * expo/fetch (the global `fetch` as of Expo SDK 56+) can't send multipart
 * FormData file parts (throws "Unsupported FormDataPart implementation" —
 * expo/expo#33134), so files travel as base64 inside the JSON body instead.
 */
interface Base64FilePart {
  fileName: string;
  contentType: string;
  data: string;
}

function toBase64Part(file: PickedFile): Base64FilePart {
  return { fileName: file.name, contentType: file.type, data: file.base64 };
}

// M2 — Registration & KYC Onboarding. Every endpoint acts on the caller's own
// profile, resolved server-side from the JWT (mirrors GET /api/vendor/me).
export const deliveryApi = createApi({
  reducerPath: 'deliveryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/delivery/partners/me`,
    prepareHeaders: (headers, { getState }) => {
      const accessToken = (getState() as RootState).auth.accessToken;
      if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
      return headers;
    },
  }),
  tagTypes: ['PartnerProfile', 'DashboardSummary', 'CurrentAssignment', 'CashInHand', 'Earnings', 'Payouts', 'DeliveryHistory', 'Notifications', 'UnreadCount', 'SupportIssues'],
  endpoints: (builder) => ({
    getPartnerProfile: builder.query<PartnerProfileResponse, void>({
      query: () => ({ url: '' }),
      transformResponse: (response: { data: PartnerProfileResponse }) => response.data,
      providesTags: ['PartnerProfile'],
    }),
    // FR-2.1
    savePersonalDetails: builder.mutation<PartnerProfileResponse, PersonalDetailsPayload>({
      query: ({ fullName, dob, gender, email, profilePhoto }) => ({
        url: '/personal-details',
        method: 'PUT',
        body: { fullName, dob, gender, email, profilePhoto: toBase64Part(profilePhoto) },
      }),
      transformResponse: (response: { data: PartnerProfileResponse }) => response.data,
      invalidatesTags: ['PartnerProfile'],
    }),
    // M11/FR-11.3 — post-registration edit of only email/profile photo, both optional.
    editProfile: builder.mutation<PartnerProfileResponse, EditProfilePayload>({
      query: ({ email, profilePhoto }) => ({
        url: '/profile',
        method: 'PUT',
        body: { email, profilePhoto: profilePhoto ? toBase64Part(profilePhoto) : undefined },
      }),
      transformResponse: (response: { data: PartnerProfileResponse }) => response.data,
      invalidatesTags: ['PartnerProfile'],
    }),
    // FR-2.2/FR-2.3
    saveVehicleDetails: builder.mutation<PartnerProfileResponse, VehicleDetailsPayload>({
      query: (body) => ({ url: '/vehicle', method: 'PUT', body }),
      transformResponse: (response: { data: PartnerProfileResponse }) => response.data,
      invalidatesTags: ['PartnerProfile'],
    }),
    // FR-2.8 — either the bank trio or a UPI id is sufficient.
    saveBankDetails: builder.mutation<PartnerProfileResponse, BankDetailsPayload>({
      query: (body) => ({ url: '/bank-details', method: 'PUT', body }),
      transformResponse: (response: { data: PartnerProfileResponse }) => response.data,
      invalidatesTags: ['PartnerProfile'],
    }),
    // FR-2.4-FR-2.7 — re-uploading the same (type, side) replaces the prior attempt.
    uploadDocument: builder.mutation<DocumentResponse, UploadDocumentPayload>({
      query: ({ type, side, file }) => ({
        url: '/documents',
        method: 'POST',
        body: { type, side, file: toBase64Part(file) },
      }),
      transformResponse: (response: { data: DocumentResponse }) => response.data,
      invalidatesTags: ['PartnerProfile'],
    }),
    // FR-2.9 — finalizes registration, transitions to PENDING_VERIFICATION.
    submitApplication: builder.mutation<PartnerProfileResponse, void>({
      query: () => ({ url: '/submit', method: 'POST' }),
      transformResponse: (response: { data: PartnerProfileResponse }) => response.data,
      invalidatesTags: ['PartnerProfile'],
    }),
    // FR-3.1/FR-3.4
    updateDutyStatus: builder.mutation<PartnerProfileResponse, { status: 'ONLINE' | 'OFFLINE' }>({
      query: (body) => ({ url: '/duty-status', method: 'PUT', body }),
      transformResponse: (response: { data: PartnerProfileResponse }) => response.data,
      invalidatesTags: ['PartnerProfile', 'DashboardSummary'],
    }),
    // FR-3.6/FR-3.8
    getDashboardSummary: builder.query<DashboardSummaryResponse, void>({
      query: () => ({ url: '/dashboard-summary' }),
      transformResponse: (response: { data: DashboardSummaryResponse }) => response.data,
      providesTags: ['DashboardSummary'],
    }),
    // M4.1 — resume support; the backend omits `data` entirely (not `null`)
    // when there's nothing active, hence the `?? null` coercion.
    getCurrentAssignment: builder.query<AssignmentResponse | null, void>({
      query: () => ({ url: '/assignments/current' }),
      transformResponse: (response: { data?: AssignmentResponse }) => response.data ?? null,
      providesTags: ['CurrentAssignment'],
    }),
    // FR-4.4
    acceptAssignment: builder.mutation<AssignmentResponse, { assignmentId: string }>({
      query: ({ assignmentId }) => ({ url: `/assignments/${assignmentId}/accept`, method: 'POST' }),
      transformResponse: (response: { data: AssignmentResponse }) => response.data,
      invalidatesTags: ['CurrentAssignment', 'DashboardSummary'],
    }),
    // FR-4.4/FR-4.5
    declineAssignment: builder.mutation<AssignmentResponse, { assignmentId: string }>({
      query: ({ assignmentId }) => ({ url: `/assignments/${assignmentId}/decline`, method: 'POST' }),
      transformResponse: (response: { data: AssignmentResponse }) => response.data,
      invalidatesTags: ['CurrentAssignment', 'DashboardSummary'],
    }),
    // FR-5.4 — location is best-effort (may be omitted for the manual-delay fallback).
    arriveAtKitchen: builder.mutation<AssignmentResponse, { assignmentId: string; latitude?: number; longitude?: number }>({
      query: ({ assignmentId, latitude, longitude }) => ({
        url: `/assignments/${assignmentId}/arrive`,
        method: 'POST',
        body: { latitude, longitude },
      }),
      transformResponse: (response: { data: AssignmentResponse }) => response.data,
      invalidatesTags: ['CurrentAssignment', 'DashboardSummary'],
    }),
    // FR-5.5/FR-5.6
    verifyPickupCode: builder.mutation<AssignmentResponse, { assignmentId: string; code: string }>({
      query: ({ assignmentId, code }) => ({
        url: `/assignments/${assignmentId}/verify-pickup`,
        method: 'POST',
        body: { code },
      }),
      transformResponse: (response: { data: AssignmentResponse }) => response.data,
      invalidatesTags: ['CurrentAssignment', 'DashboardSummary'],
    }),
    // FR-6.1 — idempotent; DropNavigationScreen calls this on mount.
    startDropNavigation: builder.mutation<AssignmentResponse, { assignmentId: string }>({
      query: ({ assignmentId }) => ({ url: `/assignments/${assignmentId}/start-drop-navigation`, method: 'POST' }),
      transformResponse: (response: { data: AssignmentResponse }) => response.data,
      invalidatesTags: ['CurrentAssignment', 'DashboardSummary'],
    }),
    // FR-6.3 — location is best-effort (may be omitted for the manual-delay fallback).
    arriveAtDrop: builder.mutation<AssignmentResponse, { assignmentId: string; latitude?: number; longitude?: number }>({
      query: ({ assignmentId, latitude, longitude }) => ({
        url: `/assignments/${assignmentId}/arrive-drop`,
        method: 'POST',
        body: { latitude, longitude },
      }),
      transformResponse: (response: { data: AssignmentResponse }) => response.data,
      invalidatesTags: ['CurrentAssignment', 'DashboardSummary'],
    }),
    // FR-6.5 — Contactless Drop proof-of-delivery photo.
    uploadDropPhoto: builder.mutation<AssignmentResponse, { assignmentId: string; file: PickedFile }>({
      query: ({ assignmentId, file }) => ({
        url: `/assignments/${assignmentId}/drop-photo`,
        method: 'POST',
        body: { file: toBase64Part(file) },
      }),
      transformResponse: (response: { data: AssignmentResponse }) => response.data,
      invalidatesTags: ['CurrentAssignment'],
    }),
    // FR-6.4/FR-6.5/FR-6.6/FR-6.7 — either otp (customer present) or contactless
    // (proof photo already uploaded via uploadDropPhoto) must be provided.
    verifyDelivery: builder.mutation<AssignmentResponse, { assignmentId: string; otp?: string; contactless?: boolean }>({
      query: ({ assignmentId, otp, contactless }) => ({
        url: `/assignments/${assignmentId}/verify-delivery`,
        method: 'POST',
        body: { otp, contactless },
      }),
      transformResponse: (response: { data: AssignmentResponse }) => response.data,
      invalidatesTags: ['CurrentAssignment', 'DashboardSummary'],
    }),
    // FR-4.8
    cancelAssignment: builder.mutation<AssignmentResponse, { assignmentId: string; reason: string }>({
      query: ({ assignmentId, reason }) => ({
        url: `/assignments/${assignmentId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      transformResponse: (response: { data: AssignmentResponse }) => response.data,
      invalidatesTags: ['CurrentAssignment', 'DashboardSummary'],
    }),
    // FR-7.1/FR-7.2 — credits the COD amount to Cash in Hand; verifyDelivery
    // rejects OTP/contactless confirmation on a COD order until this runs.
    markCashCollected: builder.mutation<AssignmentResponse, { assignmentId: string }>({
      query: ({ assignmentId }) => ({ url: `/assignments/${assignmentId}/collect-cash`, method: 'POST' }),
      transformResponse: (response: { data: AssignmentResponse }) => response.data,
      invalidatesTags: ['CurrentAssignment', 'DashboardSummary', 'CashInHand'],
    }),
    // FR-7.3
    getCashInHand: builder.query<CashInHandResponse, void>({
      query: () => ({ url: '/cash-in-hand' }),
      transformResponse: (response: { data: CashInHandResponse }) => response.data,
      providesTags: ['CashInHand'],
    }),
    // FR-7.3/FR-7.4 — Phase 1: manual Ops confirmation, no live UPI/support-point
    // integration; this just records the partner's declared remittance.
    remitCash: builder.mutation<CashInHandResponse, { method: RemittanceMethod }>({
      query: (body) => ({ url: '/cash-in-hand/remit', method: 'POST', body }),
      transformResponse: (response: { data: CashInHandResponse }) => response.data,
      invalidatesTags: ['CashInHand'],
    }),
    // FR-8.1/FR-8.2
    getEarningsSummary: builder.query<EarningsSummaryResponse, EarningsPeriod>({
      query: (period) => ({ url: `/earnings?period=${period.toLowerCase()}` }),
      transformResponse: (response: { data: EarningsSummaryResponse }) => response.data,
      providesTags: ['Earnings'],
    }),
    // FR-8.4/FR-8.5 — read-only; there's no instant-payout request action in Phase 1.
    getPayoutHistory: builder.query<PayoutResponse[], void>({
      query: () => ({ url: '/payouts' }),
      transformResponse: (response: { data: PayoutResponse[] }) => response.data,
      providesTags: ['Payouts'],
    }),
    // M9/FR-9.1/FR-9.3 — 20 deliveries per page.
    getDeliveryHistory: builder.query<PageResponse<DeliveryHistoryItemResponse>, number>({
      query: (page) => ({ url: `/deliveries/history?page=${page}&size=20` }),
      transformResponse: (response: { data: PageResponse<DeliveryHistoryItemResponse> }) => response.data,
      providesTags: ['DeliveryHistory'],
    }),
    // M9/FR-9.2
    getDeliveryHistoryDetail: builder.query<DeliveryHistoryDetailResponse, string>({
      query: (assignmentId) => ({ url: `/deliveries/history/${assignmentId}` }),
      transformResponse: (response: { data: DeliveryHistoryDetailResponse }) => response.data,
    }),
    // M10/FR-10.2 — read-only, most recent 20 rated deliveries.
    getRecentFeedback: builder.query<DeliveryFeedbackResponse[], void>({
      query: () => ({ url: '/feedback' }),
      transformResponse: (response: { data: DeliveryFeedbackResponse[] }) => response.data,
    }),
    // M12/FR-12.3 — 20 per page, most recent first.
    getNotifications: builder.query<PageResponse<NotificationResponse>, number>({
      query: (page) => ({ url: `/notifications?page=${page}&size=20` }),
      transformResponse: (response: { data: PageResponse<NotificationResponse> }) => response.data,
      providesTags: ['Notifications'],
    }),
    // M12/FR-12.2 — drives the Home bell's unread badge.
    getUnreadNotificationCount: builder.query<number, void>({
      query: () => ({ url: '/notifications/unread-count' }),
      transformResponse: (response: { data: { unreadCount: number } }) => response.data.unreadCount,
      providesTags: ['UnreadCount'],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notifications', 'UnreadCount'],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notifications', 'UnreadCount'],
    }),
    // M13/FR-13.1 — static content.
    getFaqs: builder.query<FaqResponse[], void>({
      query: () => ({ url: '/support/faqs' }),
      transformResponse: (response: { data: FaqResponse[] }) => response.data,
    }),
    // M13/FR-13.3 — backs the SOS/"Call Support" shortcut.
    getSupportConfig: builder.query<SupportConfigResponse, void>({
      query: () => ({ url: '/support/config' }),
      transformResponse: (response: { data: SupportConfigResponse }) => response.data,
    }),
    // M13/FR-13.2
    reportIssue: builder.mutation<SupportIssueResponse, ReportIssuePayload>({
      query: (body) => ({ url: '/support/issues', method: 'POST', body }),
      transformResponse: (response: { data: SupportIssueResponse }) => response.data,
      invalidatesTags: ['SupportIssues'],
    }),
    getMyIssues: builder.query<SupportIssueResponse[], void>({
      query: () => ({ url: '/support/issues' }),
      transformResponse: (response: { data: SupportIssueResponse[] }) => response.data,
      providesTags: ['SupportIssues'],
    }),
  }),
});

export const {
  useGetPartnerProfileQuery,
  useLazyGetPartnerProfileQuery,
  useSavePersonalDetailsMutation,
  useEditProfileMutation,
  useSaveVehicleDetailsMutation,
  useSaveBankDetailsMutation,
  useUploadDocumentMutation,
  useSubmitApplicationMutation,
  useUpdateDutyStatusMutation,
  useGetDashboardSummaryQuery,
  useGetCurrentAssignmentQuery,
  useAcceptAssignmentMutation,
  useDeclineAssignmentMutation,
  useArriveAtKitchenMutation,
  useVerifyPickupCodeMutation,
  useStartDropNavigationMutation,
  useArriveAtDropMutation,
  useUploadDropPhotoMutation,
  useVerifyDeliveryMutation,
  useCancelAssignmentMutation,
  useMarkCashCollectedMutation,
  useGetCashInHandQuery,
  useRemitCashMutation,
  useGetEarningsSummaryQuery,
  useGetPayoutHistoryQuery,
  useGetDeliveryHistoryQuery,
  useGetDeliveryHistoryDetailQuery,
  useGetRecentFeedbackQuery,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetFaqsQuery,
  useGetSupportConfigQuery,
  useReportIssueMutation,
  useGetMyIssuesQuery,
} = deliveryApi;
