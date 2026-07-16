import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../theme/colors';
import { ArrowLeftIcon } from './Icons';

type Props = { onPress: () => void };

/** Top-left "< Back" affordance shared by every Auth stack screen. */
export default function BackButton({ onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.iconBox}>
        <ArrowLeftIcon size={18} color={Colors.textPrimary} />
      </View>
      <Text style={styles.text}>Back</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
