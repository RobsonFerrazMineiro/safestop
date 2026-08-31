import type { OccurrenceSeverity } from "@safestop/types";
import { OCCURRENCE_SEVERITIES } from "@safestop/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, getOccurrenceSeverityChip, radius, spacing, typography } from "@safestop/ui";

import { getOccurrenceSeverityLabel } from "@/features/occurrences/utils/occurrence-labels";

type SeveritySelectorProps = {
  value: OccurrenceSeverity;
  onChange: (severity: OccurrenceSeverity) => void;
  disabled?: boolean;
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
            const tokens = getOccurrenceSeverityChip(severity);

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
                    borderColor: isSelected ? tokens.border : colors.border,
                    backgroundColor: isSelected ? tokens.background : colors.surfaceElevated,
                  },
                  pressed && !disabled && styles.optionPressed,
                ]}
                onPress={() => {
                  onChange(severity);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isSelected ? tokens.foreground : colors.foregroundMuted },
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
    gap: spacing[2],
  },
  option: {
    alignItems: "center",
    borderRadius: radius.button,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionText: {
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
    textAlign: "center",
  },
  optionTextSelected: {
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: spacing[2],
  },
});
