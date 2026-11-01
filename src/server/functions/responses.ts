import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { getDb } from '@/db'
import { responses } from '@/db/schema'
import { cleanAnswers } from '@/questions/logic'
import { type Answers, QUESTIONS, YEAR } from '@/questions/survey'

export const submitResponse = createServerFn({ method: 'POST' })
  .validator((input: { answers: Answers; ref?: string; consented: true }) => input)
  .handler(async ({ data }) => {
    // 동의 화면을 거치지 않은 요청은 받지 않는다 (개인정보 보호법 제15조, 제28조의8)
    if (data.consented !== true) throw new Error('동의가 필요해요.')
    // 화면과 같은 규칙으로 다시 검사한다. 숨겨진 문항의 답은 여기서 버려진다.
    const result = cleanAnswers(QUESTIONS, data.answers)
    if (!result.ok) throw new Error(result.error)
    await getDb(env.DB)
      .insert(responses)
      .values({
        id: crypto.randomUUID(),
        year: YEAR,
        answers: result.answers,
        ref: data.ref?.slice(0, 64) || null,
        createdAt: new Date().toISOString(),
      })
  })
