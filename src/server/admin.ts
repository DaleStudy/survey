import { count, desc, eq, sql } from 'drizzle-orm'
import type { Database } from '@/db'
import { responses } from '@/db/schema'
import type { Answers } from '@/questions/survey'

export const PAGE_SIZE = 50

export interface AdminData {
  total: number
  // 한국 날짜(YYYY-MM-DD)별 응답 수
  daily: { date: string; count: number }[]
  // 최근 응답부터 PAGE_SIZE 건
  rows: { createdAt: string; answers: Answers }[]
}

// 관리자 화면(/admin)이 보는 회차별 집계와 원본 응답 한 페이지. 읽기만 한다.
export async function loadAdminData(db: Database, edition: string, page: number): Promise<AdminData> {
  const ofEdition = eq(responses.edition, edition)
  // created_at 은 UTC ISO 문자열이라 한국 날짜로 바꿔서 묶는다
  const date = sql<string>`date(${responses.createdAt}, '+9 hours')`
  const [[{ total }], daily, rows] = await Promise.all([
    db.select({ total: count() }).from(responses).where(ofEdition),
    db.select({ date, count: count() }).from(responses).where(ofEdition).groupBy(date).orderBy(date),
    db
      .select({ createdAt: responses.createdAt, answers: responses.answers })
      .from(responses)
      .where(ofEdition)
      .orderBy(desc(responses.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ])
  return { total, daily, rows }
}
