import { createFileRoute, redirect } from '@tanstack/react-router'
import { EDITIONS } from '@/editions'
import { RESULTS } from '@/results'

// 짧은 주소: 가장 최근 회차의 결과로 보낸다. 실제 결과가 없으면 예시라도 보여 준다.
export const Route = createFileRoute('/results')({
  beforeLoad: () => {
    const withResults = EDITIONS.filter((e) => RESULTS[e.id])
    const latest = withResults.find((e) => !e.sample) ?? withResults[0]
    throw latest ? redirect({ to: '/$edition/results', params: { edition: latest.id } }) : redirect({ to: '/' })
  },
})
