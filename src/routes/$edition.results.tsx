import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Heading, Icon, Tag, Text } from 'daleui'
import { findEdition } from '@/editions'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { ResultChart } from '@/components/ResultChart'
import { RESULTS } from '@/results'
import { type Breakdown, MIN_GROUP, type QuestionStat } from '@/results/aggregate'

// 화면은 집계(src/results/<회차>.json)만 읽는다. 원본 응답은 여기로 오지 않는다.
export const Route = createFileRoute('/$edition/results')({
  validateSearch: (search: Record<string, unknown>): { by?: string } => (typeof search.by === 'string' ? { by: search.by } : {}),
  loader: ({ params }) => {
    const edition = findEdition(params.edition)
    const result = RESULTS[params.edition]
    if (!edition || !result) throw notFound()
    return { title: edition.title, result }
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `${loaderData.title} 결과` : '결과' }] }),
  component: Results,
})

const percent = (share: number) => `${Math.round(share * 100)}%`

function QuestionResult({ q, breakdown }: { q: QuestionStat; breakdown?: Breakdown }) {
  const groups = breakdown?.questions[q.id]
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        <Heading level={3} size={5}>
          {q.label}
        </Heading>
        <Text size="sm" muted>
          {q.answered.toLocaleString()}명이 답했어요.{q.type === 'multi' ? ' 여러 개 고를 수 있어서 합이 100%를 넘어요.' : ''}
          {q.mean !== undefined ? ` 평균 ${q.mean.toFixed(1)}점이에요.` : ''}
        </Text>
      </div>
      {q.hidden ? (
        <div style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
          <Icon name="eyeOff" size="sm" />
          <Text size="sm">응답자가 {MIN_GROUP}명보다 적어서 숨겼어요. 누가 답했는지 알아볼 수 없게 하려고요.</Text>
        </div>
      ) : q.type === 'long' ? (
        <Text size="sm">자유 의견은 이름이나 회사처럼 누군지 알 수 있는 내용을 지운 뒤 따로 정리해요.</Text>
      ) : (
        <>
          <ResultChart q={q} breakdown={breakdown} />
          <details>
            <summary style={{ cursor: 'pointer', fontSize: 14 }}>표로 보기</summary>
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
                {q.options.map((o) => (
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

const cell: React.CSSProperties = {
  padding: 'var(--spacing-4) var(--spacing-12)',
  borderBottom: '1px solid var(--colors-bg-neutral-hover)',
  textAlign: 'left',
}

// 집단별 보기 선택. 주소(?by=)에 남겨 그 상태 그대로 공유할 수 있게 한다.
function BreakdownPicker({ breakdowns, active }: { breakdowns: Breakdown[]; active?: string }) {
  const options = [{ id: undefined, label: '전체' }, ...breakdowns.map((b) => ({ id: b.id, label: b.label }))]
  return (
    <nav aria-label="집단별로 보기" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)', alignItems: 'center' }}>
      <Text size="sm" weight="semibold">
        나눠 보기
      </Text>
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
              padding: 'var(--spacing-8) var(--spacing-16)',
              borderRadius: 'var(--radii-full)',
              border: `1px solid ${on ? 'var(--colors-bg-solid-brand)' : 'var(--colors-border-neutral)'}`,
              background: on ? 'var(--colors-bg-solid-brand)' : 'var(--colors-app-bg)',
              color: on ? 'var(--colors-fg-solid-brand)' : 'inherit',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {o.label}
          </Link>
        )
      })}
    </nav>
  )
}

function Results() {
  const { title, result } = Route.useLoaderData()
  const { by } = Route.useSearch()
  const breakdown = result.breakdowns.find((b) => b.id === by)
  const sections = [...new Set(result.questions.map((q) => q.section))]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        {result.sample && (
          <div
            role="note"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
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
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '72px 24px 96px', display: 'flex', flexDirection: 'column', gap: 64 }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)', alignItems: 'flex-start' }}>
            <Link to="/results">← 모든 회차 결과</Link>
            {result.sample && <Tag tone="warning">예시</Tag>}
            <Heading level={1}>{title} 결과</Heading>
            <Text size="xl">{result.total.toLocaleString()}명이 답해 주셨어요.</Text>
            <BreakdownPicker breakdowns={result.breakdowns} active={breakdown?.id} />
          </section>

          {sections.map((section) => (
            <section key={section} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
              <Heading level={2} size={3}>
                {section}
              </Heading>
              {result.questions
                .filter((q) => q.section === section)
                .map((q) => (
                  <QuestionResult key={q.id} q={q} breakdown={breakdown} />
                ))}
            </section>
          ))}

          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
            <Heading level={2} size={5}>
              어떻게 조사했나요
            </Heading>
            <Text style={{ lineHeight: 1.7 }}>
              온라인 익명 설문이에요. 이름, 이메일, 로그인은 받지 않았고 만 14세 이상만 참여했어요. 응답자가 {MIN_GROUP}명보다 적은 문항은
              숨겼어요. 스스로 참여한 분들의 답이라서 한국 개발자 전체를 그대로 대표하지는 않아요.
            </Text>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
