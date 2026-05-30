// ════════════════════════════════════════════════════════════
//  Pip-Boy phosphor terminal palette
//  Near-black CRT base, phosphor-green primary, amber sparing.
// ════════════════════════════════════════════════════════════
export const T = {
  // Surfaces — near-black with a faint green cast
  bgDeep: '#070b07',
  bgSurface: '#0c120c',
  bgSurfaceAlt: '#101810',
  bgInput: '#080d08',
  bgWeekend: '#0a0f0a',
  bgToday: '#0c160c',

  // Borders
  borderSubtle: '#1a2c1a',
  borderActive: '#2bff88',

  // Text — phosphor greens, readable
  textPrimary: '#b8f5c8',
  textSecondary: '#5fa873',
  textMuted: '#3c6b48',

  // Accent — classic CRT phosphor green
  accent: '#2bff88',
  accentMuted: '#1aa856',
  accentGlow: 'rgba(43,255,136,0.14)',
  accentDim: 'rgba(43,255,136,0.06)',

  // Secondary — amber, used sparingly for highlights/warnings
  amber: '#ffb340',
  amberGlow: 'rgba(255,179,64,0.14)',

  // Radii
  rSm: '4px',
  rMd: '6px',

  // Shadows / glows
  shCard: '0 1px 3px rgba(0,0,0,0.5)',
  shHover: '0 0 16px rgba(43,255,136,0.18)',
  shGlow: '0 0 22px rgba(43,255,136,0.14)',
  textGlow: '0 0 6px rgba(43,255,136,0.45)',

  // Transitions
  trF: '0.15s ease',
  trM: '0.25s ease',

  // Typography — monospace terminal chrome, readable body
  font: 'ui-monospace,"Cascadia Mono","Cascadia Code","Segoe UI Mono",Consolas,"Roboto Mono",monospace',
  fontMono: 'ui-monospace,"Cascadia Mono","Cascadia Code","Segoe UI Mono",Consolas,"Roboto Mono",monospace',
}

export const eiStyle = {
  backgroundColor: T.bgInput,
  border: '1px solid ' + T.borderSubtle,
  borderRadius: T.rSm,
  padding: '4px 6px',
  color: T.textPrimary,
  fontSize: '11px',
  outline: 'none',
  fontFamily: T.fontMono,
  transition: T.trF,
}
