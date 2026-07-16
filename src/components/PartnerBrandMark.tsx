import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { SW } from '../theme/styles';
import { LeafIcon, ForkIcon, SpoonIcon } from './Icons';
import ScooterRiderIllustration from './ScooterRiderIllustration';

const BADGE_SIZE = SW * 0.56;

export default function PartnerBrandMark() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Svg width={BADGE_SIZE} height={BADGE_SIZE} viewBox={`0 0 ${BADGE_SIZE} ${BADGE_SIZE}`} style={StyleSheet.absoluteFill}>
          <Circle
            cx={BADGE_SIZE / 2}
            cy={BADGE_SIZE / 2}
            r={BADGE_SIZE / 2 - 3}
            stroke={Colors.primary}
            strokeWidth={2.5}
            fill="none"
          />
        </Svg>
        <ScooterRiderIllustration width={BADGE_SIZE * 0.72} />
      </View>

      <View style={styles.wordmarkRow}>
        <Text style={styles.wordmarkLine1}>Ghar ka</Text>
        <LeafIcon size={22} color={Colors.brandGreenMuted} />
      </View>
      <Text style={styles.wordmarkLine2}>S'waad</Text>

      <View style={styles.divider}>
        <ForkIcon size={16} />
        <View style={styles.dividerLine} />
        <SpoonIcon size={16} />
      </View>

      <View style={styles.partnerRow}>
        <View style={styles.partnerLine} />
        <Text style={styles.partnerText}>PARTNER</Text>
        <View style={styles.partnerLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wordmarkLine1: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.brandGreen,
  },
  wordmarkLine2: {
    fontSize: 46,
    fontWeight: '800',
    fontStyle: 'italic',
    color: Colors.primary,
    marginTop: -8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  dividerLine: {
    width: SW * 0.3,
    height: 1.5,
    backgroundColor: Colors.textPrimary,
    opacity: 0.4,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  partnerLine: {
    width: 24,
    height: 1.5,
    backgroundColor: Colors.brandGreen,
  },
  partnerText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
    color: Colors.brandGreen,
  },
});
