import { useEffect, useState } from 'react'

import { default as apiRequest } from '../../services/api'

import styles from './BookingModal.module.css'

function BookingModal({
  service,
  show,
  onClose,
}) {
  const [formData, setFormData] = useState({
    booking_date: '',
    booking_time: '',
    address: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!show) {
      return
    }

    setFormData({
      booking_date: '',
      booking_time: '',
      address: '',
      notes: '',
    })

    setError('')
    setSuccess(false)
    setLoading(false)
  }, [show])

  if (!show || !service) {
    return null
  }

  const getTodayDate = () => {
    const today = new Date()

    const year = today.getFullYear()

    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0')

    const day = String(
      today.getDate()
    ).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError('')
  }

  const validateForm = () => {
    const {
      booking_date,
      booking_time,
      address,
    } = formData

    if (!booking_date) {
      setError(
        'Please select a booking date.'
      )

      return false
    }

    if (booking_date < getTodayDate()) {
      setError(
        'Booking date cannot be in the past.'
      )

      return false
    }

    if (!booking_time) {
      setError(
        'Please select a preferred time.'
      )

      return false
    }

    if (!address.trim()) {
      setError(
        'Please enter the service address.'
      )

      return false
    }

    if (address.trim().length < 10) {
      setError(
        'Please enter a complete service address.'
      )

      return false
    }

    if (!service.is_available) {
      setError(
        'This service is currently unavailable.'
      )

      return false
    }

    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await apiRequest('/bookings/', {
        method: 'POST',
        body: JSON.stringify({
          service: service.id,
          booking_date:
            formData.booking_date,
          booking_time:
            formData.booking_time,
          address:
            formData.address.trim(),
          notes:
            formData.notes.trim(),
        }),
      })

      setSuccess(true)
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to create booking. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={styles.modal}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className={styles.header}>
          <div>
            <span
              className={styles.eyebrow}
            >
              BOOK SERVICE
            </span>

            <h2>
              {service.name}
            </h2>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close booking modal"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {success ? (
          <div
            className={
              styles.successState
            }
          >
            <div
              className={
                styles.successIcon
              }
            >
              <i className="bi bi-check-lg"></i>
            </div>

            <span
              className={
                styles.successBadge
              }
            >
              BOOKING CREATED
            </span>

            <h3>
              Booking created successfully!
            </h3>

            <p>
              Your booking request has been
              submitted successfully. It is
              currently pending provider
              confirmation.
            </p>

            <button
              type="button"
              className={`${styles.successButton} btn`}
              onClick={onClose}
            >
              Done

              <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        ) : (
          <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
          >
            <div
              className={
                styles.serviceSummary
              }
            >
              <div
                className={
                  styles.serviceIcon
                }
              >
                <i className="bi bi-tools"></i>
              </div>

              <div>
                <span>
                  Starting from
                </span>

                <strong>
                  ₹
                  {Number(
                    service.price || 0
                  ).toLocaleString('en-IN')}
                </strong>
              </div>

              <span
                className={
                  service.is_available
                    ? styles.available
                    : styles.unavailable
                }
              >
                {service.is_available
                  ? 'Available'
                  : 'Unavailable'}
              </span>
            </div>

            {error && (
              <div
                className={
                  styles.errorMessage
                }
                role="alert"
              >
                <i className="bi bi-exclamation-circle"></i>

                <span>
                  {error}
                </span>
              </div>
            )}

            <div className="row g-3">
              <div className="col-md-6">
                <label
                  htmlFor="booking_date"
                  className={styles.label}
                >
                  Booking Date
                </label>

                <div
                  className={
                    styles.inputWrapper
                  }
                >
                  <i className="bi bi-calendar3"></i>

                  <input
                    id="booking_date"
                    type="date"
                    name="booking_date"
                    value={
                      formData.booking_date
                    }
                    onChange={
                      handleChange
                    }
                    min={getTodayDate()}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="booking_time"
                  className={styles.label}
                >
                  Preferred Time
                </label>

                <div
                  className={
                    styles.inputWrapper
                  }
                >
                  <i className="bi bi-clock"></i>

                  <input
                    id="booking_time"
                    type="time"
                    name="booking_time"
                    value={
                      formData.booking_time
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="col-12">
                <label
                  htmlFor="address"
                  className={styles.label}
                >
                  Service Address
                </label>

                <div
                  className={
                    styles.textareaWrapper
                  }
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
                    placeholder="Enter the complete address where the service is required..."
                    rows="3"
                    required
                    disabled={loading}
                  ></textarea>
                </div>
              </div>

              <div className="col-12">
                <label
                  htmlFor="notes"
                  className={styles.label}
                >
                  Additional Notes

                  <span>
                    Optional
                  </span>
                </label>

                <div
                  className={
                    styles.textareaWrapper
                  }
                >
                  <i className="bi bi-chat-left-text"></i>

                  <textarea
                    id="notes"
                    name="notes"
                    value={
                      formData.notes
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Tell the service provider anything they should know..."
                    rows="3"
                    disabled={loading}
                  ></textarea>
                </div>
              </div>
            </div>

            <div
              className={
                styles.formFooter
              }
            >
              <div
                className={
                  styles.footerNote
                }
              >
                <i className="bi bi-shield-check"></i>

                <span>
                  Your booking details
                  are securely submitted.
                </span>
              </div>

              <button
                type="submit"
                className={`${styles.submitButton} btn`}
                disabled={
                  loading ||
                  !service.is_available
                }
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>

                    Booking...
                  </>
                ) : (
                  <>
                    Confirm Booking

                    <i className="bi bi-arrow-right ms-2"></i>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default BookingModal