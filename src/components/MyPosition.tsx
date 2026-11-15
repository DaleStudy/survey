import { Select, Text } from 'daleui'
import { useState } from 'react'
import { BRAND, BRAND_SOFT, LIKERT } from '@/lib/chartColors'
import { MIN_GROUP, type ResultSet } from '@/results/aggregate'
import { POSITION, distribution, position, positionChoices } from '@/results/position'

const percent = (share: number) => Math.round(share * 100)
// 낮은 구간은 척도의 가운데 회색, 같은 구간은 브랜드 보라, 높은 구간은 옅은 보라. 칸 아래에 이름과 비율을 함께 적는다.
const SEGMENTS = [
  { key: 'below', label: '나보다 낮은 구간', color: LIKERT[2] },
  { key: 'same', label: '같은 구간', color: BRAND },
  { key: 'above', label: '나보다 높은 구간', color: BRAND_SOFT },
] as const

// 고른 값은 이 컴포넌트의 상태로만 두고 주소나 서버로 보내지 않는다(src/results/position.ts)
export function MyPosition({ result }: { result: ResultSet }) {
  const [by, setBy] = useState('')
  const [group, setGroup] = useState('')
  const [salary, setSalary] = useState('')
  const breakdowns = result.breakdowns.filter((b) => POSITION.by.includes(b.id))
  const breakdown = breakdowns.find((b) => b.id === by)
  const short = (label: string) => label.replace(/별$/, '')
  const dist = by ? (group ? distribution(result, by, group) : undefined) : distribution(result)
  const p = dist && salary ? position(dist.codes, dist.shares, salary) : undefined
  const who = breakdown ? `${short(breakdown.label)} ${breakdown.groups.find((g) => g.code === group)?.label}` : '전체'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-12)' }}>
        <Select
          label="누구와 비교할까요?"
          value={by}
          onChange={(e) => {
            setBy(e.target.value)
            setGroup('')
          }}
        >
          <option value="">전체 응답자</option>
          {breakdowns.map((b) => (
            <option key={b.id} value={b.id}>
              같은 {short(b.label)}
            </option>
          ))}
        </Select>
        {breakdown && (
          <Select label={`나의 ${short(breakdown.label)}`} placeholder="골라 주세요" value={group} onChange={(e) => setGroup(e.target.value)}>
            {breakdown.groups.map((g) => {
              // 응답자가 적어서 숨긴 칸은 분포가 없어서 고를 수 없다
              const hidden = breakdown.questions[POSITION.question]?.find((x) => x.group === g.code)?.hidden ?? true
              return (
                <option key={g.code} value={g.code} disabled={hidden}>
                  {g.label}
                  {hidden ? ` (응답자가 ${MIN_GROUP}명보다 적어요)` : ''}
                </option>
              )
            })}
          </Select>
        )}
        <Select label="나의 세전 연봉" placeholder="골라 주세요" value={salary} onChange={(e) => setSalary(e.target.value)}>
          {positionChoices(result).map((o) => (
            <option key={o.code} value={o.code}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {p && dist ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
          <Text weight="semibold" style={{ fontSize: '1.125rem', lineHeight: 1.6 }} aria-live="polite">
            {who} 응답자 {dist.ranked.toLocaleString()}명 가운데 {headline(p)}
          </Text>
          <div role="img" aria-label={SEGMENTS.map((s) => `${s.label} ${percent(p[s.key])}%`).join(', ')} style={{ display: 'flex', height: 28, gap: 2, borderRadius: 6, overflow: 'hidden' }}>
            {SEGMENTS.map((s) => (
              <div key={s.key} style={{ width: `${p[s.key] * 100}%`, background: s.color }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8) var(--spacing-20)' }}>
            {SEGMENTS.map((s) => (
              <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                <span style={{ width: 10, height: 10, borderRadius: 10, background: s.color }} />
                {s.label} {percent(p[s.key])}%
              </span>
            ))}
          </div>
        </div>
      ) : (
        <Text size="sm" muted>
          비교할 사람과 연봉 구간을 고르면 그 안에서 어디쯤인지 보여 드려요.
        </Text>
      )}
      <Text size="sm" muted>
        성과급을 뺀 세전 계약 연봉 기준이고, 답하지 않은 사람은 빼고 셌어요. 연봉을 구간으로 물어서 위치도 범위로 나와요. 고른 값은 이 화면에서만 쓰고 어디에도 보내지 않아요.
      </Text>
    </div>
  )
}

// 연봉을 구간으로만 알아서 정확한 백분위 대신 "상위 a~b%" 범위로 말한다
function headline(p: { below: number; same: number; above: number }): string {
  const bottom = percent(p.above + p.same)
  if (p.above === 0) return `가장 높은 구간이에요. 상위 ${bottom}% 안에 들어요.`
  if (p.below === 0) return `가장 낮은 구간이에요. 하위 ${percent(p.same)}% 안에 들어요.`
  return `상위 ${percent(p.above)}~${bottom}% 사이예요.`
}
