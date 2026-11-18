import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Button, Heading, Icon, Tag, Text } from 'daleui'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ConsentStep } from '@/components/ConsentStep'
import { QuestionStep } from '@/components/QuestionStep'
import { Turnstile } from '@/components/Turnstile'
import { DevTypeCard } from '@/components/DevTypeCard'
import { DevTypeGrid } from '@/components/DevTypeGrid'
import { ReadmeBadge } from '@/components/ReadmeBadge'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { ShareButton } from '@/components/ShareButton'
import { StarBurst } from '@/components/StarBurst'
import { type DevType, devTypeOf, findDevType } from '@/lib/devType'
import { doneKey, findEdition, isBeta, isClosed } from '@/editions'
import { koDate } from '@/lib/date'
import { heroFrame, heroImage } from '@/lib/brand'
import { KOREA } from '@/lib/stackOverflow'
import { OTHER, isEmpty, otherKey, toggleOption, visibleQuestions } from '@/questions/logic'
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

// 제출하는 동안 보여 주는 분석 화면. 유형을 정하는 두 문항(ai_frequency, company_criteria)을 짚어서
// 결과가 내 답에서 나온다는 걸 보여 준다. 제출 대기와 겹치므로 실제로 늘어나는 시간은 짧다.
const ANALYSIS_STEPS = ['응답을 익명으로 저장하는 중', 'AI 사용 습관 읽는 중', '커리어 우선순위 확인 중', '2027년 커리어 한 줄 뽑는 중']
const ANALYSIS_STEP_MS = 1200
const ANALYSIS_MIN_MS = ANALYSIS_STEPS.length * ANALYSIS_STEP_MS + 400
// 별 회전과 체크 표시에 쓰는, 살짝 지나쳤다 돌아오는 곡선
const POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

function Analyzing() {
  const [done, setDone] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setDone((n) => Math.min(n + 1, ANALYSIS_STEPS.length)), ANALYSIS_STEP_MS)
    return () => clearInterval(t)
  }, [])
  return (
    <main style={page}>
      <div role="status" aria-live="polite" aria-atomic="false" style={{ ...column, maxWidth: 560 }}>
        {/* 단계마다 별이 돈다. 모션 줄이기 설정에서는 돌지 않는다 */}
        <style>{'@media (prefers-reduced-motion: reduce) { .analyzing-star { transition: none !important; } }'}</style>
        <span
          className="analyzing-star"
          aria-hidden
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            transform: `rotate(${done * 144}deg)`,
            transition: `transform 700ms ${POP}`,
          }}
        >
          <Icon name="star" size="lg" tone="brand" fill="currentColor" style={{ width: 40, height: 40 }} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
          <Heading level={1}>두구두구…</Heading>
          <Text size="lg" tone="neutral" muted>
            내 답도 2026 한국 개발자 결과에 함께 담겨요!
          </Text>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
          {ANALYSIS_STEPS.map((step, i) => (
            <li
              key={step}
              style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center', opacity: i <= done ? 1 : 0.35, transition: 'opacity 200ms ease' }}
            >
              {/* 끝난 단계에만 체크. 자리는 비워 둬서 글자가 움직이지 않게 한다 */}
              <span style={{ display: 'inline-flex', transform: `scale(${i < done ? 1 : 0})`, transition: `transform 300ms ${POP}` }}>
                <Icon name="check" size="sm" tone="success" />
              </span>
              <Text size="lg">{i === done ? `${step}…` : step}</Text>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

const bar: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', boxSizing: 'border-box' }

// 아래 버튼 줄. 데스크톱은 이전 | 건너뛸게요 ... 다음, 휴대폰은 다음을 넓게(1:2) 두고 건너뛸게요를 위로 올린다.
const SURVEY_CSS = `
.q-actions { display: flex; flex-wrap: wrap; gap: var(--spacing-8); align-items: center; }
.q-next { margin-left: auto; min-width: 140px; }
@media (max-width: 640px) {
  .q-actions { display: grid; grid-template-columns: 1fr 2fr; }
  .q-skip { grid-column: 1 / -1; order: -1; }
  .q-next { margin-left: 0; min-width: 0; }
  .q-step-label, .q-saved { display: none !important; }
}
`

// 응답을 마쳤거나 마감된 화면. 설문 진행 중이 아니라서 다른 화면으로 갈 수 있게 헤더와 하단을 둔다.
function EndPage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...page, background: 'var(--colors-app-bg)', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>{children}</main>
      <SiteFooter />
    </div>
  )
}

// 응답을 마친 뒤의 화면. 유형이 보상이자 공유할 거리라서 내 유형 → 공유를 첫 화면에 두고,
// 결과 일정 안내와 다른 유형 보기는 그 아래에 둔다.
function Finished({ saved, title, lead, devType, edition, onRetake }: {
  saved?: boolean
  title: string
  lead: string
  devType?: DevType
  edition: { id: string; title: string }
  onRetake?: () => void
}) {
  const leadText = (
    <Text size="lg" style={{ lineHeight: 1.7 }}>
      {lead}
    </Text>
  )
  const wrap: React.CSSProperties = { maxWidth: devType ? 1120 : 640, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }
  return (
    <EndPage>
      <section style={{ ...wrap, paddingTop: 56, paddingBottom: devType ? 72 : 32, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-40)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)', maxWidth: 720 }}>
          {saved && (
            <div style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
              <Icon name="check" size="sm" tone="success" />
              <Text size="sm" weight="semibold" tone="success">
                익명으로 저장했어요
              </Text>
            </div>
          )}
          <Heading level={1} wordBreak="cjk" style={{ fontSize: 'clamp(2.25rem, 2vw + 1.5rem, 3rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {title}
          </Heading>
          {!devType && leadText}
        </div>
        {devType && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-32)', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 480px', minWidth: 0 }}>
              {saved && <StarBurst />}
              <DevTypeCard type={devType} label="나의 개발자 유형" />
            </div>
            <aside style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
              <div style={{ ...panel, background: 'var(--colors-bg-brand)', border: '1px solid var(--colors-bg-brand-active)' }}>
                <ShareButton type={devType} edition={edition} />
              </div>
              <div style={{ padding: '0 var(--spacing-4)' }}>{leadText}</div>
              <div style={{ ...panel, border: '1px solid var(--colors-bg-neutral-hover)' }}>
                <ReadmeBadge edition={edition} />
              </div>
            </aside>
          </div>
        )}
      </section>
      {devType && (
        <section
          aria-labelledby="types"
          style={{ background: 'var(--colors-bg-brand)', borderTop: '1px solid var(--colors-bg-brand-active)', borderBottom: '1px solid var(--colors-bg-brand-active)' }}
        >
          <div style={{ ...wrap, paddingTop: 64, paddingBottom: 80, display: 'flex', flexDirection: 'column', gap: 28 }}>
            <Heading level={2} size={4} id="types">
              여섯 가지 유형 모두 보기
            </Heading>
            <DevTypeGrid current={devType.slug} currentLabel="나" />
          </div>
        </section>
      )}
      <div style={{ ...wrap, paddingTop: 'var(--spacing-24)', paddingBottom: 'var(--spacing-48)', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-16)', justifyContent: 'space-between', alignItems: 'center' }}>
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
    </EndPage>
  )
}

