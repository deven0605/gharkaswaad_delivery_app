import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';

type Props = {
  emoji: string;
  title: string;
  subtitle: string;
};

/** Shared shell for milestone stub screens (Registration/UnderReview/Home)
 * that aren't built yet — keeps the OTP flow navigable to a real screen
 * instead of a dead end, ready to be swapped for the full screen per-milestone. */
export default function PlaceholderScreen({ emoji, title, subtitle }: Props) {
  return (
    <ImageBackground
      source={require('../../assets/images/bg-pattern.png')}
      style={styles.root}
      resizeMode="cover"
    >
      <StatusBar style="dark" />
      <SafeAreaView style={commonStyles.safe}>
        <View style={styles.content}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    width: SW,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.brandGreen,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
