import { Button, Heading, Icon, Tag, Text, TextInput } from 'daleui'
import { LONG_MAX, OTHER, OTHER_MAX, picksOther } from '@/questions/logic'
import { sectionIcon } from '@/questions/sectionIcons'
import { type Answer, type Question, SCALE_POINTS } from '@/questions/survey'

interface Props {
  question: Question
  value: Answer | undefined
  error: string
  onPick: (code: string) => void
  onToggle: (code: string) => void
  onText: (text: string) => void
  otherText: string
  onOtherText: (text: string) => void
}

// 숫자 키(1~9)로 고를 수 있는 선택지 수. 설문 화면(Survey)의 키 처리와 같은 값이다.
export const KEY_OPTIONS = 9

// 선택지 행의 :hover, :focus-visible 과 키 안내. 키 안내는 마우스가 있는 화면에서만 보인다.
const OPTION_CSS = `
.q-option { display: flex; gap: 14px; align-items: center; width: 100%; min-height: 56px; padding: 0 18px; box-sizing: border-box; border-radius: 12px; border: 1px solid var(--colors-border-neutral-active); background: var(--colors-app-bg); color: var(--colors-fg-neutral); font: inherit; font-size: 1.0625rem; font-weight: 500; line-height: 1.35; text-align: left; cursor: pointer; }
.q-option:hover { border-color: var(--colors-border-brand); background: var(--colors-bg-brand); }
.q-option:focus-visible { outline: 2px solid var(--colors-border-brand-focus); outline-offset: 2px; }
.q-option[aria-checked='true'] { border: 2px solid var(--colors-border-brand-active); padding: 0 17px; background: var(--colors-bg-brand-hover); color: var(--colors-fg-neutral-active); font-weight: 700; }
.q-mark { display: inline-flex; flex: none; width: 22px; height: 22px; box-sizing: border-box; align-items: center; justify-content: center; border: 2px solid var(--colors-border-neutral-active); color: var(--colors-fg-solid-brand); }
.q-option[aria-checked='true'] .q-mark { border: 0; background: var(--colors-bg-solid-brand); }
.q-key { display: none; margin-left: auto; min-width: 24px; padding: 2px 6px; box-sizing: border-box; border-radius: 4px; border: 1px solid var(--colors-bg-neutral-active); color: var(--colors-fg-neutral-placeholder); font-family: var(--fonts-mono); font-size: 0.75rem; font-weight: 500; text-align: center; }
@media (hover: hover) and (pointer: fine) { .q-key { display: inline-block; } }
`

export function QuestionStep({ question: q, value, error, onPick, onToggle, onText, otherText, onOtherText }: Props) {
  const picked = Array.isArray(value) ? value : []
  const many = q.options.length >= 9
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
      <style>{OPTION_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)' }}>
          <Tag tone={q.section.includes('AI') ? 'brand' : 'neutral'}>
            <span style={{ display: 'inline-flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
              <Icon name={sectionIcon(q.sectionId)} size="sm" />
              {q.section}
            </span>
          </Tag>
          {!q.required && <Tag tone="neutral">건너뛰어도 돼요</Tag>}
        </div>
        <Heading level={2} wordBreak="cjk" id="question" style={{ fontSize: 'clamp(1.5rem, 1.5vw + 1rem, 2.125rem)', lineHeight: 1.35, fontWeight: 800, letterSpacing: '-0.025em' }}>
          {q.label}
        </Heading>
        {q.help && (
          <Text size="lg" muted>
            {q.help}
          </Text>
        )}
      </div>

      {(q.type === 'single' || q.type === 'multi') && (
        <div
          role={q.type === 'multi' ? 'group' : 'radiogroup'}
          aria-labelledby="question"
          style={{
            display: 'grid',
            gridTemplateColumns: many ? 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))' : '1fr',
            gap: 10,
          }}
        >
          {q.options.map((o, i) => {
            const on = q.type === 'multi' ? picked.includes(o.code) : value === o.code
            return (
              <button
                key={o.code}
                type="button"
                className="q-option"
                role={q.type === 'multi' ? 'checkbox' : 'radio'}
                aria-checked={on}
                onClick={() => (q.type === 'multi' ? onToggle(o.code) : onPick(o.code))}
              >
                <span aria-hidden="true" className="q-mark" style={{ borderRadius: q.type === 'multi' ? 'var(--radii-sm)' : 'var(--radii-full)' }}>
                  {on && (q.type === 'multi' ? <Icon name="check" size="xs" /> : <span style={{ width: 8, height: 8, borderRadius: 'var(--radii-full)', background: 'currentColor' }} />)}
                </span>
                <span>{o.label}</span>
                {i < KEY_OPTIONS && (
                  <kbd aria-hidden="true" className="q-key">
                    {i + 1}
                  </kbd>
                )}
              </button>
            )
          })}
        </div>
      )}

      {q.options.some((o) => o.code === OTHER) && picksOther(value) && (
        <div style={{ maxWidth: 440 }}>
          <TextInput
            label="기타 (선택)"
            placeholder="무엇인지 적어 주세요"
            value={otherText}
            maxLength={OTHER_MAX}
            autoFocus
            onChange={(e) => onOtherText(e.target.value)}
          />
        </div>
      )}

      {q.type === 'scale' && q.scale && (
        <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
          <div
            role="radiogroup"
            aria-labelledby="question"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${SCALE_POINTS.length}, minmax(0, 1fr))`, gap: 'var(--spacing-8)' }}
          >
            {SCALE_POINTS.map((v) => (
              <Button
                key={v}
                role="radio"
                aria-checked={value === v}
                variant={value === v ? 'solid' : 'outline'}
                tone={value === v ? 'brand' : 'neutral'}
                size="lg"
                fullWidth
                onClick={() => onPick(v)}
              >
                {v}
              </Button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <Text size="sm" tone="neutral">
              {q.scale.min.label}
            </Text>
            <Text size="sm" tone="neutral">
              {q.scale.max.label}
            </Text>
          </div>
        </div>
      )}

      {q.type === 'long' && (
        <textarea
          aria-labelledby="question"
          rows={5}
          maxLength={LONG_MAX}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onText(e.target.value)}
          placeholder="자유롭게 적어 주세요"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            resize: 'vertical',
            padding: 'var(--spacing-16)',
            border: '1px solid var(--colors-border-neutral-active)',
            borderRadius: 'var(--radii-md)',
            background: 'var(--colors-app-bg)',
            color: 'var(--colors-fg-neutral)',
            font: 'inherit',
            lineHeight: 1.6,
          }}
        />
      )}

      {error && (
        <div role="alert" style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
          <Icon name="circleAlert" size="sm" tone="danger" />
          <Text size="sm" tone="danger">
            {error}
          </Text>
        </div>
      )}
    </div>
  )
}
