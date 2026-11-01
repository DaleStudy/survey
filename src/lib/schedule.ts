// 응답 마감 시각 (ISO 8601, 한국 시간이면 +09:00). 날짜가 정해지면 채운다. null 이면 마감하지 않는다.
export const CLOSES_AT: string | null = null

export function isClosed(now: Date = new Date(), closesAt: string | null = CLOSES_AT): boolean {
  return closesAt !== null && now.getTime() >= new Date(closesAt).getTime()
}
