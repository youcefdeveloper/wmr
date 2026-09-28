import '@assets/css/assistant.css'
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'

// Floating chat with the rates assistant (src/lib/server/agent), on every
// dashboard page. Each dashboard page is a full page load, so the conversation
// and open state are kept in sessionStorage for the tab.

type Turn = { role: 'user' | 'assistant'; content: string }
type Saved = { open: boolean; expanded?: boolean; turns: Turn[] }

const API = '/api/dashboard/assistant'
const STORAGE_KEY = 'wmr-assistant'
/** The server accepts at most 20 earlier turns. */
const MAX_HISTORY = 20

const SUGGESTIONS = [
  'What are the rates this week?',
  'What was the lowest 30-year rate since 2020?',
  'Compare the 2023, 2024 and 2025 averages',
  'When is new data published?',
]

function load(): Saved {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
    if (saved && Array.isArray(saved.turns)) return saved
  } catch {
    // Storage blocked or corrupt: start fresh.
  }
  return { open: false, turns: [] }
}

function save(state: Saved) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Not critical: the chat just won't survive a page change.
  }
}

async function ask(question: string, history: Turn[]): Promise<string> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history: history.slice(-MAX_HISTORY) }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data.answer
}

/** Plain text with **bold** spans, the only markup the model tends to use. */
const Formatted = ({ text }: { text: string }) => (
  <>
    {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
      i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>,
    )}
  </>
)

const CloseIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

const ChatIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 3.5c-4.97 0-9 3.36-9 7.5 0 2.1 1.04 4 2.72 5.36-.2 1.2-.8 2.4-1.72 3.3a.5.5 0 0 0 .4.84c1.96-.1 3.6-.8 4.72-1.62.9.24 1.87.37 2.88.37 4.97 0 9-3.36 9-7.5S16.97 3.5 12 3.5z"
    />
    <circle className="wmr-chat-fab-dot" cx="8" cy="11" r="1.25" />
    <circle className="wmr-chat-fab-dot" cx="12" cy="11" r="1.25" />
    <circle className="wmr-chat-fab-dot" cx="16" cy="11" r="1.25" />
  </svg>
)

const SendIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a1 1 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
  </svg>
)

const Assistant = () => {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restored, setRestored] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const saved = load()
    setOpen(saved.open)
    setExpanded(saved.expanded === true)
    setTurns(saved.turns)
    setRestored(true)
  }, [])

  useEffect(() => {
    if (restored) save({ open, expanded, turns })
  }, [open, expanded, turns, restored])

  useEffect(() => {
    if (!open) return
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [open, turns, pending])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // On phones the window covers the page; assistant.css stops the page from
  // scrolling behind it while this class is set.
  useEffect(() => {
    document.documentElement.classList.toggle('wmr-chat-open', open)
    return () => document.documentElement.classList.remove('wmr-chat-open')
  }, [open])

  // Grow the input with its text, up to the CSS max-height.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft, open])

  const close = () => {
    setOpen(false)
    fabRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || pending) return
    const history = turns
    setTurns([...history, { role: 'user', content: question }])
    setDraft('')
    setError(null)
    setPending(true)
    try {
      const answer = await ask(question, history)
      setTurns((t) => [...t, { role: 'assistant', content: answer }])
    } catch (err) {
      // Drop the unanswered question and put it back in the box to retry.
      setTurns(history)
      setDraft(question)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
      inputRef.current?.focus()
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(draft)
  }

  // Enter sends, Shift+Enter adds a line.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(draft)
    }
  }

  const reset = () => {
    setTurns([])
    setError(null)
    setDraft('')
    inputRef.current?.focus()
  }

  return (
    <div className="wmr-chat">
      {open && (
        <section
          id="wmr-chat-panel"
          className={`wmr-chat-panel${expanded ? ' is-expanded' : ''}`}
          role="dialog"
          aria-label="Rates assistant"
        >
          <div className="wmr-chat-header">
            <div className="wmr-chat-avatar" aria-hidden="true">
              <i className="bi bi-graph-up-arrow" />
            </div>
            <div className="wmr-chat-heading">
              <h2 className="wmr-chat-title fw-semibold">Rates Assistant</h2>
              <p className="wmr-chat-subtitle">Based on weekly PMMS data</p>
            </div>
            <div className="wmr-chat-actions">
              <button
                type="button"
                className="wmr-chat-icon-btn"
                onClick={reset}
                disabled={pending || turns.length === 0}
                title="New chat"
                aria-label="New chat"
              >
                <i className="bi bi-arrow-counterclockwise" />
              </button>
              <button
                type="button"
                className="wmr-chat-icon-btn wmr-chat-resize"
                onClick={() => setExpanded((e) => !e)}
                title={expanded ? 'Minimize' : 'Maximize'}
                aria-label={expanded ? 'Minimize' : 'Maximize'}
                aria-pressed={expanded}
              >
                <i className={expanded ? 'bi bi-arrows-angle-contract' : 'bi bi-arrows-angle-expand'} />
              </button>
              <button
                type="button"
                className="wmr-chat-icon-btn"
                onClick={close}
                title="Close"
                aria-label="Close"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          </div>

          <div ref={bodyRef} className="wmr-chat-body" aria-live="polite">
            {turns.length === 0 ? (
              <div className="wmr-chat-welcome">
                <div className="wmr-chat-avatar" aria-hidden="true">
                  <i className="bi bi-stars" />
                </div>
                <div className="fw-semibold">How can I help?</div>
                <p>Ask about weekly mortgage rates, trends and where the data comes from.</p>
                <div className="wmr-chat-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="wmr-chat-suggestion"
                      onClick={() => send(s)}
                    >
                      <span>{s}</span>
                      <i className="bi bi-arrow-up-right" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              turns.map((t, i) => (
                <div key={i} className={`wmr-chat-msg is-${t.role}`}>
                  {t.role === 'assistant' ? <Formatted text={t.content} /> : t.content}
                </div>
              ))
            )}
            {pending && (
              <div className="wmr-chat-msg is-assistant" aria-label="Thinking">
                <span className="wmr-chat-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="wmr-chat-error" role="alert">
              {error}
            </div>
          )}

          <form className="wmr-chat-composer" onSubmit={onSubmit}>
            <textarea
              ref={inputRef}
              className="wmr-chat-input"
              rows={1}
              maxLength={2000}
              placeholder="Ask about mortgage rates…"
              aria-label="Question"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              type="submit"
              className="wmr-chat-send"
              disabled={pending || !draft.trim()}
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </form>
          <p className="wmr-chat-footnote">National averages, not an offer. Not financial advice.</p>
        </section>
      )}

      <button
        ref={fabRef}
        type="button"
        className="wmr-chat-fab"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="wmr-chat-panel"
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        title={open ? 'Close assistant' : 'Ask the rates assistant'}
      >
        {/* Keyed so the icon animates in when it swaps. */}
        {open ? <CloseIcon key="close" size={26} /> : <ChatIcon key="chat" />}
      </button>
    </div>
  )
}

export default Assistant
