import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Heading, Text } from 'daleui'
import { isBeta, openEditions } from '@/editions'

// 홍보용 짧은 주소. 열린 회차가 하나면 그리로 보내고, 여럿이면 고르게 한다. ?ref= 는 그대로 넘긴다.
export const Route = createFileRoute('/survey')({
  validateSearch: (search: Record<string, unknown>): { ref?: string } =>
    typeof search.ref === 'string' ? { ref: search.ref } : {},
  beforeLoad: ({ search }) => {
    const open = openEditions()
    if (open.length === 1) throw redirect({ to: '/$edition/survey', params: { edition: open[0].id }, search })
    if (open.length === 0) throw redirect({ to: '/' })
  },
  component: ChooseEdition,
})

function ChooseEdition() {
  const search = Route.useSearch()
  return (
    <main style={{ maxWidth: 840, margin: '0 auto', padding: '96px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <Heading level={1}>참여할 설문을 골라 주세요</Heading>
      <Text>지금 응답을 받는 설문이에요.</Text>
      {openEditions().map((e) => (
        <Link key={e.id} to="/$edition/survey" params={{ edition: e.id }} search={search} reloadDocument={isBeta(e)}>
          {e.title}
        </Link>
      ))}
    </main>
  )
}
