// 결과 화면을 시험하려는 예시 데이터. 실제 설문이 아니다. 운영 D1 에는 넣지 않고 집계만 파일로 남긴다.
// 오픈 전에 지운다(AGENTS.md 의 오픈 체크리스트).
import { visibleQuestions } from '../src/questions/logic'
import { type Answers, questionsFor } from '../src/questions/survey'
import { aggregate } from '../src/results/aggregate'

// 예시 회차. 문항은 2026 회차 것을 빌려 쓴다.
const EDITION = '2025'
const QUESTIONS = questionsFor('2026')!
const COUNT = 800

// 매번 같은 결과가 나오게 시드를 고정한 난수 (mulberry32)
let seed = 20251116
function random() {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// 선택지마다 무게를 하나씩 정해 두고 그 비율로 고른다. 앞쪽 선택지가 조금 더 많이 나오게 한다.
const weights = new Map(QUESTIONS.map((q) => [q.id, q.options.map((_, i) => (random() + 0.3) / (1 + i * 0.25))]))
// 현업 문항(회사, 연봉, 만족도)의 차트도 시험하려면 현업이 대부분이어야 한다
weights.set('status', [7, 1.5, 1, 0.5, 0.3])

function pick(id: string, codes: string[]): string {
  const w = weights.get(id)?.slice(0, codes.length) ?? codes.map(() => 1)
  let r = random() * w.reduce((a, b) => a + b, 0)
  for (let i = 0; i < codes.length; i++) {
    r -= w[i]
    if (r <= 0) return codes[i]
  }
  return codes[codes.length - 1]
}

function respond(): Answers {
  const answers: Answers = {}
  // 앞 문항의 답에 따라 뒤 문항이 보이므로, 보이는 문항을 다시 계산하며 하나씩 답한다
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i]
    if (!visibleQuestions(QUESTIONS, answers).some((v) => v.id === q.id)) continue
    if (!q.required && random() < 0.25) continue
    const codes = q.options.map((o) => o.code)
    if (q.type === 'single') answers[q.id] = pick(q.id, codes)
    else if (q.type === 'scale') answers[q.id] = String(1 + Math.min(4, Math.floor(random() * 3 + random() * 3)))
    else if (q.type === 'multi') {
      const n = 1 + Math.floor(random() * (q.limit ?? 3))
      answers[q.id] = [...new Set(Array.from({ length: n }, () => pick(q.id, codes)))]
    }
  }
  return answers
}

const responses = Array.from({ length: COUNT }, respond)
await Bun.write(`src/results/${EDITION}.json`, JSON.stringify(aggregate(QUESTIONS, responses, EDITION, true), null, 2) + '\n')
console.log(`예시 응답 ${COUNT}건을 집계해 src/results/${EDITION}.json 에 저장했어요.`)
