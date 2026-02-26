import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import FavoritesScreen from "../screens/FavoritesScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProductDetailsScreen from "../screens/ProductDetailsScreen";
import ScannerScreen from "../screens/ScannerScreen";
import SearchScreen from "../screens/SearchScreen";
import SettingsScreen from "../screens/SettingsScreen";

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
  return (
    <ScannerStack.Navigator>
      <ScannerStack.Screen name="Scanner" component={ScannerScreen} />
      <ScannerStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: "Fiche produit" }}
      />
      <ScannerStack.Screen
        name="CompareHub"
        component={CompareHubScreen}
        options={{ title: "Comparer" }}
      />
      <ScannerStack.Screen
        name="ComparePick"
        component={ComparePickScreen}
        options={{ title: "Choisir un produit" }}
      />
      <ScannerStack.Screen
        name="Comparator"
        component={ComparatorScreen}
        options={{ title: "Comparateur" }}
      />
    </ScannerStack.Navigator>
  );
}

function SearchStackScreen() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen name="Recherche" component={SearchScreen} />
      <SearchStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: "Fiche produit" }}
      />
      <SearchStack.Screen
        name="CompareHub"
        component={CompareHubScreen}
        options={{ title: "Comparer" }}
      />
      <SearchStack.Screen
        name="ComparePick"
        component={ComparePickScreen}
        options={{ title: "Choisir un produit" }}
      />
      <SearchStack.Screen
        name="Comparator"
        component={ComparatorScreen}
        options={{ title: "Comparateur" }}
      />
    </SearchStack.Navigator>
  );
}

function HistoryStackScreen() {
  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen name="Historique" component={HistoryScreen} />
      <HistoryStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: "Fiche produit" }}
      />
      <HistoryStack.Screen
        name="CompareHub"
        component={CompareHubScreen}
        options={{ title: "Comparer" }}
      />
      <HistoryStack.Screen
        name="ComparePick"
        component={ComparePickScreen}
        options={{ title: "Choisir un produit" }}
      />
      <HistoryStack.Screen
        name="Comparator"
        component={ComparatorScreen}
        options={{ title: "Comparateur" }}
      />
    </HistoryStack.Navigator>
  );
}

function FavoritesStackScreen() {
  return (
    <FavoritesStack.Navigator>
      <FavoritesStack.Screen name="Favoris" component={FavoritesScreen} />
      <FavoritesStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: "Fiche produit" }}
      />
    </FavoritesStack.Navigator>
  );
}

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen name="Paramètres" component={SettingsScreen} />
      <SettingsStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: "Fiche produit" }}
      />
      <SettingsStack.Screen
        name="CompareHub"
        component={CompareHubScreen}
        options={{ title: "Comparer" }}
      />
      <SettingsStack.Screen
        name="ComparePick"
        component={ComparePickScreen}
        options={{ title: "Choisir un produit" }}
      />
      <SettingsStack.Screen
        name="Comparator"
        component={ComparatorScreen}
        options={{ title: "Comparateur" }}
      />
    </SettingsStack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="ScannerTab"
        component={ScannerStackScreen}
        options={{ title: "Scanner" }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackScreen}
        options={{ title: "Recherche" }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesStackScreen}
        options={{ title: "Favoris" }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStackScreen}
        options={{ title: "Historique" }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackScreen}
        options={{ title: "Paramètres" }}
      />
    </Tab.Navigator>
  );
}
