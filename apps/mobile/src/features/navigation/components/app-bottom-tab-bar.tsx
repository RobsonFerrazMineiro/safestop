import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@safestop/ui";

import { stopWorkNewRoute } from "@/lib/auth/routes";

import { usePreventiveStopDraftNavigation } from "../context/preventive-stop-draft-navigation-context";

type TabItemConfig = {
  key: string;
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  icon: string;
};

export type AppBottomTabBarProps = {
  state: {
    index: number;
    routes: { key: string }[];
  };
  navigation: {
    emit: (options: { type: "tabPress"; target?: string; canPreventDefault?: true }) => {
      defaultPrevented: boolean;
    };
  };
};

function isHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "/index" || pathname.endsWith("/(app)");
}

function isStopWorkPath(pathname: string): boolean {
  return pathname.includes("/stop-work") && !pathname.endsWith("/stop-work/new");
}

const HOME_TAB: TabItemConfig = {
  key: "home",
  label: "Início",
  href: "/(app)",
  match: isHomePath,
  icon: "▦",
};

const STOP_WORK_TAB: TabItemConfig = {
  key: "stop-work",
  label: "Paralisações",
  href: "/(app)/stop-work",
  match: isStopWorkPath,
  icon: "☰",
};

const NOTIFICATIONS_TAB: TabItemConfig = {
  key: "notifications",
  label: "Notificações",
  href: "/(app)/notifications",
  match: (pathname) => pathname.includes("/notifications"),
  icon: "🔔",
};

const PROFILE_TAB: TabItemConfig = {
  key: "profile",
  label: "Perfil",
  href: "/(app)/profile",
  match: (pathname) => pathname.includes("/profile"),
  icon: "👤",
};

function isFabActive(pathname: string): boolean {
  return pathname.endsWith("/stop-work/new");
}

export function AppBottomTabBar({ state, navigation }: AppBottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { requestNavigation } = usePreventiveStopDraftNavigation();

  function navigateTo(href: string) {
    requestNavigation(() => {
      router.navigate(href as never);
    });
  }

  function handleFabPress() {
    if (isFabActive(pathname)) {
      return;
    }

    requestNavigation(() => {
      router.navigate(stopWorkNewRoute);
    });
  }

  const homeItem = HOME_TAB;
  const stopWorkItem = STOP_WORK_TAB;
  const notificationsItem = NOTIFICATIONS_TAB;
  const profileItem = PROFILE_TAB;

  function renderTab(item: TabItemConfig, routeIndex: number) {
    const isFocused = state.index === routeIndex || item.match(pathname);

    return (
      <Pressable
        key={item.key}
        accessibilityLabel={item.label}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
        onPress={() => {
          const event = navigation.emit({
            type: "tabPress",
            target: state.routes[routeIndex]?.key,
            canPreventDefault: true,
          });

          if (!event.defaultPrevented) {
            navigateTo(item.href);
          }
        }}
      >
        <Text style={[styles.tabIcon, isFocused ? styles.tabIconActive : styles.tabIconInactive]}>
          {item.icon}
        </Text>
        <Text
          style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  }

  const fabActive = isFabActive(pathname);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {renderTab(homeItem, 0)}
        {renderTab(stopWorkItem, 1)}

        <View style={styles.fabSlot}>
          <Pressable
            accessibilityLabel="Nova Paralisação Preventiva"
            accessibilityRole="button"
            accessibilityState={{ selected: fabActive }}
            style={({ pressed }) => [
              styles.fab,
              fabActive && styles.fabActive,
              pressed && styles.fabPressed,
            ]}
            onPress={handleFabPress}
          >
            <Text style={styles.fabIcon}>+</Text>
          </Pressable>
          <Text
            style={[styles.fabLabel, fabActive ? styles.tabLabelActive : styles.tabLabelInactive]}
          >
            Paralisar
          </Text>
        </View>

        {renderTab(notificationsItem, 2)}
        {renderTab(profileItem, 3)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    minHeight: 56,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  container: {
    backgroundColor: colors.surface,
  },
  fab: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 28,
    elevation: 6,
    height: 56,
    justifyContent: "center",
    marginTop: -28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    width: 56,
  },
  fabActive: {
    backgroundColor: colors.primaryActive,
  },
  fabIcon: {
    color: colors.background,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 30,
  },
  fabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  fabPressed: {
    opacity: 0.9,
  },
  fabSlot: {
    alignItems: "center",
    flex: 1,
    minWidth: 64,
  },
  tab: {
    alignItems: "center",
    flex: 1,
    gap: 2,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 2,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabIconActive: {
    color: colors.primary,
  },
  tabIconInactive: {
    color: colors.foregroundMuted,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabLabelInactive: {
    color: colors.foregroundMuted,
  },
  tabPressed: {
    opacity: 0.85,
  },
});
