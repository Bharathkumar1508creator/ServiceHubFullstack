import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { getBookings } from '../../services/api'

import styles from './CustomerDashboard.module.css'

function CustomerDashboard() {
  const dashboardRef = useRef(null)

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadBookings = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getBookings()

      setBookings(
        Array.isArray(data)
          ? data
          : data.results || []
      )
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load your bookings.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    const dashboard = dashboardRef.current

    if (!dashboard) {
      return
    }

    const revealItems =
      dashboard.querySelectorAll(
        '[data-dashboard-reveal]'
      )

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
        threshold: 0.12,
      }
    )

    revealItems.forEach((item, index) => {
      item.style.setProperty(
        '--animation-delay',
        `${index * 80}ms`
      )

      observer.observe(item)
    })

    return () => {
      observer.disconnect()
    }
  }, [bookings, isLoading])

  const handleCardMove = (event) => {
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()

    const x =
      event.clientX - rect.left

    const y =
      event.clientY - rect.top

    const rotateX =
      ((y - rect.height / 2) /
        rect.height) *
      -5

    const rotateY =
      ((x - rect.width / 2) /
        rect.width) *
      5

    card.style.transform = `
      perspective(900px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      translateY(-5px)
    `
  }

  const handleCardLeave = (event) => {
    event.currentTarget.style.transform = ''
  }

  const getBookingDateTime = (booking) => {
    if (
      !booking.booking_date ||
      !booking.booking_time
    ) {
      return null
    }

    const date = new Date(
      `${booking.booking_date}T${booking.booking_time}`
    )

    return Number.isNaN(date.getTime())
      ? null
      : date
  }

  const formatDate = (date) => {
    if (!date) {
      return 'Date not available'
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }
    )
  }

  const formatTime = (date) => {
    if (!date) {
      return 'Time not available'
    }

    return date.toLocaleTimeString(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    )
  }

  const getStatusLabel = (status) => {
    if (!status) {
      return 'PENDING'
    }

    return status
      .replaceAll('_', ' ')
      .toUpperCase()
  }

  const getServiceName = (booking) => {
    if (
      booking.service &&
      typeof booking.service === 'object'
    ) {
      return (
        booking.service.name ||
        'Service'
      )
    }

    if (
      booking.service_name
    ) {
      return booking.service_name
    }

    return `Service #${booking.service || ''}`
  }

  const getServiceDescription = (
    booking
  ) => {
    if (
      booking.service &&
      typeof booking.service === 'object'
    ) {
      return (
        booking.service.description ||
        'Your scheduled service.'
      )
    }

    return 'Your scheduled service.'
  }

  const totalBookings = bookings.length

  const upcomingBookings =
    bookings
      .filter((booking) => {
        const date =
          getBookingDateTime(booking)

        if (!date) {
          return false
        }

        return (
          date >= new Date() &&
          booking.status !==
            'cancelled' &&
          booking.status !==
            'completed'
        )
      })
      .sort(
        (first, second) =>
          getBookingDateTime(first) -
          getBookingDateTime(second)
      )

  const upcomingBooking =
    upcomingBookings[0] || null

  const upcomingCount =
    upcomingBookings.length

  const completedCount =
    bookings.filter(
      (booking) =>
        booking.status === 'completed'
    ).length

  const recentBookings =
    [...bookings]
      .sort((first, second) => {
        const firstDate =
          new Date(
            first.created_at || 0
          )

        const secondDate =
          new Date(
            second.created_at || 0
          )

        return (
          secondDate - firstDate
        )
      })
      .slice(0, 3)

  const allBookings =
    [...bookings].sort((first, second) => {
      const firstDate = new Date(first.created_at || 0)
      const secondDate = new Date(second.created_at || 0)
      return secondDate - firstDate
    })

  const getRelativeTime = (dateValue) => {
    if (!dateValue) {
      return 'Recently'
    }

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return 'Recently'
    }

    const difference =
      Date.now() - date.getTime()

    const minutes = Math.floor(
      difference / 60000
    )

    if (minutes < 1) {
      return 'Just now'
    }

    if (minutes < 60) {
      return `${minutes} min ago`
    }

    const hours = Math.floor(
      minutes / 60
    )

    if (hours < 24) {
      return `${hours} hr ago`
    }

    const days = Math.floor(
      hours / 24
    )

    if (days === 1) {
      return 'Yesterday'
    }

    if (days < 7) {
      return `${days} days ago`
    }

    return formatDate(date)
  }

  const getActivityIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bi-check-lg'

      case 'completed':
        return 'bi-check2-all'

      case 'cancelled':
        return 'bi-x-lg'

      case 'pending':
      default:
        return 'bi-calendar-plus'
    }
  }

  const getActivityDotClass = (status) => {
    switch (status) {
      case 'confirmed':
        return styles.activityDotBlue

      case 'completed':
        return styles.activityDotPurple

      case 'cancelled':
        return styles.activityDotOrange

      case 'pending':
      default:
        return styles.activityDotCyan
    }
  }

  const getActivityTitle = (booking) => {
    switch (booking.status) {
      case 'confirmed':
        return 'Booking confirmed'

      case 'completed':
        return 'Service completed'

      case 'cancelled':
        return 'Booking cancelled'

      case 'pending':
      default:
        return 'Booking created'
    }
  }

  const getActivityDescription = (
    booking
  ) => {
    const serviceName =
      getServiceName(booking)

    switch (booking.status) {
      case 'confirmed':
        return `${serviceName} was confirmed by the provider.`

      case 'completed':
        return `${serviceName} has been completed successfully.`

      case 'cancelled':
        return `${serviceName} booking was cancelled.`

      case 'pending':
      default:
        return `Your ${serviceName} request was successfully submitted.`
    }
  }

  return (
    <main
      ref={dashboardRef}
      className={styles.dashboard}
    >
      <div
        className={
          styles.backgroundGlowOne
        }
      ></div>

      <div
        className={
          styles.backgroundGlowTwo
        }
      ></div>

      <div
        className={styles.gridPattern}
      ></div>

      <div className="container py-5">
        {/* Header */}

        <section
          className={`${styles.hero} mb-4`}
          data-dashboard-reveal
        >
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <div
                className={
                  styles.heroEyebrow
                }
              >
                <span
                  className={
                    styles.liveIndicator
                  }
                ></span>

                CUSTOMER SPACE
              </div>

              <h1
                className={`${styles.heroTitle} mt-3 mb-3`}
              >
                Your services.
                <br />

                <span>
                  Your schedule.
                </span>
              </h1>

              <p
                className={`${styles.heroText} mb-0`}
              >
                Everything you need to
                discover, book and track
                your services — all from
                one place.
              </p>
            </div>

            <div className="col-lg-4">
              <div
                className={styles.heroOrb}
              >
                <div
                  className={`${styles.orbit} ${styles.orbitOne}`}
                ></div>

                <div
                  className={`${styles.orbit} ${styles.orbitTwo}`}
                ></div>

                <div
                  className={
                    styles.orbCore
                  }
                >
                  <i className="bi bi-lightning-charge-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Error */}

        {error && (
          <section
            className="mb-4"
            data-dashboard-reveal
          >
            <div className="alert alert-danger d-flex justify-content-between align-items-center mb-0">
              <span>
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </span>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={loadBookings}
              >
                Retry
              </button>
            </div>
          </section>
        )}

        {/* Stats */}

        <section className="row g-3 mb-4">
          <div
            className="col-6 col-lg-3"
            data-dashboard-reveal
          >
            <div
              className={`${styles.statCard} ${styles.statBlue}`}
              onMouseMove={handleCardMove}
              onMouseLeave={handleCardLeave}
            >
              <div
                className={styles.statIcon}
              >
                <i className="bi bi-calendar2-check"></i>
              </div>

              <div
                className={styles.statNumber}
              >
                {isLoading
                  ? '—'
                  : totalBookings}
              </div>

              <p>Bookings</p>

              <span>
                Total requests
              </span>
            </div>
          </div>

          <div
            className="col-6 col-lg-3"
            data-dashboard-reveal
          >
            <div
              className={`${styles.statCard} ${styles.statCyan}`}
              onMouseMove={handleCardMove}
              onMouseLeave={handleCardLeave}
            >
              <div
                className={styles.statIcon}
              >
                <i className="bi bi-clock-history"></i>
              </div>

              <div
                className={styles.statNumber}
              >
                {isLoading
                  ? '—'
                  : upcomingCount}
              </div>

              <p>Upcoming</p>

              <span>
                Scheduled services
              </span>
            </div>
          </div>

          <div
            className="col-6 col-lg-3"
            data-dashboard-reveal
          >
            <div
              className={`${styles.statCard} ${styles.statPurple}`}
              onMouseMove={handleCardMove}
              onMouseLeave={handleCardLeave}
            >
              <div
                className={styles.statIcon}
              >
                <i className="bi bi-check2-circle"></i>
              </div>

              <div
                className={styles.statNumber}
              >
                {isLoading
                  ? '—'
                  : completedCount}
              </div>

              <p>Completed</p>

              <span>
                Services finished
              </span>
            </div>
          </div>

          <div
            className="col-6 col-lg-3"
            data-dashboard-reveal
          >
            <div
              className={`${styles.statCard} ${styles.statOrange}`}
              onMouseMove={handleCardMove}
              onMouseLeave={handleCardLeave}
            >
              <div
                className={styles.statIcon}
              >
                <i className="bi bi-star-fill"></i>
              </div>

              <div
                className={styles.statNumber}
              >
                0
              </div>

              <p>Saved</p>

              <span>
                Favourite services
              </span>
            </div>
          </div>
        </section>

        {/* Main Content */}

        <section className="row g-4">
          {/* Upcoming Booking */}

          <div
            className="col-lg-7"
            data-dashboard-reveal
          >
            <div
              className={styles.bookingPanel}
            >
              <div
                className={`${styles.sectionHeader} d-flex justify-content-between align-items-center`}
              >
                <div>
                  <span
                    className={
                      styles.sectionLabel
                    }
                  >
                    NEXT UP
                  </span>

                  <h2>
                    Upcoming service
                  </h2>
                </div>

                <Link
                  to="/services"
                  className={
                    styles.textAction
                  }
                >
                  Explore

                  <i className="bi bi-arrow-up-right"></i>
                </Link>
              </div>

              {isLoading ? (
                <div className="py-5 text-center">
                  <div
                    className="spinner-border"
                    role="status"
                  >
                    <span className="visually-hidden">
                      Loading...
                    </span>
                  </div>

                  <p className="mt-3 mb-0">
                    Loading your bookings...
                  </p>
                </div>
              ) : upcomingBooking ? (
                <>
                  <div
                    className={
                      styles.bookingFeature
                    }
                  >
                    <div
                      className={
                        styles.bookingIcon
                      }
                    >
                      <i className="bi bi-tools"></i>
                    </div>

                    <div
                      className={
                        styles.bookingContent
                      }
                    >
                      <span
                        className={
                          styles.bookingStatus
                        }
                      >
                        {getStatusLabel(
                          upcomingBooking.status
                        )}
                      </span>

                      <h3>
                        {getServiceName(
                          upcomingBooking
                        )}
                      </h3>

                      <p>
                        {getServiceDescription(
                          upcomingBooking
                        )}
                      </p>

                      <div
                        className={
                          styles.bookingMeta
                        }
                      >
                        <span>
                          <i className="bi bi-calendar3"></i>

                          {formatDate(
                            getBookingDateTime(
                              upcomingBooking
                            )
                          )}
                        </span>

                        <span>
                          <i className="bi bi-clock"></i>

                          {formatTime(
                            getBookingDateTime(
                              upcomingBooking
                            )
                          )}
                        </span>
                      </div>
                    </div>

                    <div
                      className={
                        styles.bookingArrow
                      }
                    >
                      <i className="bi bi-arrow-right"></i>
                    </div>
                  </div>

                  <div
                    className={
                      styles.progressTrack
                    }
                  >
                    <div
                      className={
                        styles.progressLine
                      }
                    ></div>

                    <div
                      className={
                        styles.progressStepActive
                      }
                    >
                      <span></span>
                      <small>
                        Booked
                      </small>
                    </div>

                    <div
                      className={
                        upcomingBooking.status ===
                          'confirmed' ||
                        upcomingBooking.status ===
                          'completed'
                          ? styles.progressStepActive
                          : styles.progressStep
                      }
                    >
                      <span></span>
                      <small>
                        Confirmed
                      </small>
                    </div>

                    <div
                      className={
                        upcomingBooking.status ===
                          'completed'
                          ? styles.progressStepActive
                          : styles.progressStep
                      }
                    >
                      <span></span>
                      <small>
                        In progress
                      </small>
                    </div>

                    <div
                      className={
                        upcomingBooking.status ===
                          'completed'
                          ? styles.progressStepActive
                          : styles.progressStep
                      }
                    >
                      <span></span>
                      <small>
                        Completed
                      </small>
                    </div>
                  </div>

                  <Link
                    to={`/booking-tracker/${upcomingBooking.id}`}
                    className={styles.trackBookingLink}
                  >
                    Track this booking
                    <i className="bi bi-arrow-up-right"></i>
                  </Link>
                </>
              ) : (
                <div className="py-5 text-center">
                  <i className="bi bi-calendar-x fs-1"></i>

                  <h4 className="mt-3">
                    No upcoming services
                  </h4>

                  <p>
                    You don't have any
                    upcoming bookings.
                  </p>

                  <Link
                    to="/services"
                    className="btn btn-primary"
                  >
                    Find a service
                  </Link>
                </div>
              )}
            </div>

          </div>

          {/* Quick Actions */}

          <div
            className="col-lg-5"
            data-dashboard-reveal
          >
            <div
              className={styles.actionPanel}
            >
              <span
                className={
                  styles.sectionLabel
                }
              >
                QUICK ACTIONS
              </span>

              <h2>
                What do you need?
              </h2>

              <div className="row g-2 mt-2">
                <div className="col-6">
                  <Link
                    to="/services"
                    className={
                      styles.actionCard
                    }
                  >
                    <span>
                      <i className="bi bi-search"></i>
                    </span>

                    <strong>
                      Find a service
                    </strong>

                    <small>
                      Explore providers
                    </small>
                  </Link>
                </div>

                <div className="col-6">
                  <Link
                    to="/services"
                    className={
                      styles.actionCard
                    }
                  >
                    <span>
                      <i className="bi bi-plus-lg"></i>
                    </span>

                    <strong>
                      New booking
                    </strong>

                    <small>
                      Schedule a service
                    </small>
                  </Link>
                </div>

                <div className="col-6">
                  <Link
                    to="/customer-dashboard#all-service-bookings"
                    className={
                      styles.actionCard
                    }
                  >
                    <span>
                      <i className="bi bi-receipt"></i>
                    </span>

                    <strong>
                      My bookings
                    </strong>

                    <small>
                      Track requests
                    </small>
                  </Link>
                </div>

                <div className="col-6">
                  <Link
                    to="/services"
                    className={
                      styles.actionCard
                    }
                  >
                    <span>
                      <i className="bi bi-headset"></i>
                    </span>

                    <strong>
                      Get support
                    </strong>

                    <small>
                      Need some help?
                    </small>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* All Bookings */}

        <section className="row g-4 mt-1">
          <div
            className="col-12"
            data-dashboard-reveal
          >
            <div
              className={styles.allBookingsPanel}
              id="all-service-bookings"
            >
              <div className={`${styles.sectionHeader} d-flex justify-content-between align-items-center`}>
                <div>
                  <span className={styles.sectionLabel}>
                    EVERY SERVICE, ONE PLACE
                  </span>
                  <h2>All your bookings</h2>
                  <p className={styles.allBookingsHint}>
                    Select a service to open its live progress tracker.
                  </p>
                </div>
                <span className={styles.allBookingsCount}>
                  {isLoading ? '—' : totalBookings}
                  <small> bookings</small>
                </span>
              </div>

              {isLoading ? (
                <div className="py-5 text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 mb-0">Loading all your services...</p>
                </div>
              ) : allBookings.length === 0 ? (
                <div className={styles.allBookingsEmpty}>
                  <i className="bi bi-calendar2-plus"></i>
                  <strong>No bookings yet</strong>
                  <span>When you book a service, its progress card will appear here.</span>
                  <Link to="/services">Browse services</Link>
                </div>
              ) : (
                <div className={styles.bookingGrid}>
                  {allBookings.map((booking) => {
                    const isCancelled =
                      booking.status === 'cancelled'
                    const progressStep = {
                      pending: 0,
                      confirmed: 1,
                      completed: 2,
                    }[booking.status] ?? 0
                    const progressWidth = isCancelled
                      ? '0%'
                      : `${(progressStep / 2) * 100}%`
                    const bookingDate = getBookingDateTime(booking)
                    const statusClass = isCancelled
                      ? styles.cardStatusCancelled
                      : booking.status === 'completed'
                        ? styles.cardStatusCompleted
                        : booking.status === 'confirmed'
                          ? styles.cardStatusConfirmed
                          : styles.cardStatusPending

                    return (
                      <Link
                        to={`/booking-tracker/${booking.id}`}
                        className={styles.bookingProgressCard}
                        key={booking.id}
                      >
                        <span className={styles.bookingProgressTop}>
                          <span className={styles.bookingProgressIcon}>
                            <i className="bi bi-tools"></i>
                          </span>
                          <span className={`${styles.cardStatus} ${statusClass}`}>
                            {isCancelled
                              ? booking.cancelled_by === 'provider'
                                ? 'DECLINED'
                                : 'CANCELLED'
                              : getStatusLabel(booking.status)}
                          </span>
                        </span>

                        <strong className={styles.bookingProgressName}>
                          {getServiceName(booking)}
                        </strong>
                        <span className={styles.bookingProgressProvider}>
                          <i className="bi bi-person-workspace"></i>
                          {booking.provider_name || 'Service provider'}
                        </span>

                        <span className={styles.progressSummary}>
                          <span>Booked</span>
                          <span>Accepted</span>
                          <span>Complete</span>
                        </span>
                        <span
                          className={`${styles.miniProgressTrack} ${
                            isCancelled ? styles.miniProgressCancelled : ''
                          }`}
                        >
                          <span
                            className={styles.miniProgressFill}
                            style={{ width: progressWidth }}
                          ></span>
                          {[0, 1, 2].map((step) => (
                            <i
                              className={
                                !isCancelled && step <= progressStep
                                  ? styles.miniProgressStepActive
                                  : styles.miniProgressStep
                              }
                              key={step}
                            ></i>
                          ))}
                        </span>

                        <span className={styles.bookingProgressBottom}>
                          <span>
                            <i className="bi bi-calendar3"></i>
                            {bookingDate
                              ? formatDate(bookingDate)
                              : 'Schedule pending'}
                          </span>
                          <span className={styles.openTracker}>
                            View progress
                            <i className="bi bi-arrow-up-right"></i>
                          </span>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Activity */}

        <section className="row g-4 mt-1">
          <div
            className="col-lg-8"
            data-dashboard-reveal
          >
            <div
              className={styles.activityPanel}
            >
              <div
                className={`${styles.sectionHeader} d-flex justify-content-between align-items-center`}
              >
                <div>
                  <span
                    className={
                      styles.sectionLabel
                    }
                  >
                    ACTIVITY
                  </span>

                  <h2>
                    Recent activity
                  </h2>
                </div>

                <span
                  className={
                    styles.activityCount
                  }
                >
                  {recentBookings.length}{' '}
                  updates
                </span>
              </div>

              <div
                className={
                  styles.activityList
                }
              >
                {isLoading ? (
                  <div className="py-4 text-center">
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    >
                      <span className="visually-hidden">
                        Loading...
                      </span>
                    </div>
                  </div>
                ) : recentBookings.length ===
                  0 ? (
                  <div className="py-4 text-center">
                    <i className="bi bi-activity fs-2"></i>

                    <p className="mt-2 mb-0">
                      No booking activity yet.
                    </p>
                  </div>
                ) : (
                  recentBookings.map(
                    (booking) => (
                      <div
                        className={
                          styles.activityItem
                        }
                        key={booking.id}
                      >
                        <div
                          className={getActivityDotClass(
                            booking.status
                          )}
                        >
                          <i
                            className={`bi ${getActivityIcon(
                              booking.status
                            )}`}
                          ></i>
                        </div>

                        <div>
                          <strong>
                            {getActivityTitle(
                              booking
                            )}
                          </strong>

                          <p>
                            {getActivityDescription(
                              booking
                            )}
                          </p>
                        </div>

                        <time>
                          {getRelativeTime(
                            booking.created_at
                          )}
                        </time>
                        <Link
                          to={`/booking-tracker/${booking.id}`}
                          className={styles.activityTrackLink}
                          aria-label={`Track ${getServiceName(booking)} booking`}
                        >
                          Track
                          <i className="bi bi-arrow-right"></i>
                        </Link>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>

          {/* CTA */}

          <div
            className="col-lg-4"
            data-dashboard-reveal
          >
            <div
              className={styles.ctaPanel}
            >
              <div
                className={
                  styles.ctaDecoration
                }
              >
                <span></span>
                <span></span>
                <span></span>
              </div>

              <i
                className={`${styles.ctaIcon} bi bi-stars`}
              ></i>

              <span
                className={
                  styles.sectionLabel
                }
              >
                SERVICEHUB
              </span>

              <h2>
                Need something
                <br />
                fixed today?
              </h2>

              <p>
                Find trusted local
                professionals and get your
                service booked in minutes.
              </p>

              <Link
                to="/services"
                className={
                  styles.ctaButton
                }
              >
                Browse services

                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default CustomerDashboard