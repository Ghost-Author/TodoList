import { DEFAULT_SEGMENT_COLORS } from './constants.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const toChars = (value) => Array.from(String(value || ''));

const hexToRgb = (hex) => {
  const clean = String(hex || '').replace('#', '');
  if (clean.length !== 6) return { r: 255, g: 255, b: 255 };
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

const getLuma = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

export const makeSegmentColor = (idx, count) => {
  if (count <= DEFAULT_SEGMENT_COLORS.length) return DEFAULT_SEGMENT_COLORS[idx % DEFAULT_SEGMENT_COLORS.length];
  const baseHue = (idx * 137.508) % 360;
  const sat = idx % 2 === 0 ? 78 : 72;
  const light = idx % 3 === 0 ? 86 : idx % 3 === 1 ? 82 : 88;
  return `hsl(${Math.round(baseHue)} ${sat}% ${light}%)`;
};

export const getDisplayLabel = (segmentDeg, label) => {
  const raw = String(label || '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';
  const [firstPhrase] = raw.split(/[，,。.!！?？;；:：|/]/).filter(Boolean);
  const candidate = (firstPhrase || raw).trim();
  const chars = toChars(candidate);
  const maxChars = segmentDeg >= 56 ? 9 : segmentDeg >= 44 ? 8 : segmentDeg >= 30 ? 7 : segmentDeg >= 22 ? 5 : 4;
  if (chars.length <= maxChars) return candidate;
  return `${chars.slice(0, Math.max(1, maxChars - 1)).join('')}…`;
};

export const getLabelLayout = (segmentDeg) => {
  const fontSize = segmentDeg >= 60 ? 11 : segmentDeg >= 45 ? 10 : segmentDeg >= 30 ? 9 : segmentDeg >= 22 ? 8 : 7;
  const radius = segmentDeg >= 55 ? 74 : segmentDeg >= 36 ? 77 : segmentDeg >= 24 ? 80 : 84;
  const arcLength = (Math.PI * 2 * radius) * (segmentDeg / 360);
  const maxWidth = clamp(Math.round(arcLength * 0.88), 32, 98);
  return { fontSize, radius, maxWidth };
};

export const getTextTone = (color) => {
  if (String(color).startsWith('hsl')) return '#3b2e4a';
  const rgb = hexToRgb(color);
  const luma = getLuma(rgb);
  if (luma < 0.6) return '#2f2539';
  if (luma > 0.86) return '#4a3b5a';
  return '#3b2e4a';
};

export const countChars = (value) => toChars(value).length;

