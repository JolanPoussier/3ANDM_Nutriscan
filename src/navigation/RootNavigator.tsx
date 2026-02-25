import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ScannerScreen from '../screens/ScannerScreen';
import SearchScreen from '../screens/SearchScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';

import type {
  TabParamList,
  ScannerStackParamList,
  SearchStackParamList,
  HistoryStackParamList,
  SettingsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const ScannerStack = createNativeStackNavigator<ScannerStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function ScannerStackScreen() {
  return (
    <ScannerStack.Navigator>
      <ScannerStack.Screen name="Scanner" component={ScannerScreen} />
      <ScannerStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: 'Fiche produit' }}
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
        options={{ title: 'Fiche produit' }}
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
        options={{ title: 'Fiche produit' }}
      />
    </HistoryStack.Navigator>
  );
}

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen name="Paramètres" component={SettingsScreen} />
      <SettingsStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: 'Fiche produit' }}
      />
    </SettingsStack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="ScannerTab" component={ScannerStackScreen} options={{ title: 'Scanner' }} />
      <Tab.Screen name="SearchTab" component={SearchStackScreen} options={{ title: 'Recherche' }} />
      <Tab.Screen name="HistoryTab" component={HistoryStackScreen} options={{ title: 'Historique' }} />
      <Tab.Screen name="SettingsTab" component={SettingsStackScreen} options={{ title: 'Paramètres' }} />
    </Tab.Navigator>
  );
}