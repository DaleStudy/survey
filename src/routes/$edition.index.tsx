import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Heading, Icon, Tag, Text } from 'daleui'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { findEdition, isClosed } from '@/editions'
import { koDate } from '@/lib/date'
import { SITE_URL, ogImage } from '@/lib/og'
import { questionsFor } from '@/questions/survey'
import { RESULTS } from '@/results'

const DESCRIPTION = '해외 설문조사에서는 잘 보이지 않는 한국 개발자의 일과 커리어를 물어요. 결과는 누구나 볼 수 있게 공개해요.'

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
  const topics = [...new Map(questions.filter((q) => q.sectionId !== 'closing').map((q) => [q.sectionId, q.section])).values()]

  const status = result
    ? `${result.total.toLocaleString()}명이 답했어요`
    : open
      ? e.closesAt && `${koDate(e.closesAt)}까지 응답을 받아요`
      : e.resultsAt && `${koDate(e.resultsAt)}에 결과를 공개해요`

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <section style={{ background: 'var(--colors-bg-brand)' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '96px 24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)', alignItems: 'flex-start' }}>
            {status && <Tag tone={e.sample ? 'warning' : 'brand'}>{status}</Tag>}
            <Heading level={1}>{e.title}</Heading>
            <Text size="xl" style={{ maxWidth: 680, lineHeight: 1.6 }}>
              {DESCRIPTION}
            </Text>
            {open && (
              <>
                <Link to="/$edition/survey" params={{ edition: e.id }} search={ref ? { ref } : {}} style={cta}>
                  설문 시작하기
                </Link>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-24)' }}>
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
        </section>

        {questions.length > 0 && (
          <section>
            <div style={{ maxWidth: 1120, margin: '0 auto', padding: '96px 24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
              <Heading level={2} size={3}>
                무엇을 묻나요
              </Heading>
              <Text size="lg" style={{ maxWidth: 720, lineHeight: 1.6 }}>
                {topics.length}가지 주제를 물어요. 지금 상황에 맞는 질문만 나와서 실제로 답할 문항은 {questions.length}개보다 적어요.
                {e.opensAt && e.closesAt && ` 응답은 ${koDate(e.opensAt)}부터 ${koDate(e.closesAt)}까지 받아요.`}
                {e.resultsAt && ` 결과는 ${koDate(e.resultsAt)}에 공개해요.`}
              </Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)' }}>
                {topics.map((t) => (
                  <Tag key={t} tone={t.includes('AI') ? 'brand' : 'neutral'}>
                    {t}
                  </Tag>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
