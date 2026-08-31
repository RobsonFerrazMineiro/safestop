import { usePathname, useRouter } from "expo-router";
import { Bell, House, List, Plus, User, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, controlHeight, elevation, spacing } from "@safestop/ui";

import { stopWorkNewRoute, stopWorkRoute } from "@/lib/auth/routes";

import { usePreventiveStopDraftNavigation } from "../context/preventive-stop-draft-navigation-context";

const TAB_ICON_SIZE = 20;
const FAB_ICON_SIZE = 24;
const FAB_SIZE = 48;
const FAB_LIFT = 20;
const FAB_SLOT_WIDTH = 68;
const TAB_LABEL_FONT_SIZE = 11;
const TAB_LABEL_LINE_HEIGHT = 13;
const TAB_LABEL_MIN_SCALE = 0.88;

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
      // Nova PP vive no stack da tab Paralisações: `navigate` para a lista
      // não desempilha e causa piscada/no-op. O Voltar já usa replace.
      if (isFabActive(pathname) && href === STOP_WORK_TAB.href) {
        router.replace(stopWorkRoute);
        return;
      }

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

  function renderTabLabel(label: string, isFocused: boolean) {
    return (
      <Text
        adjustsFontSizeToFit
        minimumFontScale={TAB_LABEL_MIN_SCALE}
        numberOfLines={1}
        style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}
      >
        {label}
      </Text>
    );
  }

  const fabActive = isFabActive(pathname);

  function renderTab(item: TabItemConfig, routeIndex: number) {
    // Pathname is the source of truth: /stop-work/new must not keep "Paralisações"
    // active via the tab navigator index (create lives under the stop-work tab).
    const isFocused = item.match(pathname) || (state.index === routeIndex && !fabActive);
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
          // Em Nova PP, o Leave Guard deve controlar a saída. O tabPress padrão
          // (popToTop / troca de tab) compete e provoca piscada na lista.
          if (fabActive) {
            navigateTo(item.href);
            return;
          }

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
        <TabIcon color={iconColor} size={TAB_ICON_SIZE} strokeWidth={2} />
        {renderTabLabel(item.label, isFocused)}
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing[2]) }]}>
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
            <Plus color={colors.background} size={FAB_ICON_SIZE} strokeWidth={2.5} />
          </Pressable>
          {renderTabLabel("Paralisar", fabActive)}
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
    minHeight: 52,
    paddingHorizontal: spacing[1],
    paddingTop: spacing[2],
  },
  container: {
    backgroundColor: colors.surface,
  },
  fab: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: "transparent",
    borderRadius: FAB_SIZE / 2,
    borderWidth: 2,
    height: FAB_SIZE,
    justifyContent: "center",
    marginTop: -FAB_LIFT,
    width: FAB_SIZE,
    ...fabElevation,
  },
  fabActive: {
    borderColor: colors.foreground,
  },
  fabPressed: {
    opacity: 0.9,
  },
  fabSlot: {
    alignItems: "center",
    flexGrow: 0,
    flexShrink: 0,
    gap: spacing[1] / 2,
    justifyContent: "flex-end",
    width: FAB_SLOT_WIDTH,
  },
  tab: {
    alignItems: "center",
    flex: 1,
    flexShrink: 1,
    gap: spacing[1] / 2,
    justifyContent: "center",
    minHeight: controlHeight.mobile,
    minWidth: 0,
    paddingHorizontal: 0,
  },
  tabLabel: {
    fontSize: TAB_LABEL_FONT_SIZE,
    fontWeight: "600",
    lineHeight: TAB_LABEL_LINE_HEIGHT,
    maxWidth: "100%",
    textAlign: "center",
    width: "100%",
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
