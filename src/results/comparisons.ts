import type { QuestionStat, ResultSet } from './aggregate'
import { displayOptions } from './order'

// 결과 화면에서 함께 볼 문항 묶음. 집계만으로 그린다.
export interface Comparison {
  id: string
  title: string
  // 비교할 문항과 차트에서 부르는 이름. 색은 이 순서대로 정해진다.
  questions: { id: string; name: string }[]
  // grouped: 같은 code 를 한 줄에 나란히 놓는다. 줄과 순서는 첫 문항을 따르고, 뒤 문항의 선택지는 모두 첫 문항에 있어야 한다.
  // diverging: code 가 다른 두 문항을 첫 문항은 왼쪽, 둘째 문항은 오른쪽으로 뻗게 그린다.
  layout: 'grouped' | 'diverging'
  // 비율을 그대로 견주기 어려운 이유(고른 개수, 기준 기간 등)
  note?: string
}

const COMPARISONS_2026: Comparison[] = [
  {
    id: 'workplace',
    title: '일하는 곳에서 만족하는 점과 힘든 점, 고를 때 보는 점',
    questions: [
      { id: 'job_good', name: '만족하는 점' },
      { id: 'job_pain', name: '힘든 점' },
      { id: 'company_criteria', name: '고를 때 보는 점' },
    ],
    layout: 'grouped',
    note: '만족하는 점과 힘든 점은 2개까지, 고를 때 보는 점은 3개까지 골랐어요.',
  },
  {
    id: 'pay',
    title: '계약 연봉과 지난해 총보상',
    questions: [
      { id: 'salary', name: '계약 연봉' },
      { id: 'total_comp', name: '지난해 총보상' },
    ],
    layout: 'grouped',
    note: '계약 연봉은 성과급을 뺀 지금 연봉이고, 총보상은 성과급까지 넣어 지난해에 실제로 받은 금액이에요. 총보상은 정규직·계약직·파견 근무자에게만 물었어요.',
  },
  {
    id: 'ai',
    title: 'AI 도구를 쓰고 나서 힘들어진 점과 좋아진 점',
    questions: [
      { id: 'ai_downsides', name: '힘들어진 점' },
      { id: 'ai_upsides', name: '좋아진 점' },
    ],
    layout: 'diverging',
    note: '둘 다 2개까지 골랐어요.',
  },
  {
    id: 'language',
    title: '가장 많이 쓴 언어와 더 써 보고 싶은 언어',
    questions: [
      { id: 'main_language', name: '가장 많이 쓴 언어' },
      { id: 'want_language', name: '써 보고 싶은 언어' },
    ],
    layout: 'grouped',
    note: '가장 많이 쓴 언어는 하나만, 써 보고 싶은 언어는 2개까지 골랐어요.',
  },
]

// 회차 ID → 비교 묶음
export const COMPARISONS: Record<string, Comparison[]> = {
  '2026': COMPARISONS_2026,
  // 예시 회차는 2026 문항을 빌려 쓴다(scripts/sample-results.ts)
  '2025': COMPARISONS_2026,
}

export interface ComparisonView {
  comparison: Comparison
  // 숨기지 않은 문항만. 둘보다 적으면 비교를 보여 주지 않는다.
  series: { name: string; q: QuestionStat }[]
}

export function comparisonViews(result: ResultSet): ComparisonView[] {
  return (COMPARISONS[result.edition] ?? []).flatMap((comparison) => {
    const series = comparison.questions.flatMap(({ id, name }) => {
      const q = result.questions.find((x) => x.id === id)
      return q && !q.hidden ? [{ name, q }] : []
    })
    return series.length >= 2 ? [{ comparison, series }] : []
  })
}

// grouped 비교의 줄. 첫 문항의 결과 화면 순서를 따른다. 그 문항에 없는 선택지는 undefined.
export function groupedLines(view: ComparisonView): { code: string; label: string; shares: (number | undefined)[] }[] {
  return displayOptions(view.series[0].q).map((o) => ({
    code: o.code,
    label: o.label,
    shares: view.series.map(({ q }) => q.options.find((x) => x.code === o.code)?.share),
  }))
}
