// 운영 D1 의 원본 응답을 CSV 로 내려받는다. DaleStudy Cloudflare 계정에 wrangler 로그인이 되어 있어야 한다.
// 원본에는 자유 의견, 기타에 직접 적은 내용, 제출 시각이 들어 있다. 공개용 데이터가 아니니 exports/ 밖으로 옮기거나 커밋하지 않는다.
import { mkdir } from 'node:fs/promises'
import { toCsv } from '../src/lib/csv'
import { questionsFor } from '../src/questions/survey'
import { readResponses } from './d1'

// bun run export <회차>  예: bun run export 2026
const EDITION = process.argv[2]
const QUESTIONS = EDITION ? questionsFor(EDITION) : undefined
if (!EDITION || !QUESTIONS || !/^[0-9a-z-]+$/.test(EDITION)) {
  console.error('회차를 알려 주세요. 예: bun run export 2026')
  process.exit(1)
}

const rows = await readResponses(EDITION)

await mkdir('exports', { recursive: true })
const path = `exports/${EDITION}-responses-${new Date().toISOString().slice(0, 10)}.csv`
// 엑셀이 UTF-8 로 읽도록 BOM 을 붙인다
await Bun.write(path, '\uFEFF' + toCsv(QUESTIONS, rows))
console.log(`${rows.length}건을 ${path} 에 저장했어요.`)
