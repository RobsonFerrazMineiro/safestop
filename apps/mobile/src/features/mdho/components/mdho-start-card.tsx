import { StyleSheet, Text } from "react-native";
import { spacing, statusChip, typography } from "@safestop/ui";

import { Button, Card } from "@/components/ui";

type MdhoStartCardProps = {
  isOnline: boolean;
  isStarting: boolean;
  onStart: () => Promise<void>;
};

export function MdhoStartCard({ isOnline, isStarting, onStart }: MdhoStartCardProps) {
  return (
    <Card style={styles.card} variant="muted">
      <Text style={styles.intro}>
        A Interdição Oficial está confirmada. Inicie a Avaliação Técnica (MDHO) para registrar a
        análise estruturada.
      </Text>

      {!isOnline ? (
        <Text style={styles.offline}>Conecte-se para continuar a Avaliação Técnica (MDHO).</Text>
      ) : null}

      <Button
        accessibilityLabel={
          isStarting ? "Iniciando Avaliação Técnica" : "Iniciar Avaliação Técnica (MDHO)"
        }
        disabled={!isOnline}
        loading={isStarting}
        onPress={() => {
          void onStart();
        }}
      >
        Iniciar Avaliação Técnica (MDHO)
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: statusChip.info.background,
    borderColor: statusChip.info.border,
    gap: spacing[3],
  },
  intro: {
    color: statusChip.info.foreground,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
  },
  offline: {
    color: statusChip.info.foreground,
    fontSize: typography.caption.fontSize,
  },
});
