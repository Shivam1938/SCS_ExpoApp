import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  Easing,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';
import { useTheme } from '../context/ThemeContext';

export const ThemedText = React.forwardRef(function ThemedText(
  { style, ...props },
  ref,
) {
  return (
    <Text
      ref={ref}
      {...props}
      style={[{ color: colors.text }, style]}
    />
  );
});

export const ThemedTextInput = React.forwardRef(function ThemedTextInput(
  { style, placeholderTextColor, ...props },
  ref,
) {
  return (
    <TextInput
      ref={ref}
      {...props}
      placeholderTextColor={placeholderTextColor || colors.muted}
      style={[{ color: colors.text }, style]}
    />
  );
});

const APressable = Animated.createAnimatedComponent(Pressable);

export function Press({
  onPress,
  style,
  children,
  disabled,
  accessibilityLabel,
  accessibilityRole = 'button',
}) {
  const s = useRef(new Animated.Value(1)).current;

  const to = (v) =>
    Animated.spring(s, {
      toValue: v,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <APressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(0.97)}
      onPressOut={() => to(1)}
      style={[
        style,
        {
          transform: [{ scale: s }],
        },
      ]}
    >
      {children}
    </APressable>
  );
}

export function FadeIn({ delay = 0, y = 16, style, children }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 350,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: v,
          transform: [
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [y, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'orange',
  style,
  disabled,
  icon,
}) {
  const bg =
    variant === 'teal'
      ? colors.teal
      : variant === 'outline'
        ? colors.surface
        : variant === 'white'
          ? colors.surface
          : colors.orange;

  const fg =
    variant === 'outline'
      ? colors.text
      : variant === 'white'
        ? colors.orange
        : '#fff';

  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.5 : 1,
        },
        variant === 'outline' && {
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadow,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={20}
          color={fg}
          style={{ marginRight: 8 }}
        />
      ) : null}

      <ThemedText style={[styles.btnText, { color: fg }]}>
        {title}
      </ThemedText>
    </Press>
  );
}

export function Card({ style, children }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function IconBox({
  name,
  tint = colors.tealSoft,
  color = colors.teal,
  size = 44,
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: tint,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        name={name || 'construct-outline'}
        size={size * 0.5}
        color={color}
      />
    </View>
  );
}

export function Pill({
  text,
  tint = colors.tealSoft,
  color = colors.teal,
  style,
}) {
  return (
    <View
      style={[
        {
          backgroundColor: tint,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: radius.pill,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <ThemedText
        style={{
          color,
          fontWeight: '700',
          fontSize: 13,
        }}
      >
        {text}
      </ThemedText>
    </View>
  );
}

export function Header({ title, onBack, right }) {
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <View style={{ width: 44 }}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={[
              styles.back,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.text}
            />
          </Pressable>
        ) : null}
      </View>

      <ThemedText
        numberOfLines={1}
        style={[
          styles.headerTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </ThemedText>

      <View
        style={{
          width: 44,
          alignItems: 'flex-end',
        }}
      >
        {right}
      </View>
    </View>
  );
}

export function Screen({
  children,
  style,
  edges = ['top', 'bottom'],
}) {
  return (
    <SafeAreaView
      edges={edges}
      style={[
        {
          flex: 1,
          backgroundColor: colors.bg,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}

export function Logo({ size = 22 }) {
  const { resolved } = useTheme();
  return (
    <Image
      source={resolved === 'dark' ? require('../logo/logo-dark.png') : require('../logo/logo.png')}
      style={{
        width: size * 5.25,
        height: size * 2.1,
        resizeMode: 'contain',
      }}
    />
  );
}

export const styles = StyleSheet.create({
  btn: {
    minHeight: 54,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  btnText: {
    fontSize: 16,
    fontWeight: '800',
  },

  card: {
    borderRadius: radius.lg,
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.bg,
  },

  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },

  h1: {
    fontSize: 24,
    fontWeight: '800',
  },

  h2: {
    fontSize: 18,
    fontWeight: '800',
  },

  muted: {
    fontSize: 14,
  },
});