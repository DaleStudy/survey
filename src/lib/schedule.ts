// 응답 마감 시각 (ISO 8601, 한국 시간). 계획서 일정: 11월 16일 시작, 12월 6일 마감, 12월 21일 발표.
export const CLOSES_AT: string | null = '2026-12-06T23:59:59+09:00'

export function isClosed(now: Date = new Date(), closesAt: string | null = CLOSES_AT): boolean {
  return closesAt !== null && now.getTime() >= new Date(closesAt).getTime()
}
