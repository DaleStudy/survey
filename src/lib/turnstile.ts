// Turnstile 위젯 survey 의 사이트 키. 브라우저에 그대로 드러나는 공개 값이다.
// 시크릿 키는 Worker 시크릿 TURNSTILE_SECRET (원본: 1Password dev/CF_SURVEY_TURNSTILE).
export const TURNSTILE_SITEKEY = '0x4AAAAAAFviaQabwRYcGFVK'
export const TURNSTILE_ACTION = 'survey_submit'

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface VerifyInput {
  token: unknown
  secret: string | undefined
  // 이 배포에서 받아 줄 프런트엔드 호스트 이름. 운영에는 localhost 를 넣지 않는다.
  // 점으로 시작하는 항목(.survey-preview.dalestudy.com)은 그 하위 도메인을 모두 받는다.
  hostnames: string | undefined
  fetch?: typeof fetch
}

function isAllowed(allowed: Set<string>, hostname: string): boolean {
  return [...allowed].some((h) => (h.startsWith('.') ? hostname.endsWith(h) : hostname === h))
}

// siteverify 로 토큰을 검사한다. 실패하거나 확인할 수 없으면 false (fail closed).
export async function verifyTurnstile({ token, secret, hostnames, fetch: fetchImpl = fetch }: VerifyInput): Promise<boolean> {
  const allowed = new Set(
    (hostnames ?? '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean),
  )
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048 || !secret || allowed.size === 0) {
    return false
  }
  try {
    const r = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret, response: token }),
    })
    if (!r.ok) return false
    const result = (await r.json()) as { success?: boolean; action?: string; hostname?: string }
    return result.success === true && result.action === TURNSTILE_ACTION && !!result.hostname && isAllowed(allowed, result.hostname)
  } catch {
    return false
  }
}
