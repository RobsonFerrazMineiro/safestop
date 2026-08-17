import { Alert, Platform } from "react-native";

type ConfirmActionOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function confirmAction(options: ConfirmActionOptions): Promise<boolean> {
  const { title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar" } = options;

  if (Platform.OS === "web") {
    const browserGlobal = globalThis as typeof globalThis & {
      confirm?: (message?: string) => boolean;
    };

    return Promise.resolve(browserGlobal.confirm?.(`${title}\n\n${message}`) ?? false);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, onPress: () => resolve(true) },
    ]);
  });
}
