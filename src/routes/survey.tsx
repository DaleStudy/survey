import { Link, createFileRoute } from '@tanstack/react-router'
import { Button, Heading, Icon, Tag, Text } from 'daleui'
import { useEffect, useRef, useState } from 'react'
import { ConsentStep } from '@/components/ConsentStep'
import { QuestionStep } from '@/components/QuestionStep'
import { Turnstile } from '@/components/Turnstile'
import { DevTypeCard } from '@/components/DevTypeCard'
import { ShareButton } from '@/components/ShareButton'
import { type DevType, devTypeOf, findDevType } from '@/lib/devType'
import { isClosed } from '@/lib/schedule'
import { isEmpty, visibleQuestions } from '@/questions/logic'
import { type Answers, QUESTIONS } from '@/questions/survey'
import { submitResponse } from '@/server/functions/responses'

export const Route = createFileRoute('/survey')({
  validateSearch: (search: Record<string, unknown>): { ref?: string } =>
    typeof search.ref === 'string' ? { ref: search.ref } : {},
  component: Survey,
})

// 하나만 고르는 문항은 고른 걸 잠깐 보여 준 뒤 다음 문항으로 넘긴다
const AUTO_ADVANCE_MS = 300
// 같은 브라우저에서 다시 답하지 않게 남기는 표시. 서버로는 보내지 않는다.
const DONE_KEY = 'survey-2026-done'

const page: React.CSSProperties = {
  minHeight: '100vh',
  boxSizing: 'border-box',
  background: 'var(--colors-bg-brand)',
  color: 'var(--colors-fg-neutral)',
}
const column: React.CSSProperties = {
  maxWidth: 840,
  margin: '0 auto',
  padding: '96px 24px 120px',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-24)',
}

