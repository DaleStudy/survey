import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Text } from 'daleui'
import { DevTypeCard } from '@/components/DevTypeCard'
import { SITE_URL } from '@/components/ShareButton'
import { findDevType } from '@/lib/devType'

// 공유 링크로 들어오는 페이지. 유형만 보여 주고, 설문은 랜딩에서 ref=share 로 시작하게 한다.
export const Route = createFileRoute('/type/$slug')({
  loader: ({ params }) => {
    const type = findDevType(params.slug)
    if (!type) throw notFound()
    return type
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const title = `나는 '${loaderData.name}' 개발자 · 2026 한국 개발자 설문`
    return {
      meta: [
        { title },
        { name: 'description', content: loaderData.description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: `${loaderData.description} 10분이면 나의 유형도 알 수 있어요.` },
        { property: 'og:url', content: `${SITE_URL}/type/${loaderData.slug}` },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'ko_KR' },
        { property: 'og:site_name', content: '한국 개발자 설문' },
      ],
    }
  },
  component: TypePage,
})

function TypePage() {
  const type = Route.useLoaderData()
  return (
    <main style={{ minHeight: '100vh', background: 'var(--colors-bg-brand)', color: 'var(--colors-fg-neutral)' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '96px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)', alignItems: 'flex-start' }}>
        <DevTypeCard type={type} label="친구의 개발자 유형" />
        <Text size="lg">한국 개발자의 일과 커리어를 묻는 연례 설문이에요. 10분이면 나의 유형도 알 수 있어요.</Text>
        <Link
          to="/"
          search={{ ref: 'share' }}
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
      </div>
    </main>
  )
}
