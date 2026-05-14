import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '../constants/theme';

type SizeKey = keyof typeof FontSize;
type WeightKey = keyof typeof FontWeight;

interface AppTextProps extends TextProps {
  size?: SizeKey;
  weight?: WeightKey;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function AppText({
  size = 'md',
  weight = 'regular',
  color = Colors.textPrimary,
  align = 'left',
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: FontSize[size],
          fontWeight: FontWeight[weight],
          color,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
