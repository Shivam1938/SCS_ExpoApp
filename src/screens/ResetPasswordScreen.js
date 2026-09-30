import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen, Button, Header, Press } from "../components/ui";
import { colors, radius } from "../theme";
import { supabase } from "../services/supabase";

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
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

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
    <Screen style={{ backgroundColor: "#fff" }}>
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
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: colors.text,
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            Set new password
          </Text>

          <Text
            style={{
              color: colors.muted,
              fontSize: 16,
              lineHeight: 22,
              marginBottom: 28,
            }}
          >
            Enter a new password for your Sunshine Computer Solution account.
          </Text>

          <Text style={{ fontWeight: "700", marginBottom: 8 }}>
            New password
          </Text>

          <View
            style={{
              backgroundColor: "#F4F7F8",
              borderRadius: radius.md,
              paddingHorizontal: 15,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              placeholderTextColor="#9AA3A9"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={{
                flex: 1,
                paddingVertical: 15,
                fontSize: 16,
              }}
            />

            <Press
              onPress={() => setShowPassword((shown) => !shown)}
              style={{ padding: 4 }}
            >
              <Text style={{ color: colors.teal, fontWeight: "700" }}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Press>
          </View>

          <Text style={{ fontWeight: "700", marginBottom: 8 }}>
            Confirm password
          </Text>

          <View
            style={{
              backgroundColor: "#F4F7F8",
              borderRadius: radius.md,
              paddingHorizontal: 15,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Enter password again"
              placeholderTextColor="#9AA3A9"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              style={{
                flex: 1,
                paddingVertical: 15,
                fontSize: 16,
              }}
            />

            <Press
              onPress={() =>
                setShowConfirmPassword((shown) => !shown)
              }
              style={{ padding: 4 }}
            >
              <Text style={{ color: colors.teal, fontWeight: "700" }}>
                {showConfirmPassword ? "Hide" : "Show"}
              </Text>
            </Press>
          </View>

          {!!error && (
            <Text
              accessibilityRole="alert"
              style={{
                color: "#C0392B",
                marginBottom: 12,
                lineHeight: 20,
              }}
            >
              {error}
            </Text>
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