import { useEffect } from 'react'

import styles from './Home.module.css'

function Home() {
  useEffect(() => {
    const revealElements = document.querySelectorAll(
      '[data-reveal]'
    )

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              styles.revealVisible
            )

            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.15,
      }
    )

    revealElements.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  const services = [
    {
      icon: 'bi-snow',
      title: 'AC Services',
      description:
        'Professional AC repair, installation and maintenance services.',
    },
    {
      icon: 'bi-lightning-charge',
      title: 'Electrical',
      description:
        'Reliable electrical repair, wiring and installation services.',
    },
    {
      icon: 'bi-droplet',
      title: 'Plumbing',
      description:
        'Quick plumbing repairs and maintenance for your home.',
    },
    {
      icon: 'bi-house-gear',
      title: 'Home Maintenance',
      description:
        'Complete home maintenance solutions from trusted professionals.',
    },
  ]

  const stats = [
    {
      icon: 'bi-people',
      value: '500+',
      label: 'Happy Customers',
    },
    {
      icon: 'bi-person-check',
      value: '100+',
      label: 'Service Providers',
    },
    {
      icon: 'bi-tools',
      value: '25+',
      label: 'Services',
    },
    {
      icon: 'bi-star',
      value: '4.8',
      label: 'Average Rating',
    },
  ]

  const steps = [
    {
      number: '01',
      icon: 'bi-search',
      title: 'Choose a Service',
      description:
        'Browse available services and find what you need.',
    },
    {
      number: '02',
      icon: 'bi-calendar-check',
      title: 'Book a Service',
      description:
        'Select your preferred date, time and service address.',
    },
    {
      number: '03',
      icon: 'bi-person-workspace',
      title: 'Get It Done',
      description:
        'A trusted service provider will handle your request.',
    },
  ]

  return (
    <main className={styles.home}>

      {/* HERO */}

      <section className={styles.heroSection}>

        <div className="container">

          <div className="row align-items-center min-vh-100 py-5">

            <div className="col-lg-7">

              <div
                className={styles.heroContent}
                data-reveal
              >

                <span className={styles.heroBadge}>
                  <i className="bi bi-stars me-2"></i>
                  Trusted Local Services
                </span>

                <h1 className={styles.heroTitle}>
                  Find Trusted
                  <span> Services </span>
                  Near You
                </h1>

                <p className={styles.heroDescription}>
                  Book reliable local professionals for your
                  home and everyday needs. Simple booking,
                  trusted providers and quality service.
                </p>

                <div className="d-flex flex-column flex-sm-row gap-3">

                  <a
                    href="#services"
                    className={`${styles.primaryButton} btn`}
                  >
                    Explore Services
                    <i className="bi bi-arrow-right ms-2"></i>
                  </a>

                  <a
                    href="#how-it-works"
                    className={`${styles.secondaryButton} btn`}
                  >
                    How It Works
                    <i className="bi bi-play-circle ms-2"></i>
                  </a>

                </div>

                <div
                  className={styles.heroTrust}
                >
                  <div className="d-flex align-items-center">

                    <div className={styles.trustIcon}>
                      <i className="bi bi-shield-check"></i>
                    </div>

                    <div>
                      <strong>Trusted Professionals</strong>
                      <span>Verified service providers</span>
                    </div>

                  </div>
                </div>

              </div>

            </div>

            <div className="col-lg-5 mt-5 mt-lg-0">

              <div
                className={styles.heroVisual}
                data-reveal
              >

                <div className={styles.heroCircle}></div>

                <div
                  className={`${styles.floatingCard} ${styles.cardOne}`}
                >
                  <i className="bi bi-check-circle-fill"></i>
                  <div>
                    <strong>Booking Confirmed</strong>
                    <span>Your service is scheduled</span>
                  </div>
                </div>

                <div
                  className={`${styles.floatingCard} ${styles.cardTwo}`}
                >
                  <i className="bi bi-star-fill"></i>
                  <div>
                    <strong>4.8 Rating</strong>
                    <span>From happy customers</span>
                  </div>
                </div>

                <div className={styles.heroMainCard}>

                  <div className={styles.heroMainIcon}>
                    <i className="bi bi-tools"></i>
                  </div>

                  <h3>Everything You Need</h3>

                  <p>
                    Professional services at your
                    fingertips.
                  </p>

                  <div className={styles.heroMiniCards}>

                    <div>
                      <i className="bi bi-snow"></i>
                      <span>AC</span>
                    </div>

                    <div>
                      <i className="bi bi-lightning"></i>
                      <span>Electrical</span>
                    </div>

                    <div>
                      <i className="bi bi-droplet"></i>
                      <span>Plumbing</span>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* STATS */}

      <section className={styles.statsSection}>

        <div className="container">

          <div className="row g-3">

            {stats.map((stat, index) => (

              <div
                className="col-6 col-lg-3"
                key={stat.label}
                data-reveal
              >

                <div
                  className={styles.statCard}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >

                  <div className={styles.statIcon}>
                    <i className={`bi ${stat.icon}`}></i>
                  </div>

                  <div>
                    <h3>{stat.value}</h3>
                    <p>{stat.label}</p>
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* SERVICES */}

      <section
        id="services"
        className={styles.servicesSection}
      >

        <div className="container">

          <div
            className={styles.sectionHeading}
            data-reveal
          >

            <span className={styles.sectionLabel}>
              OUR SERVICES
            </span>

            <h2>
              Services for Every
              <span> Need</span>
            </h2>

            <p>
              Find skilled professionals for your home
              and everyday service requirements.
            </p>

          </div>

          <div className="row g-4">

            {services.map((service, index) => (

              <div
                className="col-md-6 col-lg-3"
                key={service.title}
                data-reveal
              >

                <div
                  className={styles.serviceCard}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >

                  <div className={styles.serviceIcon}>
                    <i className={`bi ${service.icon}`}></i>
                  </div>

                  <h3>{service.title}</h3>

                  <p>{service.description}</p>

                  <button
                    type="button"
                    className={styles.serviceLink}
                  >
                    Explore
                    <i className="bi bi-arrow-up-right"></i>
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* WHY CHOOSE US */}

      <section className={styles.whySection}>

        <div className="container">

          <div className="row align-items-center g-5">

            <div
              className="col-lg-6"
              data-reveal
            >

              <span className={styles.sectionLabel}>
                WHY CHOOSE US
              </span>

              <h2 className={styles.whyTitle}>
                Making Local Services
                <span> Simple</span>
              </h2>

              <p className={styles.whyDescription}>
                We connect customers with trusted local
                professionals through a simple and convenient
                booking experience.
              </p>

              <div className="row g-3">

                <div className="col-sm-6">

                  <div className={styles.featureItem}>
                    <i className="bi bi-shield-check"></i>
                    <div>
                      <h4>Trusted Providers</h4>
                      <p>Verified professionals</p>
                    </div>
                  </div>

                </div>

                <div className="col-sm-6">

                  <div className={styles.featureItem}>
                    <i className="bi bi-clock"></i>
                    <div>
                      <h4>Easy Booking</h4>
                      <p>Book in a few steps</p>
                    </div>
                  </div>

                </div>

                <div className="col-sm-6">

                  <div className={styles.featureItem}>
                    <i className="bi bi-wallet2"></i>
                    <div>
                      <h4>Clear Pricing</h4>
                      <p>Transparent service prices</p>
                    </div>
                  </div>

                </div>

                <div className="col-sm-6">

                  <div className={styles.featureItem}>
                    <i className="bi bi-headset"></i>
                    <div>
                      <h4>Support</h4>
                      <p>Help when you need it</p>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            <div
              className="col-lg-6"
              data-reveal
            >

              <div className={styles.whyVisual}>

                <div className={styles.whyMainCard}>

                  <div className={styles.whyTop}>
                    <span>Service Quality</span>
                    <i className="bi bi-graph-up-arrow"></i>
                  </div>

                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressBar}
                    ></div>
                  </div>

                  <div className={styles.qualityValue}>
                    95%
                  </div>

                  <p>
                    Customer satisfaction
                  </p>

                </div>

                <div className={styles.qualityBadge}>
                  <i className="bi bi-patch-check-fill"></i>
                  Quality Service
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* HOW IT WORKS */}

      <section
        id="how-it-works"
        className={styles.stepsSection}
      >

        <div className="container">

          <div
            className={styles.sectionHeading}
            data-reveal
          >

            <span className={styles.sectionLabel}>
              HOW IT WORKS
            </span>

            <h2>
              Book a Service in
              <span> Three Steps</span>
            </h2>

            <p>
              Getting professional help has never been
              easier.
            </p>

          </div>

          <div className="row g-4">

            {steps.map((step, index) => (

              <div
                className="col-md-4"
                key={step.number}
                data-reveal
              >

                <div
                  className={styles.stepCard}
                  style={{
                    transitionDelay: `${index * 120}ms`,
                  }}
                >

                  <div className={styles.stepNumber}>
                    {step.number}
                  </div>

                  <div className={styles.stepIcon}>
                    <i className={`bi ${step.icon}`}></i>
                  </div>

                  <h3>{step.title}</h3>

                  <p>{step.description}</p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* CTA */}

      <section
        className={styles.ctaSection}
        data-reveal
      >

        <div className="container">

          <div className={styles.ctaCard}>

            <div>

              <span className={styles.ctaLabel}>
                READY TO GET STARTED?
              </span>

              <h2>
                Find the right professional
                for your next service.
              </h2>

              <p>
                Explore services and book a trusted
                professional today.
              </p>

            </div>

            <a
              href="#services"
              className={`${styles.ctaButton} btn`}
            >
              Browse Services
              <i className="bi bi-arrow-right ms-2"></i>
            </a>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Home