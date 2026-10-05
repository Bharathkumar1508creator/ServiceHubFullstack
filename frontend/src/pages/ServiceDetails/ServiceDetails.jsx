import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import BookingModal from '../../components/BookingModal/BookingModal'

import styles from './ServiceDetails.module.css'

const API_URL =
  'http://127.0.0.1:8000/api/services/'

const BACKEND_URL =
  'http://127.0.0.1:8000'

function ServiceDetails() {
  const { id } = useParams()

  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBookingModal, setShowBookingModal] =
    useState(false)

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true)
        setError('')

        if (!id) {
          throw new Error(
            'Service ID is missing.'
          )
        }

        const response = await fetch(
          `${API_URL}${id}/`
        )

        if (!response.ok) {
          throw new Error(
            `Service API returned ${response.status}`
          )
        }

        const data = await response.json()

        setService(data)
      } catch (err) {
        console.error(
          'Service details error:',
          err
        )

        setError(
          err.message ||
            'Unable to load service details.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchService()
  }, [id])

  const formatPrice = (price) => {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }
    ).format(Number(price || 0))
  }

  const getImageUrl = (image) => {
    if (!image) {
      return null
    }

    if (image.startsWith('http')) {
      return image
    }

    return `${BACKEND_URL}${image}`
  }

  if (loading) {
    return (
      <main className={styles.detailsPage}>
        <section className={styles.detailsHero}>
          <div className="container">

            <div className={styles.loadingBox}>

              <div
                className={`${styles.spinner} spinner-border`}
                role="status"
              >
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <p>
                Loading service details...
              </p>

            </div>

          </div>
        </section>
      </main>
    )
  }

  if (error || !service) {
    return (
      <main className={styles.detailsPage}>
        <section className={styles.detailsHero}>
          <div className="container">

            <div className={styles.errorBox}>

              <div className={styles.errorIcon}>
                <i className="bi bi-exclamation-circle"></i>
              </div>

              <h2>
                Unable to load service
              </h2>

              <p>
                {error ||
                  'Service details are not available.'}
              </p>

              <Link
                to="/services"
                className={`${styles.backButton} btn`}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Services
              </Link>

            </div>

          </div>
        </section>
      </main>
    )
  }

  const serviceImage = getImageUrl(
    service.image
  )

  return (
    <main className={styles.detailsPage}>

      <section className={styles.detailsHero}>

        <div className="container">

          <Link
            to="/services"
            className={styles.backLink}
          >
            <i className="bi bi-arrow-left"></i>
            Back to Services
          </Link>

          <div className="row align-items-center g-5">

            <div className="col-lg-7">

              <div className={styles.badge}>

                <span
                  className={
                    service.is_available
                      ? styles.availableDot
                      : styles.unavailableDot
                  }
                ></span>

                {service.is_available
                  ? 'Service Available'
                  : 'Currently Unavailable'}

              </div>

              <span className={styles.serviceLabel}>
                SERVICE #
                {String(service.id).padStart(2, '0')}
              </span>

              <h2 className={styles.providerName}>
                {service.provider_name ||
                  'Independent Provider'}
              </h2>

              <h1 className={styles.title}>
                {service.name}
              </h1>

              <p className={styles.description}>
                {service.description}
              </p>

              <div className={styles.priceBlock}>

                <span>
                  Starting from
                </span>

                <strong>
                  {formatPrice(
                    service.price
                  )}
                </strong>

              </div>

              <div className={styles.actions}>

                {service.is_available ? (
                  <button
                    type="button"
                    className={`${styles.bookButton} btn`}
                    onClick={() =>
                      setShowBookingModal(true)
                    }
                  >
                    <i className="bi bi-calendar-check me-2"></i>
                    Book This Service
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.disabledButton} btn`}
                    disabled
                  >
                    <i className="bi bi-slash-circle me-2"></i>
                    Currently Unavailable
                  </button>
                )}

                <Link
                  to="/services"
                  className={`${styles.secondaryButton} btn`}
                >
                  Explore Services
                </Link>

              </div>

            </div>

            <div className="col-lg-5">

              <div className={styles.visualCard}>

                {serviceImage ? (
                  <img
                    src={serviceImage}
                    alt={service.name}
                    className="img-fluid rounded"
                    style={{
                      width: '100%',
                      height: '280px',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <>
                    <div
                      className={styles.visualGlow}
                    ></div>

                    <div
                      className={styles.visualIcon}
                    >
                      <i className="bi bi-tools"></i>
                    </div>
                  </>
                )}

                <span
                  className={styles.visualNumber}
                >
                  {String(
                    service.id
                  ).padStart(2, '0')}
                </span>

                <h3>
                  Professional Service
                </h3>

                <p>
                  Reliable service from
                  trusted local
                  professionals.
                </p>

                <div
                  className={
                    styles.visualFeatures
                  }
                >

                  <div>
                    <i className="bi bi-shield-check"></i>
                    <span>
                      Trusted
                    </span>
                  </div>

                  <div>
                    <i className="bi bi-clock"></i>
                    <span>
                      Convenient
                    </span>
                  </div>

                  <div>
                    <i className="bi bi-star"></i>
                    <span>
                      Quality
                    </span>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      <section className={styles.infoSection}>

        <div className="container">

          <div className="row g-4">

            <div className="col-md-4">

              <div className={styles.infoCard}>

                <div
                  className={styles.infoIcon}
                >
                  <i className="bi bi-check2-circle"></i>
                </div>

                <h3>
                  Available Service
                </h3>

                <p>
                  Book this service when
                  it is marked as available.
                </p>

              </div>

            </div>

            <div className="col-md-4">

              <div className={styles.infoCard}>

                <div
                  className={styles.infoIcon}
                >
                  <i className="bi bi-currency-rupee"></i>
                </div>

                <h3>
                  Transparent Pricing
                </h3>

                <p>
                  Starting price is clearly
                  displayed before booking.
                </p>

              </div>

            </div>

            <div className="col-md-4">

              <div className={styles.infoCard}>

                <div
                  className={styles.infoIcon}
                >
                  <i className="bi bi-calendar2-check"></i>
                </div>

                <h3>
                  Easy Booking
                </h3>

                <p>
                  Choose your preferred
                  date, time and address.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      <BookingModal
        service={service}
        show={showBookingModal}
        onClose={() =>
          setShowBookingModal(false)
        }
      />

    </main>
  )
}

export default ServiceDetails