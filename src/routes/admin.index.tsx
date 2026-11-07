import { Link, createFileRoute } from '@tanstack/react-router'
import { Heading, Text } from 'daleui'
import { EDITIONS } from '@/editions'
import { answerColumns, answerText } from '@/lib/csv'
import { questionsFor } from '@/questions/survey'
import { type AdminData, PAGE_SIZE } from '@/server/admin'

const SURVEY_EDITIONS = EDITIONS.filter((e) => e.survey)

// 운영자가 응답을 확인하는 읽기 전용 화면(#10). Cloudflare Access 가 /admin 을 잠그고, 데이터는 /admin/api 가 토큰을 다시 확인한 뒤 준다.
// 서버에서 그리지 않아서(ssr: false) 페이지 HTML 에는 응답이 들어가지 않는다.
export const Route = createFileRoute('/admin/')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { edition?: string; page?: number } => ({
    edition: typeof search.edition === 'string' ? search.edition : undefined,
    page: Number.isInteger(search.page) && Number(search.page) > 1 ? Number(search.page) : undefined,
  }),
  loaderDeps: ({ search }) => ({ edition: search.edition ?? SURVEY_EDITIONS[0].id, page: search.page ?? 1 }),
  loader: ({ deps }) => loadAdmin(deps.edition, deps.page),
  head: () => ({ meta: [{ title: '응답 확인' }, { name: 'robots', content: 'noindex' }] }),
  component: Admin,
  errorComponent: ({ error }) => (
    <main style={page}>
      <Text>{error instanceof Error ? error.message : '응답을 불러오지 못했어요.'}</Text>
      <a href="/admin">다시 불러오기</a>
    </main>
  ),
})

async function loadAdmin(edition: string, page: number) {
  // Access 세션이 끝나면 로그인 화면으로 보내는 응답이 오는데, fetch 가 따라가지 않게 해서 알아챈다
  const r = await fetch(`/admin/api?${new URLSearchParams({ edition, page: String(page) })}`, { redirect: 'manual' })
  if (r.type === 'opaqueredirect') throw new Error('로그인이 끝났어요. 다시 불러와 주세요.')
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? '응답을 불러오지 못했어요.')
  return { edition, page, data: (await r.json()) as AdminData }
}

function Admin() {
  const { edition, page: current, data } = Route.useLoaderData()
  const questions = questionsFor(edition) ?? []
  const columns = answerColumns(questions)
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  return (
    <main style={page}>
      <nav aria-label="회차" style={{ display: 'flex', gap: 'var(--spacing-12)' }}>
        {SURVEY_EDITIONS.map((e) => (
          <Link key={e.id} to="/admin" search={{ edition: e.id }} aria-current={e.id === edition ? 'page' : undefined}>
            {e.id}
          </Link>
        ))}
      </nav>
      <Heading level={1} size={3}>
        {edition} 응답 {data.total.toLocaleString()}건
      </Heading>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-32)', alignItems: 'flex-start' }}>
        <CountTable title="날짜별" label="날짜" rows={data.daily.map((d) => [d.date, d.count])} />
        <CountTable title="ref별" label="ref" rows={data.refs.map((r) => [r.ref ?? '(없음)', r.count])} />
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
        <Heading level={2} size={5}>
          원본 응답
        </Heading>
        <Text size="sm" muted>
          최근 응답부터 보여 줘요. 값은 선택지 code 이고, 복수 선택은 ; 로 이었어요. 문항 id 에 마우스를 올리면 문항이 보여요.
        </Text>
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={cell}>제출 시각</th>
                <th style={cell}>ref</th>
                {columns.map((key) => (
                  <th key={key} style={cell} title={questions.find((q) => q.id === key)?.label}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={`${row.createdAt}-${i}`}>
                  <td style={cell}>{new Date(row.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
                  <td style={cell}>{row.ref ?? ''}</td>
                  {columns.map((key) => (
                    <td key={key} style={cell}>
                      {answerText(row.answers, key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <nav aria-label="페이지" style={{ display: 'flex', gap: 'var(--spacing-16)', alignItems: 'center' }}>
          {current > 1 && (
            <Link to="/admin" search={{ edition, page: current - 1 }}>
              ← 이전
            </Link>
          )}
          <Text size="sm">
            {current} / {pages}
          </Text>
          {current < pages && (
            <Link to="/admin" search={{ edition, page: current + 1 }}>
              다음 →
            </Link>
          )}
        </nav>
      </section>
    </main>
  )
}

function CountTable({ title, label, rows }: { title: string; label: string; rows: [string, number][] }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
      <Heading level={2} size={5}>
        {title}
      </Heading>
      <table style={table}>
        <thead>
          <tr>
            <th style={cell}>{label}</th>
            <th style={cell}>응답</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, n]) => (
            <tr key={key}>
              <td style={cell}>{key}</td>
              <td style={{ ...cell, textAlign: 'right' }}>{n.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  padding: '48px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-24)',
  background: 'var(--colors-app-bg)',
  color: 'var(--colors-fg-neutral)',
}

const table: React.CSSProperties = { borderCollapse: 'collapse', fontSize: 13 }

const cell: React.CSSProperties = {
  padding: 'var(--spacing-4) var(--spacing-12)',
  borderBottom: '1px solid var(--colors-bg-neutral-hover)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
}
