# 기술 스택

무엇을 왜 쓰는지와 어디에 있는지를 적는다. 버전은 `package.json`, 바인딩과 배포 설정은 `wrangler.jsonc` 에 있다.

Tally 같은 설문 도구 대신 직접 만든다. 응답 화면을 달레 UI 로 만들고, 데이터 형식과 익명성(무엇을 저장하지 않을지)을 직접 정하고, 회차가 바뀌어도 같은 형식으로 쌓으려는 것이다.

| 영역 | 쓰는 것 | 이유 | 위치 |
|---|---|---|---|
| 실행·배포 | Cloudflare Workers | 조직 서비스 대부분이 Workers 에 있고 `feedback` 에서 검증했다 | `wrangler.jsonc`, `.github/workflows/` |
| 앱 | TanStack Start (React) | 파일 기반 라우트와 서버 함수를 한 Worker 에서 쓴다 | `src/routes/`, `src/server/` |
| DB | D1 + Drizzle | Workers 바인딩으로 바로 쓰고, 마이그레이션은 drizzle-kit 이 만든다 | `src/db/`, `drizzle/` |
| UI | 달레 UI (`daleui`) | 커뮤니티 디자인 시스템 | 컴포넌트 전반 |
| 차트 | TanStack Charts | 결과 화면 | `src/components/ResultChart.tsx` |
| 봇 방지 | Turnstile | 로그인 없이 자동 제출을 막는다 | `src/lib/turnstile.ts`, `src/components/Turnstile.tsx` |
| 운영자 인증 | Cloudflare Access | 로그인 코드를 들여오지 않고 GitHub 팀으로 잠근다 | `src/lib/access.ts`, `src/routes/admin.api.ts` |
| 문항 원본 | YAML, Bun 내장 파서 | 사람이 읽고 고치기 쉽고, 파서 의존성이 없다 | `questions/`, `scripts/questions.ts` |
| 테스트 | `bun test` + `tsc --noEmit` | 별도 테스트 러너 없이 Bun 으로 | `src/**/*.test.ts` |

## `feedback` 과 다른 점

스택은 `feedback` 과 같지만 응답자 모델이 반대라서 아래는 따르지 않는다.

- 로그인과 세션이 없다. 사용자 테이블도 없다.
- 문항을 DB 가 아니라 회차별 YAML 에 둔다. 화면에서 설문을 만드는 기능이 없다.
- 답을 문항당 1행이 아니라 응답 1건당 JSON 한 칸에 둔다([데이터 모델](data-model.md)).

## 알아 둘 것

- **생성 파일은 손으로 고치지 않는다.** 모두 git 에서 제외된다.
  - `src/questions/generated/` — `bun run questions`. `dev`, `build`, `test`, `export` 가 먼저 돌린다.
  - `src/routeTree.gen.ts` — TanStack Router 플러그인이 `dev`·`build` 때 만든다.
  - `worker-configuration.d.ts` — `bun run cf-typegen`. 저장소를 새로 받으면 `bun run test` 전에 한 번 돌린다(`tsconfig.json` 이 이 파일을 읽는다). 시크릿 타입은 `wrangler types` 가 모르므로 `src/env.d.ts` 에 더한다.
- **Worker 바인딩**은 서버 코드에서 `import { env } from 'cloudflare:workers'` 로 읽는다.
- **타입 검사 범위:** `tsconfig.json` 이 `*.test.ts` 와 `scripts/` 를 뺀다. `bun test` 는 타입을 보지 않으므로, 테스트와 스크립트의 타입 오류는 실행해야 드러난다.
- **스타일:** 달레 UI 컴포넌트를 먼저 쓰고, 배치는 인라인 `style` 에 달레 UI CSS 변수(`var(--colors-…)`, `var(--spacing-…)`)로 한다. 별도 CSS 프레임워크는 없다.
- **경로 별칭:** `@/` 는 `src/` 다(`tsconfig.json`, `vite-tsconfig-paths`).
- **유형 이미지:** `scripts/type-images.ts` 가 OpenAI 이미지 API 로 만들어 `public/types/` 에 커밋한다. 빌드나 실행 때는 API 를 부르지 않는다.
