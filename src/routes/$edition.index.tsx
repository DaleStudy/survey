import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Heading, Icon, Tag, Text } from 'daleui'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { findEdition, isBeta, isClosed } from '@/editions'
import { koDate } from '@/lib/date'
import { DEV_TYPES } from '@/lib/devType'
import { gradientBorder, gradientText, heroImage, heroWash } from '@/lib/brand'
import { SITE_URL, ogImage } from '@/lib/og'
import { questionsFor } from '@/questions/survey'
import { RESULTS } from '@/results'

const DESCRIPTION = '글로벌 설문조사에서는 잘 보이지 않는 한국 개발자의 일과 커리어를 물어요. 결과를 분석해 누구나 볼 수 있는 인사이트로 공개해요.'

// 회차 페이지. 그 회차의 일정과 주제를 보여 주고 설문이나 결과로 보낸다. 회차가 끝나도 그대로 남는다.
export const Route = createFileRoute('/$edition/')({
  validateSearch: (search: Record<string, unknown>): { ref?: string } =>
    typeof search.ref === 'string' ? { ref: search.ref } : {},
  loader: ({ params }) => {
    const edition = findEdition(params.edition)
    if (!edition) throw notFound()
    return edition
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: loaderData.title },
            { name: 'description', content: DESCRIPTION },
            { property: 'og:title', content: loaderData.title },
            { property: 'og:description', content: DESCRIPTION },
            { property: 'og:url', content: `${SITE_URL}/${loaderData.id}` },
            ...ogImage('default', '여러 세대의 한국 개발자들이 함께 서 있는 그림'),
          ],
        }
      : {},
  component: EditionPage,
})

// 회차 문항 파일의 섹션 id → 아이콘. 달레 UI 에 맞는 아이콘이 들어오면(DaleStudy/survey#1) 바꾼다.
const TOPIC_ICONS: Record<string, React.ComponentProps<typeof Icon>['name']> = {
  about: 'user',
  workplace: 'laptop',
  compensation: 'award',
  career: 'star',
  tech: 'codeXml',
  ai: 'brain',
}

const wrap: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', boxSizing: 'border-box' }

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

