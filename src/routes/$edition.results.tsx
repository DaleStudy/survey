import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Heading, Icon, Tag, Text } from 'daleui'
import { useEffect, useMemo, useRef, useState } from 'react'
import { findEdition } from '@/editions'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { ComparisonResult, QuestionResult } from '@/components/ResultCards'
import { UpcomingResults } from '@/components/UpcomingResults'
import { sectionIcon } from '@/questions/sectionIcons'
import { RESULTS } from '@/results'
import { type Breakdown, MIN_GROUP, type ResultSet } from '@/results/aggregate'
import { comparisonViews } from '@/results/comparisons'

// 화면은 집계(src/results/<회차>.json)만 읽는다. 원본 응답은 여기로 오지 않는다.
// 집계가 아직 없으면 공개일과 분석 방법을 알리는 예고 화면을 보여 준다.
export const Route = createFileRoute('/$edition/results')({
  validateSearch: (search: Record<string, unknown>): { by?: string } => (typeof search.by === 'string' ? { by: search.by } : {}),
  loader: async ({ params }) => {
    const edition = findEdition(params.edition)
    if (!edition) throw notFound()
    const entry = RESULTS[params.edition]
    if (entry) return { kind: 'result' as const, title: edition.title, result: await entry.load() }
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


// 집단별 보기 선택. 주소(?by=)에 남겨 그 상태 그대로 공유할 수 있게 한다.
function BreakdownPicker({ breakdowns, active }: { breakdowns: Breakdown[]; active?: string }) {
  const options = [{ id: undefined, label: '전체' }, ...breakdowns.map((b) => ({ id: b.id, label: b.label }))]
  // 옆으로 넘기는 좁은 화면에서 고른 기준이 가려지지 않게 그 버튼까지 넘겨 둔다. 페이지는 움직이지 않는다.
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const on = strip.current?.querySelector<HTMLElement>('[data-on]')
    if (strip.current && on) strip.current.scrollLeft = on.offsetLeft - strip.current.offsetLeft - 8
  }, [active])
  return (
    <nav aria-label="집단별로 보기" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)', alignItems: 'center', minWidth: 0, maxWidth: '100%' }}>
      <Text size="sm" weight="bold">
        나눠 보기
      </Text>
      {/* 기준이 많아서 좁은 화면에서는 줄을 바꾸지 않고 옆으로 넘긴다. 줄을 바꾸면 위에 붙는 막대가 화면을 너무 많이 가린다. */}
      <div
        ref={strip}
        style={{
          display: 'inline-flex',
          maxWidth: '100%',
          overflowX: 'auto',
          // 끝 버튼이 잘려 보이는 것으로 더 있다는 것을 알 수 있어서 스크롤 막대는 숨긴다
          scrollbarWidth: 'none',
          gap: 'var(--spacing-4)',
          padding: 'var(--spacing-4)',
          borderRadius: 12,
          background: 'var(--colors-bg-neutral-hover)',
        }}
      >
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
              data-on={on || undefined}
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
                whiteSpace: 'nowrap',
                flexShrink: 0,
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
  const comparisons = useMemo(() => comparisonViews(result), [result])
  const active = useActiveSection([...sections.map(([id]) => id), ...(comparisons.length ? ['compare'] : []), 'method'])
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
            {comparisons.length > 0 && (
              <a href="#compare" aria-current={active === 'compare' ? 'true' : undefined}>
                문항 비교
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--colors-fg-neutral-placeholder)' }}>{comparisons.length}</span>
              </a>
            )}
            <a href="#method" aria-current={active === 'method' ? 'true' : undefined} style={{ marginTop: 8, borderTop: rule, borderRadius: 0, fontSize: 14 }}>
              어떻게 조사했나요
            </a>
          </nav>

          <div style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 56 }}>
            {breakdown?.note && (
              <div role="note" style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center', padding: '12px 16px', borderRadius: 'var(--radii-md)', background: 'var(--colors-bg-neutral-hover)' }}>
                <Icon name="info" size="sm" />
                <Text size="sm">{breakdown.note}</Text>
              </div>
            )}
            {sections.map(([sectionId, section]) => (
              <section key={sectionId} id={sectionId} aria-labelledby={`${sectionId}-title`} style={{ scrollMarginTop: 88, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)' }}>
                <SectionTitle id={`${sectionId}-title`} icon={sectionIcon(sectionId)}>
                  {section}
                </SectionTitle>
                {result.questions
                  .filter((q) => q.sectionId === sectionId)
                  .map((q) => (
                    <QuestionResult key={q.id} q={q} breakdown={breakdown} edition={result.edition} />
                  ))}
              </section>
            ))}

            {comparisons.length > 0 && (
              <section id="compare" aria-labelledby="compare-title" style={{ scrollMarginTop: 88, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)' }}>
                <SectionTitle id="compare-title" icon="chartBar">
                  문항 비교
                </SectionTitle>
                {comparisons.map((view) => (
                  <ComparisonResult key={view.comparison.id} view={view} breakdown={breakdown} edition={result.edition} />
                ))}
              </section>
            )}

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

function SectionTitle({ id, icon, children }: { id: string; icon: React.ComponentProps<typeof Icon>['name']; children: React.ReactNode }) {
  return (
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
        <Icon name={icon} size="sm" tone="brand" />
      </span>
      <Heading level={2} size={3} id={id}>
        {children}
      </Heading>
    </div>
  )
}

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
