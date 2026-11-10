import { Link, createFileRoute } from '@tanstack/react-router'
import { Heading, Icon, Text } from 'daleui'
import { EditionList } from '@/components/EditionList'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { openEditions } from '@/editions'
import { koDate } from '@/lib/date'
import { ctaLink, eyebrow, gradientBanner, gradientText, heroFrame, heroImage, heroTitle, sectionTitle } from '@/lib/brand'
import { ogImage } from '@/lib/og'

const TITLE = '달레 스터디 개발자 설문조사'
const DESCRIPTION =
  '개발자 커뮤니티 달레 스터디가 진행해요. 글로벌 설문조사에서는 잘 보이지 않는 한국 개발자의 일과 커리어를 묻고, 결과를 분석해 누구나 볼 수 있는 인사이트로 공유해요.'

// 회차와 상관없는 소개 페이지. 회차마다 바뀌는 일정과 주제는 회차 페이지(/$edition)에 둔다.
export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:url', content: 'https://survey.dalestudy.com/' },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'ko_KR' },
      { property: 'og:site_name', content: '달레 스터디 개발자 설문조사' },
      ...ogImage('/types/home.jpg', '개발자들이 모여 화이트보드에 응답을 붙여 그래프를 만드는 그림'),
    ],
  }),
  component: Landing,
})

type IconName = React.ComponentProps<typeof Icon>['name']

const wrap: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }
const section: React.CSSProperties = { ...wrap, padding: '96px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-48)' }
const rule = '1px solid var(--colors-bg-neutral-hover)'
const brandRule = '1px solid var(--colors-bg-brand-active)'

const REASONS = [
  {
    title: '국내 개발자 설문조사는 명맥이 끊겼어요',
    body: '2023년 이후로 국내 개발자만을 대상으로 꾸준히 하는 설문조사가 없어요. 그래서 국내 기술이나 업계 동향을 파악하기가 어려워졌어요.',
  },
  {
    title: '한국 소프트웨어 개발 현실에 맞는 질문을 해요',
    body: 'SI와 SM, 원청과 하청 구조, 파견 근무, 신입 공채, 원화 연봉처럼 글로벌 설문조사에서는 묻지 않는 것들이에요.',
  },
]

const PROMISES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'eyeOff', title: '익명으로 답해요', body: '이름, 이메일, 로그인 정보를 수집하지 않아요. 연봉처럼 답하기 망설여지는 질문은 건너뛰어도 돼요.' },
  { icon: 'globe', title: '결과는 모두 공개해요', body: '응답이 마감되면 결과를 누구나 볼 수 있게 공개하고, 분석한 인사이트도 함께 나눠요.' },
  { icon: 'heartHandshake', title: '통계에만 써요', body: '집계된 응답은 분석과 통계를 내는 데만 쓰고, 영리 목적으로는 쓰지 않아요.' },
]

// Stack Overflow 2025 설문조사 응답자 가운데 한국 개발자
const KOREA = 86
const GLOBAL = 49_009

