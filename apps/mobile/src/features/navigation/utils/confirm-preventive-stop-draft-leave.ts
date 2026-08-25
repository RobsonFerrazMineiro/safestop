import { Alert } from "react-native";

const LEAVE_TITLE = "Sair sem concluir a paralisação?";
const LEAVE_MESSAGE =
  "Seu preenchimento foi salvo neste dispositivo e continuará disponível quando você voltar para Nova Paralisação.";
const LEAVE_CONFIRM = "Salvar e sair";
const LEAVE_CANCEL = "Continuar preenchendo";

export function confirmPreventiveStopDraftLeave(onConfirm: () => void | Promise<void>): void {
  Alert.alert(LEAVE_TITLE, LEAVE_MESSAGE, [
    { text: LEAVE_CANCEL, style: "cancel" },
    {
      text: LEAVE_CONFIRM,
      onPress: () => {
        void Promise.resolve(onConfirm());
      },
    },
  ]);
}
