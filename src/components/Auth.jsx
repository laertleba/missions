import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { T } from '../lib/theme'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const inputStyle = {
    display: 'block',
    width: '100%',
    backgroundColor: T.bgInput,
    border: '1px solid ' + T.borderSubtle,
    borderRadius: T.rSm,
    padding: '12px 14px',
    color: T.textPrimary,
    fontSize: '15px',
    outline: 'none',
    transition: T.trF,
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: T.bgDeep,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: T.font,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: T.bgSurface,
          border: '1px solid ' + T.borderSubtle,
          borderRadius: T.rMd,
          padding: '32px 28px',
          boxShadow: T.shCard,
        }}
      >
        <h1
          style={{
            margin: '0 0 6px 0',
            fontSize: '22px',
            fontWeight: '700',
            color: T.accent,
            fontFamily: T.fontMono,
            textShadow: T.textGlow,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          ▌ Missions
        </h1>
        <p style={{ margin: '0 0 28px 0', fontSize: '13px', color: T.textMuted, fontFamily: T.fontMono }}>
          Authenticate to access terminal
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: T.textSecondary, marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: T.textSecondary, marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 12px',
                backgroundColor: 'rgba(180,60,60,0.12)',
                border: '1px solid rgba(180,60,60,0.3)',
                borderRadius: T.rSm,
                fontSize: '13px',
                color: '#e07070',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: T.accent,
              border: 'none',
              borderRadius: T.rSm,
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: T.trF,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
