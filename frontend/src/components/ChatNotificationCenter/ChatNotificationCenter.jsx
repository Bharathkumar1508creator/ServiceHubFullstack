import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import apiRequest from '../../services/api'

import styles from './ChatNotificationCenter.module.css'

const POLL_INTERVAL = 4000
const PRESENCE_INTERVAL = 12000
const MAX_VISIBLE_NOTIFICATIONS = 4

function ChatNotificationCenter() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [notificationState, setNotificationState] = useState({
    ownerKey: '',
    items: [],
  })
  const [connectionError, setConnectionError] = useState('')
  const seenMessageIdsRef = useRef(new Set())
  const lastPresenceUpdateRef = useRef(0)
  const presenceOwnerRef = useRef('')
  const requestInFlightRef = useRef(false)
  const userKey = user
    ? `${user.id || user.username || ''}:${user.role || ''}`
    : ''

  const pollNotifications = useCallback(async () => {
    if (
      !isAuthenticated ||
      document.visibilityState !== 'visible' ||
      requestInFlightRef.current
    ) {
      return
    }

    requestInFlightRef.current = true
    let hasError = false

    try {
      if (presenceOwnerRef.current !== userKey) {
        presenceOwnerRef.current = userKey
        lastPresenceUpdateRef.current = 0
        seenMessageIdsRef.current.clear()
      }

      const now = Date.now()
      if (now - lastPresenceUpdateRef.current >= PRESENCE_INTERVAL) {
        try {
          await apiRequest('/bookings/presence/', {
            method: 'POST',
            body: JSON.stringify({}),
          })
          lastPresenceUpdateRef.current = now
        } catch {
          hasError = true
        }
      }

      try {
        const data = await apiRequest('/bookings/notifications/')
        const unreadMessages = Array.isArray(data) ? data : []
        const activeChatMatch = location.pathname.match(
          /^\/booking-chat\/([^/]+)$/
        )
        const activeBookingId = activeChatMatch?.[1]
        const newNotifications = unreadMessages.filter((message) => {
          if (seenMessageIdsRef.current.has(message.id)) {
            return false
          }

          seenMessageIdsRef.current.add(message.id)
          return String(message.booking) !== activeBookingId
        })

        const unreadIds = new Set(
          unreadMessages.map((message) => message.id)
        )
        setNotificationState((current) => {
          const existing = current.ownerKey === userKey
            ? current.items.filter((message) =>
                unreadIds.has(message.id)
              )
            : []
          const additions = newNotifications.map((message) => ({
            ...message,
            notificationKey: `${message.booking}-${message.id}`,
          }))
          const items = [
            ...additions,
            ...existing,
          ].slice(0, MAX_VISIBLE_NOTIFICATIONS)

          if (
            current.ownerKey === userKey &&
            current.items.length === items.length &&
            current.items.every(
              (message, index) =>
                message.id === items[index]?.id
            )
          ) {
            return current
          }

          return {
            ownerKey: userKey,
            items,
          }
        })
      } catch {
        hasError = true
      }

      setConnectionError(
        hasError
          ? 'Chat notifications are temporarily unavailable. Retrying…'
          : ''
      )
    } finally {
      requestInFlightRef.current = false
    }
  }, [isAuthenticated, location.pathname, userKey])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return undefined
    }

    pollNotifications()
    const pollTimer = window.setInterval(
      pollNotifications,
      POLL_INTERVAL
    )
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollNotifications()
      }
    }
    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    return () => {
      window.clearInterval(pollTimer)
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )
    }
  }, [isAuthenticated, pollNotifications, user])

  const notifications = notificationState.ownerKey === userKey
    ? notificationState.items
    : []

  const openConversation = (message) => {
    setNotificationState((current) => ({
      ...current,
      items: current.items.filter(
        (notification) => notification.id !== message.id
      ),
    }))
    navigate(`/booking-chat/${message.booking}`)
  }

  const dismissNotification = (messageId) => {
    setNotificationState((current) => ({
      ...current,
      items: current.items.filter(
        (notification) => notification.id !== messageId
      ),
    }))
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <aside
      className={styles.notificationCenter}
      aria-label="Chat notifications"
      aria-live="polite"
    >
      {connectionError && (
        <p className={styles.connectionNotice} role="status">
          <i className="bi bi-wifi-off"></i>
          {connectionError}
        </p>
      )}
      {notifications.map((message) => (
        <article
          className={styles.notification}
          key={message.notificationKey}
        >
          <button
            type="button"
            className={styles.notificationOpen}
            onClick={() => openConversation(message)}
          >
            <span className={styles.notificationAvatar}>
              <i className="bi bi-chat-dots-fill"></i>
            </span>
            <span className={styles.notificationText}>
              <strong>
                Message from {message.sender_name}
              </strong>
              <small>
                {message.service_name} · Booking #{message.booking}
              </small>
              <span>{message.message}</span>
            </span>
          </button>
          <button
            type="button"
            className={styles.dismissButton}
            aria-label="Dismiss notification"
            onClick={() => dismissNotification(message.id)}
          >
            <i className="bi bi-x"></i>
          </button>
        </article>
      ))}
    </aside>
  )
}

export default ChatNotificationCenter
