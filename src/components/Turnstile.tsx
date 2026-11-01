import { useEffect, useRef } from 'react'
import { TURNSTILE_ACTION, TURNSTILE_SITEKEY } from '@/lib/turnstile'

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile'))))
    script.addEventListener('error', () => reject(new Error('turnstile')))
  })
}

interface Props {
  onToken: (token: string | null) => void
  // 값이 바뀌면 위젯을 리셋해 새 토큰을 받는다. 토큰은 한 번만 쓸 수 있어서 제출이 실패하면 필요하다.
  resetKey: number
}

export function Turnstile({ onToken, resetKey }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string>(undefined)
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  useEffect(() => {
    let cancelled = false
    loadScript()
      .then((api) => {
        if (cancelled || !box.current) return
        widgetId.current = api.render(box.current, {
          sitekey: TURNSTILE_SITEKEY,
          action: TURNSTILE_ACTION,
          language: 'ko',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        })
      })
      .catch(() => onTokenRef.current(null))
    return () => {
      cancelled = true
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
    }
  }, [])

  useEffect(() => {
    if (resetKey > 0 && widgetId.current) {
      onTokenRef.current(null)
      window.turnstile?.reset(widgetId.current)
    }
  }, [resetKey])

  return <div ref={box} />
}
