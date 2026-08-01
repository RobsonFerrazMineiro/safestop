import { Pressable, StyleSheet, Text, View } from "react-native";

type OptionSelectItem = {
  id: string;
  label: string;
  hint?: string;
};

type OptionSelectListProps = {
  items: OptionSelectItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
  noneOptionLabel?: string;
};

export function OptionSelectList({
  items,
  selectedId,
  onSelect,
  disabled = false,
  emptyMessage,
  noneOptionLabel,
}: OptionSelectListProps) {
  if (items.length === 0) {
    return emptyMessage ? <Text style={styles.empty}>{emptyMessage}</Text> : null;
  }

  const options = noneOptionLabel ? [{ id: "", label: noneOptionLabel }, ...items] : items;

  return (
    <View style={styles.list}>
      {options.map((item) => {
        const isSelected = selectedId === item.id;

        return (
          <Pressable
            key={item.id || "__none__"}
            accessibilityLabel={item.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled }}
            disabled={disabled}
            style={({ pressed }) => [
              styles.option,
              isSelected && styles.optionSelected,
              pressed && !disabled && styles.optionPressed,
            ]}
            onPress={() => {
              onSelect(item.id);
            }}
          >
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {item.label}
              {item.hint ? ` (${item.hint})` : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  list: {
    gap: 8,
  },
  option: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionSelected: {
    borderColor: "#F97316",
  },
  optionText: {
    color: "#D1D5DB",
    fontSize: 14,
  },
  optionTextSelected: {
    color: "#F9FAFB",
    fontWeight: "600",
  },
});
