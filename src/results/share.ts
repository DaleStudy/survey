import type { QuestionStat, ResultSet } from './aggregate'
import { type ComparisonView, comparisonViews } from './comparisons'

// 따로 공유할 수 있는 차트. 공유 페이지(/<회차>/results/<id>)와 미리보기 이미지(scripts/results-og.ts)가 함께 쓴다.
// 숨긴 문항과 자유 의견은 차트가 없어서 뺀다. 문항 비교는 문항 id 와 겹치지 않게 compare- 를 붙인다.
export type SharedChart = { id: string; title: string } & ({ kind: 'question'; q: QuestionStat } | { kind: 'comparison'; view: ComparisonView })

export function sharedCharts(result: ResultSet): SharedChart[] {
  return [
    ...result.questions.filter((q) => !q.hidden && q.type !== 'long').map((q) => ({ id: q.id, title: q.label, kind: 'question' as const, q })),
    ...comparisonViews(result).map((view) => ({
      id: `compare-${view.comparison.id}`,
      title: view.comparison.title,
      kind: 'comparison' as const,
      view,
    })),
  ]
}
