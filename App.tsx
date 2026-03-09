import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { ThemeProvider, useAppTheme } from "./src/context/ThemeContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import { I18nProvider } from "./src/context/I18nContext";

function AppNavigation() {
  const { navigationTheme } = useAppTheme();

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <FavoritesProvider>
          <AppNavigation />
        </FavoritesProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
