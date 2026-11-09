import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Heading, Icon, Tag, Text } from 'daleui'
import { DevTypeGrid } from '@/components/DevTypeGrid'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { findEdition, isBeta, isClosed } from '@/editions'
import { koDate } from '@/lib/date'
import { ctaLink, eyebrow, gradientText, heroFrame, heroImage, heroTitle } from '@/lib/brand'
import { SITE_URL, ogImage } from '@/lib/og'
import { sectionIcon } from '@/questions/sectionIcons'
import { questionsFor } from '@/questions/survey'
import { RESULTS } from '@/results'

const DESCRIPTION = '글로벌 설문조사에서는 잘 보이지 않는 한국 개발자의 일과 커리어를 묻고, 결과를 분석해 누구나 볼 수 있는 인사이트로 공유해요.'

// 회차 페이지. 그 회차의 일정과 주제를 보여 주고 설문이나 결과로 보낸다. 회차가 끝나도 그대로 남는다.
export const Route = createFileRoute('/$edition/')({
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
            ...ogImage('/types/default.jpg', '여러 세대의 한국 개발자들이 함께 서 있는 그림'),
          ],
        }
      : {},
  component: EditionPage,
})

const wrap: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', boxSizing: 'border-box' }
const rule = '1px solid var(--colors-bg-neutral-hover)'
const brandRule = '1px solid var(--colors-bg-brand-active)'
const sectionHeading: React.CSSProperties = { fontSize: 'clamp(1.625rem, 1.5vw + 1rem, 1.875rem)', fontWeight: 800, letterSpacing: '-0.025em' }

// 올해의 주제. 주제 목록에서 큰 칸으로 떼어 낸다.
const FEATURED = 'ai'

