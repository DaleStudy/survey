// 운영 D1 의 원본 응답을 집계해 결과 화면이 읽는 src/results/<회차>.json 을 만든다. 이 파일은 커밋해 공개한다.
// 집계에는 자유 의견(long), 기타에 직접 적은 내용(<id>_other), 제출 시각이 들어가지 않는다(aggregate 가 쓰지 않는다).
import { questionsFor } from '../src/questions/survey'
import { aggregate } from '../src/results/aggregate'
import { readResponses } from './d1'

// bun run results <회차>  예: bun run results 2026
const EDITION = process.argv[2]
const QUESTIONS = EDITION ? questionsFor(EDITION) : undefined
if (!EDITION || !QUESTIONS || !/^[0-9a-z-]+$/.test(EDITION)) {
  console.error('회차를 알려 주세요. 예: bun run results 2026')
  process.exit(1)
}

const responses = (await readResponses(EDITION)).map((r) => r.answers)
const path = `src/results/${EDITION}.json`
await Bun.write(path, JSON.stringify(aggregate(QUESTIONS, responses, EDITION, false), null, 2) + '\n')
console.log(`응답 ${responses.length}건을 집계해 ${path} 에 저장했어요.`)
