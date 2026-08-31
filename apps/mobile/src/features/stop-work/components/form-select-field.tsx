import { useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, controlHeight, radius, spacing, typography } from "@safestop/ui";

type FormSelectItem = {
  id: string;
  label: string;
  hint?: string;
};

type FormSelectFieldProps = {
  label: string;
  items: FormSelectItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  noneOptionLabel?: string;
};

function formatItemLabel(item: FormSelectItem): string {
  return item.hint ? `${item.label} (${item.hint})` : item.label;
}

export function FormSelectField({
  label,
  items,
  selectedId,
  onSelect,
  placeholder = "Selecione",
  disabled = false,
  emptyMessage,
  noneOptionLabel,
}: FormSelectFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    if (noneOptionLabel) {
      return [{ id: "", label: noneOptionLabel }, ...items];
    }

    return items;
  }, [items, noneOptionLabel]);

  const selectedLabel = useMemo(() => {
    const match = options.find((item) => item.id === selectedId);

    if (!match) {
      return null;
    }

    return formatItemLabel(match);
  }, [options, selectedId]);

  if (items.length === 0 && !noneOptionLabel) {
    return emptyMessage ? (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.empty}>{emptyMessage}</Text>
      </View>
    ) : null;
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityLabel={
          selectedLabel ? `${label}: ${selectedLabel}` : `${label}: ${placeholder}`
        }
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          disabled && styles.triggerDisabled,
          pressed && !disabled && styles.pressed,
        ]}
        onPress={() => {
          setOpen(true);
        }}
      >
        <Text
          numberOfLines={1}
          style={[styles.triggerText, !selectedLabel && styles.triggerPlaceholder]}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <ChevronDown accessible={false} color={colors.foregroundMuted} size={16} strokeWidth={2} />
      </Pressable>

      <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel={`Fechar ${label}`}
            style={styles.backdrop}
            onPress={() => {
              setOpen(false);
            }}
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable
                accessibilityLabel={`Fechar ${label}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  setOpen(false);
                }}
              >
                <X accessible={false} color={colors.foregroundMuted} size={18} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map((item) => {
                const isSelected = selectedId === item.id;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={item.id || "__none__"}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                  >
                    <Text
                      numberOfLines={2}
                      style={[styles.optionText, isSelected && styles.optionTextSelected]}
                    >
                      {formatItemLabel(item)}
                    </Text>
                    {isSelected ? (
                      <Check
                        accessible={false}
                        color={colors.primary}
                        size={16}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  empty: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
  },
  field: {
    gap: spacing[1],
  },
  label: {
    color: colors.foreground,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  optionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    minHeight: controlHeight.mobile,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  optionRowSelected: {
    backgroundColor: colors.surfaceMuted,
  },
  optionText: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.label.fontSize,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    flex: 1,
    justifyContent: "flex-end",
  },
  pressed: {
    opacity: 0.85,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.dialog,
    borderTopRightRadius: radius.dialog,
    maxHeight: "70%",
    paddingTop: spacing[3],
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[4],
  },
  sheetTitle: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
  },
  trigger: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "space-between",
    minHeight: controlHeight.mobile,
    paddingHorizontal: spacing[3],
  },
  triggerDisabled: {
    opacity: 0.55,
  },
  triggerPlaceholder: {
    color: colors.foregroundMuted,
  },
  triggerText: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.label.fontSize,
  },
});
