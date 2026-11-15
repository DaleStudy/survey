// 운영 D1 에서 한 회차의 원본 응답을 읽는다. DaleStudy Cloudflare 계정에 wrangler 로그인이 되어 있어야 한다.
import type { ResponseRow } from '../src/lib/csv'

const ACCOUNT_ID = '94480614a6df7731f1e4491bdac5c440'

export async function readResponses(edition: string): Promise<ResponseRow[]> {
  const proc = Bun.spawn(
    ['bunx', 'wrangler', 'd1', 'execute', 'survey', '--remote', '--json', '--command',
      `SELECT created_at, answers FROM responses WHERE edition = '${edition}' ORDER BY created_at`],
    { env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID }, stdout: 'pipe', stderr: 'inherit' },
  )
  const out = await new Response(proc.stdout).text()
  if ((await proc.exited) !== 0) process.exit(1)

  const results = JSON.parse(out)[0].results as { created_at: string; answers: string }[]
  return results.map((r) => ({ createdAt: r.created_at, answers: JSON.parse(r.answers) }))
}
