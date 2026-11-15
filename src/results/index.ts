import type { ResultSet } from './aggregate'

// 회차 ID → 집계 결과. 결과를 발표할 때 <회차>.json 을 만들고 여기에 더한다.
// 헤더와 회차 목록은 결과가 있는지와 응답자 수(total)만 보므로, 집계는 결과 화면의 loader 가 load() 로 따로 읽는다.
// 집계를 여기서 바로 import 하면 모든 페이지가 받는 번들에 들어간다(#43). total 은 집계 파일과 같아야 한다(index.test.ts).
export interface ResultEntry {
  total: number
  load: () => Promise<ResultSet>
}

const json = (m: { default: unknown }) => m.default as ResultSet

// 예시 회차(scripts/sample-results.ts). 개발 서버에서만 RESULTS 에 넣는다.
export const SAMPLE_RESULTS: Record<string, ResultEntry> = {
  '2025': { total: 800, load: () => import('./2025.json').then(json) },
}

// 운영 빌드에서는 DEV 분기가 사라져서 예시 집계가 번들에 들어가지 않는다
export const RESULTS: Record<string, ResultEntry> = {
  ...(import.meta.env.DEV ? SAMPLE_RESULTS : {}),
}
