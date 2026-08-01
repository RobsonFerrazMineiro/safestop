import { useEffect, useState } from "react";
import { Platform } from "react-native";

export type PreventiveStopGeoState =
  | { status: "idle" }
  | { status: "capturing" }
  | { status: "captured"; latitude: number; longitude: number; accuracy: number | null }
  | { status: "unavailable" };

type PreventiveStopGeoResult = PreventiveStopGeoState & {
  coords: {
    latitude?: number;
    longitude?: number;
    locationAccuracy?: number;
  };
};

async function captureNativeLocation(): Promise<PreventiveStopGeoState> {
  try {
    const Location = await import("expo-location");

    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
      return { status: "unavailable" };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      status: "captured",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
    };
  } catch {
    return { status: "unavailable" };
  }
}

type WebGeolocationPosition = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  };
};

function captureWebLocation(): Promise<PreventiveStopGeoState> {
  return new Promise((resolve) => {
    const browserNavigator = (
      globalThis as typeof globalThis & {
        navigator?: {
          geolocation?: {
            getCurrentPosition: (
              success: (position: WebGeolocationPosition) => void,
              error: () => void,
              options?: {
                enableHighAccuracy?: boolean;
                maximumAge?: number;
                timeout?: number;
              },
            ) => void;
          };
        };
      }
    ).navigator;

    if (!browserNavigator?.geolocation) {
      resolve({ status: "unavailable" });
      return;
    }

    browserNavigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          status: "captured",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        });
      },
      () => {
        resolve({ status: "unavailable" });
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  });
}

export function usePreventiveStopGeo(): PreventiveStopGeoResult {
  const [geoState, setGeoState] = useState<PreventiveStopGeoState>({ status: "idle" });

  useEffect(() => {
    let isMounted = true;

    const capture = async () => {
      setGeoState({ status: "capturing" });

      const result =
        Platform.OS === "web" ? await captureWebLocation() : await captureNativeLocation();

      if (isMounted) {
        setGeoState(result);
      }
    };

    void capture();

    return () => {
      isMounted = false;
    };
  }, []);

  const coords =
    geoState.status === "captured"
      ? {
          latitude: geoState.latitude,
          longitude: geoState.longitude,
          locationAccuracy: geoState.accuracy ?? undefined,
        }
      : {};

  return {
    ...geoState,
    coords,
  };
}
