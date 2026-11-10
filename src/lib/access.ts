// /admin 은 Cloudflare Access 관리자 앱이 운영진(GitHub DaleStudy/maintainer 팀)에게만 연다.
// Access 는 잠근 경로로 가는 요청에만 Cf-Access-Jwt-Assertion 헤더를 붙인다. 서버는 이 토큰을 다시 검증해서,
// Access 설정이 빠지거나 잘못돼도 원본 응답이 열리지 않게 한다.
export const ACCESS_TEAM_DOMAIN = 'https://dalestudy.cloudflareaccess.com'
// 관리자 앱의 Application Audience(AUD) 태그. 토큰이 이 앱에서 발급됐는지 확인하는 공개 값이다.
export const ADMIN_AUD = '4ac303ec380af098724251d42a56d5c1d990343f6768cee819dbf45acc9aed18'

interface VerifyInput {
  token: unknown
  aud: string
  teamDomain?: string
  fetch?: typeof fetch
  now?: number
}

interface JwtHeader {
  alg?: string
  kid?: string
}

interface JwtPayload {
  aud?: string | string[]
  iss?: string
  exp?: number
  nbf?: number
}

function base64url(input: string): Uint8Array<ArrayBuffer> {
  const base64 = input.replaceAll('-', '+').replaceAll('_', '/')
  return Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (c) => c.charCodeAt(0))
}

function decodeJson<T>(part: string): T {
  return JSON.parse(new TextDecoder().decode(base64url(part))) as T
}

// RS256 서명, 발급자(팀 도메인), AUD, 유효 기간을 확인한다. 하나라도 어긋나거나 확인할 수 없으면 false (fail closed).
export async function verifyAccessToken({ token, aud, teamDomain = ACCESS_TEAM_DOMAIN, fetch: fetchImpl = fetch, now = Date.now() }: VerifyInput): Promise<boolean> {
  if (typeof token !== 'string' || token.length > 8192 || !aud) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [encodedHeader, encodedPayload, signature] = parts
  try {
    const header = decodeJson<JwtHeader>(encodedHeader)
    const payload = decodeJson<JwtPayload>(encodedPayload)
    const seconds = now / 1000
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (header.alg !== 'RS256' || !header.kid) return false
    if (!audiences.includes(aud) || payload.iss !== teamDomain) return false
    if (typeof payload.exp !== 'number' || payload.exp <= seconds || (payload.nbf !== undefined && payload.nbf > seconds)) return false

    const r = await fetchImpl(`${teamDomain}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(10_000) })
    if (!r.ok) return false
    const { keys } = (await r.json()) as { keys?: (JsonWebKey & { kid?: string })[] }
    const jwk = keys?.find((k) => k.kid === header.kid)
    if (!jwk) return false
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, base64url(signature), new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`))
  } catch {
    return false
  }
}
