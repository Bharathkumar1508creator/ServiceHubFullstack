import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import styles from './About.module.css'

const values = [
  {
    icon: 'bi-shield-check',
    title: 'Trust comes first',
    text: 'Clear provider profiles and booking details help customers choose with confidence.',
  },
  {
    icon: 'bi-lightning-charge',
    title: 'Simple by design',
    text: 'Finding a local service and requesting a booking should take only a few steps.',
  },
  {
    icon: 'bi-people',
    title: 'Better together',
    text: 'We bring customers and independent service professionals into one helpful place.',
  },
]

const team = [
  {
    initials: 'AR',
    name: 'Ananya Rao',
    role: 'Community experience',
    color: 'teamMint',
    icon: 'bi-chat-heart',
  },
  {
    initials: 'VK',
    name: 'Vikram Kumar',
    role: 'Provider partnerships',
    color: 'teamBlue',
    icon: 'bi-person-workspace',
  },
  {
    initials: 'MS',
    name: 'Meera Shah',
    role: 'Product and design',
    color: 'teamOrange',
    icon: 'bi-palette',
  },
]

function About() {
  const pageRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef(null)

  useEffect(() => {
    const page = pageRef.current

    if (!page) {
      return undefined
    }

    const revealItems = page.querySelectorAll('[data-about-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.14 }
    )

    revealItems.forEach((item, index) => {
      item.style.setProperty('--reveal-delay', `${index * 90}ms`)
      observer.observe(item)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(
    () => () => window.clearTimeout(copyTimeoutRef.current),
    []
  )

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('hello@servicehub.example')
      setCopied(true)
      window.clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = window.setTimeout(
        () => setCopied(false),
        1800
      )
    } catch (error) {
      console.error('Unable to copy the email address:', error)
      window.location.href = 'mailto:hello@servicehub.example'
    }
  }

  return (
    <main ref={pageRef} className={styles.aboutPage}>
      <section className={styles.hero}>
        <div className={styles.heroOrb} aria-hidden="true">
          <span className={styles.orbitOne}></span>
          <span className={styles.orbitTwo}></span>
          <span className={styles.orbitCore}>
            <i className="bi bi-tools"></i>
          </span>
          <span className={styles.orbitDot}></span>
        </div>

        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>
              <i className="bi bi-stars"></i>
              A LOCAL SERVICES COMMUNITY
            </span>
            <h1>
              Good help should
              <br />
              be <span>easy to find.</span>
            </h1>
            <p>
              ServiceHub brings people who need a hand together with
              local professionals ready to help — with less searching
              and clearer booking details.
            </p>
            <div className={styles.heroActions}>
              <Link to="/services" className={styles.primaryButton}>
                Explore services
                <i className="bi bi-arrow-up-right"></i>
              </Link>
              <Link to="/contact" className={styles.secondaryButton}>
                Talk to our team
              </Link>
            </div>
            <div className={styles.heroNote}>
              <span className={styles.noteAvatars} aria-hidden="true">
                <span>A</span>
                <span>V</span>
                <span>M</span>
              </span>
              <span>Built around real local service needs</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.storySection}>
        <div className="container">
          <div className={styles.storyGrid}>
            <div className={styles.storyVisual} data-about-reveal>
              <div className={styles.storyVisualTop}>
                <span>THE SERVICEHUB IDEA</span>
                <i className="bi bi-arrow-up-right"></i>
              </div>
              <div className={styles.storyIllustration}>
                <div className={styles.storySun}></div>
                <div className={styles.storyHouse}>
                  <i className="bi bi-house-heart-fill"></i>
                </div>
                <span className={styles.storyToolOne}>
                  <i className="bi bi-wrench-adjustable"></i>
                </span>
                <span className={styles.storyToolTwo}>
                  <i className="bi bi-lightning-charge-fill"></i>
                </span>
                <span className={styles.storyToolThree}>
                  <i className="bi bi-droplet-fill"></i>
                </span>
              </div>
              <p>Making everyday fixes feel a little easier.</p>
            </div>

            <div className={styles.storyCopy} data-about-reveal>
              <span className={styles.sectionEyebrow}>WHY WE EXIST</span>
              <h2>
                One place for the
                <br />
                jobs that make a house <span>a home.</span>
              </h2>
              <p>
                A leaking tap, a room that needs painting, or an AC
                that stops on a hot day — finding the right person
                should not become another problem to solve.
              </p>
              <p>
                ServiceHub is a simple way to discover local services,
                understand who is offering them, and send a booking
                request. We are building the experience one useful
                detail at a time.
              </p>
              <div className={styles.storySignature}>
                <span className={styles.signatureIcon}>
                  <i className="bi bi-heart-fill"></i>
                </span>
                <span>
                  <strong>Made for everyday life</strong>
                  <small>Thoughtful service, closer to home.</small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.valuesSection}>
        <div className="container">
          <div className={styles.sectionHeading} data-about-reveal>
            <span className={styles.sectionEyebrow}>WHAT GUIDES US</span>
            <h2>Small details. Better service.</h2>
            <p>
              The principles behind a more helpful service-booking
              experience.
            </p>
          </div>

          <div className={styles.valueGrid}>
            {values.map((value, index) => (
              <article
                className={styles.valueCard}
                data-about-reveal
                key={value.title}
              >
                <span className={styles.valueNumber}>
                  0{index + 1}
                </span>
                <span className={styles.valueIcon}>
                  <i className={`bi ${value.icon}`}></i>
                </span>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
                <span className={styles.valueArrow} aria-hidden="true">
                  <i className="bi bi-arrow-up-right"></i>
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.teamSection}>
        <div className="container">
          <div className={styles.teamHeading} data-about-reveal>
            <div>
              <span className={styles.sectionEyebrow}>A FRIENDLY HELLO</span>
              <h2>People behind the platform</h2>
            </div>
            <p>
              A sample introduction to the kind of team that keeps the
              ServiceHub experience moving.
            </p>
          </div>

          <div className={styles.teamGrid}>
            {team.map((person) => (
              <article
                className={styles.teamCard}
                data-about-reveal
                key={person.initials}
              >
                <div className={`${styles.teamPortrait} ${styles[person.color]}`}>
                  <span>{person.initials}</span>
                  <i className={`bi ${person.icon}`}></i>
                </div>
                <div className={styles.teamInfo}>
                  <span>THE SERVICEHUB TEAM</span>
                  <h3>{person.name}</h3>
                  <p>{person.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.closingSection} data-about-reveal>
        <div className="container">
          <div className={styles.closingCard}>
            <span className={styles.closingSpark}>
              <i className="bi bi-stars"></i>
            </span>
            <div>
              <span>HAVE A SERVICE IN MIND?</span>
              <h2>Let’s make the next step simple.</h2>
            </div>
            <div className={styles.closingActions}>
              <Link to="/services" className={styles.primaryButton}>
                Browse services
                <i className="bi bi-arrow-right"></i>
              </Link>
              <button
                type="button"
                className={styles.copyButton}
                onClick={handleCopyEmail}
              >
                <i className={`bi ${copied ? 'bi-check2' : 'bi-envelope'}`}></i>
                {copied ? 'Email copied' : 'hello@servicehub.example'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default About
