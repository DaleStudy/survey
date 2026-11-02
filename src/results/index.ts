import type { ResultSet } from './aggregate'
import r2025 from './2025.json'

// 회차 ID → 집계 결과. 결과를 발표할 때 <회차>.json 을 만들고 여기에 더한다.
export const RESULTS: Record<string, ResultSet> = {
  '2025': r2025 as unknown as ResultSet,
}
