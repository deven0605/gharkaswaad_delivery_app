import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { PickedFile } from '../store/deliveryApi';

// FR-2.6 — client-side validation: file size <= 5 MB, format JPG/PNG/PDF.
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function isFileSizeValid(sizeBytes: number | undefined): boolean {
  return sizeBytes === undefined || sizeBytes <= MAX_FILE_SIZE_BYTES;
}

/** FR-2.1 — front-camera selfie capture, used for pickup/drop identity verification. */
export async function captureSelfie(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Camera permission needed', 'Please allow camera access to take your selfie.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.front,
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: true,
    aspect: [1, 1],
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  if (!isFileSizeValid(asset.fileSize)) {
    Alert.alert('Photo too large', 'Please retake with a smaller photo (max 5 MB).');
    return null;
  }
  if (!asset.base64) return null;
  return {
    uri: asset.uri,
    name: asset.fileName ?? `selfie-${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
    base64: asset.base64,
  };
}

/** FR-2.5 — "front (and back) photo capture" via the camera. */
export async function captureDocumentPhoto(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Camera permission needed', 'Please allow camera access to capture the document.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  if (!isFileSizeValid(asset.fileSize)) {
    Alert.alert('Photo too large', 'Please retake — the maximum size is 5 MB.');
    return null;
  }
  if (!asset.base64) return null;
  return {
    uri: asset.uri,
    name: asset.fileName ?? `document-${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
    base64: asset.base64,
  };
}

/** FR-2.5/FR-2.6 — "gallery upload", supporting JPG/PNG/PDF via the system file picker. */
export async function pickDocumentFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ALLOWED_MIME_TYPES,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  if (!isFileSizeValid(asset.size)) {
    Alert.alert('File too large', 'Please choose a file under 5 MB.');
    return null;
  }
  if (asset.mimeType && !ALLOWED_MIME_TYPES.includes(asset.mimeType)) {
    Alert.alert('Unsupported format', 'Please choose a JPG, PNG, or PDF file.');
    return null;
  }
  const base64 = await new File(asset.uri).base64();
  return { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream', base64 };
}

/** Local-date formatting (never UTC — toISOString() can shift the calendar day). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}
