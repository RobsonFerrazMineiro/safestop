import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@safestop/ui";

import { Button, TextField } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { LOGIN_ERROR_MESSAGE } from "@/lib/auth/errors";
import { authRoutes } from "@/lib/auth/routes";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, consumePendingRedirect, isLoading: isAuthLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useAuthGuard("unauthenticated");

  const isBusy = isAuthLoading || isSubmitting;
  const canSubmit = !isBusy && email.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signIn({ email: email.trim(), password });
      const redirect = consumePendingRedirect();
      router.replace(redirect ?? authRoutes.app);
    } catch {
      setErrorMessage(LOGIN_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContent}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>SafeStop</Text>
          <Text style={styles.subtitle}>Entre com suas credenciais</Text>

          <View style={styles.form}>
            <TextField
              accessibilityLabel="E-mail"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              disabled={isBusy}
              keyboardType="email-address"
              label="E-mail"
              placeholder="seu@email.com"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />

            <TextField
              accessibilityLabel="Senha"
              autoCapitalize="none"
              autoComplete="password"
              disabled={isBusy}
              label="Senha"
              placeholder="••••••••"
              secureTextEntry
              textContentType="password"
              value={password}
              onChangeText={setPassword}
            />

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <Button
              accessibilityLabel="Entrar"
              disabled={!canSubmit}
              loading={isSubmitting}
              style={styles.submitButton}
              onPress={() => {
                void handleSubmit();
              }}
            >
              Entrar
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing[6],
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  error: {
    color: colors.destructive,
    fontSize: typography.label.fontSize,
    textAlign: "center",
  },
  form: {
    gap: spacing[3],
  },
  keyboardView: {
    flex: 1,
  },
  loadingContent: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  submitButton: {
    marginTop: spacing[2],
  },
  subtitle: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "500",
    textAlign: "center",
  },
  title: {
    color: colors.primary,
    fontSize: typography.pageTitle.fontSize,
    fontWeight: typography.pageTitle.fontWeight,
    textAlign: "center",
  },
});
