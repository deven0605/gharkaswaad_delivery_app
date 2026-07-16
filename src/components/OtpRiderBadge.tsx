import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { SW } from '../theme/styles';
import ScooterRiderIllustration from './ScooterRiderIllustration';
import { LocationPinIcon } from './Icons';

type Props = { size?: number };

/** Ringed hero badge for S03 — rider mid-route with a drop pin and motion
 * lines, echoing the badge circle used on the Splash brand mark. */
export default function OtpRiderBadge({ size = SW * 0.6 }: Props) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - 2} stroke={Colors.primary} strokeWidth={2.5} fill="none" />
      </Svg>

      <View style={styles.speedLines}>
        <View style={[styles.speedLine, { width: 20 }]} />
        <View style={[styles.speedLine, { width: 14 }]} />
        <View style={[styles.speedLine, { width: 20 }]} />
      </View>

      <ScooterRiderIllustration width={size * 0.62} />

      <View style={styles.pin}>
        <LocationPinIcon size={26} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedLines: {
    position: 'absolute',
    left: 6,
    top: '46%',
    gap: 6,
  },
  speedLine: {
    height: 2.4,
    borderRadius: 2,
    backgroundColor: Colors.brandGreenMuted,
    opacity: 0.6,
  },
  pin: {
    position: 'absolute',
    right: 8,
    top: '30%',
  },
});
