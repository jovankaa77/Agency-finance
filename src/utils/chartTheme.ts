export interface ChartTheme {
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
}

export const lightChartTheme: ChartTheme = {
  grid: '#f3f4f6', axis: '#6b7280',
  tooltipBg: '#ffffff', tooltipBorder: '#e5e7eb', tooltipText: '#111827',
};

export const darkChartTheme: ChartTheme = {
  grid: '#374151', axis: '#9ca3af',
  tooltipBg: '#1f2937', tooltipBorder: '#374151', tooltipText: '#f3f4f6',
};

export const getChartTheme = (theme: 'light' | 'dark'): ChartTheme =>
  theme === 'dark' ? darkChartTheme : lightChartTheme;
