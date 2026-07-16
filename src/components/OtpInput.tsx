import React, { useRef } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { Colors } from '../theme/colors';

type Props = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  boxSize?: number;
  autoFocus?: boolean;
};

/** Segmented digit-box OTP entry. Auto-advances on input and steps back to the
 * previous box on backspace from an empty box. */
export default function OtpInput({ length = 4, value, onChange, boxSize = 64, autoFocus }: Props) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const handleChangeText = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(''));
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={[styles.box, { width: boxSize, height: boxSize }]}
          value={digit}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          placeholder="—"
          placeholderTextColor={Colors.textSecondary}
          selectTextOnFocus
          autoFocus={autoFocus && index === 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    borderWidth: 1.4,
    borderColor: Colors.brandGreenMuted,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
