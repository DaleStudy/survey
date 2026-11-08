# 기술 스택

무엇을 왜 쓰는지와 어디에 있는지를 적는다. 버전은 `package.json`, 바인딩과 배포 설정은 `wrangler.jsonc` 에 있다.

Tally 같은 설문 도구 대신 직접 만든다. 응답 화면을 달레 UI 로 만들고, 데이터 형식과 익명성(무엇을 저장하지 않을지)을 직접 정하고, 회차가 바뀌어도 같은 형식으로 쌓으려는 것이다.

| 영역 | 쓰는 것 | 이유 | 위치 |
|---|---|---|---|
| 실행·배포 | Cloudflare Workers | 조직 서비스 대부분이 Workers 에 있다 | `wrangler.jsonc`, `.github/workflows/` |
| 앱 | TanStack Start (React) | 파일 기반 라우트와 서버 함수를 한 Worker 에서 쓴다 | `src/routes/`, `src/server/` |
| DB | D1 + Drizzle | Workers 바인딩으로 바로 쓰고, 마이그레이션은 drizzle-kit 이 만든다 | `src/db/`, `drizzle/` |
| UI | 달레 UI (`daleui`) | 커뮤니티 디자인 시스템 | 컴포넌트 전반 |
| 차트 | TanStack Charts | 결과 화면, 관리자 화면의 날짜별 응답 | `src/components/ResultChart.tsx`, `src/components/Admin.tsx` |
| 표 | TanStack Table | 관리자 화면에서 원본 응답을 거르고 정렬한다. 열이 많아 가로로 펼치지 않고 보이는 열을 고른다 | `src/routes/admin.raw.tsx` |
| 봇 방지 | Turnstile | 로그인 없이 자동 제출을 막는다 | `src/lib/turnstile.ts`, `src/components/Turnstile.tsx` |
| 운영자 인증 | Cloudflare Access | 로그인 코드를 들여오지 않고 GitHub 팀으로 잠근다 | `src/lib/access.ts`, `src/routes/admin_.api.$part.ts` |
| 문항 원본 | YAML, Bun 내장 파서 | 사람이 읽고 고치기 쉽고, 파서 의존성이 없다 | `questions/`, `scripts/questions.ts` |
| 테스트 | `bun test` + `tsc --noEmit` | 별도 테스트 러너 없이 Bun 으로 | `src/**/*.test.ts` |

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
- **유형 미리보기 이미지:** `scripts/og-images.ts` 가 유형 일러스트에 설문 이름과 유형 이름을 얹어 `public/og/<회차>/` 에 만든다. 일러스트는 유형 카드에도 쓰여서 글자를 넣지 않고 따로 둔다. 회차 제목이나 유형 이름을 바꾸면 다시 돌린다. 글자는 설치된 폰트에 기대지 않도록 `@resvg/resvg-js` 에 폰트 파일(Pretendard)을 직접 넘겨 그린다. 폰트는 저장소에 넣지 않고 실행할 때 받는다.
- **참여 배지:** `public/badges/<회차>.svg` 는 손으로 만든 정적 파일이다. GitHub 이 보는 사람의 글꼴로 그리므로 `textLength` 로 글자 폭을 고정한다.
