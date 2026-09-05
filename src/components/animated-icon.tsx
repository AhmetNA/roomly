import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors } from '@/constants/theme';

const DURATION = 900;

const revealKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 0.8 }],
    opacity: 0,
  },
  35: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(0.7),
  },
  75: {
    opacity: 1,
  },
  100: {
    opacity: 0,
    easing: Easing.out(Easing.ease),
  },
});

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const mark = (
    <View style={styles.mark}>
      <Text style={styles.markText}>R</Text>
    </View>
  );

  return animate ? (
    <Animated.View
      entering={revealKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}
    >
      {mark}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}
    >
      {mark}
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    zIndex: 1000,
  },
  mark: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.accent,
  },
  markText: {
    fontSize: 44,
    fontWeight: '700',
    color: '#ffffff',
  },
});
