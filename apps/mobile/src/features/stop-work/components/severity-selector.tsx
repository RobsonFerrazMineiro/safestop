import type { OccurrenceSeverity } from "@safestop/types";
import { OCCURRENCE_SEVERITIES } from "@safestop/types";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getOccurrenceSeverityLabel } from "@/features/occurrences/utils/occurrence-labels";

type SeveritySelectorProps = {
  value: OccurrenceSeverity;
  onChange: (severity: OccurrenceSeverity) => void;
  disabled?: boolean;
};

const SEVERITY_STYLES: Record<
  OccurrenceSeverity,
  { border: string; background: string; text: string }
> = {
  LOW: { border: "#4B5563", background: "#1F2937", text: "#D1D5DB" },
  MEDIUM: { border: "#F59E0B", background: "#422006", text: "#FCD34D" },
  HIGH: { border: "#F97316", background: "#431407", text: "#FDBA74" },
  CRITICAL: { border: "#DC2626", background: "#450A0A", text: "#FCA5A5" },
};

export function SeveritySelector({ value, onChange, disabled = false }: SeveritySelectorProps) {
  const rows: OccurrenceSeverity[][] = [
    [OCCURRENCE_SEVERITIES[0], OCCURRENCE_SEVERITIES[1]],
    [OCCURRENCE_SEVERITIES[2], OCCURRENCE_SEVERITIES[3]],
  ];

  return (
    <View style={styles.grid}>
      {rows.map((pair, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {pair.map((severity) => {
            const isSelected = value === severity;
            const tokens = SEVERITY_STYLES[severity];

            return (
              <Pressable
                key={severity}
                accessibilityLabel={getOccurrenceSeverityLabel(severity)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected, disabled }}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.option,
                  {
                    borderColor: isSelected ? tokens.border : "#374151",
                    backgroundColor: isSelected ? tokens.background : "#1F2937",
                  },
                  isSelected && styles.optionSelected,
                  pressed && !disabled && styles.optionPressed,
                ]}
                onPress={() => {
                  onChange(severity);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isSelected ? tokens.text : "#D1D5DB" },
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {getOccurrenceSeverityLabel(severity)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 8,
  },
  option: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 2,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionSelected: {
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  optionTextSelected: {
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
});
