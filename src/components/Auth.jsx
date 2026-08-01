import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { T } from '../lib/theme'

export default function Auth() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setInfo('Account created — check your email to confirm, then sign in.')
    }
    setLoading(false)
  }

  function toggleMode() {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setError(null)
    setInfo(null)
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
          {mode === 'signin' ? 'Authenticate to access terminal' : 'Register a new terminal account'}
        </p>

        <form onSubmit={handleSubmit}>
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
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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

          {info && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 12px',
                backgroundColor: T.accentGlow,
                border: '1px solid ' + T.accentMuted,
                borderRadius: T.rSm,
                fontSize: '13px',
                color: T.accent,
              }}
            >
              {info}
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
            {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in' : 'Sign up')}
          </button>
        </form>

        <button
          onClick={toggleMode}
          style={{
            marginTop: '18px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: T.textMuted,
            fontSize: '12px',
            fontFamily: T.fontMono,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
