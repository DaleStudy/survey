import { createFileRoute } from '@tanstack/react-router'
import { Heading, Text } from 'daleui'
import { EditionList } from '@/components/EditionList'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'

// 결과 아카이브: 지난 회차까지 모든 회차를 한곳에서 찾는다.
export const Route = createFileRoute('/results')({
  head: () => ({ meta: [{ title: '결과 | 한국 개발자 설문조사' }] }),
  component: Archive,
})

function Archive() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <SiteHeader />
      <main style={{ flex: 1, width: '100%', maxWidth: 960, margin: '0 auto', padding: '72px 24px 96px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
          <Heading level={1}>결과</Heading>
          <Text size="lg">회차마다 같은 질문을 하고 결과를 모두 공개해요. 지난 회차도 여기서 볼 수 있어요.</Text>
        </div>
        <EditionList />
      </main>
      <SiteFooter />
    </div>
  )
}
