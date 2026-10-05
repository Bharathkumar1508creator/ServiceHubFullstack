import { Navigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({
  children,
  allowedRole,
}) {
  const {
    isAuthenticated,
    user,
  } = useAuth()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (
    allowedRole &&
    user?.role !== allowedRole
  ) {
    if (user?.role === 'provider') {
      return (
        <Navigate
          to="/provider-dashboard"
          replace
        />
      )
    }

    return (
      <Navigate
        to="/customer-dashboard"
        replace
      />
    )
  }

  return children
}

export default ProtectedRoute