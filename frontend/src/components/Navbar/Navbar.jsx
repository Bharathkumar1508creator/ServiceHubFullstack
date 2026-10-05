import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

import styles from './Navbar.module.css'

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  const {
    isAuthenticated,
    user,
    logout,
  } = useAuth()

  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }

    window.addEventListener(
      'scroll',
      handleScroll
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      )
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const displayName =
    user?.first_name ||
    user?.name ||
    user?.username ||
    user?.email ||
    'User'

  const displayRole =
    user?.role === 'provider'
      ? 'Service Provider'
      : user?.role === 'customer'
        ? 'Customer'
        : user?.role
          ? user.role.charAt(0).toUpperCase() +
            user.role.slice(1)
          : ''

  const dashboardPath =
    user?.role === 'provider'
      ? '/provider-dashboard'
      : '/customer-dashboard'

  return (
    <nav
      className={`${styles.navbar} ${
        scrolled
          ? styles.navbarScrolled
          : ''
      } navbar navbar-expand-lg sticky-top`}
    >

      <div className="container">

        <NavLink
          to="/"
          className={`${styles.logo} navbar-brand`}
        >

          <span
            className={styles.logoIcon}
          >
            <i className="bi bi-tools"></i>
          </span>

          <span>
            Service
            <span
              className={styles.logoHighlight}
            >
              Hub
            </span>
          </span>

        </NavLink>

        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-2"></i>
        </button>

        <div
          className={`collapse navbar-collapse ${styles.navbarContent}`}
          id="mainNavbar"
        >

          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-2">

            <li className="nav-item">

              <NavLink
                to="/"
                className={({ isActive }) =>
                  `${styles.navLink} ${
                    isActive
                      ? styles.active
                      : ''
                  }`
                }
              >
                <i className="bi bi-house me-1"></i>
                Home
              </NavLink>

            </li>

            <li className="nav-item">

              <NavLink
                to="/services"
                className={({ isActive }) =>
                  `${styles.navLink} ${
                    isActive
                      ? styles.active
                      : ''
                  }`
                }
              >
                <i className="bi bi-grid me-1"></i>
                Services
              </NavLink>

            </li>

            <li className="nav-item">

              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `${styles.navLink} ${
                    isActive
                      ? styles.active
                      : ''
                  }`
                }
              >
                <i className="bi bi-info-circle me-1"></i>
                About
              </NavLink>

            </li>

            <li className="nav-item">

              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `${styles.navLink} ${
                    isActive
                      ? styles.active
                      : ''
                  }`
                }
              >
                <i className="bi bi-envelope me-1"></i>
                Contact
              </NavLink>

            </li>

          </ul>

          {/* AUTH SECTION */}

          {isAuthenticated ? (

            <div className={`d-flex flex-column flex-lg-row align-items-lg-center gap-2 ${styles.authActions}`}>

              <NavLink
                to={dashboardPath}
                className={`${styles.registerButton} btn`}
              >
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </NavLink>

              <NavLink
                to="/chats"
                className={`${styles.chatsButton} btn`}
              >
                <i className="bi bi-chat-dots me-2"></i>
                Chats
              </NavLink>

              <span
                className={styles.userWelcome}
              >
                <i className="bi bi-person-circle me-2"></i>

                Hi, {displayName}
                {displayRole && ` (${displayRole})`}
              </span>

              <button
                type="button"
                className={`${styles.loginButton} btn`}
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </button>

            </div>

          ) : (

            <div className={`d-flex flex-column flex-lg-row gap-2 ${styles.authActions}`}>

              <NavLink
                to="/login"
                className={`${styles.loginButton} btn`}
              >
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={`${styles.registerButton} btn`}
              >
                <i className="bi bi-person-plus me-2"></i>
                Register
              </NavLink>

            </div>

          )}

        </div>

      </div>

    </nav>
  )
}

export default Navbar