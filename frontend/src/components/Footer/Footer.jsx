import { Link } from 'react-router-dom'

import './Footer.css'

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__main">
          <div className="site-footer__brand">
            <Link className="site-footer__logo" to="/">
              <span className="site-footer__logo-icon" aria-hidden="true">
                <i className="bi bi-tools"></i>
              </span>
              <span>
                Service<span className="site-footer__logo-highlight">Hub</span>
              </span>
            </Link>
            <p>
              Find trusted local professionals for your home and everyday
              needs, all in one place.
            </p>
          </div>

          <nav className="site-footer__links" aria-label="Footer navigation">
            <h2>Explore</h2>
            <Link to="/">Home</Link>
            <Link to="/services">Services</Link>
            <Link to="/about">About us</Link>
            <Link to="/contact">Contact</Link>
          </nav>

          <div className="site-footer__contact">
            <h2>Get in touch</h2>
            <a href="mailto:hello@servicehub.example">
              <i className="bi bi-envelope" aria-hidden="true"></i>
              hello@servicehub.example
            </a>
            <a href="tel:+919876543210">
              <i className="bi bi-telephone" aria-hidden="true"></i>
              +91 98765 43210
            </a>
            <Link to="/contact" className="site-footer__contact-link">
              Visit our contact page
              <i className="bi bi-arrow-up-right" aria-hidden="true"></i>
            </Link>
          </div>
        </div>

        <div className="site-footer__bottom">
          <div className="site-footer__credits">
            <span>© {new Date().getFullYear()} ServiceHub. All rights reserved.</span>
            <span className="site-footer__credit">
              Designed and developed by{' '}
              <a
                href="https://www.linkedin.com/in/bharathkumarpdev"
                target="_blank"
                rel="noopener noreferrer"
              >
                Bharath Kumar.P
                <i className="bi bi-linkedin" aria-hidden="true"></i>
              </a>
              <a
                href="https://github.com/Bharathkumar1508creator"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bharath Kumar.P on GitHub"
              >
                <i className="bi bi-github" aria-hidden="true"></i>
              </a>
            </span>
          </div>
          <button
            className="site-footer__top-button"
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            Back to top
            <i className="bi bi-arrow-up" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer
