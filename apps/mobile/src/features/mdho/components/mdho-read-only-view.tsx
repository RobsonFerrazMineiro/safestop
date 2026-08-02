import { StyleSheet, Text, View } from "react-native";
import type { MdhoCatalogCategory } from "@safestop/types";
import { MDHO_DEVIATION_TYPE_CATEGORY_CODE, MDHO_OTHER_OPTION_CODE } from "@safestop/types";

import type { MdhoAssessmentEnriched } from "../services/map-mdho";
import { getMdhoCategoryLabel } from "../utils/mdho-labels";

type MdhoReadOnlyViewProps = {
  catalog: MdhoCatalogCategory[];
  assessment: MdhoAssessmentEnriched;
};

function formatCategoryValue(category: MdhoCatalogCategory, assessment: MdhoAssessmentEnriched) {
  const selections =
    assessment.selections?.filter((selection) => selection.categoryId === category.id) ?? [];

  if (selections.length === 0) {
    return "—";
  }

  return selections
    .map((selection) => {
      const option = category.options.find((item) => item.id === selection.optionId);
      const label = option?.label ?? "Opção";

      if (option?.code === MDHO_OTHER_OPTION_CODE && selection.detail) {
        return `${label}: ${selection.detail}`;
      }

      return label;
    })
    .join(", ");
}

export function MdhoReadOnlyView({ catalog, assessment }: MdhoReadOnlyViewProps) {
  return (
    <View style={styles.container}>
      {catalog.map((category) => (
        <View key={category.id} style={styles.field}>
          <Text style={styles.label}>
            {getMdhoCategoryLabel(category.code)}
            {category.code === MDHO_DEVIATION_TYPE_CATEGORY_CODE ? "" : ""}
          </Text>
          <Text style={styles.value}>{formatCategoryValue(category, assessment)}</Text>
        </View>
      ))}

      {assessment.complement ? (
        <View style={styles.field}>
          <Text style={styles.label}>Complemento da avaliação</Text>
          <Text selectable style={styles.value}>
            {assessment.complement}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  field: {
    gap: 4,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  value: {
    color: "#F9FAFB",
    fontSize: 15,
    lineHeight: 22,
  },
});
