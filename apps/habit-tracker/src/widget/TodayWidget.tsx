import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { t } from '@shared/i18n';
import { defaultPalettes } from '@shared/theme/tokens';
import type { WidgetSnapshot } from '@/domain/types';
import { palette } from '@/theme/tokens';

type Hex = `#${string}`;
const hex = (v: string) => v as Hex;

export interface WidgetColors {
  bg: Hex;
  text: Hex;
  muted: Hex;
  border: Hex;
  success: Hex;
  onSuccess: Hex;
  primary: Hex;
}

export const widgetColors = (mode: 'light' | 'dark'): WidgetColors => {
  const c = { ...defaultPalettes[mode], ...palette[mode] };
  return {
    bg: hex(c.surface),
    text: hex(c.text),
    muted: hex(c.textMuted),
    border: hex(c.border),
    success: hex(c.success),
    onSuccess: hex(mode === 'light' ? '#FFFFFF' : '#0F1115'),
    primary: hex(c.primary),
  };
};

const ROW_HEIGHT = 40;
const CHROME_HEIGHT = 64;

/** How many rows fit: about 3 at 4x2 growing to 8 at 4x4 (the plan caps at 5 and 8). */
export const rowsFor = (heightDp: number) => Math.max(2, Math.min(8, Math.floor((heightDp - CHROME_HEIGHT) / ROW_HEIGHT) + 1));

const initial = (name: string) => Array.from(name.trim())[0]?.toUpperCase() ?? '?';

export function TodayWidget({ snapshot, colors, maxRows }: { snapshot: WidgetSnapshot; colors: WidgetColors; maxRows: number }) {
  const { items, doneCount, total, day } = snapshot;
  const shown = items.slice(0, maxRows);
  const hidden = items.length - shown.length;
  const allDone = total > 0 && doneCount === total;

  return (
    <FlexWidget
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: colors.bg, borderRadius: 24, padding: 12, flexDirection: 'column' }}
      accessibilityLabel={t('widget.header', { done: doneCount, total })}
    >
      <FlexWidget
        style={{ width: 'match_parent', height: 32, flexDirection: 'row', alignItems: 'center' }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'habittracker://today' }}
      >
        <TextWidget
          text={total === 0 ? t('tabs.today') : allDone ? t('widget.allDone') : t('widget.header', { done: doneCount, total })}
          style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}
        />
      </FlexWidget>

      {total === 0 && (
        <FlexWidget
          style={{ width: 'match_parent', height: 40, justifyContent: 'center' }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'habittracker://today' }}
        >
          <TextWidget text={t('widget.empty')} style={{ fontSize: 14, color: colors.primary }} />
        </FlexWidget>
      )}

      {shown.map((item) => {
        const color = hex(item.color);
        const open = { clickAction: 'OPEN_URI', clickActionData: { uri: `habittracker://habit/${item.id}` } } as const;
        return (
          <FlexWidget key={item.id} style={{ width: 'match_parent', height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center' }}>
            <FlexWidget style={{ flex: 1, height: 'match_parent', flexDirection: 'row', alignItems: 'center' }} {...open}>
              <FlexWidget
                style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: hex(item.color + '33'), alignItems: 'center', justifyContent: 'center' }}
              >
                <TextWidget text={initial(item.name)} style={{ fontSize: 14, fontWeight: 'bold', color }} />
              </FlexWidget>
              <FlexWidget style={{ flex: 1, marginLeft: 8 }}>
                <TextWidget
                  text={item.name}
                  maxLines={1}
                  truncate="END"
                  style={{ fontSize: 14, color: item.done ? colors.muted : colors.text }}
                />
              </FlexWidget>
            </FlexWidget>

            {item.type === 'boolean' && (
              <FlexWidget
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: item.done ? colors.success : colors.border,
                  backgroundColor: item.done ? colors.success : hex('#00000000'),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                clickAction="TOGGLE"
                clickActionData={{ id: item.id, day }}
                accessibilityLabel={t(item.done ? 'widget.toggleUndo' : 'widget.toggle', { name: item.name })}
              >
                {item.done && <TextWidget text="✓" style={{ fontSize: 16, fontWeight: 'bold', color: colors.onSuccess }} />}
              </FlexWidget>
            )}

            {item.type === 'count' && (
              <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextWidget
                  text={t('widget.count', { value: item.value, target: item.target })}
                  style={{ fontSize: 13, color: item.done ? colors.success : colors.muted, marginRight: 6 }}
                />
                <FlexWidget
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: item.done ? colors.success : color, alignItems: 'center', justifyContent: 'center' }}
                  clickAction="INCREMENT"
                  clickActionData={{ id: item.id, day }}
                  accessibilityLabel={t('widget.plus', { name: item.name })}
                >
                  <TextWidget text="+" style={{ fontSize: 20, fontWeight: 'bold', color: hex('#FFFFFF') }} />
                </FlexWidget>
              </FlexWidget>
            )}

            {item.type === 'timer' && (
              <FlexWidget
                style={{ height: 36, borderRadius: 18, paddingHorizontal: 14, borderWidth: 2, borderColor: item.done ? colors.success : colors.border, alignItems: 'center', justifyContent: 'center' }}
                {...open}
              >
                <TextWidget text={item.done ? '✓' : t('widget.open')} style={{ fontSize: 13, color: item.done ? colors.success : colors.text }} />
              </FlexWidget>
            )}
          </FlexWidget>
        );
      })}

      {hidden > 0 && (
        <FlexWidget
          style={{ width: 'match_parent', height: 28, justifyContent: 'center' }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'habittracker://today' }}
        >
          <TextWidget text={t('widget.more', { count: hidden })} style={{ fontSize: 13, color: colors.primary }} />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
