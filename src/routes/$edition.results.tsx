import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Heading, Icon, Tag, Text } from 'daleui'
import { findEdition } from '@/editions'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { RESULTS } from '@/results'
import { MIN_GROUP, type QuestionStat } from '@/results/aggregate'

// 화면은 집계(src/results/<회차>.json)만 읽는다. 원본 응답은 여기로 오지 않는다.
export const Route = createFileRoute('/$edition/results')({
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

function QuestionResult({ q }: { q: QuestionStat }) {
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
        <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
          {q.options.map((o) => (
            <div
              role="listitem"
              key={o.code}
              aria-label={`${o.label} ${percent(o.share)}`}
              style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 220px) minmax(0, 1fr) 48px', gap: 'var(--spacing-12)', alignItems: 'center' }}
            >
              <Text size="sm">{q.type === 'scale' && q.scale ? `${o.label}${o.label === '1' ? ` (${q.scale.min})` : o.label === '5' ? ` (${q.scale.max})` : ''}` : o.label}</Text>
              <div style={{ height: 20, borderRadius: 'var(--radii-sm)', background: 'var(--colors-bg-neutral-hover)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: percent(o.share), background: 'var(--colors-bg-solid-brand)', borderRadius: 'var(--radii-sm)' }} />
              </div>
              <Text size="sm" weight="semibold" style={{ textAlign: 'right' }}>
                {percent(o.share)}
              </Text>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function Results() {
  const { title, result } = Route.useLoaderData()
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
          </section>

          {sections.map((section) => (
            <section key={section} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
              <Heading level={2} size={3}>
                {section}
              </Heading>
              {result.questions
                .filter((q) => q.section === section)
                .map((q) => (
                  <QuestionResult key={q.id} q={q} />
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
