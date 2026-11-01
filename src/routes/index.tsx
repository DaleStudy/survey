import { Link, createFileRoute } from '@tanstack/react-router'
import { Card, Heading, Icon, Tag, Text } from 'daleui'

const TITLE = '2026 한국 개발자 설문'
const DESCRIPTION = '해외 설문에서는 잘 보이지 않는 한국 개발자의 일과 커리어를 매년 같은 질문으로 물어요. 결과와 응답 데이터는 누구나 볼 수 있게 공개해요.'

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
      { property: 'og:site_name', content: '한국 개발자 설문' },
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

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)', maxWidth: 720 }}>
      <Text weight="semibold" tone="brand">
        {label}
      </Text>
      <Heading level={2}>{title}</Heading>
    </div>
  )
}

function Landing() {
  const { ref } = Route.useSearch()
  const start = (
    <Link to="/survey" search={ref ? { ref } : {}} style={cta}>
      설문 시작하기
    </Link>
  )

  return (
    <div style={{ background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <header style={{ borderBottom: '1px solid var(--colors-bg-neutral-hover)' }}>
        <div style={{ ...wrap, padding: 'var(--spacing-16) 24px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
            <Icon name="codeXml" tone="brand" />
            <Text size="lg" weight="bold">
              한국 개발자 설문
            </Text>
          </div>
          <nav aria-label="주요 메뉴" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-24)', alignItems: 'center' }}>
            <a href="#why">왜 하나요</a>
            <a href="#promise">약속</a>
            <a href="#schedule">일정</a>
          </nav>
        </div>
      </header>

      <section style={{ background: 'var(--colors-bg-brand)' }}>
        <div style={{ ...section, gap: 'var(--spacing-24)', alignItems: 'flex-start' }}>
          <Tag tone="brand">2026 · 1회차</Tag>
          <Heading level={1} style={{ maxWidth: 820 }}>
            한국 개발자의 오늘을 함께 기록해요
          </Heading>
          <Text size="xl" style={{ maxWidth: 680, lineHeight: 1.6 }}>
            {DESCRIPTION}
          </Text>
          {start}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-24)' }}>
            <span style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
              <Icon name="clock" size="sm" /> <Text>10분 안팎</Text>
            </span>
            <span style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
              <Icon name="eyeOff" size="sm" /> <Text>로그인도 이메일도 필요 없어요</Text>
            </span>
          </div>
        </div>
      </section>

      <section id="why">
        <div style={section}>
          <SectionTitle label="왜 하나요" title="해외 설문 속 한국은 너무 작아요" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-32)', alignItems: 'start' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-8)',
                padding: 'var(--spacing-32)',
                borderRadius: 'var(--radii-lg)',
                background: 'var(--colors-bg-solid-brand)',
                color: 'var(--colors-fg-solid-brand)',
              }}
            >
              <div style={{ fontSize: '4.5rem', fontWeight: 700, lineHeight: 1 }}>86명</div>
              <div style={{ fontSize: '1.125rem', lineHeight: 1.5 }}>
                Stack Overflow 2025 설문에서 나라를 밝힌 35,369명 가운데 한국 응답자 수예요. 전체의 0.2%밖에 안 돼요.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                <Heading level={3} size={4}>
                  국내 연례 설문은 2023년에 멈췄어요
                </Heading>
                <Text size="lg" style={{ lineHeight: 1.6 }}>
                  가장 컸던 프로그래머스 개발자 설문(2018~2023)이 끝난 뒤로, 국내 개발자 전체를 매년 조사하는 곳이 없어요.
                </Text>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                <Heading level={3} size={4}>
                  한국에만 있는 질문이 있어요
                </Heading>
                <Text size="lg" style={{ lineHeight: 1.6 }}>
                  SI·SM과 원청·하청 구조, 코딩 테스트, 원화 연봉처럼 해외 설문에서는 묻지 않는 것들이에요.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="promise" style={{ background: 'var(--colors-bg-neutral-hover)' }}>
        <div style={section}>
          <SectionTitle label="약속" title="답한 사람이 손해 보지 않게 할게요" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-24)' }}>
            <Card tone="neutral" outline>
              <Card.Icon name="eyeOff" />
              <Card.Body>
                <Card.Title>익명으로 답해요</Card.Title>
                <Card.Description>
                  이름, 이메일, 로그인을 받지 않아요. 연봉이나 지역처럼 민감한 건 구간으로만 묻고, 답하지 않아도 돼요.
                </Card.Description>
              </Card.Body>
            </Card>
            <Card tone="neutral" outline>
              <Card.Icon name="handHeart" />
              <Card.Body>
                <Card.Title>결과는 모두 공개해요</Card.Title>
                <Card.Description>
                  12월에 결과 리포트를 누구나 볼 수 있게 내요. 누군지 알 수 없게 처리한 응답 데이터도 CSV로 함께 올려요.
                </Card.Description>
              </Card.Body>
            </Card>
            <Card tone="neutral" outline>
              <Card.Icon name="clock" />
              <Card.Body>
                <Card.Title>매년 같은 질문을 해요</Card.Title>
                <Card.Description>
                  핵심 문항은 해마다 바꾸지 않아요. 올해 답이 한국 개발자가 어떻게 달라지는지 보여 주는 기준이 돼요.
                </Card.Description>
              </Card.Body>
            </Card>
          </div>
        </div>
      </section>

      <section id="schedule">
        <div style={section}>
          <SectionTitle label="무엇을 묻나요" title="여섯 가지 주제, 30문항 안팎" />
          <Text size="lg" style={{ maxWidth: 720, lineHeight: 1.6 }}>
            지금 상황에 맞는 질문만 나와서, 실제로 답할 문항은 이보다 적을 수 있어요. 응답은 11월 [시작일]부터 [마감일]까지 받고, 결과는 12월
            [발표일]에 공개해요.
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)' }}>
            {['나에 대해', '일하는 곳', '보상', '커리어', '기술'].map((t) => (
              <Tag key={t} tone="neutral">
                {t}
              </Tag>
            ))}
            <Tag tone="brand">올해의 주제 · AI</Tag>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--colors-bg-solid-brand)', color: 'var(--colors-fg-solid-brand)' }}>
        <div style={{ ...section, padding: '80px 24px', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-24)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)', maxWidth: 640 }}>
            <div style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2 }}>10분이면 한국 개발자 지도에 점 하나를 더할 수 있어요</div>
            <div style={{ fontSize: '1.125rem', lineHeight: 1.5 }}>주변 개발자에게도 알려 주세요. 다양한 사람이 답할수록 결과가 정확해져요.</div>
          </div>
          <Link
            to="/survey"
            search={ref ? { ref } : {}}
            style={{ ...cta, background: 'var(--colors-fg-solid-brand)', color: 'var(--colors-bg-solid-brand)', fontWeight: 600 }}
          >
            설문 시작하기
          </Link>
        </div>
      </section>

      <footer>
        <div style={{ ...wrap, padding: 'var(--spacing-32) 24px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <Text size="sm" muted>
            달레 스터디가 운영하는 연례 설문이에요
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-24)' }}>
            <Link to="/privacy">개인정보 처리방침</Link>
            <a href="https://github.com/DaleStudy/survey" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
