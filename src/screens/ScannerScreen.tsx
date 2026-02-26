import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { ScannerStackParamList } from "../navigation/types";
import { OFFFetch } from "../utils/api";
import type { OFFProductResponse } from "../types/off";
import { addToHistory } from "../utils/historyStorage";

type Props = NativeStackScreenProps<ScannerStackParamList, "Scanner">;

export default function ScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // lock anti double-scan
  const locked = useRef(false);

  const barcodeTypes = useMemo(
    () =>
      [
        "ean13",
        "ean8",
        "upc_a",
        "upc_e",
        "code128",
        "code39",
        "qr",
      ] as const,
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    locked.current = false;
  }, []);

  const onScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (locked.current) return;

      const barcode = (result.data ?? "").trim();
      if (!barcode) return;

      locked.current = true;
      setError(null);
      setIsLoading(true);

      try {
        const data = await OFFFetch<OFFProductResponse>(`product/${barcode}`);

        if (data?.status !== 1 || !data.product) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("Produit introuvable dans Open Food Facts.");
          locked.current = false;
          return;
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const p = data.product;

        await addToHistory({
          barcode,
          scannedAt: Date.now(),
          name: p.product_name ?? undefined,
          brand: p.brands ?? undefined,
          imageUrl: p.image_url ?? undefined,
          nutriScore: p.nutriscore_grade ?? undefined,
        });

        navigation.navigate("ProductDetails", { barcode });

        navigation.navigate("ProductDetails", { barcode });
      } catch (e) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError("Erreur réseau. Vérifie ta connexion et réessaie.");
        locked.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [navigation]
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Chargement…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={[styles.text, { textAlign: "center", marginBottom: 14 }]}>
          NutriScan a besoin de la caméra pour scanner un code-barres.
        </Text>
        <Pressable style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={styles.btnPrimaryText}>Autoriser la caméra</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={isLoading ? undefined : onScanned}
        barcodeScannerSettings={{ barcodeTypes: barcodeTypes as unknown as string[] }}
      />

      <View style={styles.overlay}>
        <View style={styles.top}>
          <Text style={styles.title}>Scanner un produit</Text>
          <Text style={styles.subtitle}>Place le code-barres dans le cadre</Text>
        </View>

        <View style={styles.frame} />

        <View style={styles.bottom}>
          {isLoading ? (
            <View style={styles.row}>
              <ActivityIndicator />
              <Text style={[styles.text, { marginLeft: 10 }]}>Recherche du produit…</Text>
            </View>
          ) : error ? (
            <>
              <Text style={styles.error}>{error}</Text>
              <Pressable style={styles.btnSecondary} onPress={reset}>
                <Text style={styles.btnSecondaryText}>Rescanner</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.hint}>Astuce : évite les reflets, rapproche-toi légèrement.</Text>
          )}
        </View>
      </View>

      {!isLoading && (
        <Pressable style={styles.fab} onPress={reset}>
          <Text style={styles.fabText}>↻</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 28,
    justifyContent: "space-between",
  },

  top: { gap: 6 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.75)", fontSize: 13 },

  frame: {
    alignSelf: "center",
    width: "86%",
    height: 230,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  bottom: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },

  text: { color: "#fff", fontSize: 14 },
  hint: { color: "rgba(255,255,255,0.8)", textAlign: "center", fontSize: 13 },
  error: { color: "#ffb4b4", fontWeight: "700", textAlign: "center" },

  row: { flexDirection: "row", alignItems: "center" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18, backgroundColor: "#000" },

  btnPrimary: { backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14 },
  btnPrimaryText: { color: "#000", fontWeight: "800" },

  btnSecondary: { backgroundColor: "rgba(255,255,255,0.12)", paddingVertical: 12, borderRadius: 14 },
  btnSecondaryText: { color: "#fff", fontWeight: "800", textAlign: "center" },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: "#fff", fontSize: 22, fontWeight: "800" },
});