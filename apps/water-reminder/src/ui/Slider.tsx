import { useState } from 'react';
import { View, type AccessibilityActionEvent, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { useTheme } from '@shared/theme';

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
  /** Spoken value, e.g. "250 millilitres". */
  valueText?: string;
}

const snap = (v: number, min: number, max: number, step: number) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));

/**
 * A horizontal slider with a 48dp-tall touch area. TalkBack users get "adjustable" semantics:
 * swipe up/down to change the value by one step.
 */
export function Slider({ value, min, max, step, onChange, label, valueText }: SliderProps) {
  const { colors, touchTarget } = useTheme();
  const [width, setWidth] = useState(0);
  const fraction = (value - min) / (max - min);

  const fromTouch = (e: GestureResponderEvent) => {
    if (width <= 0) return;
    const f = Math.min(1, Math.max(0, e.nativeEvent.locationX / width));
    onChange(snap(min + f * (max - min), min, max, step));
  };
  const onAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'increment') onChange(snap(value + step, min, max, step));
    if (e.nativeEvent.actionName === 'decrement') onChange(snap(value - step, min, max, step));
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: valueText }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAction}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={fromTouch}
      onResponderMove={fromTouch}
      style={{ minHeight: touchTarget, justifyContent: 'center' }}
    >
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
        <View style={{ width: `${fraction * 100}%`, height: 8, backgroundColor: colors.primary }} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: fraction * width - 14,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.primary,
          borderWidth: 3,
          borderColor: colors.surface,
        }}
      />
    </View>
  );
}
