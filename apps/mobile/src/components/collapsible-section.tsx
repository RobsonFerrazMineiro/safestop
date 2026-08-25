import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CollapsibleSectionProps = {
  summary: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  accessibilityLabel?: string;
};

/**
 * Disclosure colapsável para blocos da Seção I (Detalhe da PP): MDHO concluído
 * e referência IMS registrada. Puramente apresentacional.
 */
export function CollapsibleSection({
  summary,
  defaultOpen = false,
  children,
  accessibilityLabel,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        style={({ pressed }) => [styles.summaryRow, pressed && styles.summaryPressed]}
        onPress={() => {
          setIsOpen((current) => !current);
        }}
      >
        <View style={styles.summaryContent}>{summary}</View>
        <Text style={styles.chevron}>{isOpen ? "▾" : "▸"}</Text>
      </Pressable>

      {isOpen ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chevron: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "700",
  },
  container: {
    gap: 12,
  },
  content: {
    gap: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryPressed: {
    opacity: 0.85,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
});
