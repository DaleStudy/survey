import { Link, Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Heading, Select, Tag, Text } from 'daleui'
import { ADMIN_CSS, AdminDaily, AdminError } from '@/components/Admin'
import { EDITIONS, findEdition, isBeta, isClosed } from '@/editions'
import { adminFetch } from '@/lib/adminFetch'
import type { AdminSummary } from '@/server/admin'

const SURVEY_EDITIONS = EDITIONS.filter((e) => e.survey)

// 운영자가 응답을 확인하는 읽기 전용 화면(#10). Cloudflare Access 가 /admin 을 잠그고, 데이터는 /admin/api 가 토큰을 다시 확인한 뒤 준다.
// 서버에서 그리지 않아서(ssr: false) 페이지 HTML 에는 응답이 들어가지 않는다.
// 회차 전체 그림(요약)은 여기서 회차별로 한 번 받고, 원본 응답은 자식 라우트(/admin/raw)가 페이지별로 받는다.
export const Route = createFileRoute('/admin')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { edition?: string } => ({
    edition: typeof search.edition === 'string' ? search.edition : undefined,
  }),
  loaderDeps: ({ search }) => ({ edition: search.edition ?? SURVEY_EDITIONS[0].id }),
  loader: async ({ deps }) => ({ edition: deps.edition, summary: await adminFetch<AdminSummary>('summary', { edition: deps.edition }) }),
  head: () => ({ meta: [{ title: '응답 확인' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminLayout,
  errorComponent: ({ error }) => (
    <main style={page}>
      <div style={container}>
        <AdminError error={error} />
      </div>
    </main>
  ),
})

function AdminLayout() {
  const { edition: editionId, summary } = Route.useLoaderData()
  const navigate = useNavigate()
  const edition = findEdition(editionId)
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
  const todayCount = summary.daily.find((d) => d.date === today)?.count ?? 0
  const daysLeft = edition?.closesAt ? Math.ceil((new Date(edition.closesAt).getTime() - Date.now()) / 86_400_000) : undefined

  return (
    <main style={page}>
      <style>{ADMIN_CSS}</style>
      <div style={container}>
        <header style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-16)', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
              {edition && isBeta(edition) && <Tag tone="warning">베타 응답</Tag>}
              <Text size="sm" muted>
                운영진만 볼 수 있어요
              </Text>
            </div>
            <Heading level={1} size={3}>
              응답 확인
            </Heading>
          </div>
          <div style={{ width: 220 }}>
            {/* 회차를 바꾸면 보던 탭은 그대로 두고 원본 페이지는 처음으로 */}
            <Select label="회차" value={editionId} onChange={(e) => navigate({ to: '.', search: { edition: e.target.value } })}>
              {SURVEY_EDITIONS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id}
                </option>
              ))}
            </Select>
          </div>
        </header>

        <section aria-label="요약" className="admin-stats">
          <Stat label="총 응답" value={`${summary.total.toLocaleString()}건`} />
          <Stat label={`오늘 ${Number(today.slice(5, 7))}. ${Number(today.slice(8, 10))}.`} value={`${todayCount.toLocaleString()}건`} brand />
          {edition && daysLeft !== undefined && <Stat label="마감까지" value={isClosed(edition) ? '마감' : `${daysLeft}일`} />}
        </section>

        <AdminDaily daily={summary.daily} closesAt={edition?.closesAt} />

        <nav aria-label="보기" style={{ display: 'flex', gap: 'var(--spacing-4)', borderBottom: '1px solid var(--colors-border-neutral)' }}>
          <Link to="/admin" search={{ edition: editionId }} activeOptions={{ exact: true, includeSearch: false }} className="admin-tab">
            문항별 분포
          </Link>
          <Link to="/admin/raw" search={{ edition: editionId }} activeOptions={{ includeSearch: false }} className="admin-tab">
            원본 응답
          </Link>
        </nav>

        <Outlet />

        <Text size="xs" muted>
          원본 응답은 공개하지 않아요. 이 화면의 데이터는 캐시되지 않아요.
        </Text>
      </div>
    </main>
  )
}

function Stat({ label, value, brand }: { label: string; value: string; brand?: boolean }) {
  return (
    <div className="admin-panel admin-stat">
      <span className="admin-stat-label">{label}</span>
      <span className="admin-stat-value" style={{ color: brand ? 'var(--colors-fg-brand)' : undefined }}>
        {value}
      </span>
    </div>
  )
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  boxSizing: 'border-box',
  padding: 'var(--spacing-40) var(--spacing-24)',
  background: 'var(--colors-app-bg)',
  color: 'var(--colors-fg-neutral)',
}

const container: React.CSSProperties = { maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }
