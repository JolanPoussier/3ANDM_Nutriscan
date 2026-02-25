export type ProductDetailsParams = {
    barcode?: string;
  };
  
  export type ScannerStackParamList = {
    Scanner: undefined;
    ProductDetails: ProductDetailsParams;
  };
  
  export type SearchStackParamList = {
    Recherche: undefined;
    ProductDetails: ProductDetailsParams;
  };
  
  export type HistoryStackParamList = {
    Historique: undefined;
    ProductDetails: ProductDetailsParams;
  };
  
  export type SettingsStackParamList = {
    Paramètres: undefined;
    ProductDetails: ProductDetailsParams;
  };
  
  export type TabParamList = {
    ScannerTab: undefined;
    SearchTab: undefined;
    HistoryTab: undefined;
    SettingsTab: undefined;
  };