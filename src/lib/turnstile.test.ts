import { describe, expect, test } from 'bun:test'
import { TURNSTILE_ACTION, verifyTurnstile } from './turnstile'

const reply = (body: object, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch
const ok = { success: true, action: TURNSTILE_ACTION, hostname: 'survey.dalestudy.com' }
const base = { token: 'token', secret: 'secret', hostnames: 'survey.dalestudy.com' }

describe('verifyTurnstile', () => {
  test('성공, action, 호스트 이름이 모두 맞으면 통과한다', async () => {
    expect(await verifyTurnstile({ ...base, fetch: reply(ok) })).toBe(true)
  })

  test('siteverify 가 실패라고 하면 거절한다', async () => {
    expect(await verifyTurnstile({ ...base, fetch: reply({ ...ok, success: false }) })).toBe(false)
  })

  test('다른 action 의 토큰은 거절한다', async () => {
    expect(await verifyTurnstile({ ...base, fetch: reply({ ...ok, action: 'login' }) })).toBe(false)
  })

  test('허용하지 않은 호스트에서 받은 토큰은 거절한다', async () => {
    expect(await verifyTurnstile({ ...base, fetch: reply({ ...ok, hostname: 'localhost' }) })).toBe(false)
  })

  test('토큰, 시크릿, 허용 호스트가 없으면 siteverify 를 부르지 않고 거절한다', async () => {
    const never = (async () => {
      throw new Error('called')
    }) as unknown as typeof fetch
    expect(await verifyTurnstile({ ...base, token: '', fetch: never })).toBe(false)
    expect(await verifyTurnstile({ ...base, secret: undefined, fetch: never })).toBe(false)
    expect(await verifyTurnstile({ ...base, hostnames: ' ', fetch: never })).toBe(false)
  })

  test('siteverify 호출이 실패하면 거절한다', async () => {
    expect(await verifyTurnstile({ ...base, fetch: reply({}, 500) })).toBe(false)
    const boom = (async () => {
      throw new Error('network')
    }) as unknown as typeof fetch
    expect(await verifyTurnstile({ ...base, fetch: boom })).toBe(false)
  })
})
