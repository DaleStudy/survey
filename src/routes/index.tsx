import { Link, createFileRoute } from '@tanstack/react-router'
import { Card, Heading, Text } from 'daleui'
import { EditionList } from '@/components/EditionList'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { openEditions } from '@/editions'
import { gradientBanner, gradientText, heroImage, heroWash } from '@/lib/brand'
import { ogImage } from '@/lib/og'

const TITLE = '달레 스터디 개발자 설문조사'
const DESCRIPTION =
  '개발자 커뮤니티 달레 스터디가 진행해요. 글로벌 설문조사에서는 잘 보이지 않는 한국 개발자의 일과 커리어에 대해 질문해요. 결과를 분석해 누구나 볼 수 있는 인사이트로 공유해요.'

// 회차와 상관없는 소개 페이지. 회차마다 바뀌는 일정과 주제는 회차 페이지(/$edition)에 둔다.
export const Route = createFileRoute('/')({
  // 공유 링크의 ?ref= 를 설문 링크로 넘겨 유입 경로를 남긴다
  validateSearch: (search: Record<string, unknown>): { ref?: string } =>
    typeof search.ref === 'string' ? { ref: search.ref } : {},
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
      ...ogImage('home', '개발자들이 모여 화이트보드에 응답을 붙여 그래프를 만드는 그림'),
    ],
  }),
  component: Landing,
})

const wrap: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }
const section: React.CSSProperties = { ...wrap, padding: '96px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-40)' }
const cta: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 52,
  padding: '0 var(--spacing-24)',
  borderRadius: 'var(--radii-md)',
  background: 'var(--colors-bg-solid-brand)',
  color: 'var(--colors-fg-solid-brand)',
  fontSize: '1.125rem',
  fontWeight: 500,
  textDecoration: 'none',
}

function Landing() {
  const { ref } = Route.useSearch()
  // 지금 응답을 받는 회차. 없으면 결과로 안내한다.
  const open = openEditions()[0]
  return (
    <div style={{ background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <SiteHeader />

      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={heroWash} />
        <div style={{ ...wrap, position: 'relative', padding: '88px 24px 72px', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-48)', alignItems: 'center' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)', alignItems: 'flex-start' }}>
          <Heading level={1} style={{ maxWidth: 820 }}>
            한국 개발자의 <span style={gradientText}>오늘</span>을 함께 기록해요
          </Heading>
          <Text size="lg" style={{ maxWidth: 560, lineHeight: 1.6 }}>
            한국 개발자가 어떻게 일하고 성장하는지, 그 이야기를 함께 모아요. 응답 하나하나가 모여 국내 개발 생태계를 읽는 인사이트가 돼요.
          </Text>
          {open ? (
            <Link to="/$edition" params={{ edition: open.id }} search={ref ? { ref } : {}} style={cta}>
              {open.title.replace(' 달레 스터디 개발자 설문조사', ' 설문조사')} 참여하기
            </Link>
          ) : (
            <Link to="/results" style={cta}>
              결과 보기
            </Link>
          )}
          </div>
          <img
            src="/types/home.jpg"
            alt=""
            width={1200}
            height={630}
            style={heroImage}
          />
        </div>
      </section>

      <section id="why">
        <div style={section}>
          <Heading level={2}>글로벌 설문조사 속 한국은 너무 작아요</Heading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-32)', alignItems: 'start' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-8)',
                padding: 'var(--spacing-32)',
                borderRadius: 'var(--radii-lg)',
                background: gradientBanner,
                color: '#ffffff',
              }}
            >
              <div style={{ fontSize: '4.5rem', fontWeight: 700, lineHeight: 1 }}>86명</div>
              <div style={{ fontSize: '1.125rem', lineHeight: 1.5 }}>
                Stack Overflow 2025 설문조사 응답자 49,009명 가운데 한국 개발자 수예요. 0.2%밖에 안 돼요.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                <Heading level={3} size={4}>
                  국내 개발자 설문조사는 명맥이 끊겼어요
                </Heading>
                <Text size="lg" style={{ lineHeight: 1.6 }}>
                  2023년 이후로 국내 개발자만을 대상으로 꾸준히 하는 설문조사가 없어요. 그래서 국내 기술이나 업계 동향을 파악하기가 어려워졌어요.
                </Text>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                <Heading level={3} size={4}>
                  한국 소프트웨어 개발 현실에 맞는 질문을 해요
                </Heading>
                <Text size="lg" style={{ lineHeight: 1.6 }}>
                  SI와 SM, 원청과 하청 구조, 파견 근무, 신입 공채, 원화 연봉처럼 글로벌 설문조사에서는 묻지 않는 것들이에요.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="promise" style={{ background: 'var(--colors-bg-neutral-hover)' }}>
        <div style={section}>
          <Heading level={2}>커뮤니티 설문조사라서 안심할 수 있어요</Heading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-24)' }}>
            <Card tone="neutral" outline>
              <Card.Icon name="eyeOff" />
              <Card.Body>
                <Card.Title>익명으로 답해요</Card.Title>
                <Card.Description>
                  이름, 이메일, 로그인 정보를 수집하지 않아요. 연봉처럼 답하기 망설여지는 질문은 건너뛰어도 돼요.
                </Card.Description>
              </Card.Body>
            </Card>
            <Card tone="neutral" outline>
              <Card.Icon name="handHeart" />
              <Card.Body>
                <Card.Title>결과는 모두 공개해요</Card.Title>
                <Card.Description>
                  응답이 마감되면 결과를 누구나 볼 수 있게 공개하고, 분석한 인사이트도 함께 나눠요.
                </Card.Description>
              </Card.Body>
            </Card>
            <Card tone="neutral" outline>
              <Card.Icon name="heartHandshake" />
              <Card.Body>
                <Card.Title>통계에만 써요</Card.Title>
                <Card.Description>
                  집계된 응답은 분석과 통계를 내는 데만 쓰고, 영리 목적으로는 쓰지 않아요.
                </Card.Description>
              </Card.Body>
            </Card>
          </div>
        </div>
      </section>

      <section id="results">
        <div style={section}>
          <Heading level={2}>지금까지의 설문조사</Heading>
          <EditionList />
        </div>
      </section>

      {open && (
        <section style={{ background: gradientBanner, color: '#ffffff' }}>
          <div style={{ ...section, padding: '80px 24px', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-24)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)', maxWidth: 640 }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2 }}>10분이면 참여할 수 있어요</div>
              <div style={{ fontSize: '1.125rem', lineHeight: 1.5 }}>주변 개발자에게도 알려 주세요. 다양한 사람이 답할수록 결과가 더 의미 있어져요.</div>
            </div>
            <Link
              to="/$edition"
              params={{ edition: open.id }}
              search={ref ? { ref } : {}}
              style={{ ...cta, background: '#ffffff', color: 'var(--colors-fg-brand)', fontWeight: 600 }}
            >
              참여하기
            </Link>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  )
}