const panel: React.CSSProperties = { padding: 28, borderRadius: 20 }

function Survey() {
  const edition = Route.useLoaderData()
  const QUESTIONS = questionsFor(edition.id)!
  const resultsNote = edition.resultsAt
    ? `결과와 분석한 인사이트는 ${koDate(edition.resultsAt)}에 모두 공개해요.`
    : '결과와 분석한 인사이트는 정리되는 대로 모두 공개해요.'
  // 같은 브라우저에서 다시 답하지 않게 남기는 표시. 서버로는 보내지 않는다.
  const DONE_KEY = doneKey(edition)
  const PROGRESS_KEY = `survey-${edition.id}-progress`
  const [answers, setAnswers] = useState<Answers>({})
  const [qid, setQid] = useState<string | null>(null)
  // 어느 화면부터 보일지는 브라우저 저장소를 읽어야 알 수 있어서, 읽기 전(서버 렌더링 포함)에는 빈 화면을 둔다
  const [phase, setPhase] = useState<'loading' | 'intro' | 'consent' | 'question' | 'sending' | 'done' | 'already'>('loading')
  const [error, setError] = useState('')
  // 마지막 문항 화면에서 받는다. 토큰은 5분이면 만료돼서 설문을 시작할 때 받으면 늦다.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReset, setTurnstileReset] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // 응답을 마치면 브라우저에서 계산해 보여 준다. 서버에는 보내지 않는다.
  const [devType, setDevType] = useState<DevType>()
  // 그리기 전에 화면을 정해야 빈 화면이 깜빡이지 않는다
  useLayoutEffect(() => {
    const done = localStorage.getItem(DONE_KEY)
    if (done) {
      setDevType(findDevType(done))
      setPhase('already')
    } else {
      // 진행 중인 답은 동의한 뒤에만 저장되므로, 남아 있으면 이 탭에서 이미 동의한 것이다
      const saved = loadProgress(PROGRESS_KEY, QUESTIONS)
      if (saved) {
        setAnswers(saved.answers)
        setQid(saved.qid)
        setPhase('question')
      } else setPhase('intro')
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
    // 분석 화면이 바로 사라지지 않게 최소 시간을 기다린다
    const minWait = edition.devTypes && new Promise((r) => setTimeout(r, ANALYSIS_MIN_MS))
    try {
      await submitResponse({ data: { edition: edition.id, answers: final, consented: true, turnstileToken } })
      const type = edition.devTypes ? devTypeOf(final) : undefined
      // 다시 들어와도 유형을 보여 줄 수 있게 유형 이름만 남긴다. 기다리는 동안 새로고침해도 남도록 저장 직후에 둔다
      localStorage.setItem(DONE_KEY, type?.slug ?? 'done')
      clearProgress(PROGRESS_KEY)
      await minWait
      setDevType(type)
      setPhase('done')
    } catch {
      setPhase('question')
      setError('저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
      // 쓴 토큰은 다시 쓸 수 없으니 비우고 새로 받는다
      setTurnstileToken(null)
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

  function pick(code: string) {
    if (!current) return
    const next = { ...answers, [current.id]: code }
    update(next)
    // 기타는 직접 적을 수 있게 머문다
    if (code !== OTHER) timer.current = setTimeout(() => advance(next), AUTO_ADVANCE_MS)
  }

  function toggle(code: string) {
    if (!current) return
    const picked = answers[current.id]
    const next = toggleOption(current, Array.isArray(picked) ? picked : [], code)
    if (!next) {
      setError(`최대 ${current.limit}개까지 고를 수 있어요. 다른 걸 먼저 빼 주세요.`)
      return
    }
    update({ ...answers, [current.id]: next })
  }

  if (phase === 'done') {
    return (
      <Finished
        saved
        title={devType ? '내 유형이 나왔어요!' : '수고했어요!'}
        lead={`전체 설문 ${resultsNote}`}
        devType={devType}
        edition={edition}
        onRetake={isBeta(edition) ? retake : undefined}
      />
    )
  }

  if (isClosed(edition)) {
    return <Finished title="설문이 마감됐어요" lead={`참여해 주신 분들 고마워요. ${resultsNote}`} edition={edition} />
  }

  if (phase === 'loading') return <main style={page} />

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
              setQid(qid ?? visible[0].id)
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
          <figure style={{ ...heroFrame, flex: 'none', alignSelf: 'stretch' }}>
            <img src="/types/welcome.jpg" alt="" width={1200} height={630} style={heroImage} />
          </figure>
          <Heading level={1}>{edition.title}</Heading>
          <Text size="lg" style={{ lineHeight: 1.7 }}>
            <b style={{ color: 'var(--colors-fg-brand)' }}>“그래서 한국은?”</b> 해외 개발자 설문 결과를 볼 때마다 남던 물음이에요. Stack Overflow 설문에 답한 한국 개발자는 {KOREA}명뿐이고, 국내 설문은 명맥이 끊겼죠. 그래서 달레 스터디가 다시 시작합니다.
          </Text>
          <Text size="lg" style={{ lineHeight: 1.7 }}>
            한 번으로 끝내지 않고 해마다 같은 질문을 던져 한국 개발자의 변화를 기록해 나가려고 합니다. 현업 개발자도, 개발자를 꿈꾸며 공부하는 분도 함께해 주세요. 다양한 분이 답할수록 한국 개발자의 모습을 더 넓게 담을 수 있습니다.
          </Text>
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-12)',
              alignItems: 'flex-start',
              padding: 'var(--spacing-20) var(--spacing-24)',
              borderRadius: 16,
              background: 'var(--colors-app-bg)',
              border: '1px solid var(--colors-bg-brand-active)',
            }}
          >
            <Icon name="handHeart" tone="brand" style={{ flex: 'none', marginTop: 2 }} />
            <Text style={{ lineHeight: 1.7 }}>
              바쁜 와중에 시간 내어 주셔서 진심으로 감사합니다. 한 분 한 분의 답이 모여 한국 개발자의 오늘을 담은 기록이 됩니다.
            </Text>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8) var(--spacing-20)' }}>
            {(
              [
                ['clock', '10분 안팎', 'neutral'],
                ['eyeOff', '이름·이메일·로그인 없이 익명', 'neutral'],
                ...(edition.devTypes ? [['star', '마지막엔 개발자 유형과 2027년 커리어 한 줄', 'brand'] as const] : []),
              ] as const
            ).map(([icon, text, tone]) => (
              <span key={icon} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                <Icon name={icon} size="sm" tone={tone} {...(icon === 'star' && { fill: 'currentColor' })} />
                <Text size="sm" tone={tone} weight={tone === 'brand' ? 'semibold' : undefined}>
                  {text}
                </Text>
              </span>
            ))}
          </div>
          <Button tone="brand" size="lg" onClick={() => setPhase('consent')}>
            시작하기 <Icon name="chevronRight" size="sm" />
          </Button>
          <Link to="/privacy">개인정보 처리방침</Link>
        </div>
      </main>
    )
  }

  if (phase === 'sending' && edition.devTypes) return <Analyzing />

  const value = answers[current.id]
  const last = pos === visible.length - 1
  const picked = Array.isArray(value) ? value : []
  // 진행 막대는 섹션 단위다. 문항 수는 답에 따라 바뀌지만 섹션은 그대로라서 어디쯤인지 더 정확하다.
  const sections = [...new Map(QUESTIONS.map((q) => [q.sectionId, q.section])).entries()].map(([id, title], i, all) => {
    const inSection = visible.filter((q) => q.sectionId === id)
    const here = all.findIndex(([sid]) => sid === current.sectionId)
    const done = inSection.length ? inSection.filter((q) => visible.indexOf(q) < pos).length / inSection.length : i < here ? 1 : 0
    return { id, title: title.replace(/^올해의 주제\s*/, ''), done, now: id === current.sectionId }
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--colors-app-bg)', color: 'var(--colors-fg-neutral)' }}>
      <style>{SURVEY_CSS}</style>
      <header style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--colors-app-bg)', borderBottom: '1px solid var(--colors-bg-neutral-hover)' }}>
        <div style={{ ...bar, padding: 'var(--spacing-8) 24px', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8) var(--spacing-24)', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/$edition" params={{ edition: edition.id }} style={quietAction}>
            <Icon name="x" size="sm" /> 그만하기
          </Link>
          <Text size="sm" muted className="q-saved" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <Icon name="check" size="sm" tone="success" /> 이 탭에 임시 저장돼요
          </Text>
        </div>
        <div
          role="progressbar"
          aria-label="설문 진행률"
          aria-valuenow={pos + 1}
          aria-valuemin={1}
          aria-valuemax={visible.length}
          aria-valuetext={`${current.section}, ${visible.length}문항 가운데 ${pos + 1}번째`}
          style={{ ...bar, padding: '4px 24px 14px', display: 'grid', gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))`, gap: 6 }}
        >
          {sections.map((s) => (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)', minWidth: 0 }}>
              <div style={{ height: 6, borderRadius: 'var(--radii-full)', background: 'var(--colors-bg-brand-active)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.done * 100}%`, background: 'var(--colors-bg-solid-brand)', transition: 'width 300ms ease' }} />
              </div>
              <span
                aria-hidden="true"
                className="q-step-label"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: s.now ? 700 : 500,
                  color: s.now ? 'var(--colors-fg-brand)' : 'var(--colors-fg-neutral-placeholder)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </header>

      <main style={{ flex: 1, padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <Text size="sm" weight="bold" tone="brand">
            질문 {pos + 1} / {visible.length}
          </Text>
          <QuestionStep
            question={current}
            value={value}
            error={error}
            onPick={pick}
            onToggle={toggle}
            onText={(text) => update({ ...answers, [current.id]: text })}
            otherText={typeof answers[otherKey(current.id)] === 'string' ? (answers[otherKey(current.id)] as string) : ''}
            onOtherText={(text) => update({ ...answers, [otherKey(current.id)]: text })}
          />
          {last && <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />}
        </div>
      </main>

      <footer style={{ position: 'sticky', bottom: 0, background: 'var(--colors-app-bg)', borderTop: '1px solid var(--colors-bg-neutral-hover)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: 'var(--spacing-12) 24px var(--spacing-16)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {current.type === 'multi' && (
            <Text size="sm" muted style={{ textAlign: 'center' }}>
              <b style={{ color: 'var(--colors-fg-brand)' }}>{picked.length}</b>
              {current.limit ? ` / ${current.limit}개 골랐어요` : '개 골랐어요. 여러 개 골라도 돼요.'}
            </Text>
          )}
          <div className="q-actions">
            <div className="q-prev">
              <Button tone="neutral" variant="outline" size="lg" fullWidth onClick={() => (pos > 0 ? setQid(visible[pos - 1].id) : setPhase('consent'))}>
                <Icon name="chevronLeft" size="sm" /> 이전
              </Button>
            </div>
            {!current.required && (
              <div className="q-skip">
                <Button
                  tone="neutral"
                  variant="ghost"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    const { [current.id]: _, ...rest } = answers
                    update(rest)
                    advance(rest)
                  }}
                >
                  건너뛸게요
                </Button>
              </div>
            )}
            <div className="q-next">
              <Button
                tone="brand"
                size="lg"
                fullWidth
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
