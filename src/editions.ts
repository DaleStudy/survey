// 회차 목록. 근거: docs/decisions/0005-survey-editions.md
export interface Edition {
  // 주소와 DB 에 쓰는 ID: 2026(연례), 2027-h1(반기), 2027-frontend(트랙)
  id: string
  title: string
  // 응답을 받는 회차인지. 문항 파일 questions/<id>.yaml 이 있어야 한다.
  survey: boolean
  // 응답 마감 (ISO 8601, 한국 시간). 이 시각부터 화면과 서버가 응답을 막는다.
  closesAt?: string
  resultsAt?: string
  // 완료 화면에서 개발자 유형을 보여 주는지 (ADR 0004)
  devTypes: boolean
  // 결과 화면을 시험하려고 만든 예시 데이터. 실제 설문이 아니다. 오픈 전에 지운다.
  sample?: boolean
}

export const EDITIONS: Edition[] = [
  {
    id: '2026',
    title: '2026 한국 개발자 설문조사',
    survey: true,
    // 계획서 일정: 11월 16일 시작, 12월 6일 마감, 12월 21일 발표
    closesAt: '2026-12-06T23:59:59+09:00',
    resultsAt: '2026-12-21',
    devTypes: true,
  },
  {
    id: '2025',
    title: '2025 한국 개발자 설문조사 (예시)',
    survey: false,
    devTypes: false,
    sample: true,
  },
]

export function findEdition(id: string): Edition | undefined {
  return EDITIONS.find((e) => e.id === id)
}

export function isClosed(edition: Edition, now: Date = new Date()): boolean {
  return edition.closesAt !== undefined && now.getTime() >= new Date(edition.closesAt).getTime()
}

// 지금 응답을 받는 회차들. /survey 짧은 주소가 본다.
export function openEditions(now: Date = new Date()): Edition[] {
  return EDITIONS.filter((e) => e.survey && !isClosed(e, now))
}
