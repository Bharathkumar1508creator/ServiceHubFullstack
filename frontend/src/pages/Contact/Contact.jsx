import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import apiRequest from '../../services/api'
import styles from './Contact.module.css'

const contactOptions = [
  {
    icon: 'bi-envelope',
    eyebrow: 'EMAIL US',
    value: 'hello@servicehub.example',
    href: 'mailto:hello@servicehub.example',
    action: 'Send an email',
    tone: 'mint',
  },
  {
    icon: 'bi-telephone',
    eyebrow: 'CALL OUR SAMPLE DESK',
    value: '+91 98765 43210',
    href: 'tel:+919876543210',
    action: 'Call the sample number',
    tone: 'blue',
  },
  {
    icon: 'bi-clock',
    eyebrow: 'TYPICAL RESPONSE',
    value: 'Within one business day',
    href: null,
    action: 'Monday – Friday, 9 AM – 6 PM',
    tone: 'orange',
  },
]

const topics = [
  'Booking help',
  'Provider account',
  'Service listing',
  'Something else',
]

function Contact() {
  const pageRef = useRef(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: topics[0],
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const page = pageRef.current

    if (!page) {
      return undefined
    }

    const revealItems = page.querySelectorAll('[data-contact-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )

    revealItems.forEach((item, index) => {
      item.style.setProperty('--contact-delay', `${index * 80}ms`)
      observer.observe(item)
    })

    return () => observer.disconnect()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
    setSubmitted(false)
    setSubmitError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      await apiRequest('/contact-messages/', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          topic: form.topic,
          message: form.message.trim(),
        }),
      })

      setSubmitted(true)
      setForm({
        name: '',
        email: '',
        topic: topics[0],
        message: '',
      })
    } catch (error) {
      setSubmitError(
        error.message ||
          'Unable to send your message. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main ref={pageRef} className={styles.contactPage}>
      <section className={styles.contactHero}>
        <div className={styles.heroDecor} aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>
              <i className="bi bi-chat-dots"></i>
              WE’RE HERE TO HELP
            </span>
            <h1>
              Let’s get
              <br />
              <span>in touch.</span>
            </h1>
            <p>
              A question about a booking, a provider profile, or how
              ServiceHub works? Send us a note and we’ll point you in
              the right direction.
            </p>
            <a className={styles.scrollLink} href="#contact-form">
              <span className={styles.scrollIcon}>
                <i className="bi bi-arrow-down"></i>
              </span>
              Send us a message
            </a>
          </div>
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.messageCard}>
              <div className={styles.messageCardTop}>
                <span className={styles.messageAvatar}>
                  <i className="bi bi-tools"></i>
                </span>
                <span>
                  <strong>ServiceHub</strong>
                  <small>Usually replies within a day</small>
                </span>
                <i className="bi bi-three-dots"></i>
              </div>
              <div className={styles.chatBubble}>
                Hi there! How can we make your day easier?
              </div>
              <div className={`${styles.chatBubble} ${styles.chatBubbleReply}`}>
                I have a question about a service.
              </div>
              <div className={styles.typingLine}>
                <span></span>
                <span></span>
                <span></span>
                <small>We’re listening</small>
              </div>
            </div>
            <span className={styles.floatingHeart}>
              <i className="bi bi-heart-fill"></i>
            </span>
            <span className={styles.floatingSpark}>
              <i className="bi bi-stars"></i>
            </span>
          </div>
        </div>
      </section>

      <section className={styles.contactBody}>
        <div className="container">
          <div className={styles.contactLayout}>
            <div className={styles.contactSide}>
              <div className={styles.sideHeading} data-contact-reveal>
                <span className={styles.sectionEyebrow}>
                  CONTACT DETAILS
                </span>
                <h2>Pick the way that works for you.</h2>
                <p>
                  These are sample contact details for the project
                  demo. Replace them with your real support contacts
                  before launch.
                </p>
              </div>

              <div className={styles.contactOptions}>
                {contactOptions.map((option) => {
                  const Card = option.href ? 'a' : 'div'
                  const linkProps = option.href
                    ? {
                        href: option.href,
                        onClick: () => setSubmitted(false),
                      }
                    : {}

                  return (
                    <Card
                      {...linkProps}
                      className={`${styles.contactOption} ${styles[option.tone]}`}
                      data-contact-reveal
                      key={option.eyebrow}
                    >
                      <span className={styles.optionIcon}>
                        <i className={`bi ${option.icon}`}></i>
                      </span>
                      <span className={styles.optionText}>
                        <small>{option.eyebrow}</small>
                        <strong>{option.value}</strong>
                        <span>{option.action}</span>
                      </span>
                      {option.href && (
                        <i className={`bi bi-arrow-up-right ${styles.optionArrow}`}></i>
                      )}
                    </Card>
                  )
                })}
              </div>

              <div className={styles.locationCard} data-contact-reveal>
                <span className={styles.locationIcon}>
                  <i className="bi bi-geo-alt"></i>
                </span>
                <span>
                  <strong>Local by nature</strong>
                  <small>Helping customers connect with nearby service professionals.</small>
                </span>
              </div>

              <div className={styles.socialLinks} data-contact-reveal>
                <span>FOLLOW THE JOURNEY</span>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <i className="bi bi-instagram"></i>
                </a>
                <a
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <i className="bi bi-linkedin"></i>
                </a>
                <a
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <i className="bi bi-facebook"></i>
                </a>
              </div>
            </div>

            <section
              className={styles.formCard}
              id="contact-form"
              data-contact-reveal
              aria-labelledby="contactFormTitle"
            >
              <div className={styles.formHeading}>
                <span className={styles.formStep}>
                  <i className="bi bi-send"></i>
                  YOUR NOTE
                </span>
                <h2 id="contactFormTitle">How can we help?</h2>
                <p>Send us a message and our team will get back to you.</p>
              </div>

              {submitted && (
                <div
                  className={styles.successMessage}
                  role="status"
                  aria-live="polite"
                >
                  <i className="bi bi-check-circle-fill"></i>
                  <span>
                    <strong>Message sent successfully.</strong>
                    <small>
                      Your message has been saved. Our team will review it soon.
                    </small>
                  </span>
                </div>
              )}

              {submitError && (
                <div
                  className={styles.errorMessage}
                  role="alert"
                >
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{submitError}</span>
                </div>
              )}

              <form className={styles.contactForm} onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <label>
                    <span>Your name</span>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Arun Kumar"
                      autoComplete="name"
                      required
                      maxLength={100}
                    />
                  </label>
                  <label>
                    <span>Email address</span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      maxLength={254}
                    />
                  </label>
                </div>

                <label>
                  <span>What can we help with?</span>
                  <select
                    name="topic"
                    value={form.topic}
                    onChange={handleChange}
                  >
                    {topics.map((topic) => (
                      <option key={topic}>{topic}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Your message</span>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us a little about what you need..."
                    rows="5"
                    required
                    minLength={10}
                    maxLength={2000}
                  ></textarea>
                  <small className={styles.characterCount}>
                    {form.message.length}/2000
                  </small>
                </label>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  <span>
                    {isSubmitting ? 'Sending message…' : 'Send message'}
                  </span>
                  <i className="bi bi-arrow-up-right"></i>
                </button>
                <p className={styles.formPrivacy}>
                  <i className="bi bi-info-circle"></i>
                  Your details are securely stored so our support team can respond.
                </p>
              </form>
            </section>
          </div>
        </div>
      </section>

      <section className={styles.bottomCta}>
        <div className="container">
          <div className={styles.bottomCtaInner} data-contact-reveal>
            <div>
              <span>READY WHEN YOU ARE</span>
              <h2>Looking for a service instead?</h2>
            </div>
            <Link to="/services" className={styles.browseButton}>
              Browse services
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Contact
