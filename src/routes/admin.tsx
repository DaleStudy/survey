import { Link, Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Heading, Icon, Select, Tag, Text } from 'daleui'
import { Logo } from '@/components/Logo'
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

  // 응답 기간 중 며칠째인지. 시작일이 없으면 진행 막대를 그리지 않는다.
  const day = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00+09:00` : iso).getTime()
  const period =
    edition?.opensAt && edition.closesAt
      ? (() => {
          const total = Math.ceil((day(edition.closesAt) - day(edition.opensAt)) / 86_400_000)
          const elapsed = Math.min(total, Math.max(0, Math.ceil((Date.now() - day(edition.opensAt)) / 86_400_000)))
          return { total, elapsed }
        })()
      : undefined

  return (
    <div style={page}>
      <style>{ADMIN_CSS}</style>
      <header style={{ background: 'var(--colors-app-bg)', borderBottom: '1px solid var(--colors-bg-neutral-active)' }}>
        <div style={{ ...bar, display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12) var(--spacing-24)', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--spacing-12)', paddingBottom: 'var(--spacing-8)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)', alignItems: 'center' }}>
            <Logo />
            <Heading level={1} size={5}>
              응답 확인
            </Heading>
            {edition && isBeta(edition) && <Tag tone="warning">베타 응답</Tag>}
            <Text size="sm" muted style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <Icon name="eyeOff" size="xs" /> 운영진만 볼 수 있어요
            </Text>
          </div>
          <div style={{ width: 200 }}>
            {/* 회차를 바꾸면 보던 탭은 그대로 두고 원본 페이지는 처음으로 */}
            <Select label="회차" value={editionId} onChange={(e) => navigate({ to: '.', search: { edition: e.target.value } })}>
              {SURVEY_EDITIONS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <nav aria-label="보기" style={{ ...bar, display: 'flex', gap: 'var(--spacing-4)' }}>
          <Link to="/admin" search={{ edition: editionId }} activeOptions={{ exact: true, includeSearch: false }} className="admin-tab">
            문항별 분포
          </Link>
          <Link to="/admin/raw" search={{ edition: editionId }} activeOptions={{ includeSearch: false }} className="admin-tab">
            원본 응답
          </Link>
        </nav>
      </header>

      <main style={container}>
        <section aria-label="요약" className="admin-stats">
          <Stat label="총 응답" value={summary.total.toLocaleString()} unit="건" />
          <Stat label={`오늘 ${Number(today.slice(5, 7))}. ${Number(today.slice(8, 10))}.`} value={todayCount.toLocaleString()} unit="건" brand />
          {edition && daysLeft !== undefined && (
            <Stat label="마감까지" value={isClosed(edition) ? '마감' : String(daysLeft)} unit={isClosed(edition) ? undefined : '일'} note={period && `${period.total}일 중 ${period.elapsed}일째`}>
              {period && (
                <div aria-hidden="true" style={{ height: 6, borderRadius: 'var(--radii-full)', background: 'var(--colors-bg-brand-active)' }}>
                  <div style={{ width: `${(period.elapsed / period.total) * 100}%`, height: '100%', borderRadius: 'var(--radii-full)', background: 'var(--colors-bg-solid-brand)' }} />
                </div>
              )}
            </Stat>
          )}
        </section>

        <AdminDaily daily={summary.daily} closesAt={edition?.closesAt} />

        <Outlet />

        <Text size="xs" muted>
          원본 응답은 공개하지 않아요. 이 화면의 데이터는 캐시되지 않아요.
        </Text>
      </main>
    </div>
  )
}

function Stat({ label, value, unit, brand, note, children }: { label: string; value: string; unit?: string; brand?: boolean; note?: string; children?: React.ReactNode }) {
  return (
    <div className="admin-panel admin-stat">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-8)', alignItems: 'baseline' }}>
        <span className="admin-stat-label">{label}</span>
        {note && <span className="admin-stat-label">{note}</span>}
      </div>
      <span className="admin-stat-value" style={{ color: brand ? 'var(--colors-fg-brand)' : undefined }}>
        {value}
        {unit && <span style={{ fontSize: '1rem', fontWeight: 600 }}> {unit}</span>}
      </span>
      {children}
    </div>
  )
}

// 옅은 회색 바탕에 흰 패널을 얹어 테두리 없이 구획을 나눈다
const page: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--colors-bg-neutral-hover)',
  color: 'var(--colors-fg-neutral)',
}

const bar: React.CSSProperties = { maxWidth: 1200, margin: '0 auto', padding: '0 var(--spacing-24)', boxSizing: 'border-box' }
const container: React.CSSProperties = { ...bar, paddingTop: 28, paddingBottom: 'var(--spacing-48)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)' }
