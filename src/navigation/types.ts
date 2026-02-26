export type ProductDetailsParams = {
  barcode?: string;
};

export type CompareHubParams = {
  leftBarcode?: string;
  rightBarcode?: string;
};

export type ComparePickParams = {
  slot: "left" | "right";
  leftBarcode?: string;
  rightBarcode?: string;
};

export type ComparatorParams = {
  leftBarcode: string;
  rightBarcode: string;
};

export type ScannerStackParamList = {
  Scanner: undefined;
  ProductDetails: ProductDetailsParams;
  CompareHub: CompareHubParams;
  ComparePick: ComparePickParams;
  Comparator: ComparatorParams;
};

export type SearchStackParamList = {
  Recherche: undefined;
  ProductDetails: ProductDetailsParams;
  CompareHub: CompareHubParams;
  ComparePick: ComparePickParams;
  Comparator: ComparatorParams;
};

export type HistoryStackParamList = {
  Historique: undefined;
  ProductDetails: ProductDetailsParams;
  CompareHub: CompareHubParams;
  ComparePick: ComparePickParams;
  Comparator: ComparatorParams;
};

export type SettingsStackParamList = {
  Paramètres: undefined;
  ProductDetails: ProductDetailsParams;
  CompareHub: CompareHubParams;
  ComparePick: ComparePickParams;
  Comparator: ComparatorParams;
};

export type TabParamList = {
  ScannerTab: undefined;
  SearchTab: undefined;
  FavoritesTab: undefined;
  HistoryTab: undefined;
  SettingsTab: undefined;
};

export type FavoritesStackParamList = {
  Favoris: undefined;
  ProductDetails: ProductDetailsParams;
};
