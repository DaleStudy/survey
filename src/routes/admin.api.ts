import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { getDb } from '@/db'
import { findEdition } from '@/editions'
import { ADMIN_AUD, verifyAccessToken } from '@/lib/access'
import { loadAdminData } from '@/server/admin'

// 원본 응답이 브라우저나 중간 서버에 남지 않고, 검색에도 나오지 않게 한다
const PRIVATE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }

// GET /admin/api?edition=2026&page=1 → 관리자 화면 데이터.
// 서버 함수(/_serverFn)가 아니라 /admin 아래에 두는 건, Access 가 잠근 경로로 가는 요청에만 토큰을 붙여 주기 때문이다.
export const Route = createFileRoute('/admin/api')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const allowed = await verifyAccessToken({ token: request.headers.get('cf-access-jwt-assertion'), aud: ADMIN_AUD })
        if (!allowed) return Response.json({ error: '운영자만 볼 수 있어요.' }, { status: 403, headers: PRIVATE })

        const params = new URL(request.url).searchParams
        const edition = findEdition(params.get('edition') ?? '')
        const page = Number(params.get('page') ?? '1')
        if (!edition?.survey || !Number.isInteger(page) || page < 1) {
          return Response.json({ error: '회차나 페이지가 올바르지 않아요.' }, { status: 400, headers: PRIVATE })
        }
        return Response.json(await loadAdminData(getDb(env.DB), edition.id, page), { headers: PRIVATE })
      },
    },
  },
})
