import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  emailRegex,
  passwordRegex,
  nameRegex,
  phoneRegex,
  addressRegex,
} from '../../utils/regex'

import styles from './Signup.module.css'

const API_URL = '/api/register/'

function Signup() {
  const pageRef = useRef(null)
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    address: '',
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const elements =
      pageRef.current?.querySelectorAll('[data-reveal]')

    if (!elements) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              styles.revealed
            )

            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.15,
      }
    )

    elements.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }))

    setApiError('')
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name =
        'Full name is required.'
    } else if (
      !nameRegex.test(
        formData.name.trim()
      )
    ) {
      newErrors.name =
        'Please enter a valid name.'
    }

    if (!formData.email.trim()) {
      newErrors.email =
        'Email address is required.'
    } else if (
      !emailRegex.test(
        formData.email.trim()
      )
    ) {
      newErrors.email =
        'Please enter a valid email address.'
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number =
        'Phone number is required.'
    } else if (
      !phoneRegex.test(
        formData.phone_number.trim()
      )
    ) {
      newErrors.phone_number =
        'Enter a valid 10-digit Indian mobile number.'
    }

    if (!formData.password) {
      newErrors.password =
        'Password is required.'
    } else if (
      !passwordRegex.test(
        formData.password
      )
    ) {
      newErrors.password =
        'Password must contain 8+ characters, uppercase, lowercase, number and special character.'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        'Please confirm your password.'
    } else if (
      formData.password !==
      formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        'Passwords do not match.'
    }

    if (!formData.address.trim()) {
      newErrors.address =
        'Address is required.'
    } else if (
      !addressRegex.test(
        formData.address.trim()
      )
    ) {
      newErrors.address =
        'Please enter a valid address.'
    }

    if (!formData.role) {
      newErrors.role =
        'Please select an account type.'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setApiError('')

    const isValid = validateForm()

    if (!isValid) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        API_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            username:
              formData.email.trim(),
            email:
              formData.email.trim(),
            password:
              formData.password,
            role:
              formData.role,
            phone_number:
              formData.phone_number.trim(),
            address:
              formData.address.trim(),
            first_name:
              formData.name.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const backendError =
          data.detail ||
          data.message ||
          Object.values(data)
            .flat()
            .join(' ')

        throw new Error(
          backendError ||
            'Unable to create your account.'
        )
      }

      setSuccess(true)

      setTimeout(() => {
        navigate('/login')
      }, 1800)

    } catch (error) {
      console.error(
        'Signup error:',
        error
      )

      setApiError(
        error.message ||
          'Unable to create account. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleMouseMove = (event) => {
    const card = event.currentTarget

    const rect =
      card.getBoundingClientRect()

    const x =
      ((event.clientX - rect.left) /
        rect.width) *
      100

    const y =
      ((event.clientY - rect.top) /
        rect.height) *
      100

    const rotateY =
      ((x - 50) / 50) * 2

    const rotateX =
      ((50 - y) / 50) * 2

    card.style.setProperty(
      '--mouse-x',
      `${x}%`
    )

    card.style.setProperty(
      '--mouse-y',
      `${y}%`
    )

    card.style.setProperty(
      '--rotate-x',
      `${rotateX}deg`
    )

    card.style.setProperty(
      '--rotate-y',
      `${rotateY}deg`
    )
  }

  const handleMouseLeave = (event) => {
    const card = event.currentTarget

    card.style.setProperty(
      '--mouse-x',
      '50%'
    )

    card.style.setProperty(
      '--mouse-y',
      '50%'
    )

    card.style.setProperty(
      '--rotate-x',
      '0deg'
    )

    card.style.setProperty(
      '--rotate-y',
      '0deg'
    )
  }

  return (
    <main
      ref={pageRef}
      className={styles.signupPage}
    >

      <div
        className={styles.backgroundOrbOne}
      ></div>

      <div
        className={styles.backgroundOrbTwo}
      ></div>

      <section
        className={styles.signupSection}
      >

        <div className="container">

          <div className="row justify-content-center align-items-center g-5">

            {/* LEFT SIDE */}

            <div
              className="col-lg-5"
              data-reveal
            >

              <div
                className={styles.introContent}
              >

                <span
                  className={styles.eyebrow}
                >
                  JOIN SERVICEHUB
                </span>

                <h1>
                  Build your
                  <span> service journey.</span>
                </h1>

                <p>
                  Create your ServiceHub
                  account and get access to
                  trusted local services and
                  simple booking management.
                </p>

                <div
                  className={styles.featureList}
                >

                  <div
                    className={
                      styles.featureItem
                    }
                  >

                    <div
                      className={
                        styles.featureIcon
                      }
                    >
                      <i className="bi bi-lightning-charge"></i>
                    </div>

                    <div>
                      <strong>
                        Quick Registration
                      </strong>

                      <span>
                        Create your account in minutes.
                      </span>
                    </div>

                  </div>

                  <div
                    className={
                      styles.featureItem
                    }
                  >

                    <div
                      className={
                        styles.featureIcon
                      }
                    >
                      <i className="bi bi-calendar-check"></i>
                    </div>

                    <div>
                      <strong>
                        Simple Bookings
                      </strong>

                      <span>
                        Find and book services easily.
                      </span>
                    </div>

                  </div>

                  <div
                    className={
                      styles.featureItem
                    }
                  >

                    <div
                      className={
                        styles.featureIcon
                      }
                    >
                      <i className="bi bi-person-check"></i>
                    </div>

                    <div>
                      <strong>
                        Flexible Account
                      </strong>

                      <span>
                        Join as a customer or provider.
                      </span>
                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* SIGNUP FORM */}

            <div
              className="col-lg-6"
              data-reveal
            >

              <div
                className={styles.formCard}
                onMouseMove={
                  handleMouseMove
                }
                onMouseLeave={
                  handleMouseLeave
                }
              >

                <div
                  className={styles.cardGlow}
                ></div>

                <div
                  className={styles.formHeader}
                >

                  <div
                    className={styles.formIcon}
                  >
                    <i className="bi bi-person-plus"></i>
                  </div>

                  <div>
                    <span>
                      CREATE ACCOUNT
                    </span>

                    <h2>
                      Sign Up
                    </h2>
                  </div>

                </div>

                {apiError && (
                  <div
                    className={
                      styles.errorMessage
                    }
                  >
                    <i className="bi bi-exclamation-circle"></i>

                    <span>
                      {apiError}
                    </span>
                  </div>
                )}

                {success && (
                  <div
                    className={
                      styles.successMessage
                    }
                  >
                    <i className="bi bi-check-circle"></i>

                    <span>
                      Account created successfully!
                      Redirecting to login...
                    </span>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  noValidate
                >

                  <div className="row g-3">

                    {/* NAME */}

                    <div className="col-md-6">

                      <div
                        className={
                          styles.inputGroup
                        }
                      >

                        <label htmlFor="name">
                          Full Name
                        </label>

                        <div
                          className={`${styles.inputWrapper} ${
                            errors.name
                              ? styles.inputError
                              : ''
                          }`}
                        >

                          <i className="bi bi-person"></i>

                          <input
                            id="name"
                            type="text"
                            name="name"
                            value={
                              formData.name
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter your name"
                            autoComplete="name"
                          />

                        </div>

                        {errors.name && (
                          <span
                            className={
                              styles.fieldError
                            }
                          >
                            <i className="bi bi-exclamation-circle"></i>

                            {errors.name}
                          </span>
                        )}

                      </div>

                    </div>

                    {/* PHONE */}

                    <div className="col-md-6">

                      <div
                        className={
                          styles.inputGroup
                        }
                      >

                        <label htmlFor="phone_number">
                          Phone Number
                        </label>

                        <div
                          className={`${styles.inputWrapper} ${
                            errors.phone_number
                              ? styles.inputError
                              : ''
                          }`}
                        >

                          <i className="bi bi-telephone"></i>

                          <input
                            id="phone_number"
                            type="tel"
                            name="phone_number"
                            value={
                              formData.phone_number
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter phone number"
                            autoComplete="tel"
                            maxLength="10"
                          />

                        </div>

                        {errors.phone_number && (
                          <span
                            className={
                              styles.fieldError
                            }
                          >
                            <i className="bi bi-exclamation-circle"></i>

                            {errors.phone_number}
                          </span>
                        )}

                      </div>

                    </div>

                    {/* EMAIL */}

                    <div className="col-12">

                      <div
                        className={
                          styles.inputGroup
                        }
                      >

                        <label htmlFor="email">
                          Email Address
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
                            id="email"
                            type="email"
                            name="email"
                            value={
                              formData.email
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter your email"
                            autoComplete="email"
                          />

                        </div>

                        {errors.email && (
                          <span
                            className={
                              styles.fieldError
                            }
                          >
                            <i className="bi bi-exclamation-circle"></i>

                            {errors.email}
                          </span>
                        )}

                      </div>

                    </div>

                    {/* ROLE */}

                    <div className="col-12">

                      <div
                        className={
                          styles.inputGroup
                        }
                      >

                        <label>
                          Account Type
                        </label>

                        <div
                          className={
                            styles.roleGrid
                          }
                        >

                          <button
                            type="button"
                            className={`${styles.roleCard} ${
                              formData.role ===
                              'customer'
                                ? styles.roleActive
                                : ''
                            }`}
                            onClick={() =>
                              setFormData(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  role: 'customer',
                                })
                              )
                            }
                          >

                            <i className="bi bi-person"></i>

                            <span>
                              Customer
                            </span>

                            <small>
                              Book services
                            </small>

                          </button>

                          <button
                            type="button"
                            className={`${styles.roleCard} ${
                              formData.role ===
                              'provider'
                                ? styles.roleActive
                                : ''
                            }`}
                            onClick={() =>
                              setFormData(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  role: 'provider',
                                })
                              )
                            }
                          >

                            <i className="bi bi-briefcase"></i>

                            <span>
                              Service Provider
                            </span>

                            <small>
                              Offer services
                            </small>

                          </button>

                        </div>

                      </div>

                    </div>

                    {/* PASSWORD */}

                    <div className="col-md-6">

                      <div
                        className={
                          styles.inputGroup
                        }
                      >

                        <label htmlFor="password">
                          Password
                        </label>

                        <div
                          className={`${styles.inputWrapper} ${
                            errors.password
                              ? styles.inputError
                              : ''
                          }`}
                        >

                          <i className="bi bi-lock"></i>

                          <input
                            id="password"
                            type={
                              showPassword
                                ? 'text'
                                : 'password'
                            }
                            name="password"
                            value={
                              formData.password
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Create password"
                            autoComplete="new-password"
                          />

                          <button
                            type="button"
                            className={
                              styles.passwordButton
                            }
                            onClick={() =>
                              setShowPassword(
                                (
                                  previous
                                ) =>
                                  !previous
                              )
                            }
                          >
                            <i
                              className={
                                showPassword
                                  ? 'bi bi-eye-slash'
                                  : 'bi bi-eye'
                              }
                            ></i>
                          </button>

                        </div>

                        {errors.password && (
                          <span
                            className={
                              styles.fieldError
                            }
                          >
                            <i className="bi bi-exclamation-circle"></i>

                            {errors.password}
                          </span>
                        )}

                      </div>

                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div className="col-md-6">

                      <div
                        className={
                          styles.inputGroup
                        }
                      >

                        <label htmlFor="confirmPassword">
                          Confirm Password
                        </label>

                        <div
                          className={`${styles.inputWrapper} ${
                            errors.confirmPassword
                              ? styles.inputError
                              : ''
                          }`}
                        >

                          <i className="bi bi-shield-lock"></i>

                          <input
                            id="confirmPassword"
                            type={
                              showConfirmPassword
                                ? 'text'
                                : 'password'
                            }
                            name="confirmPassword"
                            value={
                              formData.confirmPassword
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Confirm password"
                            autoComplete="new-password"
                          />

                          <button
                            type="button"
                            className={
                              styles.passwordButton
                            }
                            onClick={() =>
                              setShowConfirmPassword(
                                (
                                  previous
                                ) =>
                                  !previous
                              )
                            }
                          >
                            <i
                              className={
                                showConfirmPassword
                                  ? 'bi bi-eye-slash'
                                  : 'bi bi-eye'
                              }
                            ></i>
                          </button>

                        </div>

                        {errors.confirmPassword && (
                          <span
                            className={
                              styles.fieldError
                            }
                          >
                            <i className="bi bi-exclamation-circle"></i>

                            {errors.confirmPassword}
                          </span>
                        )}

                      </div>

                    </div>

                    {/* ADDRESS */}

                    <div className="col-12">

                      <div
                        className={
                          styles.inputGroup
                        }
                      >

                        <label htmlFor="address">
                          Address
                        </label>

                        <div
                          className={`${styles.textareaWrapper} ${
                            errors.address
                              ? styles.inputError
                              : ''
                          }`}
                        >

                          <i className="bi bi-geo-alt"></i>

                          <textarea
                            id="address"
                            name="address"
                            value={
                              formData.address
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Enter your complete address"
                            rows="3"
                          ></textarea>

                        </div>

                        {errors.address && (
                          <span
                            className={
                              styles.fieldError
                            }
                          >
                            <i className="bi bi-exclamation-circle"></i>

                            {errors.address}
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* SUBMIT */}

                  <button
                    type="submit"
                    className={`${styles.signupButton} btn`}
                    disabled={loading}
                  >

                    {loading ? (
                      <>
                        <span>
                          Creating Account...
                        </span>

                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                        ></span>
                      </>
                    ) : (
                      <>
                        <span>
                          Create Account
                        </span>

                        <i className="bi bi-arrow-right"></i>
                      </>
                    )}

                  </button>

                </form>

                <div
                  className={styles.divider}
                >
                  <span>
                    OR
                  </span>
                </div>

                <p
                  className={
                    styles.loginText
                  }
                >
                  Already have an account?

                  <Link to="/login">
                    Login here
                  </Link>
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Signup