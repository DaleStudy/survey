import type { ResultSet } from './aggregate'
import r2025 from './2025.json'

// 회차 ID → 집계 결과. 결과를 발표할 때 <회차>.json 을 만들고 여기에 더한다.
// 예시 회차(2025)는 개발 서버에서만 넣는다. 운영 빌드에서는 이 분기가 사라져서 예시 집계가 번들에 들어가지 않는다.
export const RESULTS: Record<string, ResultSet> = {
  ...(import.meta.env.DEV ? { '2025': r2025 as unknown as ResultSet } : {}),
}
