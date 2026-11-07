import { beforeAll, describe, expect, test } from 'bun:test'
import { verifyAccessToken } from './access'

const TEAM = 'https://team.cloudflareaccess.com'
const AUD = 'admin-aud'
const NOW = Date.UTC(2026, 10, 7) / 1000

const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
const encodeJson = (value: object) => encode(new TextEncoder().encode(JSON.stringify(value)))

let privateKey: CryptoKey
let certs: typeof fetch

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )
  privateKey = pair.privateKey
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey)
  const body = JSON.stringify({ keys: [{ ...jwk, kid: 'key-1' }] })
  certs = (async (url: string) => (url === `${TEAM}/cdn-cgi/access/certs` ? new Response(body) : new Response('', { status: 404 }))) as unknown as typeof fetch
})

async function sign(payload: object, header: object = { alg: 'RS256', kid: 'key-1' }) {
  const input = `${encodeJson(header)}.${encodeJson(payload)}`
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(input)))
  return `${input}.${encode(signature)}`
}

const claims = { aud: [AUD], iss: TEAM, exp: NOW + 60, nbf: NOW - 60 }
const verify = (token: unknown, fetch = certs) => verifyAccessToken({ token, aud: AUD, teamDomain: TEAM, fetch, now: NOW * 1000 })

describe('verifyAccessToken', () => {
  test('관리자 앱이 발급한 유효한 토큰은 통과한다', async () => {
    expect(await verify(await sign(claims))).toBe(true)
  })

  test('다른 Access 앱의 토큰은 거절한다', async () => {
    expect(await verify(await sign({ ...claims, aud: ['beta-aud'] }))).toBe(false)
  })

  test('다른 팀 도메인이 발급한 토큰은 거절한다', async () => {
    expect(await verify(await sign({ ...claims, iss: 'https://evil.cloudflareaccess.com' }))).toBe(false)
  })

  test('만료됐거나 아직 쓸 수 없는 토큰은 거절한다', async () => {
    expect(await verify(await sign({ ...claims, exp: NOW }))).toBe(false)
    expect(await verify(await sign({ ...claims, nbf: NOW + 60 }))).toBe(false)
    expect(await verify(await sign({ aud: [AUD], iss: TEAM }))).toBe(false)
  })

  test('서명을 바꾸거나 내용을 고친 토큰은 거절한다', async () => {
    const [header, , signature] = (await sign(claims)).split('.')
    expect(await verify(`${header}.${encodeJson({ ...claims, aud: [AUD, 'x'] })}.${signature}`)).toBe(false)
    expect(await verify(`${header}.${encodeJson(claims)}.`)).toBe(false)
  })

  test('RS256 이 아니거나 모르는 키로 서명한 토큰은 거절한다', async () => {
    expect(await verify(await sign(claims, { alg: 'none', kid: 'key-1' }))).toBe(false)
    expect(await verify(await sign(claims, { alg: 'RS256', kid: 'key-2' }))).toBe(false)
  })

  test('토큰이 없거나 모양이 틀리면 공개 키를 받지 않고 거절한다', async () => {
    const never = (async () => {
      throw new Error('called')
    }) as unknown as typeof fetch
    for (const token of [null, undefined, '', 'a.b', 'a.b.c.d', 'x'.repeat(9000)]) expect(await verify(token, never)).toBe(false)
  })

  test('AUD 가 비어 있으면 어떤 토큰도 거절한다', async () => {
    expect(await verifyAccessToken({ token: await sign({ ...claims, aud: [''] }), aud: '', teamDomain: TEAM, fetch: certs, now: NOW * 1000 })).toBe(false)
  })

  test('공개 키를 받지 못하면 거절한다', async () => {
    const down = (async () => new Response('', { status: 500 })) as unknown as typeof fetch
    const offline = (async () => {
      throw new TypeError('network')
    }) as unknown as typeof fetch
    const token = await sign(claims)
    expect(await verify(token, down)).toBe(false)
    expect(await verify(token, offline)).toBe(false)
  })
})