function Landing() {
  // 지금 응답을 받는 회차. 없으면 결과로 안내한다.
  const open = openEditions()[0]
  const share = KOREA / GLOBAL
  return (
    <div style={{ background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <SiteHeader />

      <section style={{ ...wrap, padding: '80px 24px 96px', display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center' }}>
        <div style={{ flex: '1 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'flex-start' }}>
          {open?.opensAt && (
            <Link
              to="/$edition"
              params={{ edition: open.id }}
              style={{
                display: 'inline-flex',
                gap: 'var(--spacing-8)',
                alignItems: 'center',
                padding: '6px 14px 6px 6px',
                borderRadius: 'var(--radii-full)',
                background: 'var(--colors-bg-brand)',
                border: brandRule,
                color: 'var(--colors-fg-neutral)',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radii-full)',
                  background: 'var(--colors-bg-solid-brand)',
                  color: 'var(--colors-fg-solid-brand)',
                  fontWeight: 600,
                }}
              >
                {open.id}
              </span>
              {koDate(open.opensAt)}부터 응답을 받아요
              <Icon name="chevronRight" size="sm" tone="brand" />
            </Link>
          )}
          <Heading level={1} wordBreak="cjk" style={heroTitle}>
            한국 개발자의 <span style={gradientText}>오늘</span>을
            <br />
            함께 기록해요
          </Heading>
          <Text size="lg" style={{ maxWidth: 520, fontSize: '1.1875rem', lineHeight: 1.65 }}>
            한국 개발자가 어떻게 일하고 성장하는지, 그 이야기를 함께 모아요. 응답 하나하나가 모여 국내 개발 생태계를 읽는 인사이트가 돼요.
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)', alignItems: 'center' }}>
            {open ? (
              <Link to="/$edition" params={{ edition: open.id }} style={ctaLink}>
                {open.title.replace(' 달레 스터디 개발자 설문조사', ' 설문조사')} 참여하기 <Icon name="chevronRight" size="sm" />
              </Link>
            ) : (
              <Link to="/results" style={ctaLink}>
                결과 보기
              </Link>
            )}
            <a href="#why" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 56, padding: '0 20px', color: 'inherit', fontSize: '1.0625rem', fontWeight: 500, textDecoration: 'none' }}>
              왜 하나요?
            </a>
          </div>
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
            <Fact icon="clock">10분 안팎</Fact>
            <Fact icon="eyeOff">로그인·이메일 없이 익명</Fact>
            <Fact icon="globe">결과는 모두 공개</Fact>
          </ul>
        </div>
        <figure style={heroFrame}>
          <img src="/types/home.jpg" alt="" width={1200} height={630} style={heroImage} />
        </figure>
      </section>

      <section id="why" aria-labelledby="why-title" style={{ borderTop: rule }}>
        <div style={section}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)', maxWidth: 720 }}>
            <p style={eyebrow}>왜 하나요</p>
            <Heading level={2} wordBreak="cjk" id="why-title" style={sectionTitle}>
              글로벌 설문조사 속 한국은 너무 작아요
            </Heading>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 'var(--spacing-48)', alignItems: 'start' }}>
            {/* 패널은 테마와 상관없이 짙은 바탕이라 글자색도 고정한다 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-20)',
                padding: 36,
                borderRadius: 'var(--radii-lg)',
                background: '#363c43',
                color: '#f4f6f7',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#cad3d7' }}>Stack Overflow 2025 설문조사 응답자</p>
              <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 'var(--spacing-12)' }}>
                <span style={{ fontSize: '5.5rem', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff' }}>
                  {KOREA}
                  <span style={{ fontSize: '2.5rem' }}>명</span>
                </span>
                <span style={{ fontSize: '1.25rem', color: '#cad3d7' }}>/ {GLOBAL.toLocaleString()}명</span>
              </p>
              <div role="img" aria-label={`전체 응답자 가운데 한국 개발자는 ${(share * 100).toFixed(1)}%`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                <div style={{ height: 12, borderRadius: 'var(--radii-full)', background: '#5d727d', overflow: 'hidden' }}>
                  {/* 실제 비율로는 보이지 않을 만큼 가늘어서 최소 폭을 둔다 */}
                  <div style={{ width: `${share * 100}%`, minWidth: 6, height: 12, borderRadius: 'var(--radii-full)', background: '#24eaca' }} />
                </div>
                <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#cad3d7' }}>
                  <b style={{ color: '#24eaca' }}>한국 {(share * 100).toFixed(1)}%</b>
                  <span>전체 응답자</span>
                </div>
              </div>
            </div>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
              {REASONS.map((r, i) => (
                <li
                  key={r.title}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px minmax(0, 1fr)',
                    gap: 'var(--spacing-16)',
                    ...(i > 0 && { marginTop: 32, paddingTop: 32, borderTop: rule }),
                  }}
                >
                  <span aria-hidden="true" style={{ paddingTop: 4, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--colors-fg-brand)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                    <Heading level={3} size={4} wordBreak="cjk" style={{ lineHeight: 1.4 }}>
                      {r.title}
                    </Heading>
                    <Text size="lg" style={{ lineHeight: 1.7 }}>
                      {r.body}
                    </Text>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="promise" aria-labelledby="promise-title" style={{ background: 'var(--colors-bg-brand)', borderTop: brandRule, borderBottom: brandRule }}>
        <div style={section}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)', maxWidth: 720 }}>
            <p style={eyebrow}>약속</p>
            <Heading level={2} wordBreak="cjk" id="promise-title" style={sectionTitle}>
              커뮤니티 설문조사라서 안심할 수 있어요
            </Heading>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--spacing-20)' }}>
            {PROMISES.map((p) => (
              <li
                key={p.title}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-16)',
                  padding: 28,
                  borderRadius: 'var(--radii-lg)',
                  background: 'var(--colors-app-bg)',
                  border: brandRule,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    width: 48,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    background: 'var(--colors-bg-brand-active)',
                  }}
                >
                  <Icon name={p.icon} tone="brand" />
                </span>
                <Heading level={3} size={5} wordBreak="cjk">
                  {p.title}
                </Heading>
                <Text style={{ lineHeight: 1.7 }}>{p.body}</Text>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="results" aria-labelledby="results-title">
        <div style={{ ...section, gap: 'var(--spacing-32)' }}>
          <Heading level={2} size={3} wordBreak="cjk" id="results-title">
            지금까지의 설문조사
          </Heading>
          <EditionList />
        </div>
      </section>

      {open && (
        <section style={{ padding: '0 24px 96px' }}>
          <div
            style={{
              maxWidth: 1072,
              margin: '0 auto',
              padding: 'clamp(32px, 5vw, 56px)',
              boxSizing: 'border-box',
              borderRadius: 24,
              background: gradientBanner,
              color: '#ffffff',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--spacing-24)',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 600 }}>
              <h2 style={{ ...sectionTitle, fontSize: 'clamp(1.625rem, 2vw + 0.75rem, 2.125rem)', color: 'inherit' }}>10분이면 참여할 수 있어요</h2>
              <p style={{ margin: 0, fontSize: '1.125rem', lineHeight: 1.6 }}>주변 개발자에게도 알려 주세요. 다양한 사람이 답할수록 결과가 더 의미 있어져요.</p>
            </div>
            <Link to="/$edition" params={{ edition: open.id }} style={{ ...ctaLink, background: '#ffffff', color: '#32228d', fontWeight: 700 }}>
              참여하기
            </Link>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  )
}

function Fact({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <Icon name={icon} size="sm" />
      {children}
    </li>
  )
}