function EditionPage() {
  const e = Route.useLoaderData()
  const open = e.survey && !isClosed(e)
  const result = RESULTS[e.id]
  const questions = questionsFor(e.id) ?? []
  const topics = [...new Map(questions.filter((q) => q.sectionId !== 'closing').map((q) => [q.sectionId, { id: q.sectionId, title: q.section }])).values()]
  const featured = topics.find((t) => t.id === FEATURED)
  const steps = [
    e.opensAt && { label: '시작', date: koDate(e.opensAt), note: '응답을 받기 시작해요' },
    e.closesAt && { label: '마감', date: koDate(e.closesAt), note: '밤 11시 59분까지 받아요' },
    e.resultsAt && { label: '결과 공개', date: koDate(e.resultsAt), note: '누구나 볼 수 있어요' },
  ].filter((step) => !!step)
  const current = open ? 0 : result ? steps.length - 1 : Math.min(1, steps.length - 1)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <section style={{ ...wrap, padding: '72px 24px 80px', display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center' }}>
          <div style={{ flex: '1 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)' }}>
              {e.sample && <Tag tone="warning">예시</Tag>}
              {result ? (
                <Tag tone="brand">{result.total.toLocaleString()}명이 답했어요</Tag>
              ) : open ? (
                <>
                  <Tag tone="success">응답 받는 중</Tag>
                  {e.closesAt && <Tag tone="neutral">{koDate(e.closesAt)} 마감</Tag>}
                </>
              ) : (
                e.resultsAt && <Tag tone="brand">{koDate(e.resultsAt)}에 결과를 공개해요</Tag>
              )}
            </div>
            <Heading level={1} wordBreak="cjk" style={{ ...heroTitle, fontSize: 'clamp(2.125rem, 3.5vw + 1rem, 3.25rem)' }}>
              {/^\d{4}/.test(e.title) ? (
                <>
                  <span style={gradientText}>{e.title.split(' ')[0]}</span> {e.title.split(' ').slice(1).join(' ')}
                </>
              ) : (
                e.title
              )}
            </Heading>
            <Text size="lg" style={{ maxWidth: 520, lineHeight: 1.7 }}>
              {DESCRIPTION}
            </Text>
            {open && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
                <Link to="/$edition/survey" params={{ edition: e.id }} reloadDocument={isBeta(e)} style={ctaLink}>
                  설문 시작하기 <Icon name="chevronRight" size="sm" />
                </Link>
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-8) var(--spacing-24)',
                    fontSize: '0.9375rem',
                    color: 'var(--colors-fg-neutral-placeholder)',
                  }}
                >
                  <li style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Icon name="clock" size="sm" />
                    10분 안팎
                  </li>
                  <li style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Icon name="eyeOff" size="sm" />
                    로그인도 이메일도 필요 없어요
                  </li>
                </ul>
              </div>
            )}
            {result && (
              <Link to="/$edition/results" params={{ edition: e.id }} style={ctaLink}>
                결과 보기 <Icon name="chevronRight" size="sm" />
              </Link>
            )}
          </div>
          <figure style={heroFrame}>
            <img src="/types/default.jpg" alt="" width={1200} height={630} style={heroImage} />
          </figure>
        </section>

        {steps.length > 0 && (
          <section aria-labelledby="schedule" style={{ borderTop: rule }}>
            <div style={{ ...wrap, padding: '72px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12) var(--spacing-24)', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Heading level={2} id="schedule" style={sectionHeading}>
                  일정
                </Heading>
                {!result && e.resultsAt && (
                  <Link
                    to="/$edition/results"
                    params={{ edition: e.id }}
                    style={{ display: 'inline-flex', gap: 'var(--spacing-4)', alignItems: 'center', minHeight: 44, fontWeight: 600, textDecoration: 'none' }}
                  >
                    결과를 어떻게 분석하나요 <Icon name="chevronRight" size="sm" tone="brand" />
                  </Link>
                )}
              </div>
              <ol
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                  rowGap: 'var(--spacing-32)',
                }}
              >
                {steps.map((step, i) => {
                  const done = i <= current
                  const last = i === steps.length - 1
                  return (
                    <li key={step.label} aria-current={i === current ? 'step' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingRight: last ? 0 : 'var(--spacing-24)' }}>
                      <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
                        <span
                          style={{
                            flex: 'none',
                            width: 20,
                            height: 20,
                            boxSizing: 'border-box',
                            borderRadius: 'var(--radii-full)',
                            ...(done
                              ? { background: 'var(--colors-bg-solid-brand)', boxShadow: i === current ? '0 0 0 6px var(--colors-bg-brand-active)' : undefined }
                              : { border: '2px solid var(--colors-border-neutral-active)', background: 'var(--colors-app-bg)' }),
                          }}
                        />
                        {!last && (
                          <span style={{ flex: 1, height: 2, marginLeft: 'var(--spacing-12)', background: i < current ? 'var(--colors-bg-solid-brand)' : 'var(--colors-bg-neutral-hover)' }} />
                        )}
                      </div>
                      <Text size="sm" weight="bold" tone={i === current ? 'brand' : 'neutral'} muted={i !== current}>
                        {i === current ? `${step.label} · 지금` : step.label}
                      </Text>
                      <span style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--colors-fg-neutral-active)' }}>{step.date}</span>
                      <Text>{step.note}</Text>
                    </li>
                  )
                })}
              </ol>
            </div>
          </section>
        )}

        {topics.length > 0 && (
          <section aria-labelledby="topics" style={{ borderTop: rule }}>
            <div style={{ ...wrap, padding: '72px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Heading level={2} id="topics" style={sectionHeading}>
                  무엇을 묻나요
                </Heading>
                <Text size="lg" style={{ lineHeight: 1.7 }}>
                  {topics.length}가지 주제를 물어요. 본인 상황에 맞는 질문만 나와서 10분 안팎이면 끝나요.
                </Text>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
                {featured && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--spacing-20)',
                      alignItems: 'center',
                      padding: 'var(--spacing-24) 28px',
                      borderRadius: 'var(--radii-lg)',
                      background: 'var(--colors-bg-solid-brand)',
                      color: 'var(--colors-fg-solid-brand)',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        width: 56,
                        height: 56,
                        flex: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 14,
                        background: 'rgb(255 255 255 / 0.16)',
                      }}
                    >
                      <Icon name={sectionIcon(featured.id)} size="lg" />
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, opacity: 0.85 }}>올해의 주제</span>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>{featured.title.replace(/^올해의 주제\s*/, '')}</span>
                    </div>
                  </div>
                )}
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                    gap: 'var(--spacing-12)',
                  }}
                >
                  {topics
                    .filter((t) => t.id !== FEATURED)
                    .map((t) => (
                      <li
                        key={t.id}
                        style={{
                          display: 'flex',
                          gap: 14,
                          alignItems: 'center',
                          minHeight: 72,
                          padding: '0 var(--spacing-20)',
                          borderRadius: 12,
                          border: rule,
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          color: 'var(--colors-fg-neutral-active)',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            width: 40,
                            height: 40,
                            flex: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 10,
                            background: 'var(--colors-bg-brand-hover)',
                          }}
                        >
                          <Icon name={sectionIcon(t.id)} size="sm" tone="brand" />
                        </span>
                        {t.title}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {e.devTypes && (
          <section aria-labelledby="types" style={{ background: 'var(--colors-bg-brand)', borderTop: brandRule, borderBottom: brandRule }}>
            <div style={{ ...wrap, padding: '80px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
                <p style={eyebrow}>끝까지 답하면</p>
                <Heading level={2} wordBreak="cjk" id="types" style={sectionHeading}>
                  나의 개발자 유형을 알려 드려요
                </Heading>
                <Text size="lg" style={{ lineHeight: 1.7 }}>
                  여섯 가지 유형 가운데 하나와 함께, 2027년 커리어를 내다보는 한 줄도 받아 볼 수 있어요. 친구에게 공유해 보세요.
                </Text>
              </div>
              <DevTypeGrid />
            </div>
          </section>
        )}

        <section>
          <div style={{ ...wrap, padding: '48px 24px', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12) var(--spacing-24)', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text>이 설문조사를 왜 하는지, 응답을 어떻게 다루는지 궁금하다면</Text>
            <Link to="/" style={{ display: 'inline-flex', gap: 'var(--spacing-4)', alignItems: 'center', minHeight: 44, fontWeight: 600, textDecoration: 'none' }}>
              달레 스터디 개발자 설문조사 소개 보기 <Icon name="chevronRight" size="sm" tone="brand" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