function Survey() {
  const { ref } = Route.useSearch()
  const [answers, setAnswers] = useState<Answers>({})
  const [qid, setQid] = useState<string | null>(null)
  const [phase, setPhase] = useState<'intro' | 'consent' | 'question' | 'sending' | 'done' | 'already'>('intro')
  const [error, setError] = useState('')
  // 하이드레이션 전에 누른 버튼은 아무 일도 하지 않으므로, 그 전에는 시작 버튼을 막아 둔다
  const [hydrated, setHydrated] = useState(false)
  // 마지막 문항 화면에서 받는다. 토큰은 5분이면 만료돼서 설문을 시작할 때 받으면 늦다.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReset, setTurnstileReset] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // 응답을 마치면 브라우저에서 계산해 보여 준다. 서버에는 보내지 않는다.
  const [devType, setDevType] = useState<DevType>()
  useEffect(() => {
    setHydrated(true)
    const done = localStorage.getItem(DONE_KEY)
    if (done) {
      setDevType(findDevType(done))
      setPhase('already')
    }
    return () => clearTimeout(timer.current)
  }, [])

  const visible = visibleQuestions(QUESTIONS, answers)
  const pos = visible.findIndex((q) => q.id === qid)
  const current = pos >= 0 ? visible[pos] : undefined

  async function submit(final: Answers) {
    if (!turnstileToken) {
      setError('자동 입력 방지 확인이 끝나면 제출할 수 있어요. 잠시만 기다려 주세요.')
      return
    }
    setPhase('sending')
    try {
      await submitResponse({ data: { answers: final, ref, consented: true, turnstileToken } })
      const type = devTypeOf(final)
      // 다시 들어와도 유형을 보여 줄 수 있게 유형 이름만 남긴다
      localStorage.setItem(DONE_KEY, type.slug)
      setDevType(type)
      setPhase('done')
    } catch {
      setPhase('question')
      setError('저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
      // 쓴 토큰은 다시 쓸 수 없으니 새로 받는다
      setTurnstileReset((n) => n + 1)
    }
  }

  // 답이 바뀌면 보이는 문항도 바뀌므로, 다음 문항은 새 답으로 다시 계산한다
  function advance(next: Answers) {
    if (!current) return
    const list = visibleQuestions(QUESTIONS, next)
    const i = list.findIndex((q) => q.id === current.id)
    setError('')
    if (i + 1 >= list.length) void submit(next)
    else setQid(list[i + 1].id)
  }

  function update(next: Answers) {
    clearTimeout(timer.current)
    setAnswers(next)
    setError('')
  }

  if (phase === 'done') {
    return (
      <main style={page}>
        <div style={{ ...column, alignItems: 'flex-start' }}>
          <Heading level={1}>고마워요</Heading>
          <Text size="lg">응답이 익명으로 저장됐어요. 결과는 12월 21일에 누구나 볼 수 있게 공개할게요.</Text>
          {devType && (
            <>
              <DevTypeCard type={devType} label="나의 개발자 유형" />
              <Text>주변 개발자에게도 알려 주세요. 다양한 분들이 답할수록 결과가 정확해져요.</Text>
              <ShareButton type={devType} />
            </>
          )}
        </div>
      </main>
    )
  }

  if (isClosed()) {
    return (
      <main style={page}>
        <div style={column}>
          <Heading level={1}>설문이 마감됐어요</Heading>
          <Text size="lg">참여해 주신 분들 고마워요. 결과는 12월 21일에 누구나 볼 수 있게 공개할게요.</Text>
          <Link to="/">설문 소개로 돌아가기</Link>
        </div>
      </main>
    )
  }

  if (phase === 'already') {
    return (
      <main style={page}>
        <div style={{ ...column, alignItems: 'flex-start' }}>
          <Heading level={1}>이미 답해 주셨어요</Heading>
          <Text size="lg">이 브라우저에서는 응답을 마쳤어요. 결과는 12월 21일에 누구나 볼 수 있게 공개할게요.</Text>
          {devType && (
            <>
              <DevTypeCard type={devType} label="나의 개발자 유형" />
              <ShareButton type={devType} />
            </>
          )}
        </div>
      </main>
    )
  }

  if (phase === 'consent') {
    return (
      <main style={page}>
        <div style={column}>
          <ConsentStep
            onAgree={() => {
              setQid(visible[0].id)
              setPhase('question')
            }}
          />
        </div>
      </main>
    )
  }

  if (phase === 'intro' || !current) {
    return (
      <main style={page}>
        <div style={{ ...column, alignItems: 'flex-start' }}>
          <Tag tone="brand">2026 · 1회차</Tag>
          <Heading level={1}>2026 한국 개발자 설문</Heading>
          <Text size="lg">
            해외 설문에서는 잘 보이지 않는 한국 개발자의 일과 커리어를 묻는 설문이에요. 매년 같은 질문을 드리고, 결과는
            12월 21일에 누구나 볼 수 있게 공개해요.
          </Text>
          <Text>이름도 이메일도 로그인도 필요 없어요. 10분 안팎이면 끝나요.</Text>
          <Button tone="brand" size="lg" disabled={!hydrated} onClick={() => setPhase('consent')}>
            시작하기 <Icon name="chevronRight" size="sm" />
          </Button>
          <Link to="/privacy">개인정보 처리방침</Link>
        </div>
      </main>
    )
  }

  const value = answers[current.id]
  const last = pos === visible.length - 1
  const progress = Math.round((pos / visible.length) * 100)

  return (
    <main style={page}>
      <div
        role="progressbar"
        aria-label="설문 진행률"
        aria-valuenow={pos + 1}
        aria-valuemin={1}
        aria-valuemax={visible.length}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4, background: 'var(--colors-bg-brand-active)' }}
      >
        <div style={{ height: 4, width: `${progress}%`, background: 'var(--colors-bg-solid-brand)', transition: 'width 300ms ease' }} />
      </div>
      <div style={column}>
        <Text size="sm" tone="neutral" muted>
          {pos + 1} / {visible.length}
        </Text>
        <QuestionStep
          question={current}
          value={value}
          error={error}
          onPick={(code) => {
            const next = { ...answers, [current.id]: code }
            update(next)
            timer.current = setTimeout(() => advance(next), AUTO_ADVANCE_MS)
          }}
          onToggle={(code) => {
            const picked = Array.isArray(value) ? value : []
            if (!picked.includes(code) && current.limit && picked.length >= current.limit) {
              setError(`최대 ${current.limit}개까지 고를 수 있어요. 다른 걸 먼저 빼 주세요.`)
              return
            }
            update({ ...answers, [current.id]: picked.includes(code) ? picked.filter((c) => c !== code) : [...picked, code] })
          }}
          onText={(text) => update({ ...answers, [current.id]: text })}
        />
        {last && <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)', alignItems: 'center' }}>
          <Button tone="neutral" variant="outline" onClick={() => (pos > 0 ? setQid(visible[pos - 1].id) : setPhase('consent'))}>
            <Icon name="chevronLeft" size="sm" /> 이전
          </Button>
          <Button
            tone="brand"
            loading={phase === 'sending'}
            onClick={() => {
              if (current.required && isEmpty(value)) {
                setError(current.type === 'multi' ? '하나 이상 골라 주세요.' : current.type === 'long' ? '내용을 적어 주세요.' : '답을 하나 골라 주세요.')
                return
              }
              advance(answers)
            }}
          >
            {last ? '제출하기' : '다음'}
          </Button>
          {!current.required && (
            <Button
              tone="neutral"
              variant="ghost"
              onClick={() => {
                const { [current.id]: _, ...rest } = answers
                update(rest)
                advance(rest)
              }}
            >
              건너뛸게요
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
