import { StyleSheet, Text, View } from "react-native";

type MdhoReturnedBannerProps = {
  returnReason: string;
};

export function MdhoReturnedBanner({ returnReason }: MdhoReturnedBannerProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.title}>MDHO devolvido — corrija e reenvie.</Text>
      <Text style={styles.reason}>{returnReason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#451A03",
    borderColor: "#F59E0B",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  reason: {
    color: "#FDE68A",
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: "#FBBF24",
    fontSize: 14,
    fontWeight: "700",
  },
});
