export interface LabelStyleConfig {
  color: string;
  fontSize: number; // 8 to 24px
  fontWeight: 'font-normal' | 'font-medium' | 'font-semibold' | 'font-bold' | 'font-black';
  letterSpacing: string;
  textTransform: 'uppercase' | 'normal-case';
  fontFamily?: string;
}

export const LABEL_STYLE_STORAGE_KEY = "shift_report_label_style_v2";

export const DEFAULT_LABEL_STYLE: LabelStyleConfig = {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 'font-black',
  letterSpacing: 'tracking-[0.25em]',
  textTransform: 'uppercase',
  fontFamily: 'sans',
};

export const COLOR_PRESETS = [
  { name: 'Slate Neutral', hex: '#94a3b8', description: 'Standard tactical gray' },
  { name: 'Pure White', hex: '#ffffff', description: 'Maximum contrast' },
  { name: 'Neon Cyan', hex: '#22d3ee', description: 'Digital cyan display' },
  { name: 'Emerald', hex: '#34d399', description: 'Crisp green readout' },
  { name: 'Amber Gold', hex: '#fbbf24', description: 'High-visibility alert' },
  { name: 'Command Indigo', hex: '#818cf8', description: 'Tactical purple-blue' },
  { name: 'Coral Rose', hex: '#fb7185', description: 'Vivid contrast tone' },
  { name: 'Electric Violet', hex: '#c084fc', description: 'Clear violet hue' },
  { name: 'Lime Spark', hex: '#a3e635', description: 'Laser bright lime' },
  { name: 'Safety Orange', hex: '#fb923c', description: 'High alert orange' },
];

export const SIZE_PRESETS = [
  { label: 'Compact', size: 9 },
  { label: 'Standard', size: 11 },
  { label: 'Medium', size: 13 },
  { label: 'Large', size: 15 },
  { label: 'Extra Large', size: 18 },
];

export function getSavedLabelStyle(): LabelStyleConfig {
  try {
    const saved = localStorage.getItem(LABEL_STYLE_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_LABEL_STYLE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_LABEL_STYLE;
}

export function saveLabelStyle(style: LabelStyleConfig) {
  try {
    localStorage.setItem(LABEL_STYLE_STORAGE_KEY, JSON.stringify(style));
    window.dispatchEvent(new CustomEvent('shift_report_label_style_changed', { detail: style }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error(e);
  }
}

export function resetSavedLabelStyle(): LabelStyleConfig {
  try {
    localStorage.removeItem(LABEL_STYLE_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('shift_report_label_style_changed', { detail: DEFAULT_LABEL_STYLE }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_LABEL_STYLE;
}
