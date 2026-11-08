import { createFileRoute } from '@tanstack/react-router'
import { Button, Heading, Select, Tag, Text } from 'daleui'
import { useState } from 'react'
import { EDITIONS, findEdition, isBeta, isClosed } from '@/editions'
import { answerText } from '@/lib/csv'
import { koDate } from '@/lib/date'
import { OTHER, otherKey } from '@/questions/logic'
import { type Answers, type Question, questionsFor } from '@/questions/survey'
import { type AdminData, PAGE_SIZE } from '@/server/admin'

const SURVEY_EDITIONS = EDITIONS.filter((e) => e.survey)
// 목록에서 응답을 알아보기 쉽게 요약으로 보여 줄 문항
const SUMMARY = ['status', 'experience', 'role']

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
      <div style={container}>
        <Text>{error instanceof Error ? error.message : '응답을 불러오지 못했어요.'}</Text>
        <a href="/admin">다시 불러오기</a>
      </div>
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

// 선택지 code 를 화면에 보이는 문구로 바꾼다. 복수 선택은 쉼표로 잇고, "기타"에 적은 내용을 붙인다.
function answerLabel(q: Question, answers: Answers): string {
  const a = answers[q.id]
  if (a === undefined) return ''
  if (q.type === 'scale') return `${a} / ${q.scale?.max.value ?? 5}`
  if (q.type === 'long') return String(a)
  const label = (code: string) => {
    const text = q.options.find((o) => o.code === code)?.label ?? code
    const other = answers[otherKey(q.id)]
    return code === OTHER && typeof other === 'string' ? `${text}: ${other}` : text
  }
  return Array.isArray(a) ? a.map(label).join(', ') : label(a)
}

const submittedAt = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })

function Admin() {
  const { edition: editionId, page: current, data } = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const edition = findEdition(editionId)
  const questions = questionsFor(editionId) ?? []
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
  const todayCount = data.daily.find((d) => d.date === today)?.count ?? 0
  const daysLeft = edition?.closesAt ? Math.ceil((new Date(edition.closesAt).getTime() - Date.now()) / 86_400_000) : undefined
  const go = (search: { edition: string; page?: number }) => navigate({ search })

  return (
    <main style={page}>
      <div style={container}>
        <header style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-16)', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
              {edition && isBeta(edition) && <Tag tone="warning">베타 응답</Tag>}
              <Text size="sm" muted>
                운영진만 볼 수 있어요
              </Text>
            </div>
            <Heading level={1} size={3}>
              응답 확인
            </Heading>
          </div>
          <div style={{ width: 220 }}>
            <Select label="회차" value={editionId} onChange={(e) => go({ edition: e.target.value })}>
              {SURVEY_EDITIONS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id}
                </option>
              ))}
            </Select>
          </div>
        </header>

        <section aria-label="요약" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-16)' }}>
          <Stat label="총 응답" value={`${data.total.toLocaleString()}건`} />
          <Stat label={`오늘 (${koDate(today)})`} value={`${todayCount.toLocaleString()}건`} brand />
          {edition && daysLeft !== undefined && <Stat label="마감까지" value={isClosed(edition) ? '마감됐어요' : `${daysLeft}일`} />}
        </section>

        <Daily daily={data.daily} />

        <section aria-labelledby="raw-title" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Heading level={2} size={5} id="raw-title">
              원본 응답
            </Heading>
            <Text size="sm" muted>
              최근 응답부터 · 응답을 고르면 모든 답이 보여요
            </Text>
          </div>
          {data.rows.length === 0 ? (
            <Text muted>아직 응답이 없어요.</Text>
          ) : (
            // 페이지나 회차가 바뀌면 고른 응답을 첫 번째로 되돌린다
            <Responses
              key={`${editionId}-${current}`}
              rows={data.rows}
              firstNo={data.total - (current - 1) * PAGE_SIZE}
              questions={questions}
              pager={
                <nav aria-label="페이지" style={pager}>
                  <Button tone="neutral" variant="outline" size="sm" disabled={current <= 1} onClick={() => go({ edition: editionId, page: current - 1 })}>
                    이전
                  </Button>
                  <Text size="sm" muted>
                    {((current - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(current * PAGE_SIZE, data.total).toLocaleString()} /{' '}
                    {data.total.toLocaleString()}
                  </Text>
                  <Button tone="neutral" variant="outline" size="sm" disabled={current >= pages} onClick={() => go({ edition: editionId, page: current + 1 })}>
                    다음
                  </Button>
                </nav>
              }
            />
          )}
        </section>

        <Text size="xs" muted>
          원본 응답은 공개하지 않아요. 이 화면의 데이터는 캐시되지 않아요.
        </Text>
      </div>
    </main>
  )
}

function Stat({ label, value, brand }: { label: string; value: string; brand?: boolean }) {
  return (
    <div style={{ ...panel, padding: 'var(--spacing-20)', gap: 'var(--spacing-8)' }}>
      <Text size="sm" weight="medium" muted>
        {label}
      </Text>
      <span style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums', color: brand ? 'var(--colors-fg-brand)' : undefined }}>
        {value}
      </span>
    </div>
  )
}

