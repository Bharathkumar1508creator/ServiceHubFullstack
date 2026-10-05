import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { getServices } from '../../services/api'
import {
  getProviderScore,
  getServiceGroupKey,
} from '../../utils/serviceComparison'

import styles from './ServiceComparison.module.css'

function ServiceComparison() {
  const [searchParams] = useSearchParams()
  const providerIds = searchParams.get('ids') || ''
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadComparison = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await getServices()
        const allServices = Array.isArray(response)
          ? response
          : response.results || []
        const requestedIds = new Set(
          providerIds
            .split(',')
            .map((id) => Number(id))
            .filter(Number.isInteger)
        )
        const selectedServices = allServices.filter(
          (service) => requestedIds.has(Number(service.id))
        )
        const expectedGroup = getServiceGroupKey(
          selectedServices[0]?.name
        )
        const matchingServices = selectedServices.filter(
          (service) =>
            getServiceGroupKey(service.name) === expectedGroup
        )

        if (matchingServices.length < 2) {
          throw new Error(
            'Choose at least two providers offering the same service to compare.'
          )
        }

        if (isCurrent) {
          setServices(matchingServices)
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(
            loadError.message ||
              'Unable to load providers for comparison.'
          )
        }
      } finally {
        if (isCurrent) {
          setLoading(false)
        }
      }
    }

    loadComparison()

    return () => {
      isCurrent = false
    }
  }, [providerIds])

  const rankedServices = useMemo(
    () =>
      services
        .map((service) => ({
          ...service,
          comparisonScore: getProviderScore(service, services),
        }))
        .sort(
          (first, second) =>
            second.comparisonScore - first.comparisonScore ||
            Number(first.price || 0) -
              Number(second.price || 0) ||
            Number(second.provider_experience || 0) -
              Number(first.provider_experience || 0)
        )
        .slice(0, 3),
    [services]
  )

  const lowestPrice = Math.min(
    ...services.map((service) =>
      Number(service.price || 0)
    )
  )
  const highestExperience = Math.max(
    ...services.map((service) =>
      Number(service.provider_experience || 0)
    )
  )

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(price || 0))

  const getReasons = (service) => {
    const reasons = []
    const experience = Number(
      service.provider_experience || 0
    )

    if (service.is_available) {
      reasons.push('Available to book now')
    }
    if (service.provider_verified) {
      reasons.push('Verified provider profile')
    }
    if (experience > 0 && experience === highestExperience) {
      reasons.push('Most experience in this comparison')
    } else if (experience > 0) {
      reasons.push(`${experience} years of experience`)
    }
    if (Number(service.price || 0) === lowestPrice) {
      reasons.push('Lowest listed price')
    }

    return reasons.length
      ? reasons
      : ['Compare the details below to choose what suits you']
  }

  if (loading) {
    return (
      <main className={styles.comparisonPage}>
        <div className={styles.stateCard} role="status">
          <span className={styles.loader}></span>
          <p>Finding the right match for you…</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.comparisonPage}>
        <div className={styles.stateCard}>
          <span className={styles.stateIcon}>
            <i className="bi bi-search"></i>
          </span>
          <h1>Comparison unavailable</h1>
          <p>{error}</p>
          <Link to="/services" className={styles.backButton}>
            <i className="bi bi-arrow-left"></i>
            Back to services
          </Link>
        </div>
      </main>
    )
  }

  const serviceName = rankedServices[0]?.name

  return (
    <main className={styles.comparisonPage}>
      <section className={styles.comparisonHero}>
        <div className={styles.heroGlow} aria-hidden="true"></div>
        <div className={`container ${styles.heroInner}`}>
          <Link to="/services" className={styles.backLink}>
            <i className="bi bi-arrow-left"></i>
            Back to services
          </Link>

          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <i className="bi bi-stars"></i>
              YOUR SHORTLIST, MADE SIMPLE
            </span>
            <h1>
              Compare your
              <br />
              <span>best options.</span>
            </h1>
            <p>
              A clearer choice than price alone. See availability,
              provider verification and experience side by side.
            </p>
            <div className={styles.compareContext}>
              <span className={styles.contextIcon}>
                <i className="bi bi-tools"></i>
              </span>
              <span>
                <small>COMPARING SERVICE</small>
                <strong>{serviceName}</strong>
              </span>
              <span className={styles.contextCount}>
                {rankedServices.length} providers
              </span>
            </div>
          </div>

          <div className={styles.flowCard}>
            <span className={styles.flowEyebrow}>A BETTER WAY TO CHOOSE</span>
            <div className={styles.flowDiagram}>
              <div className={`${styles.flowStep} ${styles.flowStepActive}`}>
                <span><i className="bi bi-search"></i></span>
                <strong>Search</strong>
                <small>{serviceName}</small>
              </div>
              <span className={styles.flowConnector}>
                <i className="bi bi-arrow-right"></i>
              </span>
              <div className={`${styles.flowStep} ${styles.flowStepActive}`}>
                <span><i className="bi bi-layout-three-columns"></i></span>
                <strong>Compare</strong>
                <small>4 key factors</small>
              </div>
              <span className={styles.flowConnector}>
                <i className="bi bi-arrow-right"></i>
              </span>
              <div className={`${styles.flowStep} ${styles.flowStepWinner}`}>
                <span><i className="bi bi-stars"></i></span>
                <strong>Choose</strong>
                <small>your best fit</small>
              </div>
            </div>
            <div className={styles.flowLegend}>
              <span><i></i> Live availability</span>
              <span><i></i> Verified profile</span>
              <span><i></i> Experience</span>
              <span><i></i> Fair price</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.resultsSection}>
        <div className="container">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>SIDE-BY-SIDE</span>
              <h2>Find the right fit</h2>
            </div>
            <p>
              The match score weighs availability (35%), verification
              (25%), experience (25%) and price (15%). No review scores
              are assumed.
            </p>
          </div>

          <div className={styles.providerGrid}>
            {rankedServices.map((service, index) => {
              const isBestMatch = index === 0
              const experience = Number(
                service.provider_experience || 0
              )

              return (
                <article
                  className={`${styles.providerCard} ${
                    isBestMatch ? styles.providerCardBest : ''
                  }`}
                  key={service.id}
                  style={{ '--card-order': index }}
                >
                  {isBestMatch && (
                    <span className={styles.bestBadge}>
                      <i className="bi bi-stars"></i>
                      BEST OVERALL MATCH
                    </span>
                  )}

                  <div className={styles.providerTop}>
                    <span className={styles.providerAvatar}>
                      <i className="bi bi-person-workspace"></i>
                    </span>
                    <span className={styles.providerIdentity}>
                      <small>
                        {isBestMatch ? 'TOP MATCH' : `OPTION 0${index + 1}`}
                      </small>
                      <h3>
                        {service.provider_name ||
                          'Independent Provider'}
                      </h3>
                    </span>
                    {service.provider_verified && (
                      <span
                        className={styles.verifiedBadge}
                        title="Verified provider"
                      >
                        <i className="bi bi-patch-check-fill"></i>
                      </span>
                    )}
                  </div>

                  <div className={styles.scoreBlock}>
                    <div className={styles.scoreHeader}>
                      <span>Match score</span>
                      <strong>{service.comparisonScore}<small>/100</small></strong>
                    </div>
                    <div
                      className={styles.scoreTrack}
                      role="meter"
                      aria-label={`${service.comparisonScore} out of 100 match score`}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={service.comparisonScore}
                    >
                      <span
                        style={{
                          '--score-width': `${service.comparisonScore}%`,
                        }}
                      ></span>
                    </div>
                  </div>

                  <dl className={styles.detailsList}>
                    <div>
                      <dt><i className="bi bi-cash-coin"></i> Listed price</dt>
                      <dd>{formatPrice(service.price)}</dd>
                    </div>
                    <div>
                      <dt><i className="bi bi-lightning-charge"></i> Availability</dt>
                      <dd className={service.is_available ? styles.valuePositive : styles.valueMuted}>
                        {service.is_available ? 'Available now' : 'Unavailable'}
                      </dd>
                    </div>
                    <div>
                      <dt><i className="bi bi-patch-check"></i> Profile</dt>
                      <dd className={service.provider_verified ? styles.valuePositive : styles.valueMuted}>
                        {service.provider_verified ? 'Verified' : 'Not verified'}
                      </dd>
                    </div>
                    <div>
                      <dt><i className="bi bi-briefcase"></i> Experience</dt>
                      <dd>
                        {experience > 0
                          ? `${experience} years`
                          : 'Not provided'}
                      </dd>
                    </div>
                    <div>
                      <dt><i className="bi bi-card-text"></i> Service details</dt>
                      <dd className={styles.descriptionValue}>
                        {service.description || 'No description provided'}
                      </dd>
                    </div>
                  </dl>

                  <div className={styles.reasonsBlock}>
                    <span>WHY {isBestMatch ? 'THIS MATCH' : 'CONSIDER THEM'}</span>
                    <ul>
                      {getReasons(service).map((reason) => (
                        <li key={reason}>
                          <i className="bi bi-check-circle-fill"></i>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to={`/services/${service.id}`}
                    className={styles.chooseButton}
                  >
                    View service
                    <i className="bi bi-arrow-up-right"></i>
                  </Link>
                </article>
              )
            })}
          </div>

          <div className={styles.noteBar}>
            <i className="bi bi-info-circle"></i>
            <p>
              Match scores compare only the details providers have listed.
              Confirm the final price and scope with your provider before booking.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.decisionSection}>
        <div className={`container ${styles.decisionInner}`}>
          <div>
            <span>READY FOR THE NEXT STEP?</span>
            <h2>Choose with confidence.</h2>
          </div>
          <Link to="/services" className={styles.backButton}>
            Explore more services
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
      </section>
    </main>
  )
}

export default ServiceComparison
