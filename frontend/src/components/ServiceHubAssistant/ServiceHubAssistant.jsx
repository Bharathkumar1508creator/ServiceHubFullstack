import { useEffect, useRef, useState } from 'react'

import { useAuth } from '../../context/AuthContext'
import { sendAssistantMessage } from '../../services/api'

import styles from './ServiceHubAssistant.module.css'

const quickPrompts = {
  customer: [
    'How do I track my booking?',
    'How can I compare providers?',
    'How do I request a cancellation?',
  ],
  provider: [
    'How do I manage new bookings?',
    'How does cancellation review work?',
    'Where can I see my earnings?',
  ],
}

function greetingFor(role) {
  return role === 'provider'
    ? 'Hi! I’m your ServiceHub assistant. Ask me about bookings, services, customers, cancellations, or earnings.'
    : 'Hi! I’m your ServiceHub assistant. Ask me about finding services, comparing providers, bookings, tracking, or cancellations.'
}

function createSessionId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (character) => {
      const value = Math.floor(Math.random() * 16)
      return (character === 'x' ? value : (value & 0x3) | 0x8).toString(16)
    },
  )
}

function ServiceHubAssistant() {
  const { isAuthenticated, user } = useAuth()
  const role = user?.role
  const ownerKey = isAuthenticated && user
    ? `${user.id || user.username || user.email || ''}:${role || ''}`
    : ''

  if (!isAuthenticated || !quickPrompts[role]) {
    return null
  }

  return (
    <AssistantWidget
      key={ownerKey}
      ownerKey={ownerKey}
      role={role}
    />
  )
}

function AssistantWidget({ role, ownerKey }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const historyRef = useRef(null)
  const messageIdRef = useRef(0)
  const sessionIdRef = useRef('')
  const ownerKeyRef = useRef(ownerKey)
  const prompts = quickPrompts[role]

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop =
        historyRef.current.scrollHeight
    }
  }, [messages, isSending, error, isOpen])

  useEffect(() => {
    ownerKeyRef.current = ownerKey
    return () => {
      ownerKeyRef.current = ''
      sessionIdRef.current = ''
    }
  }, [ownerKey])

  const visibleMessages = [
    {
      id: 'welcome',
      role: 'assistant',
      content: greetingFor(role),
    },
    ...messages,
  ]

  const submitMessage = async (event, suggestedMessage) => {
    event?.preventDefault()
    const message = (suggestedMessage || draft).trim()
    if (!message || isSending) {
      return
    }

    const activeSessionId =
      sessionIdRef.current || createSessionId()
    sessionIdRef.current = activeSessionId
    const activeOwnerKey = ownerKey
    const conversationHistory = messages
      .slice(-8)
      .map(({ role: messageRole, content }) => ({
        role: messageRole,
        content,
      }))
    const userMessage = {
      id: `user-${++messageIdRef.current}`,
      role: 'user',
      content: message,
    }

    setMessages((current) => [...current, userMessage])
    setDraft('')
    setError('')
    setIsSending(true)

    try {
      const response = await sendAssistantMessage(
        message,
        conversationHistory,
        activeSessionId,
      )
      if (
        ownerKeyRef.current !== activeOwnerKey ||
        sessionIdRef.current !== activeSessionId
      ) {
        return
      }
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${++messageIdRef.current}`,
          role: 'assistant',
          content: response.reply,
        },
      ])
    } catch (requestError) {
      if (
        ownerKeyRef.current !== activeOwnerKey ||
        sessionIdRef.current !== activeSessionId
      ) {
        return
      }
      setError(
        requestError.message ||
          'Could not reach the assistant. Please try again.',
      )
    } finally {
      if (
        ownerKeyRef.current === activeOwnerKey &&
        sessionIdRef.current === activeSessionId
      ) {
        setIsSending(false)
      }
    }
  }

  const toggleAssistant = () => {
    if (isOpen) {
      sessionIdRef.current = ''
      setMessages([])
      setDraft('')
      setError('')
      setIsSending(false)
      setIsOpen(false)
      return
    }

    sessionIdRef.current = createSessionId()
    setMessages([])
    setDraft('')
    setError('')
    setIsOpen(true)
  }

  return (
    <aside className={styles.assistant} aria-label="ServiceHub AI assistant">
      {isOpen && (
        <section
          className={styles.panel}
          aria-label="Chat with ServiceHub assistant"
        >
          <header className={styles.header}>
            <div className={styles.headerIdentity}>
              <span className={styles.avatar}>
                <i className="bi bi-stars" aria-hidden="true"></i>
              </span>
              <span className={styles.headerCopy}>
                <strong>ServiceHub AI</strong>
                <span>
                  <i aria-hidden="true"></i>
                  {role === 'provider'
                    ? 'Provider support'
                    : 'Customer support'}
                </span>
              </span>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
            >
              <i className="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </header>

          <div
            className={styles.messages}
            ref={historyRef}
            aria-live="polite"
            aria-relevant="additions text"
          >
            <div className={styles.dayDivider}>
              <span>HERE TO HELP</span>
            </div>
            {visibleMessages.map((item) => (
              <div
                className={`${styles.messageRow} ${
                  item.role === 'user' ? styles.userRow : ''
                }`}
                key={item.id}
              >
                {item.role === 'assistant' && (
                  <span className={styles.messageAvatar}>
                    <i className="bi bi-stars" aria-hidden="true"></i>
                  </span>
                )}
                <p
                  className={`${styles.messageBubble} ${
                    item.role === 'user' ? styles.userBubble : ''
                  }`}
                >
                  {item.content}
                </p>
              </div>
            ))}
            {isSending && (
              <div className={styles.messageRow} role="status">
                <span className={styles.messageAvatar}>
                  <i className="bi bi-stars" aria-hidden="true"></i>
                </span>
                <span className={styles.typing} aria-label="Assistant is typing">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
              </div>
            )}
            {error && (
              <p className={styles.error} role="alert">
                <i className="bi bi-exclamation-circle" aria-hidden="true"></i>
                {error}
              </p>
            )}
            {messages.length === 0 && (
              <div className={styles.quickPrompts}>
                {prompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    disabled={isSending}
                    onClick={() => submitMessage(undefined, prompt)}
                  >
                    {prompt}
                    <i className="bi bi-arrow-up-right" aria-hidden="true"></i>
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className={styles.composer}
            onSubmit={submitMessage}
          >
            <label className={styles.visuallyHidden} htmlFor="assistant-message">
              Ask ServiceHub AI
            </label>
            <textarea
              id="assistant-message"
              rows="1"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submitMessage()
                }
              }}
              placeholder="Ask anything..."
              maxLength={2000}
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              aria-label="Send message"
            >
              <i className="bi bi-arrow-up" aria-hidden="true"></i>
            </button>
            <small>AI can make mistakes. Check important details in your account.</small>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`${styles.launcher} ${isOpen ? styles.launcherOpen : ''}`}
        onClick={toggleAssistant}
        aria-label={isOpen ? 'Close ServiceHub assistant' : 'Open ServiceHub assistant'}
        aria-expanded={isOpen}
      >
        <span className={styles.launcherGlow}></span>
        <i
          className={`bi ${isOpen ? 'bi-x-lg' : 'bi-chat-heart-fill'}`}
          aria-hidden="true"
        ></i>
        {!isOpen && <span className={styles.launcherSparkle}>✦</span>}
      </button>
    </aside>
  )
}

export default ServiceHubAssistant
