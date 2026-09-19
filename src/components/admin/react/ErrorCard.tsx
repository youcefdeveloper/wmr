import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import { useEffect } from 'react'

interface ErrorCardProps {
  errorType?: string
}

const errorMessages: Record<string, { title: string; description: string }> = {
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in. Your email is not in the allowed list.',
  },
  Configuration: {
    title: 'Configuration Error',
    description: 'There is a problem with the server configuration.',
  },
  Verification: {
    title: 'Verification Error',
    description: 'The verification token has expired or has already been used.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during authentication. Please try again.',
  },
}

export default function ErrorCard({ errorType }: ErrorCardProps) {
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

  const errorInfo = errorMessages[errorType || 'Default'] || errorMessages.Default

  return (
    <div className={`card card-auth ${theme === 'light' ? 'card-light light' : 'card-dark'}`}>
      <div className="card-body text-center">
        <a href="/">
          <div className="d-flex justify-content-center mt-3 mb-4">
            <img
              src={theme === 'light' ? '/logos/wmr_logo_light.png' : '/logos/wmr_logo_dark.png'}
              width="90"
              height="90"
              alt="WMR"
            />
          </div>
        </a>
        
        <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#dc3545" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
          </svg>
          <h5 className="mb-0 text-danger fw-light" style={{fontSize: 18}}>{errorInfo.title}</h5>
        </div>

        <p className="mb-4 text-muted px-xl-4 fw-light" style={{ fontSize: 16 }}>{errorInfo.description}</p>

        <div className="d-flex flex-column gap-2">
          <a href="/auth/login" className="btn btn-lg btn-modal w-100">
            Try Again
          </a>
          <a href="/" className="btn btn-lg btn-outline-dark w-100">
            Go to Home
          </a>
        </div>
      </div>
    </div>
  )
}
