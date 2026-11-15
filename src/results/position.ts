import type { ResultSet } from './aggregate'

// 나와 비교하기: 연봉 구간을 고르면 같은 집단 응답자 가운데 어디쯤인지 보여 준다.
// 집계만으로 계산하고, 고른 값은 화면 상태로만 둔다(주소에도 남기지 않는다).
// 집단은 집단별 보기(BREAKDOWNS) 가운데 연봉과 견줄 만한 것만 쓴다.
export const POSITION = { question: 'salary', by: ['experience', 'role', 'company_type', 'work_type'] }

// 위치를 셀 때 빼는 선택지. 구간이 아니라 답을 미룬 것이다.
const SKIP = new Set(['no_answer'])

export interface Position {
  below: number
  same: number
  above: number
}

// codes 는 낮은 구간부터의 순서(문항 선택지 순서), shares 는 code → 비율. 답을 미룬 선택지는 빼고 다시 100%로 맞춘다.
export function position(codes: string[], shares: Record<string, number>, mine: string): Position | undefined {
  const ranked = codes.filter((c) => !SKIP.has(c))
  const i = ranked.indexOf(mine)
  const total = ranked.reduce((s, c) => s + (shares[c] ?? 0), 0)
  if (i < 0 || total === 0) return undefined
  const part = (cs: string[]) => cs.reduce((s, c) => s + (shares[c] ?? 0), 0) / total
  return { below: part(ranked.slice(0, i)), same: part([mine]), above: part(ranked.slice(i + 1)) }
}

export interface Distribution {
  codes: string[]
  shares: Record<string, number>
  // 구간을 고른 사람 수. 답을 미룬 사람은 위치를 셀 때 빼므로 여기서도 뺀다.
  ranked: number
}

const ranked = (answered: number, shares: Record<string, number>) => Math.round(answered * (1 - [...SKIP].reduce((s, c) => s + (shares[c] ?? 0), 0)))

// 집단의 연봉 분포. by 가 없으면 전체 응답자. 문항이나 집단 칸을 숨겼으면(응답자가 적으면) undefined.
export function distribution(result: ResultSet, by?: string, group?: string): Distribution | undefined {
  const q = result.questions.find((x) => x.id === POSITION.question)
  if (!q || q.hidden) return undefined
  const codes = q.options.map((o) => o.code)
  if (!by) {
    const shares = Object.fromEntries(q.options.map((o) => [o.code, o.share]))
    return { codes, shares, ranked: ranked(q.answered, shares) }
  }
  const stat = result.breakdowns.find((b) => b.id === by)?.questions[POSITION.question]?.find((g) => g.group === group)
  return stat && !stat.hidden ? { codes, shares: stat.shares, ranked: ranked(stat.answered, stat.shares) } : undefined
}

// 위치를 고를 수 있는 연봉 구간
export function positionChoices(result: ResultSet): { code: string; label: string }[] {
  return (result.questions.find((x) => x.id === POSITION.question)?.options ?? []).filter((o) => !SKIP.has(o.code))
}
