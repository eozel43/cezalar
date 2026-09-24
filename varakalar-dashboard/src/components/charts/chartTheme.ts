import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Tooltip,
  Legend,
  annotationPlugin
);

ChartJS.defaults.font.family = "Inter, -apple-system, 'Segoe UI', sans-serif";
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = '#475569';
// No animation: charts paint immediately, even when the tab is in the background,
// while switching sections or when printing (animated first paint needs rAF)
ChartJS.defaults.animation = false;

// Tek renk ailesi (lacivert) + tek vurgu rengi (kümülatif/ikincil seri için)
export const CHART_COLORS = {
  primary: '#1F446E',
  primarySoft: '#7F9FC4',
  accent: '#A16207',
  grid: '#E2E8F0',
  text: '#475569',
};

// Categorical slots, fixed order (never cycled). Validated with the dataviz
// validator against #FFFFFF, all pairs: CVD ΔE ≥ 9.0, normal-vision ΔE ≥ 19.3,
// contrast ≥ 3:1. Anything past three series folds into OTHER.
export const CATEGORICAL = ['#2A6FC4', '#D9622B', '#16936F'];
export const OTHER_COLOR = '#CBD5E1';

// Sequential ramp (one hue, light → dark) for magnitude, e.g. heatmap cells
export const SEQUENTIAL = ['#EEF3F8', '#D6E1EE', '#ADC3DC', '#7F9FC4', '#4F78A6', '#2B5585', '#183759'];

// Bar mark spec: ≤ 24px thick, 4px rounded data end, square at the baseline
export const BAR_MARK = {
  borderRadius: 4,
  borderSkipped: 'start' as const,
  maxBarThickness: 24,
};

export const tooltipStyle = {
  backgroundColor: '#0F172A',
  titleColor: '#FFFFFF',
  bodyColor: '#E2E8F0',
  padding: 10,
  cornerRadius: 4,
  displayColors: false,
  titleFont: { weight: 600 as const },
};

const compactTL = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatTLAxis = (value: number | string) => compactTL.format(Number(value));

export const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
