import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getProviderScore,
  getServiceGroupKey,
  rankProviders,
} from '../../utils/serviceComparison'

import styles from './Services.module.css'

const API_URL =
  'http://127.0.0.1:8000/api/services/'

const BACKEND_URL =
  'http://127.0.0.1:8000'

function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const serviceGroups = useMemo(() => {
    const groups = new Map()

    services.forEach((service) => {
      const key = getServiceGroupKey(service.name)
      const group = groups.get(key) || []
      group.push(service)
      groups.set(key, group)
    })

    return groups
  }, [services])

  const visibleServices = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase()

    return services
      .filter((service) => {
        if (!query) {
          return true
        }

        return (
          service.name?.toLocaleLowerCase().includes(query) ||
          service.provider_name
            ?.toLocaleLowerCase()
            .includes(query)
        )
      })
      .sort((first, second) => {
        if (sortBy === 'price-asc') {
          return (
            Number(first.price || 0) -
              Number(second.price || 0) ||
            Number(second.id) - Number(first.id)
          )
        }

        if (sortBy === 'price-desc') {
          return (
            Number(second.price || 0) -
              Number(first.price || 0) ||
            Number(second.id) - Number(first.id)
          )
        }

        if (sortBy === 'experience') {
          return (
            Number(second.provider_experience || 0) -
              Number(first.provider_experience || 0) ||
            Number(second.id) - Number(first.id)
          )
        }

        if (sortBy === 'recommended') {
          const firstGroup = serviceGroups.get(
            getServiceGroupKey(first.name)
          ) || []
          const secondGroup = serviceGroups.get(
            getServiceGroupKey(second.name)
          ) || []
          return (
            getProviderScore(second, secondGroup) -
              getProviderScore(first, firstGroup) ||
            Number(second.id) - Number(first.id)
          )
        }

        return Number(second.id) - Number(first.id)
      })
  }, [services, searchQuery, sortBy, serviceGroups])

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(API_URL)

        if (!response.ok) {
          throw new Error(
            `Services API returned ${response.status}`
          )
        }

        const data = await response.json()

        setServices(
          Array.isArray(data)
            ? data
            : data.results || []
        )
      } catch (err) {
        console.error(
          'Services fetch error:',
          err
        )

        setError(
          err.message ||
            'Unable to load services.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

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
      <main className={styles.servicesPage}>
        <section className={styles.servicesSection}>
          <div className="container">

            <div
              className={`${styles.loadingBox} text-center`}
            >
              <div
                className="spinner-border"
                role="status"
              >
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <p className="mt-3">
                Loading services...
              </p>
            </div>

          </div>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.servicesPage}>
        <section className={styles.servicesSection}>
          <div className="container">

            <div className={styles.errorBox}>

              <i className="bi bi-exclamation-circle"></i>

              <h2>
                Unable to load services
              </h2>

              <p>
                {error}
              </p>

              <button
                type="button"
                className={`${styles.retryButton} btn`}
                onClick={() =>
                  window.location.reload()
                }
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Try Again
              </button>

            </div>

          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.servicesPage}>

      <section className={styles.servicesHero}>

        <div className="container">

          <div className={styles.heroContent}>

            <span className={styles.heroLabel}>
              OUR SERVICES
            </span>

            <h1 className={styles.heroTitle}>
              Find the right service
              <br />
              for your needs
            </h1>

            <p className={styles.heroDescription}>
              Connect with trusted local
              professionals and book
              reliable services easily.
            </p>

          </div>

        </div>

      </section>

      <section className={styles.servicesSection}>

        <div className="container">

          <div className={styles.sectionHeader}>

            <div>
              <span className={styles.sectionLabel}>
                AVAILABLE SERVICES
              </span>

              <h2 className={styles.sectionTitle}>
                Explore Services
              </h2>
            </div>

            <span className={styles.serviceCount}>
              {visibleServices.length} of {services.length} Services
            </span>

          </div>

          {services.length > 0 && (
            <div className={styles.servicesToolbar}>
              <label className={styles.searchControl}>
                <i className="bi bi-search" aria-hidden="true"></i>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search service or provider"
                  aria-label="Search services by name or provider"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.clearSearch}
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear service search"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </label>

              <label className={styles.sortControl}>
                <span>Sort by</span>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value)
                  }
                  aria-label="Sort services"
                >
                  <option value="newest">Newest first</option>
                  <option value="recommended">
                    Recommended: availability, price, experience
                  </option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="experience">
                    Provider experience
                  </option>
                </select>
              </label>
            </div>
          )}

          {services.length === 0 ? (
            <div className={styles.emptyBox}>

              <div className={styles.emptyIcon}>
                <i className="bi bi-tools"></i>
              </div>

              <h3>
                No services available
              </h3>

              <p>
                New services will appear here
                when providers add them.
              </p>

            </div>
          ) : visibleServices.length === 0 ? (
            <div className={styles.emptyBox}>
              <div className={styles.emptyIcon}>
                <i className="bi bi-search"></i>
              </div>
              <h3>No matching services</h3>
              <p>
                Try another service name or provider name.
              </p>
            </div>
          ) : (
            <div className={styles.serviceGrid}>

              {visibleServices.map((service) => {

                const serviceImage =
                  getImageUrl(
                    service.image
                  )
                const matchingProviders =
                  serviceGroups.get(
                    getServiceGroupKey(service.name)
                  ) || []
                const rankedProviders =
                  rankProviders(matchingProviders)
                const isRecommended =
                  sortBy === 'recommended' &&
                  rankedProviders[0]?.id === service.id
                const queryMatchesService =
                  searchQuery.trim() &&
                  getServiceGroupKey(service.name).includes(
                    searchQuery.trim().toLocaleLowerCase()
                  )
                const comparableProviders =
                  rankProviders(matchingProviders).slice(0, 3)

                return (
                  <div
                    key={service.id}
                    className={styles.serviceGridItem}
                  >

                    <article
                      className={
                        styles.serviceCard
                      }
                    >

                      <div
                        className={
                          styles.imageContainer
                        }
                      >

                        {serviceImage ? (
                          <img
                            src={serviceImage}
                            alt={service.name}
                            className={
                              styles.serviceImage
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={
                              styles.imagePlaceholder
                            }
                          >
                            <i className="bi bi-tools"></i>
                          </div>
                        )}

                        <span
                          className={
                            service.is_available
                              ? styles.availableBadge
                              : styles.unavailableBadge
                          }
                        >
                          <span></span>

                          {service.is_available
                            ? 'Available'
                            : 'Unavailable'}
                        </span>
                        {isRecommended && (
                          <span className={styles.recommendedBadge}>
                            <i className="bi bi-stars"></i>
                            Recommended
                          </span>
                        )}
                        <div
                          className={`${styles.providerOverlay} ${
                            queryMatchesService &&
                            matchingProviders.length > 1
                              ? styles.providerOverlayRaised
                              : ''
                          }`}
                        >
                          <span>PROVIDED BY</span>
                          <h2>
                            {service.provider_name ||
                              'Independent Provider'}
                          </h2>
                        </div>

                        {queryMatchesService &&
                          matchingProviders.length > 1 && (
                          <Link
                            to={`/services/compare?ids=${matchingProviders
                              .map((provider) => provider.id)
                              .join(',')}`}
                            className={styles.compareButton}
                          >
                            <i className="bi bi-stars"></i>
                            Compare {comparableProviders.length}{' '}
                            {comparableProviders.length === 1
                              ? 'provider'
                              : 'providers'}
                            {matchingProviders.length > 3 &&
                              ' · Top matches'}
                          </Link>
                        )}

                      </div>

                      <div
                        className={
                          styles.cardContent
                        }
                      >

                        <span
                          className={
                            styles.serviceNumber
                          }
                        >
                          SERVICE #
                          {String(
                            service.id
                          ).padStart(2, '0')}
                        </span>

                        <h3 className={styles.serviceName}>
                          {service.name}
                        </h3>

                        <p
                          className={
                            styles.serviceDescription
                          }
                        >
                          {service.description}
                        </p>

                        <div
                          className={
                            styles.cardFooter
                          }
                        >

                          <div
                            className={
                              styles.priceBlock
                            }
                          >
                            <span>
                              Starting from
                            </span>

                            <strong>
                              {formatPrice(
                                service.price
                              )}
                            </strong>
                          </div>

                          <Link
                            to={`/services/${service.id}`}
                            className={
                              styles.viewButton
                            }
                          >
                            View Details
                            <i className="bi bi-arrow-right"></i>
                          </Link>

                        </div>

                      </div>

                    </article>

                  </div>
                )
              })}

            </div>
          )}

        </div>

      </section>

    </main>
  )
}

export default Services