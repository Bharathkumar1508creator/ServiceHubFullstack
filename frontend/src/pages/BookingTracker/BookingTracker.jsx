import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import apiRequest, { getBookings } from '../../services/api'

import styles from './BookingTracker.module.css'

const TRACKING_INTERVAL = 20000

const trackingSteps = [
  {
    key: 'booked',
    title: 'Request sent',
    description: 'Your booking is with the provider.',
    icon: 'bi-send-check',
  },
  {
    key: 'confirmed',
    title: 'Provider accepted',
    description: 'The provider has confirmed your service.',
    icon: 'bi-patch-check',
  },
  {
    key: 'completed',
    title: 'Service completed',
    description: 'Your service has been completed.',
    icon: 'bi-house-check',
  },
]

function BookingTracker() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [showCancellationModal, setShowCancellationModal] =
    useState(false)
  const [cancellationReason, setCancellationReason] =
    useState('')
  const [cancellationError, setCancellationError] =
    useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    let isCurrent = true

    const loadBooking = async (showLoading) => {
      if (showLoading) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError('')

      try {
        const response = await getBookings()
        const bookings = Array.isArray(response)
          ? response
          : response.results || []
        const trackedBooking = bookings.find(
          (item) => String(item.id) === id
        )

        if (!trackedBooking) {
          throw new Error(
            'This booking could not be found in your account.'
          )
        }

        if (isCurrent) {
          setBooking(trackedBooking)
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            requestError.message ||
              'Unable to load booking progress.'
          )
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    loadBooking(true)
    const refreshTimer = window.setInterval(
      () => loadBooking(false),
      TRACKING_INTERVAL
    )

    return () => {
      isCurrent = false
      window.clearInterval(refreshTimer)
    }
  }, [id])

  const formatDateTime = (value) => {
    if (!value) {
      return 'Waiting for update'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return 'Waiting for update'
    }

    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  const formatSchedule = (date, time) => {
    if (!date) {
      return 'Schedule not available'
    }

    const value = new Date(
      `${date}T${time || '00:00:00'}`
    )

    if (Number.isNaN(value.getTime())) {
      return 'Schedule not available'
    }

    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'full',
      timeStyle: time ? 'short' : undefined,
    }).format(value)
  }

  const formatStatus = (status) =>
    (status || 'pending')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())

  const submitCancellation = async (event) => {
    event.preventDefault()
    setCancellationError('')
    setIsCancelling(true)

    try {
      if (booking.status === 'pending') {
        await apiRequest(`/bookings/${booking.id}/cancel/`, {
          method: 'POST',
          body: JSON.stringify({}),
        })
        setBooking((current) => ({
          ...current,
          status: 'cancelled',
          cancelled_by: 'customer',
        }))
      } else {
        const updatedBooking = await apiRequest(
          `/bookings/${booking.id}/request-cancellation/`,
          {
            method: 'POST',
            body: JSON.stringify({
              reason: cancellationReason.trim(),
            }),
          }
        )
        setBooking(updatedBooking)
      }
      setShowCancellationModal(false)
      setCancellationReason('')
    } catch (requestError) {
      setCancellationError(
        requestError.message ||
          'Unable to submit your cancellation.'
      )
    } finally {
      setIsCancelling(false)
    }
  }

  const statusIndex = {
    pending: 0,
    confirmed: 1,
    completed: 2,
  }

  if (isLoading) {
    return (
      <main className={styles.trackerPage}>
        <section className={styles.statePanel} role="status">
          <span className={styles.loader}></span>
          <p>Loading your booking timeline…</p>
        </section>
      </main>
    )
  }

  if (error || !booking) {
    return (
      <main className={styles.trackerPage}>
        <section className={styles.statePanel}>
          <span className={styles.stateIcon}>
            <i className="bi bi-exclamation-circle"></i>
          </span>
          <h1>Booking not available</h1>
          <p>{error || 'This booking could not be loaded.'}</p>
          <Link to="/customer-dashboard" className={styles.backButton}>
            <i className="bi bi-arrow-left"></i>
            Back to dashboard
          </Link>
        </section>
      </main>
    )
  }

  const isCancelled = booking.status === 'cancelled'
  const currentStep = isCancelled
    ? -1
    : statusIndex[booking.status] ?? 0
  const serviceName =
    booking.service_name ||
    booking.service?.name ||
    `Service #${booking.service}`
  const cancellationRequest = booking.cancellation_request
  const canRequestCancellation =
    booking.status === 'confirmed' &&
    cancellationRequest?.status !== 'pending'
  const canCancelPendingBooking =
    booking.status === 'pending'

  return (
    <main className={styles.trackerPage}>
      <div className={styles.ambientGlow} aria-hidden="true"></div>

      <section className={styles.trackerHero}>
        <div className="container">
          <Link
            to="/customer-dashboard"
            className={styles.backLink}
          >
            <i className="bi bi-arrow-left"></i>
            Customer dashboard
          </Link>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>
                <span className={styles.liveDot}></span>
                BOOKING TRACKER
                {isRefreshing && (
                  <span className={styles.refreshingLabel}>
                    <i className="bi bi-arrow-repeat"></i>
                    Updating
                  </span>
                )}
              </span>
              <h1>
                Your service,
                <br />
                <span>step by step.</span>
              </h1>
              <p>
                Follow your request from the moment it was booked to
                completion. We check for provider updates automatically.
              </p>
            </div>

            <div className={styles.bookingCard}>
              <div className={styles.bookingIcon}>
                <i className="bi bi-tools"></i>
              </div>
              <div className={styles.bookingIdentity}>
                <small>BOOKING #{String(booking.id).padStart(4, '0')}</small>
                <h2>{serviceName}</h2>
                <p>
                  <i className="bi bi-person-workspace"></i>
                  {booking.provider_name || 'Service provider'}
                </p>
              </div>
              <span
                className={`${styles.statusBadge} ${
                  isCancelled ? styles.statusCancelled : ''
                } ${booking.status === 'completed' ? styles.statusCompleted : ''}`}
              >
                {formatStatus(booking.status)}
              </span>
              <Link
                to={`/booking-chat/${booking.id}`}
                className={styles.chatLink}
              >
                <i className="bi bi-chat-dots-fill"></i>
                Message provider
              </Link>
              {(canRequestCancellation || canCancelPendingBooking) && (
                <button
                  type="button"
                  className={styles.cancelBookingButton}
                  onClick={() => {
                    setCancellationReason('')
                    setCancellationError('')
                    setShowCancellationModal(true)
                  }}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel booking
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.timelineSection}>
        <div className="container">
          {isCancelled ? (
            <div className={styles.cancelledPanel} role="status">
              <div className={styles.cancelledIcon}>
                <i className="bi bi-x-lg"></i>
              </div>
              <div className={styles.cancelledContent}>
                <span>
                  {booking.cancelled_by === 'provider'
                    ? 'PROVIDER DECLINED THIS BOOKING'
                    : booking.cancelled_by === 'customer'
                      ? 'BOOKING CANCELLED BY YOU'
                      : 'BOOKING CANCELLED'}
                </span>
                <h2>
                  {cancellationRequest?.status === 'approved'
                    ? 'The provider approved your cancellation request.'
                    : booking.cancelled_by === 'provider'
                    ? 'The provider could not accept this request.'
                    : 'This booking will not go ahead.'}
                </h2>
                {booking.cancellation_reason ? (
                  <div className={styles.reasonCard}>
                    <i className="bi bi-chat-left-text"></i>
                    <div>
                      <small>
                        {booking.cancelled_by === 'provider'
                          ? 'PROVIDER’S REASON'
                          : 'CANCELLATION NOTE'}
                      </small>
                      <p>{booking.cancellation_reason}</p>
                    </div>
                  </div>
                ) : (
                  <p className={styles.noReason}>
                    No additional reason was provided.
                  </p>
                )}
                <Link to="/services" className={styles.findServiceButton}>
                  Find another service
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.timelineCard}>
              <div className={styles.timelineHeading}>
                <div>
                  <span className={styles.sectionEyebrow}>
                    LIVE PROGRESS
                  </span>
                  <h2>Booking journey</h2>
                </div>
                <span className={styles.updateNote}>
                  <i className="bi bi-arrow-repeat"></i>
                  Refreshes every 20 seconds
                </span>
              </div>

              <div
                className={styles.timeline}
                role="list"
                aria-label={`Booking progress: ${formatStatus(booking.status)}`}
              >
                <div className={styles.progressRail}>
                  <span
                    className={styles.progressFill}
                    style={{
                      '--progress-width': `${(currentStep / 2) * 100}%`,
                    }}
                  ></span>
                </div>
                {trackingSteps.map((step, index) => {
                  const isActive = index <= currentStep
                  const stepDate = {
                    booked: booking.created_at,
                    confirmed: booking.confirmed_at,
                    completed: booking.completed_at,
                  }[step.key]

                  return (
                    <div
                      className={`${styles.timelineStep} ${
                        isActive ? styles.timelineStepActive : ''
                      } ${index === currentStep ? styles.timelineStepCurrent : ''}`}
                      role="listitem"
                      key={step.key}
                    >
                      <span className={styles.stepIcon}>
                        <i className={`bi ${step.icon}`}></i>
                      </span>
                      <strong>{step.title}</strong>
                      <small>
                        {isActive
                          ? stepDate
                            ? formatDateTime(stepDate)
                            : 'In progress'
                          : 'Waiting'}
                      </small>
                      <p>{step.description}</p>
                    </div>
                  )
                })}
              </div>

              {booking.status === 'pending' && (
                <div className={styles.waitingNote}>
                  <span className={styles.waitingIcon}>
                    <i className="bi bi-hourglass-split"></i>
                  </span>
                  <p>
                    <strong>Waiting for provider confirmation.</strong>
                    The tracker will update when the provider accepts or declines.
                  </p>
                </div>
              )}

              {booking.status === 'confirmed' && (
                <div className={`${styles.waitingNote} ${styles.acceptedNote}`}>
                  <span className={styles.waitingIcon}>
                    <i className="bi bi-check2-circle"></i>
                  </span>
                  <p>
                    <strong>Your provider accepted the booking.</strong>
                    Your service is scheduled for{' '}
                    {formatSchedule(
                      booking.booking_date,
                      booking.booking_time
                    )}
                    .
                  </p>
                </div>
              )}

              {cancellationRequest?.status === 'pending' && (
                <div className={styles.cancellationRequestPending} role="status">
                  <span className={styles.cancellationRequestIcon}>
                    <i className="bi bi-hourglass-split"></i>
                  </span>
                  <div>
                    <strong>Cancellation request sent</strong>
                    <p>
                      Your provider must review your reason and approve it before
                      this booking is cancelled.
                    </p>
                    <blockquote>{cancellationRequest.reason}</blockquote>
                  </div>
                </div>
              )}

              {cancellationRequest?.status === 'rejected' && (
                <div className={styles.cancellationRequestRejected} role="status">
                  <span className={styles.cancellationRequestIcon}>
                    <i className="bi bi-info-circle"></i>
                  </span>
                  <div>
                    <strong>Cancellation request not approved</strong>
                    <p>
                      Your booking remains confirmed. You can message your
                      provider to discuss it or send another request.
                    </p>
                    {cancellationRequest.provider_response && (
                      <blockquote>
                        {cancellationRequest.provider_response}
                      </blockquote>
                    )}
                  </div>
                </div>
              )}

              {booking.status === 'completed' && (
                <div className={`${styles.waitingNote} ${styles.acceptedNote}`}>
                  <span className={styles.waitingIcon}>
                    <i className="bi bi-stars"></i>
                  </span>
                  <p>
                    <strong>Service completed.</strong>
                    The provider marked this booking as complete.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className={styles.detailsGrid}>
            <article className={styles.detailCard}>
              <span className={styles.detailIcon}>
                <i className="bi bi-calendar2-week"></i>
              </span>
              <div>
                <small>SERVICE SCHEDULE</small>
                <strong>
                  {formatSchedule(
                    booking.booking_date,
                    booking.booking_time
                  )}
                </strong>
              </div>
            </article>
            <article className={styles.detailCard}>
              <span className={styles.detailIcon}>
                <i className="bi bi-geo-alt"></i>
              </span>
              <div>
                <small>SERVICE ADDRESS</small>
                <strong>{booking.address || 'Not provided'}</strong>
              </div>
            </article>
            <article className={styles.detailCard}>
              <span className={styles.detailIcon}>
                <i className="bi bi-clock-history"></i>
              </span>
              <div>
                <small>BOOKED ON</small>
                <strong>{formatDateTime(booking.created_at)}</strong>
              </div>
            </article>
          </div>

          <p className={styles.privacyNote}>
            <i className="bi bi-shield-check"></i>
            This booking timeline is private to your account.
          </p>
        </div>
      </section>

      {showCancellationModal && (
        <div
          className={styles.cancellationModalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isCancelling) {
              setShowCancellationModal(false)
            }
          }}
        >
          <section
            className={styles.cancellationModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancellationModalTitle"
          >
            <div className={styles.cancellationModalHeader}>
              <span>
                <i className="bi bi-calendar2-x"></i>
              </span>
              <button
                type="button"
                onClick={() => setShowCancellationModal(false)}
                aria-label="Close cancellation dialog"
                disabled={isCancelling}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <h2 id="cancellationModalTitle">
              {booking.status === 'pending'
                ? 'Cancel this booking?'
                : 'Request to cancel this service'}
            </h2>
            {booking.status === 'pending' ? (
              <p>
                The provider has not accepted yet, so this booking will be
                cancelled immediately.
              </p>
            ) : (
              <form onSubmit={submitCancellation}>
                <p>
                  Your provider accepted this booking. Explain why you want to
                  cancel; it will only be cancelled if they approve your request.
                </p>
                {cancellationError && (
                  <div className={styles.cancellationFormError} role="alert">
                    {cancellationError}
                  </div>
                )}
                <label htmlFor="customerCancellationReason">
                  Reason for cancelling
                </label>
                <textarea
                  id="customerCancellationReason"
                  value={cancellationReason}
                  onChange={(event) => {
                    setCancellationReason(event.target.value)
                    setCancellationError('')
                  }}
                  minLength={5}
                  maxLength={500}
                  rows={4}
                  placeholder="Tell the provider why you need to cancel..."
                  required
                  disabled={isCancelling}
                ></textarea>
                <small>{cancellationReason.length}/500 characters</small>
                <div className={styles.cancellationModalActions}>
                  <button
                    type="button"
                    onClick={() => setShowCancellationModal(false)}
                    disabled={isCancelling}
                  >
                    Keep booking
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isCancelling ||
                      cancellationReason.trim().length < 5
                    }
                  >
                    {isCancelling ? 'Sending request…' : 'Send request'}
                  </button>
                </div>
              </form>
            )}
            {booking.status === 'pending' && (
              <>
                {cancellationError && (
                  <div className={styles.cancellationFormError} role="alert">
                    {cancellationError}
                  </div>
                )}
                <div className={styles.cancellationModalActions}>
                  <button
                    type="button"
                    onClick={() => setShowCancellationModal(false)}
                    disabled={isCancelling}
                  >
                    Keep booking
                  </button>
                  <button
                    type="button"
                    onClick={submitCancellation}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling…' : 'Cancel booking'}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default BookingTracker
