// 운영 D1 의 원본 응답을 CSV 로 내려받는다. DaleStudy Cloudflare 계정에 wrangler 로그인이 되어 있어야 한다.
// 원본에는 자유 의견, 기타에 직접 적은 내용, 제출 시각이 들어 있다. 공개용 데이터가 아니니 exports/ 밖으로 옮기거나 커밋하지 않는다.
import { mkdir } from 'node:fs/promises'
import { toCsv, type ResponseRow } from '../src/lib/csv'
import { questionsFor } from '../src/questions/survey'

const ACCOUNT_ID = '94480614a6df7731f1e4491bdac5c440'
// bun run export <회차>  예: bun run export 2026
const EDITION = process.argv[2]
const QUESTIONS = EDITION ? questionsFor(EDITION) : undefined
if (!EDITION || !QUESTIONS || !/^[0-9a-z-]+$/.test(EDITION)) {
  console.error('회차를 알려 주세요. 예: bun run export 2026')
  process.exit(1)
}

const proc = Bun.spawn(
  ['bunx', 'wrangler', 'd1', 'execute', 'survey', '--remote', '--json', '--command',
    `SELECT created_at, ref, answers FROM responses WHERE edition = '${EDITION}' ORDER BY created_at`],
  { env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID }, stdout: 'pipe', stderr: 'inherit' },
)
const out = await new Response(proc.stdout).text()
if ((await proc.exited) !== 0) process.exit(1)

const results = JSON.parse(out)[0].results as { created_at: string; ref: string | null; answers: string }[]
const rows: ResponseRow[] = results.map((r) => ({ createdAt: r.created_at, ref: r.ref, answers: JSON.parse(r.answers) }))

await mkdir('exports', { recursive: true })
const path = `exports/${EDITION}-responses-${new Date().toISOString().slice(0, 10)}.csv`
// 엑셀이 UTF-8 로 읽도록 BOM 을 붙인다
await Bun.write(path, '\uFEFF' + toCsv(QUESTIONS, rows))
console.log(`${rows.length}건을 ${path} 에 저장했어요.`)
