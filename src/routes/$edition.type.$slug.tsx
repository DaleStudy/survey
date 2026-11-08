import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Heading, Text } from 'daleui'
import { DevTypeCard } from '@/components/DevTypeCard'
import { DevTypeGrid } from '@/components/DevTypeGrid'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { findEdition } from '@/editions'
import { findDevType } from '@/lib/devType'
import { SITE_URL, ogImage } from '@/lib/og'

// 공유 링크로 들어오는 페이지. 유형만 보여 주고, 설문은 회차 페이지에서 시작하게 한다.
export const Route = createFileRoute('/$edition/type/$slug')({
  loader: ({ params }) => {
    const edition = findEdition(params.edition)
    const type = edition?.devTypes ? findDevType(params.slug) : undefined
    if (!edition || !type) throw notFound()
    return { ...type, edition: edition.id, editionTitle: edition.title }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const title = `나는 '${loaderData.name}' 개발자 | ${loaderData.editionTitle}`
    return {
      meta: [
        { title },
        { name: 'description', content: loaderData.description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: `${loaderData.description} 10분이면 나의 유형도 알 수 있어요.` },
        { property: 'og:url', content: `${SITE_URL}/${loaderData.edition}/type/${loaderData.slug}` },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'ko_KR' },
        { property: 'og:site_name', content: '달레 스터디 개발자 설문조사' },
        ...ogImage(`/og/${loaderData.edition}/${loaderData.slug}.jpg`, `${loaderData.editionTitle} 개발자 유형: ${loaderData.name}`),
      ],
    }
  },
  component: TypePage,
})

function TypePage() {
  const type = Route.useLoaderData()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--colors-bg-brand)', color: 'var(--colors-fg-neutral)' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: 840, margin: '0 auto', padding: '96px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)', alignItems: 'flex-start' }}>
          <DevTypeCard type={type} label="친구의 개발자 유형" />
          <Text size="lg">한국 개발자의 일과 커리어를 묻는 설문조사예요. 10분이면 나의 유형도 알 수 있어요.</Text>
          <Link
            to="/$edition"
            params={{ edition: type.edition }}
            style={{
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
            }}
          >
            나도 해 보기
          </Link>
          <section aria-labelledby="types" style={{ width: '100%', marginTop: 'var(--spacing-32)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
            <Heading level={2} size={5} id="types">
              여섯 가지 유형 모두 보기
            </Heading>
            <DevTypeGrid current={type.slug} currentLabel="친구" />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
