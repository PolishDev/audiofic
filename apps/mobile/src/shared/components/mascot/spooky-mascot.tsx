import React, { useEffect } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type SpookyPose =
  | 'idle'
  | 'excited'
  | 'listening'
  | 'mono-dark'
  | 'mono-light';

const SPOOKY_IMAGES: Record<SpookyPose, any> = {
  idle: require('@/assets/images/mascot/spooky-idle.png'),
  excited: require('@/assets/images/mascot/spooky-excited.png'),
  listening: require('@/assets/images/mascot/spooky-listening.png'),
  'mono-dark': require('@/assets/images/mascot/spooky-mono-dark.png'),
  'mono-light': require('@/assets/images/mascot/spooky-mono-light.png'),
};

export interface SpookyMascotProps {
  pose?: SpookyPose;
  size?: number;
  animated?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SpookyMascot({
  pose = 'idle',
  size = 160,
  animated = true,
  onPress,
  style,
}: SpookyMascotProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else {
      translateY.value = 0;
    }
  }, [animated, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const content = (
    <Animated.View style={[{ width: size, height: size }, animated && animatedStyle, style]}>
      <Image
        source={SPOOKY_IMAGES[pose]}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return content;
}
