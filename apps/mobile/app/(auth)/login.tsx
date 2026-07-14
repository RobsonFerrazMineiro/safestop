import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
          <ActivityIndicator size="large" color="#F97316" />
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
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              accessibilityLabel="E-mail"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isBusy}
              keyboardType="email-address"
              placeholder="seu@email.com"
              placeholderTextColor="#6B7280"
              style={styles.input}
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              accessibilityLabel="Senha"
              autoCapitalize="none"
              autoComplete="password"
              editable={!isBusy}
              placeholder="••••••••"
              placeholderTextColor="#6B7280"
              secureTextEntry
              style={styles.input}
              textContentType="password"
              value={password}
              onChangeText={setPassword}
            />

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <Pressable
              accessibilityLabel="Entrar"
              accessibilityRole="button"
              disabled={isBusy || !email.trim() || !password}
              style={({ pressed }) => [
                styles.button,
                (isBusy || !email.trim() || !password) && styles.buttonDisabled,
                pressed && !isBusy && styles.buttonPressed,
              ]}
              onPress={() => {
                void handleSubmit();
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0F1115" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1115",
  },
  keyboardView: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#F97316",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#F9FAFB",
    textAlign: "center",
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D1D5DB",
  },
  input: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  error: {
    color: "#F87171",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#0F1115",
    fontSize: 16,
    fontWeight: "700",
  },
});
