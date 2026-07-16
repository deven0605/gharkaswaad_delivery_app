import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors } from '../theme/colors';

type Props = { width?: number };

/** Side-view delivery rider on a scooter, rear delivery box facing left. Reused in the
 * splash badge (S01) and the cityscape strip beneath it. */
export default function ScooterRiderIllustration({ width = 140 }: Props) {
  const height = width * 0.72;
  return (
    <Svg width={width} height={height} viewBox="0 0 140 100">
      {/* rear wheel */}
      <Circle cx={30} cy={82} r={13} fill="#2A2A2A" />
      <Circle cx={30} cy={82} r={5.5} fill="#5B5B5B" />
      {/* front wheel */}
      <Circle cx={112} cy={82} r={13} fill="#2A2A2A" />
      <Circle cx={112} cy={82} r={5.5} fill="#5B5B5B" />

      {/* scooter body */}
      <Path
        d="M22 82c0-10 8-16 18-16h14c4-10 12-16 22-16h8c6 0 9 4 9 9 0 3-2 5-2 9 6 0 12 3 15 9 3 5 4 11 4 13"
        stroke={Colors.brandGreenMuted}
        strokeWidth={9}
        strokeLinecap="round"
        fill="none"
      />
      {/* seat */}
      <Path d="M64 58h20a5 5 0 015 5v3H64z" fill={Colors.brandGreenDark} />
      {/* headlight */}
      <Circle cx={124} cy={64} r={4} fill={Colors.primary} />

      {/* delivery box (rear) */}
      <Rect x={4} y={44} width={30} height={30} rx={5} fill={Colors.brandGreenDark} />
      <Circle cx={19} cy={59} r={10} fill="#FBF3E4" />
      <Path d="M13 60l6-5.5 6 5.5" stroke={Colors.brandGreen} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x={16} y={60} width={6} height={5} fill={Colors.brandGreen} />
      <Path d="M19 54c-2 2-2 4 0 6" stroke={Colors.primary} strokeWidth={1.4} strokeLinecap="round" fill="none" />

      {/* rider legs */}
      <Path d="M78 66c4 4 6 9 4 16h9" stroke={Colors.brandGreenDark} strokeWidth={7} strokeLinecap="round" fill="none" />
      {/* rider torso */}
      <Rect x={68} y={30} width={20} height={30} rx={9} fill={Colors.primary} />
      {/* rider arm to handlebar */}
      <Path d="M84 38c8 2 14 6 20 8" stroke={Colors.primary} strokeWidth={6.5} strokeLinecap="round" fill="none" />
      <Circle cx={106} cy={48} r={3.4} fill={Colors.brandGreenDark} />
      {/* handlebar stem */}
      <Path d="M108 48c4-6 8-12 10-20" stroke={Colors.brandGreenMuted} strokeWidth={5} strokeLinecap="round" fill="none" />

      {/* head + helmet */}
      <Circle cx={80} cy={22} r={9} fill="#F2C199" />
      <Path
        d="M70 21a10 10 0 0120-1c0 2-1 3-3 3H73c-2 0-3-1-3-2z"
        fill={Colors.brandGreenDark}
      />
      <Rect x={70} y={20} width={20} height={4} rx={2} fill={Colors.brandGreenMuted} />
    </Svg>
  );
}
