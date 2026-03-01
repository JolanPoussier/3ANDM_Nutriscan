import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";

type Props = {
  size?: number;
  color?: string;
};

export default function LoadingDots({ size = 8, color }: Props) {
  const { theme } = useAppTheme();
  const dotColor = color ?? theme.textInverse;
  const a1 = useRef(new Animated.Value(0.35)).current;
  const a2 = useRef(new Animated.Value(0.35)).current;
  const a3 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const makePulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 320,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.35,
            duration: 320,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

    const p1 = makePulse(a1, 0);
    const p2 = makePulse(a2, 120);
    const p3 = makePulse(a3, 240);

    p1.start();
    p2.start();
    p3.start();

    return () => {
      p1.stop();
      p2.stop();
      p3.stop();
    };
  }, [a1, a2, a3]);

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: dotColor, opacity: a1 }]} />
      <Animated.View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: dotColor, opacity: a2 }]} />
      <Animated.View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: dotColor, opacity: a3 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: {},
});
