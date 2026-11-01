import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { getDb } from '@/db'
import { responses } from '@/db/schema'
import { findEdition, isClosed } from '@/editions'
import { verifyTurnstile } from '@/lib/turnstile'
import { cleanAnswers } from '@/questions/logic'
import { type Answers, questionsFor } from '@/questions/survey'

export const submitResponse = createServerFn({ method: 'POST' })
  .validator((input: { edition: string; answers: Answers; ref?: string; consented: true; turnstileToken: string }) => input)
  .handler(async ({ data }) => {
    // 동의 화면을 거치지 않은 요청은 받지 않는다 (개인정보 보호법 제15조, 제28조의8)
    if (data.consented !== true) throw new Error('동의가 필요해요.')
    const edition = findEdition(data.edition)
    const questions = questionsFor(data.edition)
    if (!edition?.survey || !questions) throw new Error('없는 설문이에요.')
    if (isClosed(edition)) throw new Error('설문이 마감됐어요.')
    // 자동화된 대량 제출을 막는다. 토큰은 한 번만 쓸 수 있다.
    const human = await verifyTurnstile({
      token: data.turnstileToken,
      secret: env.TURNSTILE_SECRET,
      hostnames: env.TURNSTILE_HOSTNAMES,
    })
    if (!human) throw new Error('자동 입력 방지 확인에 실패했어요.')
    // 화면과 같은 규칙으로 다시 검사한다. 숨겨진 문항의 답은 여기서 버려진다.
    const result = cleanAnswers(questions, data.answers)
    if (!result.ok) throw new Error(result.error)
    await getDb(env.DB)
      .insert(responses)
      .values({
        id: crypto.randomUUID(),
        edition: edition.id,
        answers: result.answers,
        ref: data.ref?.slice(0, 64) || null,
        createdAt: new Date().toISOString(),
      })
  })
