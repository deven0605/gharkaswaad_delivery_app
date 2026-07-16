import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { SW } from '../theme/styles';
import ScooterRiderIllustration from './ScooterRiderIllustration';
import { LocationPinIcon } from './Icons';

const W = SW;
const H = SW * 0.62;

function Building({ x, w, h }: { x: number; w: number; h: number }) {
  return <Rect x={x} y={H - h} width={w} height={h} rx={3} fill={Colors.illoTan} opacity={0.55} />;
}

function Tree({ x }: { x: number }) {
  return (
    <>
      <Rect x={x - 2} y={H - 26} width={4} height={16} fill={Colors.brandGreenMuted} opacity={0.7} />
      <Circle cx={x} cy={H - 34} r={14} fill={Colors.brandGreenMuted} opacity={0.5} />
    </>
  );
}

/** Bottom illustration for the splash screen: skyline, road, trees, a rider en route
 * to a customer pin, connected by a dashed path. */
export default function CityscapeIllustration() {
  return (
    <View style={styles.container}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* skyline */}
        <Building x={-10} w={70} h={90} />
        <Building x={55} w={55} h={130} />
        <Building x={105} w={65} h={100} />
        <Building x={W - 150} w={60} h={110} />
        <Building x={W - 95} w={55} h={140} />
        <Building x={W - 45} w={70} h={95} />

        {/* trees */}
        <Tree x={40} />
        <Tree x={W - 40} />
        <Tree x={W * 0.28} />

        {/* winding road */}
        <Path
          d={`M0 ${H - 6} C ${W * 0.25} ${H - 30}, ${W * 0.4} ${H + 8}, ${W * 0.55} ${H - 14} S ${W * 0.85} ${H - 34}, ${W} ${H - 10}`}
          stroke={Colors.illoTan}
          strokeWidth={26}
          fill="none"
          opacity={0.65}
        />

        {/* dashed route from rider to drop pin */}
        <Path
          d={`M${W * 0.62} ${H - 40} C ${W * 0.72} ${H - 70}, ${W * 0.8} ${H - 90}, ${W * 0.86} ${H - 118}`}
          stroke={Colors.primary}
          strokeWidth={2.5}
          strokeDasharray="6 6"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      <View style={styles.pin}>
        <LocationPinIcon size={30} />
      </View>

      <View style={styles.rider}>
        <ScooterRiderIllustration width={W * 0.34} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: W,
    height: H,
  },
  pin: {
    position: 'absolute',
    right: W * 0.11,
    top: H * 0.06,
  },
  rider: {
    position: 'absolute',
    left: W * 0.3,
    bottom: 4,
  },
});
