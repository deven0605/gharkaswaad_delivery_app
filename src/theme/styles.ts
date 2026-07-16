import { Dimensions, StyleSheet } from 'react-native';

export const SW = Dimensions.get('window').width;
export const SH = Dimensions.get('window').height;

export const commonStyles = StyleSheet.create({
  root: {
    flex: 1,
    width: SW,
  },
  safe: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
});
