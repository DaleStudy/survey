import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Icon, Text } from 'daleui'
import { ComparisonResult, QuestionResult } from '@/components/ResultCards'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { findEdition } from '@/editions'
import { SITE_URL, ogImage } from '@/lib/og'
import { RESULTS } from '@/results'
import { sharedCharts } from '@/results/share'

// 차트 한 장을 공유하는 페이지. 전체 응답 기준으로 그 차트만 보여 주고 결과 페이지로 보낸다.
// 미리보기 이미지는 결과를 공개할 때 scripts/results-og.ts 가 만든다.
export const Route = createFileRoute('/$edition/results_/$chart')({
  loader: async ({ params }) => {
    const edition = findEdition(params.edition)
    const result = await RESULTS[params.edition]?.load()
    const chart = result && sharedCharts(result).find((c) => c.id === params.chart)
    if (!edition || !chart) throw notFound()
    return { editionTitle: edition.title, edition: edition.id, chart }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { chart, edition, editionTitle } = loaderData
    const title = `${chart.title} | ${editionTitle} 결과`
    const description = `${editionTitle} 결과에서 이 차트와 다른 결과를 모두 볼 수 있어요.`
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: chart.title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: `${SITE_URL}/${edition}/results/${chart.id}` },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'ko_KR' },
        { property: 'og:site_name', content: '달레 스터디 개발자 설문조사' },
        ...ogImage(`/og/${edition}/results/${chart.id}.jpg`, `${editionTitle} 결과: ${chart.title}`),
      ],
    }
  },
  component: ChartPage,
})

function ChartPage() {
  const { chart, edition, editionTitle } = Route.useLoaderData()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: 840, margin: '0 auto', padding: '48px 24px 96px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
          <Text size="sm" weight="semibold" style={{ color: 'var(--colors-fg-brand)' }}>
            {editionTitle} 결과
          </Text>
          {chart.kind === 'question' ? <QuestionResult q={chart.q} edition={edition} /> : <ComparisonResult view={chart.view} edition={edition} />}
          <Link
            to="/$edition/results"
            params={{ edition }}
            hash={chart.id}
            style={{ display: 'inline-flex', gap: 'var(--spacing-4)', alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, color: 'var(--colors-fg-brand)', fontWeight: 600, textDecoration: 'none' }}
          >
            다른 결과도 보기 <Icon name="chevronRight" size="sm" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
