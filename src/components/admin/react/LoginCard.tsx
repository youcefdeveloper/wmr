import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import { useEffect } from 'react'
import { signIn } from 'auth-astro/client'

export default function LoginCard() {
  const { theme } = useAdminThemeStore()

  useEffect(() => {
    const themeDiv = document.querySelector('.theme')
    if (!themeDiv) return

    if (theme === 'dark') {
      themeDiv.classList.add('dark')
    } else {
      themeDiv.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className={`card card-auth ${theme === 'light' ? 'card-light light' : 'card-dark'}`}>
      <div className="card-body">
        <a href="/">
          <div className="d-flex d-flex justify-content-center mt-3 mb-5">
            <img
              src={theme === 'light' ? '/logos/wmr_logo_light.png' : '/logos/wmr_logo_dark.png'}
              width="90"
              height="90"
              alt="WMR"
            />
          </div>
        </a>
        
        <div className="d-flex flex-column gap-2 w-100">
          {/* Google Login Button */}
          <button
            type="button"
            onClick={() => signIn('google')}
            className="btn btn-lg btn-auth btn-auth-google w-100 px-4 fw-semibold d-flex align-items-center justify-content-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Login with Google</span>
          </button>

          {/* GitHub Login Button */}
          <button
            type="button"
            onClick={() => signIn('github')}
            className="btn btn-lg btn-auth btn-auth-github w-100 px-4 fw-semibold d-flex align-items-center justify-content-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>Login with GitHub</span>
          </button>

          {/* LinkedIn Login Button */}
          <button
            type="button"
            onClick={() => signIn('linkedin')}
            className="btn btn-lg btn-auth btn-auth-linkedin w-100 px-4 fw-semibold d-flex align-items-center justify-content-center gap-3"
          >
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '24px', 
              height: '24px', 
              backgroundColor: '#fff',
              borderRadius: '3px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </span>
            <span>Login with LinkedIn</span>
          </button>

          {/* Microsoft Login Button */}
          <button
            type="button"
            onClick={() => signIn('microsoft-entra-id')}
            className="btn btn-lg btn-auth btn-auth-microsoft w-100 px-4 fw-semibold d-flex align-items-center justify-content-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="#f25022" d="M1 1h10v10H1z"/>
              <path fill="#00a4ef" d="M13 1h10v10H13z"/>
              <path fill="#7fba00" d="M1 13h10v10H1z"/>
              <path fill="#ffb900" d="M13 13h10v10H13z"/>
            </svg>
            <span>Login with Microsoft</span>
          </button>

          {/* Apple Login Button */}
          <button
            type="button"
            onClick={() => signIn('apple')}
            className="btn btn-lg btn-auth btn-auth-apple w-100 px-4 fw-semibold d-flex align-items-center justify-content-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span>Login with Apple</span>
          </button>
        </div>
      </div>
    </div>
  )
}