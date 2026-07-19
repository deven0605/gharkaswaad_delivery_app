import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';
import { SW } from '../theme/styles';

type Props = {
  step: number; // 1-indexed
  total: number;
  label: string;
};

/** "Step X of N" + dot/line progress track, shared by the M2 registration screens (S04-S06). */
export default function StepProgressHeader({ step, total, label }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.stepText}>
        Step {step} of {total}
      </Text>
      <View style={styles.track}>
        {Array.from({ length: total }, (_, i) => (
          <React.Fragment key={i}>
            <View style={[styles.dot, i < step && styles.dotFilled]} />
            {i < total - 1 && <View style={[styles.line, i < step - 1 && styles.lineFilled]} />}
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SW - 48,
    marginBottom: 18,
  },
  stepText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1.6,
    borderColor: Colors.brandGreenMuted,
  },
  dotFilled: {
    backgroundColor: Colors.brandGreen,
    borderColor: Colors.brandGreen,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  lineFilled: {
    backgroundColor: Colors.brandGreen,
  },
  label: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.brandGreen,
  },
});
