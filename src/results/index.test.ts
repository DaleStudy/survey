import { describe, expect, test } from 'bun:test'
import { RESULTS, SAMPLE_RESULTS } from '.'

describe('결과 목록', () => {
  // 회차 목록과 헤더는 집계를 읽지 않고 total 만 본다
  test('적어 둔 응답자 수가 집계 파일과 같다', async () => {
    for (const [edition, entry] of Object.entries({ ...RESULTS, ...SAMPLE_RESULTS })) {
      const result = await entry.load()
      expect(result.edition).toBe(edition)
      expect(result.total).toBe(entry.total)
    }
  })
})
