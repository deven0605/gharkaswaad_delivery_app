import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../theme/colors';
import { SW } from '../theme/styles';
import { AlertCircleIcon, CheckCircleIcon, IdCardIcon } from './Icons';

export type DocumentRowStatus = 'idle' | 'uploading' | 'uploaded' | 'failed';

type Props = {
  label: string;
  status: DocumentRowStatus;
  errorMessage?: string;
  onPress: () => void;
};

/** One document line in the S06 Document Upload screen — tap to capture/choose,
 * shows upload state, and doubles as the FR-2.7 retry affordance on failure. */
export default function DocumentUploadRow({ label, status, errorMessage, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.row, status === 'failed' && styles.rowError]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={status === 'uploading'}
    >
      <View style={styles.iconWrap}>
        <IdCardIcon size={20} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {status === 'failed' && (
          <Text style={styles.errorText}>{errorMessage ?? 'Upload failed — tap to retry'}</Text>
        )}
      </View>
      {status === 'uploading' && <ActivityIndicator color={Colors.primary} />}
      {status === 'uploaded' && <CheckCircleIcon size={22} />}
      {status === 'failed' && <AlertCircleIcon size={22} />}
      {status === 'idle' && <Text style={styles.uploadCta}>Upload</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SW - 48,
    borderWidth: 1.4,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  rowError: {
    borderColor: Colors.error,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  errorText: {
    fontSize: 11.5,
    color: Colors.error,
    marginTop: 2,
  },
  uploadCta: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
