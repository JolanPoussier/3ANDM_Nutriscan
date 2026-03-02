import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../context/I18nContext";
import { useAppTheme } from "../context/ThemeContext";
import type { ScannerStackParamList } from "../navigation/types";
import type { OFFProductResponse } from "../types/off";
import { OFFFetch } from "../utils/api";
import { addToHistory } from "../utils/historyStorage";

type Props = NativeStackScreenProps<ScannerStackParamList, "Scanner">;

function CornerMask({ top, left, right, bottom }: { top?: number; left?: number; right?: number; bottom?: number }) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const circleTop = top !== undefined ? -30 : -60;
  const circleLeft = left !== undefined ? -30 : -60;
  const containerStyle = useMemo(() => ({ top, left, right, bottom }), [top, left, right, bottom]);
  const cornerCircleStyle = useMemo(
    () => ({ top: circleTop, left: circleLeft, borderColor: theme.scannerMask }),
    [circleTop, circleLeft, theme.scannerMask],
  );

  return (
    <View style={[styles.cornerMaskContainer, containerStyle]}>
      <View style={[styles.cornerMaskCircle, cornerCircleStyle]} />
    </View>
  );
}

export default function ScannerScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);

  const barcodeTypes = useMemo(
    () => ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"] as const,
    [],
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
          setError(t("scanner.notFound"));
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
      } catch {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(t("scanner.networkError"));
        locked.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [navigation, t],
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>{t("scanner.cameraNeed")}</Text>
        <Pressable style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={styles.btnPrimaryText}>{t("scanner.allowCamera")}</Text>
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
        barcodeScannerSettings={{ barcodeTypes: barcodeTypes as any }}
      />

      <View style={styles.overlayContainer}>
        <View style={styles.layerTop}>
          <View style={styles.topContent}>
            <Text style={styles.title}>{t("scanner.title")}</Text>
            <Text style={styles.subtitle}>{t("scanner.subtitle")}</Text>
          </View>
        </View>

        <View style={styles.layerCenter}>
          <View style={styles.layerSide} />
          <View style={styles.frameOuter}>
            <CornerMask top={0} left={0} />
            <CornerMask top={0} right={0} />
            <CornerMask bottom={0} left={0} />
            <CornerMask bottom={0} right={0} />
            <View style={styles.frame} />
          </View>
          <View style={styles.layerSide} />
        </View>

        <View style={styles.layerBottom}>
          <View style={styles.bottomCard}>
            {isLoading ? (
              <View style={styles.row}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>{t("scanner.searching")}</Text>
              </View>
            ) : error ? (
              <>
                <Text style={styles.error}>{error}</Text>
                <Pressable style={styles.btnSecondary} onPress={reset}>
                  <Text style={styles.btnSecondaryText}>{t("common.retry")}</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.hint}>{t("scanner.hint")}</Text>
            )}
          </View>
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

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    cornerMaskContainer: {
      position: "absolute",
      width: 30,
      height: 30,
      overflow: "hidden",
    },
    cornerMaskCircle: {
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 30,
      backgroundColor: "transparent",
    },

    container: { flex: 1, backgroundColor: theme.scannerBackground },
    overlayContainer: { ...StyleSheet.absoluteFillObject },

    layerTop: {
      flex: 1,
      paddingTop: 56,
      paddingHorizontal: 18,
      justifyContent: "flex-start",
      backgroundColor: theme.scannerMask,
    },
    layerCenter: { flexDirection: "row", height: 250 },
    layerSide: { flex: 1, backgroundColor: theme.scannerMask },
    layerBottom: {
      flex: 1,
      paddingHorizontal: 18,
      paddingBottom: 28,
      justifyContent: "flex-end",
      backgroundColor: theme.scannerMask,
    },

    topContent: { gap: 6 },
    title: {
      color: theme.textInverse,
      fontSize: theme.fontSizes.xlMinus,
      fontWeight: theme.fontWeights.bold,
    },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSizes.sm },

    frameOuter: { width: "86%", height: 250, backgroundColor: "transparent" },
    frame: {
      flex: 1,
      borderRadius: 30,
      borderWidth: 3,
      borderColor: theme.scannerFrame,
      backgroundColor: theme.scannerFrameSoft,
    },

    bottomCard: {
      borderRadius: 18,
      padding: 14,
      gap: 10,
      backgroundColor: theme.scannerMaskSoft,
    },
    text: { color: theme.text, fontSize: theme.fontSizes.base },
    permissionText: {
      color: theme.text,
      textAlign: "center",
      marginBottom: 14,
      fontSize: theme.fontSizes.base,
    },
    loadingText: {
      marginLeft: 10,
      color: theme.textInverse,
      fontSize: theme.fontSizes.base,
    },
    hint: { color: theme.textMuted, textAlign: "center", fontSize: theme.fontSizes.sm },
    error: { color: theme.errorText, fontWeight: theme.fontWeights.bold, textAlign: "center" },
    row: { flexDirection: "row", alignItems: "center" },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
      backgroundColor: theme.background,
    },

    btnPrimary: {
      backgroundColor: theme.primary,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 16,
    },
    btnPrimaryText: {
      color: theme.textInverse,
      fontWeight: theme.fontWeights.extraBold,
      fontSize: theme.fontSizes.mdPlus,
    },

    btnSecondary: {
      backgroundColor: theme.primarySoftStrong,
      paddingVertical: 12,
      borderRadius: 14,
    },
    btnSecondaryText: {
      color: theme.primary,
      fontWeight: theme.fontWeights.extraBold,
      textAlign: "center",
      fontSize: theme.fontSizes.md,
    },

    fab: {
      position: "absolute",
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
    },
    fabText: {
      color: theme.textInverse,
      fontSize: theme.fontSizes.xl,
      fontWeight: theme.fontWeights.extraBold,
    },
  });
}
