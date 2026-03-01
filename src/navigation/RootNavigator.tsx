import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useAppTheme } from "../context/ThemeContext";

import FavoritesScreen from "../screens/FavoritesScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProductDetailsScreen from "../screens/ProductDetailsScreen";
import ScannerScreen from "../screens/ScannerScreen";
import SearchScreen from "../screens/SearchScreen";
import SettingsScreen from "../screens/SettingsScreen";

import { useI18n } from "../context/I18nContext";
import ComparatorScreen from "../screens/ComparatorScreen";
import CompareHubScreen from "../screens/CompareHubScreen";
import ComparePickScreen from "../screens/ComparePickScreen";

import type {
  FavoritesStackParamList,
  HistoryStackParamList,
  ScannerStackParamList,
  SearchStackParamList,
  SettingsStackParamList,
  TabParamList,
} from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

const ScannerStack = createNativeStackNavigator<ScannerStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const FavoritesStack = createNativeStackNavigator<FavoritesStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function ScannerStackScreen() {
  const { t } = useI18n();

  return (
    <ScannerStack.Navigator>
      <ScannerStack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ title: t("navigation.tabs.scanner") }}
      />
      <ScannerStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: t("navigation.stack.productDetails") }}
      />
      <ScannerStack.Screen
        name="CompareHub"
        component={CompareHubScreen}
        options={{ title: t("navigation.stack.compare") }}
      />
      <ScannerStack.Screen
        name="ComparePick"
        component={ComparePickScreen}
        options={{ title: t("navigation.stack.pickProduct") }}
      />
      <ScannerStack.Screen
        name="Comparator"
        component={ComparatorScreen}
        options={{ title: t("navigation.stack.comparator") }}
      />
    </ScannerStack.Navigator>
  );
}

function SearchStackScreen() {
  const { t } = useI18n();

  return (
    <SearchStack.Navigator>
      <SearchStack.Screen
        name="Recherche"
        component={SearchScreen}
        options={{ title: t("navigation.tabs.search") }}
      />
      <SearchStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: t("navigation.stack.productDetails") }}
      />
      <SearchStack.Screen
        name="CompareHub"
        component={CompareHubScreen}
        options={{ title: t("navigation.stack.compare") }}
      />
      <SearchStack.Screen
        name="ComparePick"
        component={ComparePickScreen}
        options={{ title: t("navigation.stack.pickProduct") }}
      />
      <SearchStack.Screen
        name="Comparator"
        component={ComparatorScreen}
        options={{ title: t("navigation.stack.comparator") }}
      />
    </SearchStack.Navigator>
  );
}

function HistoryStackScreen() {
  const { t } = useI18n();

  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen
        name="Historique"
        component={HistoryScreen}
        options={{ title: t("navigation.tabs.history") }}
      />
      <HistoryStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: t("navigation.stack.productDetails") }}
      />
      <HistoryStack.Screen
        name="CompareHub"
        component={CompareHubScreen}
        options={{ title: t("navigation.stack.compare") }}
      />
      <HistoryStack.Screen
        name="ComparePick"
        component={ComparePickScreen}
        options={{ title: t("navigation.stack.pickProduct") }}
      />
      <HistoryStack.Screen
        name="Comparator"
        component={ComparatorScreen}
        options={{ title: t("navigation.stack.comparator") }}
      />
    </HistoryStack.Navigator>
  );
}

function FavoritesStackScreen() {
  const { t } = useI18n();

  return (
    <FavoritesStack.Navigator>
      <FavoritesStack.Screen
        name="Favoris"
        component={FavoritesScreen}
        options={{ title: t("navigation.tabs.favorites") }}
      />
      <FavoritesStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: t("navigation.stack.productDetails") }}
      />
    </FavoritesStack.Navigator>
  );
}

function SettingsStackScreen() {
  const { t } = useI18n();

  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="Paramètres"
        component={SettingsScreen}
        options={{ title: t("navigation.tabs.settings") }}
      />
      <SettingsStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: t("navigation.stack.productDetails") }}
      />
      <SettingsStack.Screen
        name="CompareHub"
        component={CompareHubScreen}
        options={{ title: t("navigation.stack.compare") }}
      />
      <SettingsStack.Screen
        name="ComparePick"
        component={ComparePickScreen}
        options={{ title: t("navigation.stack.pickProduct") }}
      />
      <SettingsStack.Screen
        name="Comparator"
        component={ComparatorScreen}
        options={{ title: t("navigation.stack.comparator") }}
      />
    </SettingsStack.Navigator>
  );
}

export default function RootNavigator() {
  const { t } = useI18n();
  const { mode } = useAppTheme();
  const isDark = mode === "dark";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#0b0b0c" : "#ffffff",
          borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: isDark ? "#52525b" : "#a1a1aa",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = "home";
          if (route.name === "ScannerTab")
            iconName = focused ? "scan" : "scan-outline";
          else if (route.name === "SearchTab")
            iconName = focused ? "search" : "search-outline";
          else if (route.name === "FavoritesTab")
            iconName = focused ? "heart" : "heart-outline";
          else if (route.name === "HistoryTab")
            iconName = focused ? "time" : "time-outline";
          else if (route.name === "SettingsTab")
            iconName = focused ? "settings" : "settings-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="ScannerTab"
        component={ScannerStackScreen}
        options={{ title: t("navigation.tabs.scanner") }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackScreen}
        options={{ title: t("navigation.tabs.search") }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesStackScreen}
        options={{ title: t("navigation.tabs.favorites") }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStackScreen}
        options={{ title: t("navigation.tabs.history") }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackScreen}
        options={{ title: t("navigation.tabs.settings") }}
      />
    </Tab.Navigator>
  );
}
