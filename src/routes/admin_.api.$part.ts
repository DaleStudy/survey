import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { getDb } from '@/db'
import { findEdition } from '@/editions'
import { ADMIN_AUD, verifyAccessToken } from '@/lib/access'
import { loadResponses, loadSummary } from '@/server/admin'

// 원본 응답이 브라우저나 중간 서버에 남지 않고, 검색에도 나오지 않게 한다
const PRIVATE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }

// GET /admin/api/summary?edition=2026 → 응답 수, 날짜별 응답, 문항별 분포
// GET /admin/api/responses?edition=2026&page=1 → 원본 응답 한 페이지
// 서버 함수(/_serverFn)가 아니라 /admin 아래에 두는 건, Access 가 잠근 경로로 가는 요청에만 토큰을 붙여 주기 때문이다.
// 파일 이름의 admin_ 는 화면 레이아웃(admin.tsx) 아래로 들어가지 않게 한다.
export const Route = createFileRoute('/admin_/api/$part')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const allowed = await verifyAccessToken({ token: request.headers.get('cf-access-jwt-assertion'), aud: ADMIN_AUD })
        if (!allowed) return Response.json({ error: '운영자만 볼 수 있어요.' }, { status: 403, headers: PRIVATE })

        const search = new URL(request.url).searchParams
        const edition = findEdition(search.get('edition') ?? '')
        if (!edition?.survey) return Response.json({ error: '회차가 올바르지 않아요.' }, { status: 400, headers: PRIVATE })
        const db = getDb(env.DB)

        if (params.part === 'summary') return Response.json(await loadSummary(db, edition.id), { headers: PRIVATE })
        if (params.part === 'responses') {
          const page = Number(search.get('page') ?? '1')
          if (!Number.isInteger(page) || page < 1) return Response.json({ error: '페이지가 올바르지 않아요.' }, { status: 400, headers: PRIVATE })
          return Response.json(await loadResponses(db, edition.id, page), { headers: PRIVATE })
        }
        return Response.json({ error: '없는 주소예요.' }, { status: 404, headers: PRIVATE })
      },
    },
  },
})
