import { createFileRoute } from '@tanstack/react-router'
import { Button, Heading, Text, VStack } from 'daleui'
import { useState } from 'react'
import { submitResponse } from '@/server/functions/responses'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === 'string' ? search.ref : undefined,
  }),
  component: Home,
})

// 0단계 뼈대: 문항 하나를 받아 저장하는 데까지만. 문항은 1단계에서 questions/2026.yaml 로 옮긴다.
const STATUS_OPTIONS = [
  { code: 'employed', label: '개발자로 일하고 있어요' },
  { code: 'job_seeking', label: '개발 일자리를 찾고 있어요' },
  { code: 'student', label: '학생이에요' },
  { code: 'other_job', label: '개발 말고 다른 일을 해요' },
  { code: 'not_working', label: '지금은 일을 쉬고 있어요' },
]

function Home() {
  const { ref } = Route.useSearch()
  const [status, setStatus] = useState<string>()
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function submit() {
    if (!status) return
    setState('sending')
    try {
      await submitResponse({ data: { answers: { status }, ref } })
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <VStack gap="16" padding="40" align="left">
        <Heading level={1}>고마워요</Heading>
        <Text>응답이 저장됐어요.</Text>
      </VStack>
    )
  }

  return (
    <VStack gap="24" padding="40" align="left">
      <Heading level={1}>2026 한국 개발자 설문</Heading>
      <Heading level={2} size={3} id="question">
        지금 어떤 상황인가요?
      </Heading>
      <VStack gap="8" align="stretch" role="radiogroup" aria-labelledby="question">
        {STATUS_OPTIONS.map((o) => (
          <Button
            key={o.code}
            role="radio"
            aria-checked={status === o.code}
            variant={status === o.code ? 'solid' : 'outline'}
            tone={status === o.code ? 'brand' : 'neutral'}
            onClick={() => setStatus(o.code)}
          >
            {o.label}
          </Button>
        ))}
      </VStack>
      <Button tone="brand" disabled={!status} loading={state === 'sending'} onClick={submit}>
        제출하기
      </Button>
      {state === 'error' && <Text tone="danger">저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.</Text>}
    </VStack>
  )
}
