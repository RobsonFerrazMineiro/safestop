import { Tabs } from "expo-router";

import {
  AppBottomTabBar,
  type AppBottomTabBarProps,
} from "@/features/navigation/components/app-bottom-tab-bar";
import { PreventiveStopDraftNavigationProvider } from "@/features/navigation/context/preventive-stop-draft-navigation-context";

export default function AppTabsLayout() {
  return (
    <PreventiveStopDraftNavigationProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => (
          <AppBottomTabBar
            navigation={props.navigation as AppBottomTabBarProps["navigation"]}
            state={props.state}
          />
        )}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Início",
          }}
        />
        <Tabs.Screen
          name="stop-work"
          options={{
            title: "Paralisações",
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notificações",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
          }}
        />
      </Tabs>
    </PreventiveStopDraftNavigationProvider>
  );
}
