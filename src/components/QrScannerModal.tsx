import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../theme/colors';
import { SW, SH } from '../theme/styles';
import { ArrowLeftIcon } from './Icons';

type Props = {
  onScanned: (code: string) => void;
  onClose: () => void;
};

const PICKUP_CODE_PATTERN = /\d{4}/;

// FR-5.5 — the alternative to manual pickup-code entry. Assumes the kitchen's
// QR encodes the same 4-digit pickup code as its raw payload (no Vendor-side
// QR generation exists anywhere in this workspace to confirm a richer
// format against), so this just pulls the first 4-digit run out of whatever
// was scanned.
export default function QrScannerModal({ onScanned, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanError, setScanError] = useState<string | null>(null);
  const hasScannedRef = useRef(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (hasScannedRef.current) return;
    const match = data.match(PICKUP_CODE_PATTERN);
    if (!match) {
      setScanError('QR code not recognized. Try again or enter the code manually.');
      return;
    }
    hasScannedRef.current = true;
    onScanned(match[0]);
  };

  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        {!permission ? (
          <ActivityIndicator color={Colors.white} size="large" />
        ) : !permission.granted ? (
          <View style={styles.permissionWrap}>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionSubtitle}>
              ThaliCloud Partner needs camera access to scan the pickup QR code shown by the kitchen.
            </Text>
            {permission.canAskAgain && (
              <TouchableOpacity style={styles.permissionBtn} activeOpacity={0.85} onPress={requestPermission}>
                <Text style={styles.permissionBtnText}>Allow Camera Access</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeLink} activeOpacity={0.7} onPress={onClose}>
              <Text style={styles.closeLinkText}>Enter code manually instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
            <View style={styles.overlay}>
              <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={onClose}>
                <ArrowLeftIcon size={18} color={Colors.white} />
              </TouchableOpacity>
              <View style={styles.frame} />
              <Text style={styles.overlayHint}>Point your camera at the kitchen's pickup QR code</Text>
              {scanError && <Text style={styles.overlayError}>{scanError}</Text>}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const FRAME_SIZE = Math.min(SW, SH) * 0.6;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  overlayHint: {
    marginTop: 20,
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  overlayError: {
    marginTop: 10,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.error,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  permissionWrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginBottom: 16,
  },
  permissionBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.white,
  },
  closeLink: {
    paddingVertical: 8,
  },
  closeLinkText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.white,
    textDecorationLine: 'underline',
  },
});
