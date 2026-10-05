import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import apiRequest, { getBookings } from '../../services/api'

import styles from './BookingChat.module.css'

const POLL_INTERVAL = 3000
const MAX_MESSAGE_LENGTH = 2000

function BookingChat() {
  const { id } = useParams()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesOpen, setMessagesOpen] = useState(true)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [connectionError, setConnectionError] = useState('')
  const [messageError, setMessageError] = useState('')
  const messagesEndRef = useRef(null)
  const pollInFlightRef = useRef(false)
  const isMountedRef = useRef(false)
  const messagesOpenRef = useRef(true)

  const loadMessages = useCallback(async (showErrors = false) => {
    if (!messagesOpenRef.current || pollInFlightRef.current) {
      return
    }

    pollInFlightRef.current = true
    try {
      const data = await apiRequest(`/bookings/${id}/messages/`)
      if (isMountedRef.current) {
        const nextMessages = Array.isArray(data) ? data : []
        setMessages((previous) => {
          if (
            previous.length === nextMessages.length &&
            previous.every((message, index) =>
              message.id === nextMessages[index]?.id &&
              message.delivery_status ===
                nextMessages[index]?.delivery_status
            )
          ) {
            return previous
          }

          return nextMessages
        })
        setConnectionError('')
      }
    } catch (requestError) {
      if (showErrors && isMountedRef.current) {
        setConnectionError(
          requestError.message ||
            'Unable to refresh this private conversation.'
        )
      }
    } finally {
      pollInFlightRef.current = false
    }
  }, [id])

  const loadPresence = useCallback(async (showErrors = false) => {
    try {
      const presence = await apiRequest(
        `/bookings/${id}/presence/`
      )
      if (isMountedRef.current) {
        setPartnerOnline(Boolean(presence.is_online))
      }
    } catch (requestError) {
      if (showErrors && isMountedRef.current) {
        setConnectionError(
          requestError.message ||
            'Unable to check the other participant’s online status.'
        )
      }
    }
  }, [id])

  useEffect(() => {
    let isCurrent = true
    isMountedRef.current = true

    const loadConversation = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await getBookings()
        const bookings = Array.isArray(data)
          ? data
          : data.results || []
        const currentBooking = bookings.find(
          (item) => String(item.id) === id
        )

        if (!currentBooking) {
          throw new Error(
            'This booking is not available to your account.'
          )
        }

        const conversation = await apiRequest(
          `/bookings/${id}/messages/`
        )
        let presence = null
        try {
          presence = await apiRequest(
            `/bookings/${id}/presence/`
          )
        } catch {
          presence = null
        }

        if (isCurrent) {
          setBooking(currentBooking)
          setMessages(
            Array.isArray(conversation) ? conversation : []
          )
          setPartnerOnline(Boolean(presence?.is_online))
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            requestError.message ||
              'Unable to open this conversation.'
          )
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    loadConversation()
    const pollTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadMessages(true)
        loadPresence(true)
      }
    }, POLL_INTERVAL)

    return () => {
      isCurrent = false
      isMountedRef.current = false
      window.clearInterval(pollTimer)
    }
  }, [id, loadMessages, loadPresence])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages])

  const formatMessageTime = (value) => {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    const message = draft.trim()

    if (!message || isSending) {
      return
    }

    setIsSending(true)
    setMessageError('')

    try {
      const savedMessage = await apiRequest(
        `/bookings/${id}/messages/`,
        {
          method: 'POST',
          body: JSON.stringify({ message }),
        }
      )
      setMessages((previous) => [
        ...previous.filter((item) => item.id !== savedMessage.id),
        savedMessage,
      ])
      setDraft('')
    } catch (requestError) {
      setMessageError(
        requestError.message ||
          'Unable to send message. Please try again.'
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleComposerKeyDown = (event) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const toggleMessages = () => {
    const shouldOpen = !messagesOpenRef.current
    messagesOpenRef.current = shouldOpen
    setMessagesOpen(shouldOpen)

    if (shouldOpen) {
      loadMessages(true)
    }
  }

  if (isLoading) {
    return (
      <main className={styles.chatPage}>
        <div className={styles.stateCard} role="status">
          <span className={styles.loader}></span>
          <p>Opening your private chat…</p>
        </div>
      </main>
    )
  }

  if (error || !booking) {
    return (
      <main className={styles.chatPage}>
        <div className={styles.stateCard}>
          <span className={styles.stateIcon}>
            <i className="bi bi-chat-square-dots"></i>
          </span>
          <h1>Chat unavailable</h1>
          <p>{error || 'This booking conversation could not be loaded.'}</p>
          <Link to="/customer-dashboard" className={styles.backButton}>
            <i className="bi bi-arrow-left"></i>
            Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  const isCustomer = user?.role === 'customer'
  const partnerName = isCustomer
    ? booking.provider_name || 'Service provider'
    : booking.customer_name || 'Customer'
  const serviceName =
    booking.service_name ||
    booking.service?.name ||
    `Service #${booking.service}`
  const backPath = '/chats'

  return (
    <main className={styles.chatPage}>
      <div className={styles.chatAmbient} aria-hidden="true"></div>
      <section
        className={`${styles.chatShell} ${
          messagesOpen ? '' : styles.chatShellCollapsed
        }`}
      >
        <header className={styles.chatHeader}>
          <Link
            to={backPath}
            className={styles.backLink}
            aria-label="Back"
          >
            <i className="bi bi-arrow-left"></i>
          </Link>
          <span className={styles.avatar}>
            <i className={`bi ${isCustomer ? 'bi-person-workspace' : 'bi-person'}`}></i>
            {partnerOnline && (
              <i className={styles.onlineDot}></i>
            )}
          </span>
          <div className={styles.headerIdentity}>
            <strong>{partnerName}</strong>
            <span>
              <i className="bi bi-shield-lock-fill"></i>
              {partnerOnline ? 'online' : 'offline'} · Private chat · {serviceName}
            </span>
          </div>
          <span
            className={`${styles.liveLabel} ${
              partnerOnline ? styles.partnerOnline : styles.partnerOffline
            }`}
          >
            <i></i>
            {partnerOnline ? 'Online' : 'Offline'}
          </span>
          <button
            type="button"
            className={styles.messagesToggle}
            onClick={toggleMessages}
            aria-expanded={messagesOpen}
            aria-label={
              messagesOpen
                ? 'Close chat messages'
                : 'Open chat messages'
            }
            title={
              messagesOpen
                ? 'Close chat messages'
                : 'Open chat messages'
            }
          >
            <i className="bi bi-list" aria-hidden="true"></i>
          </button>
        </header>

        <div className={styles.bookingBanner}>
          <span className={styles.bookingBannerIcon}>
            <i className="bi bi-tools"></i>
          </span>
          <div>
            <small>BOOKING #{String(booking.id).padStart(4, '0')}</small>
            <strong>{serviceName}</strong>
          </div>
          <span className={`${styles.bookingStatus} ${styles[`status_${booking.status}`] || ''}`}>
            {(booking.status || 'pending').replaceAll('_', ' ')}
          </span>
        </div>

        {messagesOpen && (
          <>
          <section
            id="booking-chat-messages"
            className={styles.messageHistory}
            aria-label="Chat messages"
            aria-live="polite"
          >
          <div className={styles.encryptionNote}>
            <i className="bi bi-lock-fill"></i>
            Messages are limited to this booking’s customer and assigned provider.
            Chat is available even while the provider is deciding.
          </div>

          {messages.length === 0 ? (
            <div className={styles.emptyChat}>
              <span><i className="bi bi-chat-heart"></i></span>
              <strong>Start the conversation</strong>
              <p>Ask a question or share details about your service.</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage =
                message.sender_role === user?.role

              return (
                <article
                  className={`${styles.messageRow} ${
                    isOwnMessage ? styles.messageRowOwn : ''
                  }`}
                  key={message.id}
                >
                  {!isOwnMessage && (
                    <span className={styles.messageAvatar}>
                      <i className="bi bi-person-fill"></i>
                    </span>
                  )}
                  <div
                    className={`${styles.messageBubble} ${
                      isOwnMessage ? styles.messageBubbleOwn : ''
                    }`}
                  >
                    {!isOwnMessage && (
                      <strong>{message.sender_name}</strong>
                    )}
                    <p>{message.message}</p>
                    <time dateTime={message.created_at}>
                      {formatMessageTime(message.created_at)}
                      {isOwnMessage && (
                        <i
                          className={`bi ${
                            message.delivery_status === 'sent'
                              ? 'bi-check2'
                              : 'bi-check2-all'
                          } ${styles[`receipt_${message.delivery_status || 'sent'}`]}`}
                          title={
                            message.delivery_status === 'read'
                              ? 'Read'
                              : message.delivery_status === 'delivered'
                                ? 'Delivered'
                                : 'Sent'
                          }
                          aria-label={
                            message.delivery_status === 'read'
                              ? 'Read'
                              : message.delivery_status === 'delivered'
                                ? 'Delivered'
                                : 'Sent'
                          }
                        ></i>
                      )}
                    </time>
                  </div>
                </article>
              )
            })
          )}
          {connectionError && (
            <p className={styles.connectionError} role="status">
              <i className="bi bi-wifi-off"></i>
              {connectionError} Retrying automatically…
            </p>
          )}
          <div ref={messagesEndRef}></div>
          </section>

          <footer className={styles.composerArea}>
          {messageError && (
            <p className={styles.messageError} role="alert">
              <i className="bi bi-exclamation-circle"></i>
              {messageError}
            </p>
          )}
          <form className={styles.composer} onSubmit={sendMessage}>
            <textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                setMessageError('')
              }}
              onKeyDown={handleComposerKeyDown}
              placeholder={`Message ${partnerName}…`}
              aria-label="Type a message"
              rows="1"
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={isSending}
            ></textarea>
            <span className={styles.characterCount}>
              {draft.length}/{MAX_MESSAGE_LENGTH}
            </span>
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              aria-label="Send message"
            >
              {isSending ? (
                <span
                  className="spinner-border spinner-border-sm"
                  aria-hidden="true"
                ></span>
              ) : (
                <i className="bi bi-send-fill"></i>
              )}
            </button>
          </form>
          <small className={styles.composerHint}>
            <i className="bi bi-info-circle"></i>
            Enter to send · Shift + Enter for a new line
          </small>
          </footer>
          </>
        )}
      </section>
    </main>
  )
}

export default BookingChat
