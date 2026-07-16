import { ActivityIndicator, StyleSheet, View } from "react-native";

export function OccurrenceLoading() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color="#F97316" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#0F1115",
    flex: 1,
    justifyContent: "center",
  },
});
