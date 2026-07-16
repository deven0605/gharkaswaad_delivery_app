import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { commonStyles, SW } from '../theme/styles';
import { AuthStackParamList } from '../navigation/types';
import { ArrowRightIcon } from '../components/Icons';
import PartnerBrandMark from '../components/PartnerBrandMark';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

// S01 — Splash & Onboarding (M1, FR-1.1 entry point).
export default function SplashScreen({ navigation }: Props) {
  return (
    <ImageBackground
      source={require('../../assets/images/bg-pattern.png')}
      style={styles.root}
      resizeMode="cover"
    >
      <StatusBar style="dark" />

      <SafeAreaView style={commonStyles.safe}>
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/scooter.png')}
            style={styles.scooterBanner}
            resizeMode="cover"
          />

          <View style={styles.taglineBlock}>
            <Text style={styles.tagline}>Deliver. Earn. Repeat.</Text>
            <Text style={styles.subtext}>
              Deliver happiness at every doorstep{'\n'}and grow with{' '}
              <Text style={styles.subtextBold}>Ghar ka Swaad</Text>.
            </Text>
          </View>

          <View style={commonStyles.spacer} />

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.getStartedBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Login', { mode: 'register' })}
            >
              <View style={styles.getStartedIconWrap}>
                <ArrowRightIcon size={18} color={Colors.primary} />
              </View>
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <View style={styles.loginRow}>
              <Text style={styles.alreadyText}>Already a partner? </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Login', { mode: 'login' })}
                style={styles.loginBtn}
              >
                <Text style={styles.loginText}>Log In</Text>
                <ArrowRightIcon size={15} color={Colors.brandGreen} />
              </TouchableOpacity>
            </View>
          </View>
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
    paddingTop: 50,
  },

  scooterBanner: {
    width: SW - 48,
    height: (SW - 30) * 0.90,
    borderRadius: 20,
    marginBottom: 10,
  },

  taglineBlock: {
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 30,
  },
  tagline: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  subtextBold: {
    fontWeight: '700',
    color: Colors.brandGreen,
  },

  bottomSection: {
    width: '100%',
    paddingHorizontal: 26,
    paddingBottom: 20,
    alignItems: 'center',
  },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  getStartedText: {
    flex: 1,
    textAlign: 'center',
    marginRight: 42,
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 18,
    marginBottom: 14,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    marginHorizontal: 14,
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alreadyText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brandGreen,
  },
});
