import { createFileRoute } from '@tanstack/react-router'
import { Button, Heading, Text } from 'daleui'
import { useRef, useState } from 'react'
import { AdminError, STACKED } from '@/components/Admin'
import { EDITIONS } from '@/editions'
import { adminFetch } from '@/lib/adminFetch'
import { answerText } from '@/lib/csv'
import { OTHER, otherKey } from '@/questions/logic'
import { type Answers, type Question, questionsFor } from '@/questions/survey'
import { type AdminResponses, PAGE_SIZE } from '@/server/admin'

// 목록에서 응답을 알아보기 쉽게 요약으로 보여 줄 문항
const SUMMARY = ['status', 'experience', 'role']

// 원본 응답을 한 건씩 읽는다. 페이지를 넘겨도 부모(/admin)의 요약은 다시 받지 않는다.
export const Route = createFileRoute('/admin/raw')({
  validateSearch: (search: Record<string, unknown>): { page?: number } => ({
    page: Number.isInteger(search.page) && Number(search.page) > 1 ? Number(search.page) : undefined,
  }),
  loaderDeps: ({ search }) => ({ edition: search.edition ?? EDITIONS.filter((e) => e.survey)[0].id, page: search.page ?? 1 }),
  loader: async ({ deps }) => ({ ...deps, data: await adminFetch<AdminResponses>('responses', { edition: deps.edition, page: String(deps.page) }) }),
  component: Raw,
  errorComponent: AdminError,
})

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

function Raw() {
  const { edition, page: current, data } = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
  const go = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) })

  if (data.rows.length === 0) return <Text muted>아직 응답이 없어요.</Text>
  return (
    <section aria-label="원본 응답" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <Text size="sm" muted>
        최근 응답부터 · 응답을 고르면 모든 답이 보여요
      </Text>
      {/* 페이지나 회차가 바뀌면 고른 응답을 첫 번째로 되돌린다 */}
      <Responses
        key={`${edition}-${current}`}
        rows={data.rows}
        firstNo={data.total - (current - 1) * PAGE_SIZE}
        questions={questionsFor(edition) ?? []}
        pager={
          <nav aria-label="페이지" style={pager}>
            <Button tone="neutral" variant="outline" size="sm" disabled={current <= 1} onClick={() => go(current - 1)}>
              이전
            </Button>
            <Text size="sm" muted>
              {((current - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(current * PAGE_SIZE, data.total).toLocaleString()} / {data.total.toLocaleString()}
            </Text>
            <Button tone="neutral" variant="outline" size="sm" disabled={current >= pages} onClick={() => go(current + 1)}>
              다음
            </Button>
          </nav>
        }
      />
    </section>
  )
}

// 열이 많아 표로 펼치면 가로로 넘치므로, 목록에서 응답을 고르고 상세에서 문항별로 읽는다.
// 좁은 화면에서는 둘이 위아래로 쌓이므로, 고르면 상세로 내려가고 "목록으로"로 돌아온다.
function Responses({ rows, firstNo, questions, pager }: { rows: AdminResponses['rows']; firstNo: number; questions: Question[]; pager: React.ReactNode }) {
  const [picked, setPicked] = useState(0)
  const detail = useRef<HTMLElement>(null)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const selected = rows[picked]
  const summary = SUMMARY.map((id) => questions.find((q) => q.id === id)).filter((q) => q !== undefined)
  const sections = [...new Set(questions.map((q) => q.section))]
    .map((title) => ({ title, items: questions.filter((q) => q.section === title && selected.answers[q.id] !== undefined) }))
    .filter((s) => s.items.length > 0)

  const pick = (i: number) => {
    setPicked(i)
    if (window.matchMedia(STACKED).matches) detail.current?.scrollIntoView({ block: 'start' })
  }
  const backToList = () => {
    items.current[picked]?.scrollIntoView({ block: 'center' })
    items.current[picked]?.focus()
  }

  return (
    <div className="admin-raw">
      <div className="admin-panel" style={{ overflow: 'hidden' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((row, i) => (
            <li key={`${row.createdAt}-${i}`} style={{ borderBottom: '1px solid var(--colors-bg-neutral-hover)' }}>
              <button
                ref={(el) => {
                  items.current[i] = el
                }}
                type="button"
                className="admin-row"
                aria-pressed={i === picked}
                onClick={() => pick(i)}
                // 선택 배경은 회색 요약 글자와 4.5:1 이 나오는 가장 진한 브랜드 면이다. 색 차이가 작아 테두리로 함께 보인다.
                style={{ ...rowButton, ...(i === picked ? { background: 'var(--colors-bg-brand)', boxShadow: 'inset 0 0 0 1px var(--colors-border-brand)' } : {}) }}
              >
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-8)', fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontWeight: 600, color: i === picked ? 'var(--colors-fg-brand)' : undefined }}>#{(firstNo - i).toLocaleString()}</span>
                  <span style={{ color: 'var(--colors-fg-neutral-placeholder)' }}>{submittedAt(row.createdAt)}</span>
                </span>
                <span style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--colors-fg-neutral-placeholder)' }}>
                  {summary
                    .map((q) => answerLabel(q, row.answers))
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {pager}
      </div>

      <article ref={detail} aria-labelledby="detail-title" className="admin-panel" style={{ padding: 'var(--spacing-24)', gap: 'var(--spacing-24)', scrollMarginTop: 'var(--spacing-16)' }}>
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
        <div className="admin-back">
          <Button tone="neutral" variant="outline" size="sm" onClick={backToList}>
            목록으로
          </Button>
        </div>
      </article>
    </div>
  )
}

const pager: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--spacing-8)',
  padding: 'var(--spacing-12) var(--spacing-16)',
}

// 브라우저 기본 포커스 표시 대신 .admin-row:focus-visible 을 쓰고, 버튼 모양만 지운다
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
  gap: 'var(--spacing-4)',
  padding: 'var(--spacing-12) var(--spacing-16)',
  background: 'var(--colors-app-bg)',
}

const answerRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 'var(--spacing-4) var(--spacing-16)',
  paddingBottom: 'var(--spacing-12)',
  borderBottom: '1px solid var(--colors-bg-neutral-hover)',
}
