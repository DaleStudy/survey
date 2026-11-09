import { Link } from '@tanstack/react-router'
import { Heading, Icon, Tag, Text } from 'daleui'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { type Edition, isClosed } from '@/editions'
import { ctaLink } from '@/lib/brand'
import { koDate } from '@/lib/date'
import { sectionIcon } from '@/questions/sectionIcons'
import { questionsFor } from '@/questions/survey'
import { BREAKDOWNS } from '@/results/aggregate'

const wrap: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }
const sectionHeading: React.CSSProperties = { fontSize: 'clamp(1.625rem, 1.5vw + 1rem, 1.875rem)', fontWeight: 800, letterSpacing: '-0.025em' }
const brandRule = '1px solid var(--colors-bg-brand-active)'

// 결과 공개 전의 결과 화면. 언제 무엇이 공개되는지와 응답을 어떻게 분석하는지 알린다.
// 집계 규칙(BREAKDOWNS)을 그대로 읽어서 실제 결과 화면과 설명이 어긋나지 않는다.
export function UpcomingResults({ edition: e }: { edition: Edition & { resultsAt: string } }) {
  const open = !isClosed(e)
  const sections = [
    ...(questionsFor(e.id) ?? [])
      .reduce((m, q) => m.set(q.sectionId, { title: q.section, count: (m.get(q.sectionId)?.count ?? 0) + 1 }), new Map<string, { title: string; count: number }>())
      .entries(),
  ]
  const method = [
    {
      title: '문항마다 비율로 정리해요',
      body: '마감 뒤 응답을 모아 선택지별 비율과 척도 평균을 계산해요. 공개되는 건 이 집계뿐이고, 원본 응답은 공개하지 않아요.',
    },
    {
      title: '집단별로 나눠 봐요',
      body: `${BREAKDOWNS.map((b) => `${b.label}(${b.groups.map((g) => g.label).join('·')})`).join(', ')}로 나눠 같은 문항의 답을 비교할 수 있어요.`,
    },
    {
      title: '자유 의견은 따로 정리해요',
      body: '차트로 보여 주지 않아요. 이름이나 회사명처럼 특정인을 알아볼 수 있는 정보를 먼저 지워요.',
    },
  ]
  const stages = [
    { label: '응답 받는 중', date: e.opensAt && `${koDate(e.opensAt)} 시작` },
    { label: '마감', date: e.closesAt && koDate(e.closesAt) },
    { label: '결과 공개', date: koDate(e.resultsAt) },
  ]
  const now = open ? 0 : 1

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <section style={{ ...wrap, paddingTop: 64, paddingBottom: 56, display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center' }}>
          <div style={{ flex: '1 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)', alignItems: 'flex-start' }}>
            <Tag tone="brand">{koDate(e.resultsAt)} 공개</Tag>
            <Heading level={1} wordBreak="cjk" style={{ fontSize: 'clamp(2rem, 2.5vw + 1.25rem, 3rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              {e.title} 결과
            </Heading>
            <Text size="lg" style={{ maxWidth: 600, lineHeight: 1.7 }}>
              {open
                ? `지금 응답을 모으고 있어요. 마감 뒤 분석을 거쳐 ${koDate(e.resultsAt)}에 누구나 볼 수 있게 공개해요.`
                : `응답을 마감하고 분석하고 있어요. ${koDate(e.resultsAt)}에 누구나 볼 수 있게 공개해요.`}
            </Text>
            {open && (
              <Link to="/$edition" params={{ edition: e.id }} style={ctaLink}>
                설문 참여하기 <Icon name="chevronRight" size="sm" />
              </Link>
            )}
          </div>
          <ol
            aria-label="공개까지"
            style={{
              flex: '1 1 340px',
              minWidth: 0,
              listStyle: 'none',
              margin: 0,
              padding: 28,
              borderRadius: 20,
              background: 'var(--colors-bg-brand)',
              border: brandRule,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-20)',
            }}
          >
            {stages.map((s, i) => (
              <li key={s.label} aria-current={i === now ? 'step' : undefined} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0, 1fr)', gap: 14 }}>
                <span
                  aria-hidden="true"
                  style={{
                    marginTop: 4,
                    width: 14,
                    height: 14,
                    boxSizing: 'border-box',
                    borderRadius: 'var(--radii-full)',
                    ...(i <= now
                      ? { background: 'var(--colors-bg-solid-brand)', boxShadow: i === now ? '0 0 0 5px var(--colors-bg-brand-active)' : undefined }
                      : { border: '2px solid var(--colors-border-neutral-active)' }),
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Text weight="bold" tone={i === now ? 'brand' : 'neutral'}>
                    {i === now ? `${s.label} · 지금` : s.label}
                  </Text>
                  {s.date && <Text>{s.date}</Text>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="method" style={{ borderTop: '1px solid var(--colors-bg-neutral-hover)' }}>
          <div style={{ ...wrap, paddingTop: 64, paddingBottom: 64, display: 'flex', flexDirection: 'column', gap: 28 }}>
            <Heading level={2} id="method" style={sectionHeading}>
              어떻게 분석하나요
            </Heading>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 'var(--spacing-16)' }}>
              {method.map((m, i) => (
                <li
                  key={m.title}
                  style={{
                    padding: 'var(--spacing-24)',
                    borderRadius: 'var(--radii-lg)',
                    border: '1px solid var(--colors-bg-neutral-hover)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-12)',
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: 14, fontWeight: 700, color: 'var(--colors-fg-brand)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Heading level={3} size={5} wordBreak="cjk" style={{ fontSize: '1.125rem' }}>
                    {m.title}
                  </Heading>
                  <Text style={{ lineHeight: 1.7 }}>{m.body}</Text>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {sections.length > 0 && (
          <section aria-labelledby="coverage" style={{ background: 'var(--colors-bg-brand)', borderTop: brandRule, borderBottom: brandRule }}>
            <div style={{ ...wrap, paddingTop: 64, paddingBottom: 64, display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Heading level={2} id="coverage" style={sectionHeading}>
                  무엇을 공개하나요
                </Heading>
                <Text size="lg">설문에서 물은 주제를 모두 공개해요.</Text>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 'var(--spacing-12)' }}>
                {sections.map(([id, s]) => (
                  <li
                    key={id}
                    style={{
                      padding: '18px var(--spacing-20)',
                      borderRadius: 12,
                      background: 'var(--colors-app-bg)',
                      border: brandRule,
                      display: 'flex',
                      gap: 14,
                      alignItems: 'center',
                    }}
                  >
                    <Icon name={sectionIcon(id)} tone="brand" />
                    <Text weight="bold" style={{ flex: 1 }}>
                      {s.title}
                    </Text>
                    <Text size="sm" muted>
                      {s.count}문항
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section>
          <div style={{ ...wrap, paddingTop: 48, paddingBottom: 64, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Icon name="info" size="sm" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 720 }}>
              <Heading level={2} size={5}>
                읽을 때 알아 두세요
              </Heading>
              <Text style={{ lineHeight: 1.75 }}>
                스스로 참여한 분들의 답이라서 한국 개발자 전체를 그대로 대표하지는 않아요. 결과 화면에는 문항마다 몇 명이 답했는지 함께 적어요.
              </Text>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
