// ════════════════════════════════════════════════════════════
//  Pip-Boy phosphor terminal palette
//  Values resolve to CSS variables (defined in index.css) so the
//  whole palette can swap between dark (default) and light mode
//  by toggling [data-theme="light"] on <html>. Inline styles read
//  these var() strings directly — no component changes needed.
// ════════════════════════════════════════════════════════════
export const T = {
  // Surfaces
  bgDeep: 'var(--c-bg-deep)',
  bgSurface: 'var(--c-bg-surface)',
  bgSurfaceAlt: 'var(--c-bg-surface-alt)',
  bgInput: 'var(--c-bg-input)',
  bgWeekend: 'var(--c-bg-weekend)',
  bgToday: 'var(--c-bg-today)',

  // Borders
  borderSubtle: 'var(--c-border-subtle)',
  borderActive: 'var(--c-border-active)',

  // Text
  textPrimary: 'var(--c-text-primary)',
  textSecondary: 'var(--c-text-secondary)',
  textMuted: 'var(--c-text-muted)',

  // Accent — phosphor green
  accent: 'var(--c-accent)',
  accentMuted: 'var(--c-accent-muted)',
  accentGlow: 'var(--c-accent-glow)',
  accentDim: 'var(--c-accent-dim)',

  // Secondary — amber, used sparingly
  amber: 'var(--c-amber)',
  amberGlow: 'var(--c-amber-glow)',

  // Radii
  rSm: '4px',
  rMd: '6px',

  // Shadows / glows
  shCard: 'var(--c-sh-card)',
  shHover: 'var(--c-sh-hover)',
  shGlow: 'var(--c-sh-glow)',
  textGlow: 'var(--c-text-glow)',

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