function EditionPage() {
  const e = Route.useLoaderData()
  const { ref } = Route.useSearch()
  const open = e.survey && !isClosed(e)
  const result = RESULTS[e.id]
  const questions = questionsFor(e.id) ?? []
  const topics = [...new Map(questions.filter((q) => q.sectionId !== 'closing').map((q) => [q.sectionId, { id: q.sectionId, title: q.section }])).values()]
  const steps = [
    e.opensAt && { label: '시작', date: koDate(e.opensAt), note: '응답을 받기 시작해요' },
    e.closesAt && { label: '마감', date: koDate(e.closesAt), note: '밤 11시 59분까지 받아요' },
    e.resultsAt && { label: '결과 공개', date: koDate(e.resultsAt), note: '누구나 볼 수 있어요' },
  ].filter((step) => !!step)
  const current = open ? 0 : result ? steps.length - 1 : Math.min(1, steps.length - 1)

  const status = result
    ? `${result.total.toLocaleString()}명이 답했어요`
    : open
      ? e.closesAt && `${koDate(e.closesAt)} 마감`
      : e.resultsAt && `${koDate(e.resultsAt)}에 결과를 공개해요`

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <section style={{ position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={heroWash} />
          <div style={{ ...wrap, position: 'relative', padding: '88px 24px 72px', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-48)', alignItems: 'center' }}>
            <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)' }}>
                {e.sample && <Tag tone="warning">예시</Tag>}
                {status && <Tag tone="brand">{status}</Tag>}
              </div>
              <Heading level={1}>
                {/^\d{4}/.test(e.title) ? (
                  <>
                    <span style={gradientText}>{e.title.split(' ')[0]}</span> {e.title.split(' ').slice(1).join(' ')}
                  </>
                ) : (
                  e.title
                )}
              </Heading>
              <Text size="lg" style={{ maxWidth: 520, lineHeight: 1.6 }}>
                {DESCRIPTION}
              </Text>
              {open && (
                <>
                  <Link to="/$edition/survey" params={{ edition: e.id }} search={ref ? { ref } : {}} reloadDocument={isBeta(e)} style={cta}>
                    설문 시작하기
                  </Link>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-20)' }}>
                    <span style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
                      <Icon name="clock" size="sm" /> <Text>10분 안팎</Text>
                    </span>
                    <span style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
                      <Icon name="eyeOff" size="sm" /> <Text>로그인도 이메일도 필요 없어요</Text>
                    </span>
                  </div>
                </>
              )}
              {result && (
                <Link to="/$edition/results" params={{ edition: e.id }} style={cta}>
                  결과 보기
                </Link>
              )}
            </div>
            <img
              src="/types/default.jpg"
              alt=""
              width={1200}
              height={630}
              style={heroImage}
            />
          </div>
        </section>

        {steps.length > 0 && (
          <section aria-labelledby="schedule">
            <div style={{ ...wrap, padding: '72px 24px 0', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
              <Heading level={2} size={3} id="schedule">
                일정
              </Heading>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-16)' }}>
                {steps.map((step, i) => (
                  <li
                    key={step.label}
                    style={{
                      padding: 'var(--spacing-20)',
                      borderRadius: 'var(--radii-md)',
                      ...(i === current ? gradientBorder : { border: '1px solid var(--colors-bg-neutral-hover)', background: 'var(--colors-app-bg)' }),
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--spacing-4)',
                    }}
                  >
                    <Text size="sm" weight="semibold" tone={i === current ? 'brand' : 'neutral'} muted={i !== current}>
                      {i === current ? '지금' : step.label}
                    </Text>
                    <Text size="xl" weight="bold">
                      {step.date}
                    </Text>
                    <Text>{step.note}</Text>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {topics.length > 0 && (
          <section aria-labelledby="topics">
            <div style={{ ...wrap, padding: '72px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                <Heading level={2} size={3} id="topics">
                  무엇을 묻나요
                </Heading>
                <Text style={{ lineHeight: 1.6 }}>
                  {topics.length}가지 주제를 물어요. 지금 상황에 맞는 질문만 나와서 실제로 답할 문항은 {questions.length}개보다 적어요.
                </Text>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-12)' }}>
                {topics.map((t) => {
                  const highlight = t.id === 'ai'
                  return (
                    <li
                      key={t.id}
                      style={{
                        padding: 'var(--spacing-16) var(--spacing-20)',
                        borderRadius: 'var(--radii-md)',
                        background: highlight ? 'var(--colors-bg-solid-brand)' : 'var(--colors-bg-brand)',
                        color: highlight ? 'var(--colors-fg-solid-brand)' : 'inherit',
                        display: 'flex',
                        gap: 'var(--spacing-12)',
                        alignItems: 'center',
                        fontWeight: 600,
                      }}
                    >
                      <Icon name={TOPIC_ICONS[t.id] ?? 'puzzle'} tone={highlight ? undefined : 'brand'} />
                      {t.title}
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        )}
        {e.devTypes && (
          <section aria-labelledby="types" style={{ background: 'var(--colors-bg-brand)' }}>
            <div style={{ ...wrap, padding: '72px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                <Heading level={2} size={3} id="types">
                  끝까지 답하면 나의 개발자 유형을 알려 드려요
                </Heading>
                <Text style={{ lineHeight: 1.6 }}>여섯 가지 유형 가운데 하나와 함께, 2027년 커리어를 내다보는 한 줄도 받아 볼 수 있어요. 친구에게 공유해 보세요.</Text>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--spacing-16)' }}>
                {DEV_TYPES.map((t) => (
                  <li
                    key={t.slug}
                    style={{ overflow: 'hidden', borderRadius: 'var(--radii-md)', background: 'var(--colors-app-bg)', border: '1px solid var(--colors-bg-neutral-hover)' }}
                  >
                    <img src={`/types/${t.slug}.jpg`} alt="" width={1200} height={630} loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} />
                    <Text weight="semibold" style={{ display: 'block', padding: 'var(--spacing-12) var(--spacing-16)' }}>
                      {t.name}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section>
          <div style={{ ...wrap, padding: '48px 24px', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text>이 설문조사를 왜 하는지, 응답을 어떻게 다루는지 궁금하다면</Text>
            <Link to="/" style={{ display: 'inline-flex', gap: 'var(--spacing-4)', alignItems: 'center', fontWeight: 600 }}>
              달레 스터디 개발자 설문조사 소개 보기 <Icon name="chevronRight" size="sm" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
