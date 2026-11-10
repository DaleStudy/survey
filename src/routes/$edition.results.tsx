import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Heading, Icon, Tag, Text } from 'daleui'
import { useEffect, useState } from 'react'
import { findEdition } from '@/editions'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { ResultChart } from '@/components/ResultChart'
import { UpcomingResults } from '@/components/UpcomingResults'
import { sectionIcon } from '@/questions/sectionIcons'
import { RESULTS } from '@/results'
import { type Breakdown, MIN_GROUP, type QuestionStat, type ResultSet } from '@/results/aggregate'
import { displayOptions } from '@/results/order'

// 화면은 집계(src/results/<회차>.json)만 읽는다. 원본 응답은 여기로 오지 않는다.
// 집계가 아직 없으면 공개일과 분석 방법을 알리는 예고 화면을 보여 준다.
export const Route = createFileRoute('/$edition/results')({
  validateSearch: (search: Record<string, unknown>): { by?: string } => (typeof search.by === 'string' ? { by: search.by } : {}),
  loader: ({ params }) => {
    const edition = findEdition(params.edition)
    if (!edition) throw notFound()
    const result = RESULTS[params.edition]
    if (result) return { kind: 'result' as const, title: edition.title, result }
    if (!edition.survey || !edition.resultsAt) throw notFound()
    return { kind: 'upcoming' as const, title: edition.title, edition: { ...edition, resultsAt: edition.resultsAt } }
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `${loaderData.title} 결과` : '결과' }] }),
  component: ResultsPage,
})

function ResultsPage() {
  const data = Route.useLoaderData()
  return data.kind === 'result' ? <Results title={data.title} result={data.result} /> : <UpcomingResults edition={data.edition} />
}

const percent = (share: number) => `${Math.round(share * 100)}%`

