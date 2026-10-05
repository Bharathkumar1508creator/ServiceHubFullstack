import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

import styles from './Login.module.css'

function Login() {
  const navigate = useNavigate()

  const { login } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState({})

  const [isLoading, setIsLoading] =
    useState(false)

  const [serverError, setServerError] =
    useState('')

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }))

    setServerError('')
  }

  const validateForm = () => {
    const newErrors = {}

    const email =
      formData.email.trim()

    const password =
      formData.password

    if (!email) {
      newErrors.email =
        'Email is required.'
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
        email
      )
    ) {
      newErrors.email =
        'Enter a valid email address.'
    }

    if (!password) {
      newErrors.password =
        'Password is required.'
    }

    setErrors(newErrors)

    return (
      Object.keys(newErrors).length === 0
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setServerError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/login/',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            username:
              formData.email.trim(),
            password:
              formData.password,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            'Invalid email or password.'
        )
      }

      if (
        !data.access_token ||
        !data.refresh_token
      ) {
        throw new Error(
          'Login response is missing authentication tokens.'
        )
      }

      if (!data.user) {
        throw new Error(
          'Login response is missing user information.'
        )
      }

      login(data)

      if (
        data.user.role ===
        'provider'
      ) {
        navigate(
          '/provider-dashboard',
          {
            replace: true,
          }
        )
      } else {
        navigate(
          '/customer-dashboard',
          {
            replace: true,
          }
        )
      }
    } catch (error) {
      setServerError(
        error.message ||
          'Something went wrong. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      className={`${styles.loginPage} d-flex align-items-center`}
    >
      <div className={styles.backgroundGlowOne}></div>

      <div className={styles.backgroundGlowTwo}></div>

      <div className="container py-5">
        <div className="row justify-content-center align-items-center g-5">
          {/* Left content */}
          <div className="col-lg-5">
            <div className={styles.introContent}>
              <span
                className={styles.eyebrow}
              >
                <i className="bi bi-shield-check"></i>
                SECURE ACCESS
              </span>

              <h1
                className={`${styles.title} mt-3`}
              >
                Welcome
                <br />
                <span>back.</span>
              </h1>

              <p
                className={styles.description}
              >
                Sign in to manage your
                bookings, discover services
                and stay connected with
                trusted professionals.
              </p>

              <div
                className={`${styles.featureList} mt-4`}
              >
                <div
                  className={
                    styles.featureItem
                  }
                >
                  <span>
                    <i className="bi bi-lightning-charge-fill"></i>
                  </span>

                  <div>
                    <strong>
                      Fast booking
                    </strong>

                    <small>
                      Book services in just
                      a few clicks.
                    </small>
                  </div>
                </div>

                <div
                  className={
                    styles.featureItem
                  }
                >
                  <span>
                    <i className="bi bi-lock-fill"></i>
                  </span>

                  <div>
                    <strong>
                      Secure account
                    </strong>

                    <small>
                      Your account stays
                      protected.
                    </small>
                  </div>
                </div>

                <div
                  className={
                    styles.featureItem
                  }
                >
                  <span>
                    <i className="bi bi-activity"></i>
                  </span>

                  <div>
                    <strong>
                      Live updates
                    </strong>

                    <small>
                      Track your service
                      requests easily.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login card */}
          <div className="col-sm-10 col-md-8 col-lg-5">
            <div
              className={styles.loginCard}
            >
              <div
                className={
                  styles.cardTopGlow
                }
              ></div>

              <div
                className={
                  styles.formHeader
                }
              >
                <div
                  className={
                    styles.loginIcon
                  }
                >
                  <i className="bi bi-person-lock"></i>
                </div>

                <span
                  className={styles.formLabel}
                >
                  MEMBER LOGIN
                </span>

                <h2>
                  Sign in to
                  <br />
                  ServiceHub
                </h2>

                <p>
                  Enter your credentials
                  to continue.
                </p>
              </div>

              {serverError && (
                <div
                  className={`${styles.errorAlert} alert mb-4`}
                  role="alert"
                >
                  <i className="bi bi-exclamation-circle me-2"></i>

                  {serverError}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                noValidate
              >
                {/* Email */}
                <div className="mb-3">
                  <label
                    htmlFor="email"
                    className={
                      styles.inputLabel
                    }
                  >
                    Email address
                  </label>

                  <div
                    className={`${styles.inputWrapper} ${
                      errors.email
                        ? styles.inputError
                        : ''
                    }`}
                  >
                    <i className="bi bi-envelope"></i>

                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  {errors.email && (
                    <small
                      className={
                        styles.fieldError
                      }
                    >
                      {errors.email}
                    </small>
                  )}
                </div>

                {/* Password */}
                <div className="mb-4">
                  <div
                    className="d-flex justify-content-between align-items-center"
                  >
                    <label
                      htmlFor="password"
                      className={
                        styles.inputLabel
                      }
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      className={
                        styles.forgotButton
                      }
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div
                    className={`${styles.inputWrapper} ${
                      errors.password
                        ? styles.inputError
                        : ''
                    }`}
                  >
                    <i className="bi bi-key"></i>

                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={
                        formData.password
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                  </div>

                  {errors.password && (
                    <small
                      className={
                        styles.fieldError
                      }
                    >
                      {errors.password}
                    </small>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className={`${styles.loginButton} btn w-100`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      ></span>

                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <i className="bi bi-arrow-right ms-2"></i>
                    </>
                  )}
                </button>
              </form>

              <div
                className={
                  styles.divider
                }
              >
                <span></span>
                <small>
                  NEW TO SERVICEHUB?
                </small>
                <span></span>
              </div>

              <Link
                to="/signup"
                className={
                  styles.registerLink
                }
              >
                Create your account

                <i className="bi bi-arrow-up-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Login