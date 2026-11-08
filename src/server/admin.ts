import { count, desc, eq, sql } from 'drizzle-orm'
import type { Database } from '@/db'
import { responses } from '@/db/schema'
import { type Answers, questionsFor } from '@/questions/survey'
import { aggregate, type QuestionStat } from '@/results/aggregate'

export const PAGE_SIZE = 50

// 회차 전체 그림. 원본 페이지를 넘겨도 다시 받지 않도록 원본 응답과 따로 준다.
export interface AdminSummary {
  total: number
  // 한국 날짜(YYYY-MM-DD)별 응답 수
  daily: { date: string; count: number }[]
  // 모든 응답의 문항별 분포. 운영진은 원본도 보므로 MIN_GROUP 숨김(hidden)은 화면에서 쓰지 않는다.
  stats: QuestionStat[]
}

export interface AdminResponses {
  total: number
  // 최근 응답부터 PAGE_SIZE 건
  rows: { createdAt: string; answers: Answers }[]
}

// 관리자 화면(/admin)이 보는 데이터. 읽기만 한다.
export async function loadSummary(db: Database, edition: string): Promise<AdminSummary> {
  const ofEdition = eq(responses.edition, edition)
  // created_at 은 UTC ISO 문자열이라 한국 날짜로 바꿔서 묶는다
  const date = sql<string>`date(${responses.createdAt}, '+9 hours')`
  const [all, daily] = await Promise.all([
    db.select({ answers: responses.answers }).from(responses).where(ofEdition),
    db.select({ date, count: count() }).from(responses).where(ofEdition).groupBy(date).orderBy(date),
  ])
  const answers = all.map((r) => r.answers)
  const stats = aggregate(questionsFor(edition) ?? [], answers, edition, false).questions
  return { total: answers.length, daily, stats }
}

export async function loadResponses(db: Database, edition: string, page: number): Promise<AdminResponses> {
  const ofEdition = eq(responses.edition, edition)
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(responses).where(ofEdition),
    db
      .select({ createdAt: responses.createdAt, answers: responses.answers })
      .from(responses)
      .where(ofEdition)
      .orderBy(desc(responses.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ])
  return { total, rows }
}
