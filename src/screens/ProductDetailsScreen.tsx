import React from 'react';
import { View, Text } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { ProductDetailsParams } from '../navigation/types';

type Props = {
  route: RouteProp<Record<string, ProductDetailsParams>, string>;
};

export default function ProductDetailsScreen({ route }: Props) {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text>Product Details</Text>
      <Text>{route.params?.barcode}</Text>
    </View>
  );
}