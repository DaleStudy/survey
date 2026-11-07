import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Button, Heading, Icon, Tag, Text } from 'daleui'
import { useEffect, useRef, useState } from 'react'
import { ConsentStep } from '@/components/ConsentStep'
import { QuestionStep } from '@/components/QuestionStep'
import { Turnstile } from '@/components/Turnstile'
import { DevTypeCard } from '@/components/DevTypeCard'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { ShareButton } from '@/components/ShareButton'
import { type DevType, devTypeOf, findDevType } from '@/lib/devType'
import { findEdition, isBeta, isClosed } from '@/editions'
import { koDate } from '@/lib/date'
import { OTHER, isEmpty, otherKey, visibleQuestions } from '@/questions/logic'
import { clearProgress, loadProgress, saveProgress } from '@/questions/progress'
import { type Answers, questionsFor } from '@/questions/survey'
import { submitResponse } from '@/server/functions/responses'

export const Route = createFileRoute('/$edition/survey')({
  loader: ({ params }) => {
    const edition = findEdition(params.edition)
    if (!edition?.survey || !questionsFor(edition.id)) throw notFound()
    return edition
  },
  head: ({ loaderData }) => ({ meta: loaderData ? [{ title: loaderData.title }] : [] }),
  validateSearch: (search: Record<string, unknown>): { ref?: string } =>
    typeof search.ref === 'string' ? { ref: search.ref } : {},
  component: Survey,
})

// 하나만 고르는 문항은 고른 걸 잠깐 보여 준 뒤 다음 문항으로 넘긴다
const AUTO_ADVANCE_MS = 300

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

const finished: React.CSSProperties = {
  maxWidth: 560,
  margin: '0 auto',
  padding: '72px 24px 96px',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-40)',
}
const quietAction: React.CSSProperties = {
  display: 'inline-flex',
  gap: 'var(--spacing-4)',
  alignItems: 'center',
  minHeight: 44,
  padding: '0 var(--spacing-8)',
  marginLeft: 'calc(var(--spacing-8) * -1)',
  border: 0,
  background: 'none',
  color: 'inherit',
  font: 'inherit',
  textDecoration: 'none',
  cursor: 'pointer',
}

// 응답을 마쳤거나 마감된 화면. 설문 진행 중이 아니라서 다른 화면으로 갈 수 있게 헤더와 하단을 둔다.
function EndPage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...page, display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>{children}</main>
      <SiteFooter />
    </div>
  )
}

// 응답을 마친 뒤의 화면. 결과 안내 → 내 유형 → 공유 → 그 밖의 행동 순서로 한 번씩만 보여 준다.
function Finished({ saved, title, lead, devType, edition, onRetake }: {
  saved?: boolean
  title: string
  lead: string
  devType?: DevType
  edition: { id: string; title: string }
  onRetake?: () => void
}) {
  return (
    <EndPage>
      <div style={finished}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
          {saved && (
            <div style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
              <Icon name="check" size="sm" tone="success" />
              <Text size="sm" weight="semibold" tone="success">
                응답을 저장했어요
              </Text>
            </div>
          )}
          <Heading level={1}>{title}</Heading>
          <Text size="lg" style={{ lineHeight: 1.6 }}>
            {lead}
          </Text>
        </section>
        {devType && (
          <>
            <DevTypeCard type={devType} label="나의 개발자 유형" />
            <ShareButton type={devType} edition={edition} />
          </>
        )}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-16)',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 'var(--spacing-24)',
            borderTop: '1px solid var(--colors-bg-neutral-hover)',
          }}
        >
          <Link to="/" style={quietAction}>
            <Icon name="chevronLeft" size="sm" /> 처음으로
          </Link>
          {onRetake && (
            <div style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
              <Tag tone="warning">베타</Tag>
              <button type="button" onClick={onRetake} style={{ ...quietAction, color: 'var(--colors-fg-brand)', textDecoration: 'underline' }}>
                다시 답하기
              </button>
            </div>
          )}
        </div>
      </div>
    </EndPage>
  )
}

function Survey() {
  const { ref } = Route.useSearch()
  const edition = Route.useLoaderData()
  const QUESTIONS = questionsFor(edition.id)!
  const resultsNote = edition.resultsAt
    ? `결과와 분석한 인사이트는 ${koDate(edition.resultsAt)}에 누구나 볼 수 있게 공개할게요.`
    : '결과와 분석한 인사이트는 정리되는 대로 누구나 볼 수 있게 공개할게요.'
  // 같은 브라우저에서 다시 답하지 않게 남기는 표시. 서버로는 보내지 않는다.
  const DONE_KEY = `survey-${edition.id}-done`
  const PROGRESS_KEY = `survey-${edition.id}-progress`
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

  useEffect(() => {
    if (phase === 'question' && qid) saveProgress(PROGRESS_KEY, { answers, qid })
  }, [phase, answers, qid])

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
      await submitResponse({ data: { edition: edition.id, answers: final, ref, consented: true, turnstileToken } })
      const type = edition.devTypes ? devTypeOf(final) : undefined
      // 다시 들어와도 유형을 보여 줄 수 있게 유형 이름만 남긴다
      localStorage.setItem(DONE_KEY, type?.slug ?? 'done')
      clearProgress(PROGRESS_KEY)
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

  // 베타 테스트 중에는 문항을 고친 뒤 다시 답해 볼 수 있게 한다
  function retake() {
    localStorage.removeItem(DONE_KEY)
    clearProgress(PROGRESS_KEY)
    setAnswers({})
    setQid(null)
    setDevType(undefined)
    setTurnstileToken(null)
    setPhase('intro')
  }

  function update(next: Answers) {
    clearTimeout(timer.current)
    setAnswers(next)
    setError('')
  }

  if (phase === 'done') {
    return (
      <Finished
        saved
        title="고마워요"
        lead={`익명으로 저장했어요. ${resultsNote}`}
        devType={devType}
        edition={edition}
        onRetake={isBeta(edition) ? retake : undefined}
      />
    )
  }

  if (isClosed(edition)) {
    return <Finished title="설문이 마감됐어요" lead={`참여해 주신 분들 고마워요. ${resultsNote}`} edition={edition} />
  }

  if (phase === 'already') {
    return (
      <Finished
        title="이미 답해 주셨어요"
        lead={`이 브라우저에서는 응답을 마쳤어요. ${resultsNote}`}
        devType={devType}
        edition={edition}
        onRetake={isBeta(edition) ? retake : undefined}
      />
    )
  }

  if (phase === 'consent') {
    return (
      <main style={page}>
        <div style={column}>
          <ConsentStep
            deleteAt={edition.deleteAt}
            onAgree={() => {
              // 새로고침했다면 동의를 다시 받은 뒤 머물던 문항부터 잇는다
              const saved = loadProgress(PROGRESS_KEY, QUESTIONS)
              if (saved) setAnswers(saved.answers)
              setQid(saved?.qid ?? visible[0].id)
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
          <Heading level={1}>{edition.title}</Heading>
          <Text size="lg">
            글로벌 설문조사에서는 잘 보이지 않는 한국 개발자의 일과 커리어를 묻는 설문조사예요. {resultsNote}
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
            // 기타는 직접 적을 수 있게 머문다
            if (code !== OTHER) timer.current = setTimeout(() => advance(next), AUTO_ADVANCE_MS)
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
          otherText={typeof answers[otherKey(current.id)] === 'string' ? (answers[otherKey(current.id)] as string) : ''}
          onOtherText={(text) => update({ ...answers, [otherKey(current.id)]: text })}
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
