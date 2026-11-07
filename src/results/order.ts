import type { OptionStat, QuestionStat } from './aggregate'

// "기타", "잘 모르겠어요"처럼 답을 미룬 선택지. 비율이 높아도 맨 아래에 둔다.
// "답하지 않을게요"(no_answer)는 순서형 문항에만 있어서 원래 순서대로 맨 아래에 위치하므로 넣지 않는다.
const RESIDUAL = new Set(['other', 'unknown', 'undecided'])

// 결과 화면(차트와 표)에 보여 줄 선택지 순서.
// nominal 문항만 전체 응답 비율이 높은 순으로 정렬한다. 집단별 보기도 이 순서를 따라서, 보기를 바꿔도 줄이 움직이지 않는다.
// ordinal 이거나 order 가 없는 문항(예전 집계)은 원래 순서 그대로 둔다.
export function displayOptions(q: QuestionStat): OptionStat[] {
  if (q.order !== 'nominal') return q.options
  const residual = (o: OptionStat) => RESIDUAL.has(o.code)
  // 맨 아래 선택지끼리와 비율이 같은 선택지끼리는 원래 순서를 지킨다 (Array.prototype.sort 는 안정 정렬)
  return [...q.options].sort((a, b) => {
    if (residual(a) !== residual(b)) return residual(a) ? 1 : -1
    return residual(a) ? 0 : b.share - a.share
  })
}
