import React from 'react';
import { View, Text, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScannerStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ScannerStackParamList, 'Scanner'>;

export default function ScannerScreen({ navigation }: Props) {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text>Scanner Screen</Text>
      <Button
        title="Test ProductDetails"
        onPress={() => navigation.navigate('ProductDetails', { barcode:'123' })}
      />
    </View>
  );
}