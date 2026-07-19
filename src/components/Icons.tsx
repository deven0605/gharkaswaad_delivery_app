import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';

type IconProps = { size?: number; color?: string };

export function ArrowRightIcon({ size = 20, color = Colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12h15M13 6l6 6-6 6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowLeftIcon({ size = 20, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H5M11 6l-6 6 6 6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ShieldCheckIcon({ size = 18, color = Colors.white }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l8 3.5V11c0 5.2-3.4 9.4-8 10.9-4.6-1.5-8-5.7-8-10.9V5.5L12 2z"
        fill={color}
        opacity={0.18}
      />
      <Path
        d="M12 2l8 3.5V11c0 5.2-3.4 9.4-8 10.9-4.6-1.5-8-5.7-8-10.9V5.5L12 2z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M8.5 12l2.3 2.3L15.5 9.7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PersonIcon({ size = 18, color = Colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
      <Path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ClipboardCheckIcon({ size = 54 }: IconProps) {
  const w = size * 0.7;
  const h = size;
  return (
    <Svg width={w} height={h} viewBox="0 0 38 54">
      <Path d="M4 8a4 4 0 014-4h22a4 4 0 014 4v40a4 4 0 01-4 4H8a4 4 0 01-4-4V8z" fill={Colors.white} stroke={Colors.brandGreenMuted} strokeWidth={1.6} />
      <Path d="M13 4a3 3 0 013-3h6a3 3 0 013 3v2H13V4z" fill={Colors.brandGreenMuted} />
      <Circle cx={13} cy={17} r={3} stroke={Colors.brandGreen} strokeWidth={1.4} />
      <Path d="M20 15h11M20 19h11" stroke={Colors.border} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M9 29l2.5 2.5L16 27" stroke={Colors.online} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 29h11" stroke={Colors.border} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M9 38l2.5 2.5L16 36" stroke={Colors.online} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 38h11" stroke={Colors.border} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={30} cy={47} r={7} fill={Colors.brandGreen} />
      <Path d="M30 43.5v7M26.5 47h7" stroke={Colors.white} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function LeafIcon({ size = 16, color = Colors.brandGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 20c0-8 5-14 16-14 0 11-6 16-14 16-.8 0-1.5-.1-2-.3z" fill={color} />
      <Path d="M6 18C10 14 14 10 19 6" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

export function ForkIcon({ size = 18, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2v7M4 2v4.5a2 2 0 004 0V2M8 9v13"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SpoonIcon({ size = 18, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 2c-2 0-3.6 2-3.6 4.5S14 11 16 11s3.6-2 3.6-4.5S18 2 16 2z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M16 11v11" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function LocationPinIcon({ size = 20, color = Colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={color}
      />
      <Circle cx={12} cy={9} r={3} fill="#fff" />
    </Svg>
  );
}

export function BowlPlantIcon({ size = 60, color = Colors.brandGreen, opacity = 0.14 }: IconProps & { opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" opacity={opacity}>
      <Path d="M8 26h32a16 13 0 01-32 0z" stroke={color} strokeWidth={1.6} fill="none" />
      <Path d="M24 26V16c0-3 2-5 5-5" stroke={color} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <Path d="M24 20c-3-1-5-3-5-6" stroke={color} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function SpoonWatermarkIcon({ size = 60, color = Colors.brandGreen, opacity = 0.14 }: IconProps & { opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" opacity={opacity}>
      <Path
        d="M30 6c-4 0-7 4-7 9s3 9 7 9 7-4 7-9-3-9-7-9z"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
      />
      <Line x1={30} y1={24} x2={30} y2={44} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function ClockIcon({ size = 16, color = Colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M12 7v5l3.5 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HelpBubbleIcon({ size = 40, color = Colors.brandGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path
        d="M20 4c8.8 0 16 6.6 16 14.7 0 8-7.2 14.6-16 14.6-1.6 0-3.1-.2-4.6-.6L8 36l1.8-6.9C6.7 26.3 4 22.8 4 18.7 4 10.6 11.2 4 20 4z"
        fill={color}
      />
      <Path
        d="M17 15.5c0-1.8 1.4-3 3.2-3 1.7 0 3 1.1 3 2.7 0 1.3-.7 2-1.7 2.7-.9.6-1.3 1.1-1.3 2.1v.4"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={20.2} cy={24.5} r={1.3} fill="#fff" />
    </Svg>
  );
}

export function CloudIcon({ size = 28, color = Colors.brandGreen, opacity = 0.18 }: IconProps & { opacity?: number }) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 48 30" opacity={opacity}>
      <Path
        d="M12 24a8 8 0 010-16 10 10 0 0119 3 7 7 0 01-2 13H12z"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
      />
    </Svg>
  );
}

// ── M2 Registration & KYC (S04-S06) ─────────────────────────────────────────

export function CameraIcon({ size = 26, color = Colors.brandGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8.5A1.5 1.5 0 015.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0120 8.5v9A1.5 1.5 0 0118.5 19h-13A1.5 1.5 0 014 17.5v-9z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={3.4} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 18, color = Colors.online }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} fill={color} />
      <Path d="M8 12.3l2.6 2.6L16.3 9" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function AlertCircleIcon({ size = 18, color = Colors.error }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.8} />
      <Path d="M12 7.5v5.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={16.3} r={1.1} fill={color} />
    </Svg>
  );
}

export function IdCardIcon({ size = 22, color = Colors.brandGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11z" stroke={color} strokeWidth={1.6} />
      <Circle cx={8.4} cy={11} r={2} stroke={color} strokeWidth={1.5} />
      <Path d="M5.6 16c.5-1.6 1.7-2.4 2.8-2.4s2.3.8 2.8 2.4M14 9.5h5M14 13h5M14 16h3" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function BicycleIcon({ size = 28, color = Colors.brandGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={5.5} cy={17} r={3} stroke={color} strokeWidth={1.6} />
      <Circle cx={18.5} cy={17} r={3} stroke={color} strokeWidth={1.6} />
      <Path d="M5.5 17l4-9h4l3 9M9.5 8h3M9.5 8l3.5 5.5H18.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={14.5} cy={6.5} r={1.4} fill={color} />
    </Svg>
  );
}

export function ScooterIcon({ size = 28, color = Colors.brandGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={5.5} cy={17.5} r={2.5} stroke={color} strokeWidth={1.6} />
      <Circle cx={17.5} cy={17.5} r={2.5} stroke={color} strokeWidth={1.6} />
      <Path
        d="M5.5 17.5h3l2-6h4.5c1.7 0 3 1.3 3 3v3M10.5 11.5H8M15 6.5h2.2M16.3 6.5l1.2 4.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WalkIcon({ size = 28, color = Colors.brandGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={13.5} cy={5} r={1.8} fill={color} />
      <Path
        d="M12 8l-2.5 2 .5 4-3 4M12 8l3 1.5-1 3.5 2.5 3.5M9.5 10l3.5-.5"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
