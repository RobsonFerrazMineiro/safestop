import { usePathname, useRouter } from "expo-router";
import { Bell, House, List, Plus, User, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, controlHeight, elevation, spacing } from "@safestop/ui";

import { stopWorkNewRoute } from "@/lib/auth/routes";

import { usePreventiveStopDraftNavigation } from "../context/preventive-stop-draft-navigation-context";

const TAB_ICON_SIZE = 22;
const FAB_ICON_SIZE = 28;

type TabItemConfig = {
  key: string;
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  Icon: LucideIcon;
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
  Icon: House,
};

const STOP_WORK_TAB: TabItemConfig = {
  key: "stop-work",
  label: "Paralisações",
  href: "/(app)/stop-work",
  match: isStopWorkPath,
  Icon: List,
};

const NOTIFICATIONS_TAB: TabItemConfig = {
  key: "notifications",
  label: "Notificações",
  href: "/(app)/notifications",
  match: (pathname) => pathname.includes("/notifications"),
  Icon: Bell,
};

const PROFILE_TAB: TabItemConfig = {
  key: "profile",
  label: "Perfil",
  href: "/(app)/profile",
  match: (pathname) => pathname.includes("/profile"),
  Icon: User,
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
    const iconColor = isFocused ? colors.primary : colors.foregroundMuted;
    const TabIcon = item.Icon;

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
        <TabIcon color={iconColor} size={TAB_ICON_SIZE} />
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
            <Plus color={colors.background} size={FAB_ICON_SIZE} />
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

const fabElevation = elevation.overlay.native;

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
    height: 56,
    justifyContent: "center",
    marginTop: -28,
    width: 56,
    ...fabElevation,
  },
  fabActive: {
    backgroundColor: colors.primaryActive,
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
    gap: spacing[1] / 2,
    justifyContent: "center",
    minHeight: controlHeight.mobile,
    paddingHorizontal: spacing[1] / 2,
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
