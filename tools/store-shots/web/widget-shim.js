// TEMPORARY: renders react-native-android-widget primitives with plain RN views on web (store screenshots).
const React = require('react');
const { View, Text } = require('react-native');
const fix = (st = {}) => {
  const o = { ...st };
  for (const k of ['width', 'height']) if (o[k] === 'match_parent') o[k] = '100%';
  if (o.fontWeight === 'bold') o.fontWeight = '700';
  return o;
};
function FlexWidget({ style, children }) { return React.createElement(View, { style: { display: 'flex', ...fix(style) } }, children); }
function TextWidget({ text, style, maxLines }) { return React.createElement(Text, { numberOfLines: maxLines, style: { fontFamily: 'Roboto, sans-serif', ...fix(style) } }, text); }
const noop = async () => {};
module.exports = { FlexWidget, TextWidget, requestPinWidget: noop, requestWidgetUpdate: noop, registerWidgetTaskHandler: noop };
