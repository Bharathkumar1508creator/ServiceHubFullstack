import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import apiRequest from '../../services/api'

import styles from './ChatInbox.module.css'

const REFRESH_INTERVAL = 5000

function ChatInbox() {
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConversations = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true)
    }

    try {
      const data = await apiRequest('/bookings/conversations/')
      setConversations(Array.isArray(data) ? data : [])
      setError('')
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load your conversations.'
      )
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const initialLoad = window.setTimeout(
      () => loadConversations(true),
      0
    )
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadConversations()
      }
    }, REFRESH_INTERVAL)

    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(refreshTimer)
    }
  }, [loadConversations])

  const formatConversationTime = (value) => {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    return new Intl.DateTimeFormat('en-IN', isToday
      ? { hour: 'numeric', minute: '2-digit' }
      : { day: 'numeric', month: 'short' }).format(date)
  }

  return (
    <main className={styles.inboxPage}>
      <div className={styles.inboxAmbient} aria-hidden="true"></div>
      <section className={styles.inboxShell}>
        <header className={styles.inboxHeader}>
          <div>
            <span className={styles.eyebrow}>
              <i className="bi bi-lock-fill"></i>
              YOUR PRIVATE MESSAGES
            </span>
            <h1>Chats</h1>
            <p>
              Continue a conversation linked to one of your bookings.
            </p>
          </div>
          <span className={styles.chatCount}>
            <i className="bi bi-chat-dots"></i>
            {conversations.length} conversation
            {conversations.length === 1 ? '' : 's'}
          </span>
        </header>

        {error && (
          <div className={styles.errorNotice} role="alert">
            <i className="bi bi-exclamation-circle"></i>
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadConversations(true)}
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className={styles.stateCard} role="status">
            <span className={styles.loader}></span>
            <p>Loading your conversations…</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <i className="bi bi-chat-square-heart"></i>
            </span>
            <h2>No conversations yet</h2>
            <p>
              Once you send or receive a message for a booking, that private
              chat will show up here.
            </p>
            <Link to="/services" className={styles.browseButton}>
              <i className="bi bi-grid"></i>
              Browse services
            </Link>
          </div>
        ) : (
          <div className={styles.conversationList}>
            {conversations.map((conversation) => {
              const lastMessageIsOwn =
                conversation.latest_message_is_mine

              return (
                <Link
                  to={`/booking-chat/${conversation.booking_id}`}
                  className={styles.conversation}
                  key={conversation.booking_id}
                >
                  <span className={styles.personAvatar}>
                    <i className="bi bi-person-fill"></i>
                    {conversation.other_party_online && (
                      <i className={styles.onlineDot}></i>
                    )}
                  </span>
                  <span className={styles.conversationBody}>
                    <span className={styles.conversationTopline}>
                      <strong>{conversation.other_party_name}</strong>
                      <time dateTime={conversation.latest_message_at}>
                        {formatConversationTime(
                          conversation.latest_message_at
                        )}
                      </time>
                    </span>
                    <span className={styles.serviceLine}>
                      <i className="bi bi-tools"></i>
                      {conversation.service_name}
                      <span className={styles.bookingNumber}>
                        Booking #{conversation.booking_id}
                      </span>
                    </span>
                    <span className={styles.previewLine}>
                      {lastMessageIsOwn && (
                        <span className={styles.youLabel}>You: </span>
                      )}
                      {conversation.latest_message}
                    </span>
                  </span>
                  {conversation.unread_count > 0 ? (
                    <span
                      className={styles.unreadBadge}
                      aria-label={`${conversation.unread_count} unread messages`}
                    >
                      {conversation.unread_count > 99
                        ? '99+'
                        : conversation.unread_count}
                    </span>
                  ) : (
                    <i
                      className={`bi bi-chevron-right ${styles.chevron}`}
                      aria-hidden="true"
                    ></i>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default ChatInbox
