import { Button, Heading, Icon, Tag, Text, TextInput } from 'daleui'
import { OTHER, OTHER_MAX, picksOther } from '@/questions/logic'
import type { Answer, Question } from '@/questions/survey'

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

export function QuestionStep({ question: q, value, error, onPick, onToggle, onText, otherText, onOtherText }: Props) {
  const picked = Array.isArray(value) ? value : []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)' }}>
          <Tag tone={q.section.includes('AI') ? 'brand' : 'neutral'}>{q.section}</Tag>
          {!q.required && <Tag tone="neutral">선택 · 건너뛰어도 돼요</Tag>}
        </div>
        <Heading level={2} size={3} id="question">
          {q.label}
        </Heading>
        {q.help && (
          <Text tone="neutral" muted>
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
            gridTemplateColumns: q.options.length >= 9 ? 'repeat(auto-fill, minmax(220px, 1fr))' : '1fr',
            gap: 'var(--spacing-8)',
            maxWidth: q.options.length >= 9 ? 640 : 440,
          }}
        >
          {q.options.map((o) => {
            const on = q.type === 'multi' ? picked.includes(o.code) : value === o.code
            return (
              <Button
                key={o.code}
                role={q.type === 'multi' ? 'checkbox' : 'radio'}
                aria-checked={on}
                variant={on ? 'solid' : 'outline'}
                tone={on ? 'brand' : 'neutral'}
                size={q.options.length >= 9 ? 'md' : 'lg'}
                fullWidth
                onClick={() => (q.type === 'multi' ? onToggle(o.code) : onPick(o.code))}
              >
                {o.label}
              </Button>
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

      {q.type === 'multi' && (
        <Text size="sm" tone="neutral" muted>
          {picked.length}개 골랐어요 · {q.limit ? `최대 ${q.limit}개` : '여러 개 골라도 돼요'}
        </Text>
      )}

      {q.type === 'scale' && q.scale && (
        <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
          <div
            role="radiogroup"
            aria-labelledby="question"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 'var(--spacing-8)' }}
          >
            {['1', '2', '3', '4', '5'].map((v) => (
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
              1 · {q.scale.min.label}
            </Text>
            <Text size="sm" tone="neutral">
              5 · {q.scale.max.label}
            </Text>
          </div>
        </div>
      )}

      {q.type === 'long' && (
        <textarea
          aria-labelledby="question"
          rows={5}
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
