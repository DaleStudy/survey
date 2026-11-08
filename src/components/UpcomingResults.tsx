import { Link } from '@tanstack/react-router'
import { Heading, Icon, Tag, Text } from 'daleui'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { type Edition, isClosed } from '@/editions'
import { koDate } from '@/lib/date'
import { sectionIcon } from '@/questions/sectionIcons'
import { questionsFor } from '@/questions/survey'
import { BREAKDOWNS } from '@/results/aggregate'

const cta: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 52,
  padding: '0 var(--spacing-24)',
  borderRadius: 'var(--radii-md)',
  background: 'var(--colors-bg-solid-brand)',
  color: 'var(--colors-fg-solid-brand)',
  fontSize: '1.125rem',
  fontWeight: 500,
  textDecoration: 'none',
}

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
      icon: 'chartBar',
      title: '문항마다 비율로 정리해요',
      body: '마감 뒤 응답을 모아 선택지별 비율과 척도 평균을 계산해요. 공개되는 건 이 집계뿐이고, 원본 응답은 공개하지 않아요.',
    },
    {
      icon: 'users',
      title: '집단별로 나눠 봐요',
      body: `${BREAKDOWNS.map((b) => `${b.label}(${b.groups.map((g) => g.label).join('·')})`).join(', ')}로 나눠 같은 문항의 답을 비교할 수 있어요.`,
    },
    {
      icon: 'messageCircle',
      title: '자유 의견은 따로 정리해요',
      body: '차트로 보여 주지 않아요. 이름이나 회사명처럼 특정인을 알아볼 수 있는 정보를 먼저 지워요.',
    },
  ] as const

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '72px 24px 96px', display: 'flex', flexDirection: 'column', gap: 64 }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)', alignItems: 'flex-start' }}>
            <Tag tone="brand">{koDate(e.resultsAt)} 공개</Tag>
            <Heading level={1}>{e.title} 결과</Heading>
            <Text size="lg" style={{ maxWidth: 640, lineHeight: 1.6 }}>
              {open
                ? `지금 응답을 모으고 있어요. 마감 뒤 분석을 거쳐 ${koDate(e.resultsAt)}에 누구나 볼 수 있게 공개해요.`
                : `응답을 마감하고 분석하고 있어요. ${koDate(e.resultsAt)}에 누구나 볼 수 있게 공개해요.`}
            </Text>
            {open && (
              <Link to="/$edition" params={{ edition: e.id }} style={cta}>
                설문 참여하기
              </Link>
            )}
          </section>

          <section aria-labelledby="method" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
            <Heading level={2} size={3} id="method">
              어떻게 분석하나요
            </Heading>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--spacing-16)' }}>
              {method.map((m) => (
                <li
                  key={m.title}
                  style={{
                    padding: 'var(--spacing-20)',
                    borderRadius: 'var(--radii-md)',
                    border: '1px solid var(--colors-bg-neutral-hover)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-8)',
                  }}
                >
                  <Icon name={m.icon} tone="brand" />
                  <Text weight="semibold">{m.title}</Text>
                  <Text size="sm" style={{ lineHeight: 1.6 }}>
                    {m.body}
                  </Text>
                </li>
              ))}
            </ul>
          </section>

          {sections.length > 0 && (
            <section aria-labelledby="coverage" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                <Heading level={2} size={3} id="coverage">
                  무엇을 공개하나요
                </Heading>
                <Text style={{ lineHeight: 1.6 }}>설문에서 물은 주제를 모두 공개해요.</Text>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-12)' }}>
                {sections.map(([id, s]) => (
                  <li
                    key={id}
                    style={{
                      padding: 'var(--spacing-16) var(--spacing-20)',
                      borderRadius: 'var(--radii-md)',
                      background: 'var(--colors-bg-brand)',
                      display: 'flex',
                      gap: 'var(--spacing-12)',
                      alignItems: 'center',
                    }}
                  >
                    <Icon name={sectionIcon(id)} tone="brand" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text weight="semibold">{s.title}</Text>
                      <Text size="sm" muted>
                        {s.count}문항
                      </Text>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
            <Heading level={2} size={5}>
              읽을 때 알아 두세요
            </Heading>
            <Text style={{ lineHeight: 1.7 }}>
              스스로 참여한 분들의 답이라서 한국 개발자 전체를 그대로 대표하지는 않아요. 결과 화면에는 문항마다 몇 명이 답했는지 함께 적어요.
            </Text>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