function QuestionResult({ q, breakdown }: { q: QuestionStat; breakdown?: Breakdown }) {
  const groups = breakdown?.questions[q.id]
  if (q.hidden) {
    return (
      <article style={{ ...card, flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: '20px 24px', border: 0, background: 'var(--colors-bg-neutral-hover)' }}>
        <Icon name="eyeOff" size="sm" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Heading level={3} size={5} wordBreak="cjk" style={{ fontSize: '1.0625rem', lineHeight: 1.5 }}>
            {q.label}
          </Heading>
          <Text>응답자가 {MIN_GROUP}명보다 적어서 숨겼어요. 누가 답했는지 알아볼 수 없게 하려고요.</Text>
        </div>
      </article>
    )
  }
  return (
    <article style={card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12) var(--spacing-24)', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Heading level={3} size={5} wordBreak="cjk" style={{ lineHeight: 1.4 }}>
            {q.label}
          </Heading>
          <Text size="sm" muted>
            {q.answered.toLocaleString()}명이 답했어요.{q.type === 'multi' ? ' 여러 개 고를 수 있어서 합이 100%를 넘어요.' : ''}
          </Text>
        </div>
        {q.mean !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Text size="sm" weight="semibold" muted>
              평균
            </Text>
            <span style={{ fontSize: '1.875rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--colors-fg-brand)', fontVariantNumeric: 'tabular-nums' }}>
              {q.mean.toFixed(1)}
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--colors-fg-neutral-placeholder)' }}> / 5</span>
            </span>
          </div>
        )}
      </div>
      {q.type === 'long' ? (
        <Text>자유 의견은 이름이나 회사명처럼 특정인을 알아볼 수 있는 정보를 지운 뒤 따로 정리해요.</Text>
      ) : (
        <>
          <ResultChart q={q} breakdown={breakdown} />
          <details style={{ paddingTop: 14, borderTop: '1px solid var(--colors-bg-neutral-hover)' }}>
            <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>표로 보기</summary>
            <table style={{ marginTop: 'var(--spacing-8)', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th scope="col" style={cell}>
                    선택지
                  </th>
                  {groups ? (
                    groups.map((g) => (
                      <th key={g.group} scope="col" style={cell}>
                        {breakdown?.groups.find((x) => x.code === g.group)?.label}
                      </th>
                    ))
                  ) : (
                    <th scope="col" style={cell}>
                      비율
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* 차트와 같은 순서 */}
                {displayOptions(q).map((o) => (
                  <tr key={o.code}>
                    <th scope="row" style={{ ...cell, fontWeight: 400 }}>
                      {o.label}
                    </th>
                    {groups ? (
                      groups.map((g) => (
                        <td key={g.group} style={cell}>
                          {g.hidden ? '숨김' : percent(g.shares[o.code] ?? 0)}
                        </td>
                      ))
                    ) : (
                      <td style={cell}>
                        {percent(o.share)} ({o.count.toLocaleString()}명)
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </article>
  )
}

const card: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-20)',
  padding: 'clamp(16px, 4vw, 28px)',
  borderRadius: 'var(--radii-lg)',
  border: '1px solid var(--colors-bg-neutral-hover)',
}

const cell: React.CSSProperties = {
  padding: 'var(--spacing-4) var(--spacing-12)',
  borderBottom: '1px solid var(--colors-bg-neutral-hover)',
  textAlign: 'left',
}

// 집단별 보기 선택. 주소(?by=)에 남겨 그 상태 그대로 공유할 수 있게 한다.
function BreakdownPicker({ breakdowns, active }: { breakdowns: Breakdown[]; active?: string }) {
  const options = [{ id: undefined, label: '전체' }, ...breakdowns.map((b) => ({ id: b.id, label: b.label }))]
  return (
    <nav aria-label="집단별로 보기" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)', alignItems: 'center' }}>
      <Text size="sm" weight="bold">
        나눠 보기
      </Text>
      <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 'var(--spacing-4)', padding: 'var(--spacing-4)', borderRadius: 12, background: 'var(--colors-bg-neutral-hover)' }}>
        {options.map((o) => {
          const on = o.id === active
          return (
            <Link
              key={o.label}
              from="/$edition/results"
              search={o.id ? { by: o.id } : {}}
              replace
              resetScroll={false}
              aria-current={on ? 'true' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 36,
                padding: '0 var(--spacing-16)',
                borderRadius: 'var(--radii-md)',
                background: on ? 'var(--colors-app-bg)' : 'transparent',
                boxShadow: on ? '0 1px 2px rgb(0 0 0 / 0.12)' : undefined,
                color: on ? 'var(--colors-fg-brand)' : 'inherit',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: on ? 700 : 500,
              }}
            >
              {o.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// 목차에서 지금 보고 있는 주제. 화면 위쪽에 걸친 섹션을 고른다.
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top) setActive(top.target.id)
      },
      { rootMargin: '-120px 0px -60% 0px' },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [ids.join()])
  return active
}

// 목차는 넓은 화면에서만 왼쪽에 둔다. 좁으면 본문만 남긴다.
const RESULTS_CSS = `
.r-toc { flex: 1 1 200px; max-width: 240px; position: sticky; top: 88px; display: flex; flex-direction: column; gap: 2px; }
.r-toc a { display: flex; justify-content: space-between; align-items: center; min-height: 40px; padding: 0 12px; border-radius: var(--radii-md); color: inherit; text-decoration: none; }
.r-toc a:hover { background: var(--colors-bg-neutral-hover); }
.r-toc a[aria-current='true'] { background: var(--colors-bg-brand-hover); color: var(--colors-fg-brand); font-weight: 700; }
@media (max-width: 860px) { .r-toc { display: none; } }
`

function Results({ title, result }: { title: string; result: ResultSet }) {
  const { by } = Route.useSearch()
  const breakdown = result.breakdowns.find((b) => b.id === by)
  const sections = [...new Map(result.questions.map((q) => [q.sectionId, q.section]))]
  const active = useActiveSection([...sections.map(([id]) => id), 'method'])
  const count = (id: string) => result.questions.filter((q) => q.sectionId === id).length
  const wrap: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <style>{RESULTS_CSS}</style>
      {result.sample && (
        <div
          role="note"
          style={{
            padding: 'var(--spacing-12) var(--spacing-24)',
            background: 'var(--colors-bg-solid-warning)',
            color: 'var(--colors-fg-solid-warning)',
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          예시 데이터예요. 결과 화면을 시험하려고 만든 가짜 응답으로, 실제 설문 결과가 아니에요.
        </div>
      )}
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <section style={{ ...wrap, paddingTop: 56, paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)', alignItems: 'flex-start' }}>
          <Link to="/results" style={{ display: 'inline-flex', gap: 'var(--spacing-4)', alignItems: 'center', minHeight: 32, color: 'inherit', fontWeight: 500, textDecoration: 'none' }}>
            <Icon name="chevronLeft" size="sm" /> 모든 회차 결과
          </Link>
          <Heading level={1} wordBreak="cjk" style={{ fontSize: 'clamp(2rem, 2.5vw + 1.25rem, 3rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {title} 결과
          </Heading>
          <dl style={{ margin: 'var(--spacing-8) 0 0', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)' }}>
            <Figure label="응답자" value={`${result.total.toLocaleString()}명`} brand />
            <Figure label="문항" value={`${result.questions.length}개`} />
            <Figure label="주제" value={`${sections.length}가지`} />
          </dl>
        </section>

        <div style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--colors-app-bg)', borderTop: rule, borderBottom: rule }}>
          <div style={{ ...wrap, paddingTop: 'var(--spacing-12)', paddingBottom: 'var(--spacing-12)', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)', alignItems: 'center', justifyContent: 'space-between' }}>
            <BreakdownPicker breakdowns={result.breakdowns} active={breakdown?.id} />
            {result.sample && <Tag tone="warning">예시 데이터</Tag>}
          </div>
        </div>

        <div style={{ ...wrap, paddingTop: 48, paddingBottom: 96, display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>
          <nav aria-label="주제" className="r-toc">
            <Text size="sm" weight="bold" muted style={{ padding: '0 12px 8px' }}>
              주제
            </Text>
            {sections.map(([id, section]) => (
              <a key={id} href={`#${id}`} aria-current={active === id ? 'true' : undefined}>
                {section}
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--colors-fg-neutral-placeholder)' }}>{count(id)}</span>
              </a>
            ))}
            <a href="#method" aria-current={active === 'method' ? 'true' : undefined} style={{ marginTop: 8, borderTop: rule, borderRadius: 0, fontSize: 14 }}>
              어떻게 조사했나요
            </a>
          </nav>

          <div style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 56 }}>
            {sections.map(([sectionId, section]) => (
              <section key={sectionId} id={sectionId} aria-labelledby={`${sectionId}-title`} style={{ scrollMarginTop: 88, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-12)', alignItems: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      width: 40,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      background: 'var(--colors-bg-brand-hover)',
                    }}
                  >
                    <Icon name={sectionIcon(sectionId)} size="sm" tone="brand" />
                  </span>
                  <Heading level={2} size={3} id={`${sectionId}-title`}>
                    {section}
                  </Heading>
                </div>
                {result.questions
                  .filter((q) => q.sectionId === sectionId)
                  .map((q) => (
                    <QuestionResult key={q.id} q={q} breakdown={breakdown} />
                  ))}
              </section>
            ))}

            <section
              id="method"
              aria-labelledby="method-title"
              style={{
                scrollMarginTop: 88,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: 28,
                borderRadius: 'var(--radii-lg)',
                background: 'var(--colors-bg-brand)',
                border: '1px solid var(--colors-bg-brand-active)',
              }}
            >
              <Heading level={2} size={5} id="method-title">
                어떻게 조사했나요
              </Heading>
              <Text style={{ lineHeight: 1.75 }}>
                온라인 익명 설문이에요. 이름, 이메일, 로그인 정보는 수집하지 않았고 만 14세 이상만 참여했어요. 응답자가 {MIN_GROUP}명보다 적은 문항은
                숨겼어요. 스스로 참여한 분들의 답이라서 한국 개발자 전체를 그대로 대표하지는 않아요.
              </Text>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

const rule = '1px solid var(--colors-bg-neutral-hover)'

function Figure({ label, value, brand }: { label: string; value: string; brand?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 140,
        padding: '16px 20px',
        borderRadius: 12,
        background: brand ? 'var(--colors-bg-brand)' : undefined,
        border: `1px solid ${brand ? 'var(--colors-bg-brand-active)' : 'var(--colors-bg-neutral-hover)'}`,
      }}
    >
      <dt style={{ fontSize: 14, fontWeight: 600, color: 'var(--colors-fg-neutral-placeholder)' }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: brand ? 'var(--colors-fg-brand)' : 'var(--colors-fg-neutral-active)' }}>
        {value}
      </dd>
    </div>
  )
}