function Daily({ daily }: { daily: AdminData['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => d.count))
  return (
    <section aria-labelledby="daily-title" style={{ ...panel, padding: 'var(--spacing-24)', gap: 'var(--spacing-16)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Heading level={2} size={5} id="daily-title">
          날짜별 응답
        </Heading>
        <Text size="sm" muted>
          한국 시간 기준
        </Text>
      </div>
      {daily.length === 0 ? (
        <Text muted>아직 응답이 없어요.</Text>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
          {[...daily].reverse().map((d) => (
            <li key={d.date} style={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr) 64px', gap: 'var(--spacing-12)', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums' }}>{koDate(d.date)}</span>
              <span style={{ height: 12, borderRadius: 'var(--radii-full)', background: 'var(--colors-bg-brand-active)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${(d.count / max) * 100}%`, borderRadius: 'var(--radii-full)', background: 'var(--colors-bg-solid-brand)' }} />
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{d.count.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

// 열이 많아 표로 펼치면 가로로 넘치므로, 목록에서 응답을 고르고 상세에서 문항별로 읽는다
function Responses({ rows, firstNo, questions, pager }: { rows: AdminData['rows']; firstNo: number; questions: Question[]; pager: React.ReactNode }) {
  const [picked, setPicked] = useState(0)
  const selected = rows[picked]
  const summary = SUMMARY.map((id) => questions.find((q) => q.id === id)).filter((q) => q !== undefined)
  const sections = [...new Set(questions.map((q) => q.section))]
    .map((title) => ({ title, items: questions.filter((q) => q.section === title && selected.answers[q.id] !== undefined) }))
    .filter((s) => s.items.length > 0)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-16)', alignItems: 'flex-start' }}>
      <div style={{ ...panel, flex: '1 1 340px', minWidth: 0, maxWidth: 420, overflow: 'hidden' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((row, i) => (
            <li key={`${row.createdAt}-${i}`} style={{ borderBottom: '1px solid var(--colors-bg-neutral-hover)' }}>
              <button type="button" aria-pressed={i === picked} onClick={() => setPicked(i)} style={{ ...rowButton, background: i === picked ? 'var(--colors-bg-brand-active)' : 'var(--colors-app-bg)' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-8)', fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontWeight: 600 }}>#{(firstNo - i).toLocaleString()}</span>
                  <span style={{ color: 'var(--colors-fg-neutral-placeholder)' }}>{submittedAt(row.createdAt)}</span>
                </span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                  {summary.map((q) => {
                    const text = answerLabel(q, row.answers)
                    return text ? (
                      <Tag key={q.id} tone="neutral">
                        {text}
                      </Tag>
                    ) : null
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {pager}
      </div>

      <article aria-labelledby="detail-title" style={{ ...panel, flex: '999 1 520px', minWidth: 0, padding: 'var(--spacing-24)', gap: 'var(--spacing-24)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Heading level={3} size={5} id="detail-title">
            응답 #{(firstNo - picked).toLocaleString()}
          </Heading>
          <Text size="sm" muted>
            {submittedAt(selected.createdAt)} 제출
          </Text>
        </div>
        {sections.map((s) => (
          <section key={s.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
            <Text size="sm" weight="semibold" tone="brand">
              {s.title}
            </Text>
            <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
              {s.items.map((q) => (
                <div key={q.id} style={answerRow}>
                  <dt style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--colors-fg-neutral-placeholder)' }}>{q.label}</dt>
                  <dd style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                    <span style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{answerLabel(q, selected.answers)}</span>
                    {q.type !== 'long' && (
                      <code style={{ fontFamily: 'var(--fonts-mono)', fontSize: '0.75rem', color: 'var(--colors-fg-neutral-placeholder)' }}>
                        {q.id}: {answerText(selected.answers, q.id)}
                      </code>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </article>
    </div>
  )
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  boxSizing: 'border-box',
  padding: 'var(--spacing-40) var(--spacing-24)',
  background: 'var(--colors-app-bg)',
  color: 'var(--colors-fg-neutral)',
}

const container: React.CSSProperties = { maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }

const panel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid var(--colors-border-neutral)',
  borderRadius: 'var(--radii-lg)',
}

const pager: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--spacing-8)',
  padding: 'var(--spacing-12) var(--spacing-16)',
}

// 브라우저 기본 포커스 표시는 남기고 버튼 모양만 지운다
const rowButton: React.CSSProperties = {
  border: 0,
  margin: 0,
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 44,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-8)',
  padding: 'var(--spacing-12) var(--spacing-16)',
}

const answerRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 'var(--spacing-4) var(--spacing-16)',
  paddingBottom: 'var(--spacing-12)',
  borderBottom: '1px solid var(--colors-bg-neutral-hover)',
}
