import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { Screen, Button, Header, Press, ThemedText, ThemedTextInput } from "../components/ui";
import { colors, radius } from "../theme";
import { api } from '../services/api';

export default function ResetPasswordScreen({ navigation }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updatePassword = async () => {
    if (loading) return;

    setError("");

    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);

    try {
      await api.updatePassword(password);

      Alert.alert(
        "Password updated",
        "Your password has been changed successfully.",
        [
          {
            text: "Continue",
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              }),
          },
        ],
      );
    } catch (error) {
      setError(
        error?.message || "Could not update your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ backgroundColor: colors.surface }}>
      <Header
        title="Reset password"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            paddingBottom: 36,
          }}
        >
          <ThemedText
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: colors.text,
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            Set new password
          </ThemedText>

          <ThemedText
            style={{
              color: colors.muted,
              fontSize: 16,
              lineHeight: 22,
              marginBottom: 28,
            }}
          >
            Enter a new password for your Sunshine Computer Solution account.
          </ThemedText>

          <ThemedText style={{ fontWeight: "700", marginBottom: 8 }}>
            New password
          </ThemedText>

          <View
            style={{
              backgroundColor: colors.input,
              borderRadius: radius.md,
              paddingHorizontal: 15,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <ThemedTextInput
              value={password}
              onChangeThemedText={setPassword}
              placeholder="Enter new password"
              placeholderThemedTextColor={colors.muted}
              secureThemedTextEntry={!showPassword}
              autoCapitalize="none"
              style={{
  flex: 1,
  paddingVertical: 15,
  fontSize: 16,
  color: colors.text,
}}
            />

            <Press
              onPress={() => setShowPassword((shown) => !shown)}
              style={{ padding: 4 }}
            >
              <ThemedText style={{ color: colors.teal, fontWeight: "700" }}>
                {showPassword ? "Hide" : "Show"}
              </ThemedText>
            </Press>
          </View>

          <ThemedText style={{ fontWeight: "700", marginBottom: 8 }}>
            Confirm password
          </ThemedText>

          <View
            style={{
              backgroundColor: colors.input,
              borderRadius: radius.md,
              paddingHorizontal: 15,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <ThemedTextInput
              value={confirmPassword}
              onChangeThemedText={setConfirmPassword}
              placeholder="Enter password again"
              placeholderThemedTextColor={colors.muted}
              secureThemedTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              style={{
  flex: 1,
  paddingVertical: 15,
  fontSize: 16,
  color: colors.text,
}}
            />

            <Press
              onPress={() =>
                setShowConfirmPassword((shown) => !shown)
              }
              style={{ padding: 4 }}
            >
              <ThemedText style={{ color: colors.teal, fontWeight: "700" }}>
                {showConfirmPassword ? "Hide" : "Show"}
              </ThemedText>
            </Press>
          </View>

          {!!error && (
            <ThemedText
              accessibilityRole="alert"
              style={{
                color: "#C0392B",
                marginBottom: 12,
                lineHeight: 20,
              }}
            >
              {error}
            </ThemedText>
          )}

          <Button
            title={loading ? "Updating password…" : "Update password"}
            disabled={loading}
            onPress={updatePassword}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}