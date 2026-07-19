import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../config/env';
import type { RootState } from './store';
import { PartnerLifecycleState } from './authSlice';

export type VehicleType = 'BICYCLE' | 'BIKE' | 'ON_FOOT';
export type DocumentType = 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VEHICLE_RC';
export type DocumentSide = 'FRONT' | 'BACK';
export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

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
  lifecycleState: PartnerLifecycleState;
  registrationComplete: boolean;
  documents: DocumentResponse[];
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

export interface VehicleDetailsPayload {
  vehicleType: VehicleType;
  vehicleNumber?: string;
  vehicleModel?: string;
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
  tagTypes: ['PartnerProfile'],
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
    // FR-2.2/FR-2.3
    saveVehicleDetails: builder.mutation<PartnerProfileResponse, VehicleDetailsPayload>({
      query: (body) => ({ url: '/vehicle', method: 'PUT', body }),
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
  }),
});

export const {
  useGetPartnerProfileQuery,
  useLazyGetPartnerProfileQuery,
  useSavePersonalDetailsMutation,
  useSaveVehicleDetailsMutation,
  useUploadDocumentMutation,
  useSubmitApplicationMutation,
} = deliveryApi;
