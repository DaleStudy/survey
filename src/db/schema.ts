import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// 응답 1건 = 1행. IP·User-Agent 처럼 응답자를 알아볼 수 있는 값은 저장할 칸을 두지 않는다.
export const responses = sqliteTable('responses', {
  id: text('id').primaryKey(),
  year: integer('year').notNull(),
  // 문항 id → 선택지 code (복수 선택은 code 배열, 서술형은 글)
  answers: text('answers', { mode: 'json' }).$type<Record<string, string | string[]>>().notNull(),
  // 설문 링크의 ?ref= 값. 어느 채널로 들어왔는지만 남긴다.
  ref: text('ref'),
  createdAt: text('created_at').notNull(),
})
