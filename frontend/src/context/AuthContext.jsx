import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem('access_token')
  )

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user')

    try {
      return storedUser
        ? JSON.parse(storedUser)
        : null
    } catch {
      return null
    }
  })

  const [isAuthenticated, setIsAuthenticated] =
    useState(
      Boolean(
        localStorage.getItem('access_token')
      )
    )

  useEffect(() => {
    const handleAuthExpired = () => {
      setAccessToken(null)
      setUser(null)
      setIsAuthenticated(false)
    }

    window.addEventListener(
      'servicehub:auth-expired',
      handleAuthExpired
    )

    return () => {
      window.removeEventListener(
        'servicehub:auth-expired',
        handleAuthExpired
      )
    }
  }, [])

  const login = (data) => {
    const {
      access_token,
      refresh_token,
    } = data
    const loggedInUser = data.user || {
      username: data.username,
      email: data.email,
      first_name: data.first_name,
      role: data.role,
    }

    localStorage.setItem(
      'access_token',
      access_token
    )

    localStorage.setItem(
      'refresh_token',
      refresh_token
    )

    if (loggedInUser) {
      localStorage.setItem(
        'user',
        JSON.stringify(loggedInUser)
      )
    } else {
      localStorage.removeItem('user')
    }

    setAccessToken(access_token)
    setUser(loggedInUser || null)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')

    setAccessToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export default AuthProvider