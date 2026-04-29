// ─── DESIGN TOKENS — dùng chung toàn app ──────────────────────────────────
export const C = {
  navy:       '#1a3a6b',   // Primary brand
  navyLight:  '#e8eef8',   // Navy tint background
  navyMid:    '#2d5299',   // Hover / active
  green:      '#16a34a',
  greenLight: '#f0fdf4',
  amber:      '#b45309',
  amberLight: '#fffbeb',
  red:        '#dc2626',
  redLight:   '#fef2f2',
  purple:     '#7c3aed',
  purpleLight:'#f5f3ff',

  // Neutrals
  bg:         '#f5f6f8',   // Page background
  surface:    '#ffffff',   // Card / panel
  border:     'rgba(0,0,0,0.08)',
  borderMid:  'rgba(0,0,0,0.13)',
  text1:      '#0f172a',   // Primary text
  text2:      '#475569',   // Secondary text
  text3:      '#94a3b8',   // Muted / label
};

export const R = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
};

export const S = {
  // Common header style
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  // Primary CTA button
  ctaBtn: {
    backgroundColor: '#1a3a6b',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  // Secondary (outline) button
  outlineBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  outlineBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 16,
  },
  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.7,
    color: '#94a3b8',
    marginBottom: 10,
  },
};
