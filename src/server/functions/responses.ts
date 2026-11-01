import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { getDb } from '@/db'
import { responses } from '@/db/schema'

const YEAR = 2026

export const submitResponse = createServerFn({ method: 'POST' })
  .validator((input: { answers: Record<string, string | string[]>; ref?: string }) => input)
  .handler(async ({ data }) => {
    await getDb(env.DB)
      .insert(responses)
      .values({
        id: crypto.randomUUID(),
        year: YEAR,
        answers: data.answers,
        ref: data.ref?.slice(0, 64) || null,
        createdAt: new Date().toISOString(),
      })
  })
