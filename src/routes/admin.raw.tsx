import { createFileRoute } from '@tanstack/react-router'
import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createExpandedRowModel,
  createFacetedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { Button, Checkbox, Icon, Select, Tag, Text, TextInput } from 'daleui'
import { useMemo } from 'react'
import { AdminError } from '@/components/Admin'
import { EDITIONS } from '@/editions'
import { adminFetch } from '@/lib/adminFetch'
import { answerText } from '@/lib/csv'
import { OTHER, otherKey, visibleQuestions } from '@/questions/logic'
import { type Answers, type Question, questionsFor, SCALE_POINTS } from '@/questions/survey'
import type { AdminResponses } from '@/server/admin'

// 처음 보이는 문항 열. 응답을 알아보기 쉬운 것들이다.
const DEFAULT_COLUMNS = ['status', 'experience', 'role']
// 문항 열을 이보다 많이 펼치면 칸이 좁아져 읽기 어렵다. 가로 스크롤 대신 열을 고르게 한다.
const MAX_COLUMNS = 5
const PAGE_SIZE = 50

// 원본 응답을 표로 거르고 정렬하며 읽는다. 회차의 응답 전체를 한 번에 받아 브라우저에서 처리한다.
export const Route = createFileRoute('/admin/raw')({
  loaderDeps: ({ search }) => ({ edition: search.edition ?? EDITIONS.filter((e) => e.survey)[0].id }),
  loader: async ({ deps }) => ({ ...deps, data: await adminFetch<AdminResponses>('responses', { edition: deps.edition }) }),
  component: Raw,
  errorComponent: AdminError,
})

type Entry = {
  // 제출 순서. 가장 먼저 낸 응답이 1번이다.
  no: number
  createdAt: string
  answers: Answers
  // 전체 검색 대상: 모든 답의 문구와 "기타"에 적은 내용
  search: string
}

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  columnVisibilityFeature,
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})
const helper = createColumnHelper<typeof features, Entry>()

// 선택지 code 를 화면에 보이는 문구로 바꾼다. 복수 선택은 쉼표로 잇고, "기타"에 적은 내용을 붙인다.
function answerLabel(q: Question, answers: Answers): string {
  const a = answers[q.id]
  if (a === undefined) return ''
  if (q.type === 'scale') return `${a} / ${q.scale?.max.value ?? 5}`
  if (q.type === 'long') return String(a)
  const label = (code: string) => {
    const text = q.options.find((o) => o.code === code)?.label ?? code
    const other = answers[otherKey(q.id)]
    return code === OTHER && typeof other === 'string' ? `${text}: ${other}` : text
  }
  return Array.isArray(a) ? a.map(label).join(', ') : label(a)
}

// 거르기와 정렬에 쓰는 선택지 목록. 척도는 1~5점이다.
const choices = (q: Question) => (q.type === 'scale' ? SCALE_POINTS.map((code) => ({ code, label: code })) : q.options)

// 선택지는 가나다순이 아니라 문항에 정한 순서로 정렬한다(경력이면 짧은 순). 복수 선택은 첫 번째 답으로.
function rank(q: Question, answers: Answers): number | undefined {
  const a = answers[q.id]
  const code = Array.isArray(a) ? a[0] : a
  if (code === undefined) return undefined
  return choices(q).findIndex((o) => o.code === code)
}

const submittedAt = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })

function buildColumns(questions: Question[]) {
  return helper.columns([
    helper.accessor('no', {
      header: '#',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <button type="button" className="admin-expand" aria-expanded={row.getIsExpanded()} onClick={() => row.toggleExpanded()}>
          <Icon name="chevronRight" size="sm" />#{row.original.no.toLocaleString()}
        </button>
      ),
    }),
    helper.accessor('createdAt', {
      header: '제출',
      enableColumnFilter: false,
      cell: ({ row }) => submittedAt(row.original.createdAt),
    }),
    ...questions.map((q) =>
      helper.accessor((r) => rank(q, r.answers), {
        id: q.id,
        header: q.label,
        cell: ({ row }) => answerLabel(q, row.original.answers),
        enableSorting: q.type !== 'long',
        enableColumnFilter: q.type !== 'long',
        sortUndefined: 'last',
        // 정렬 값이 숫자(선택지 순번)라 그대로 두면 내림차순부터 시작한다. 문항에 정한 순서부터 보이게 한다.
        sortDescFirst: false,
        filterFn: (row, _id, code: string) => {
          const a = row.original.answers[q.id]
          return Array.isArray(a) ? a.includes(code) : a === code
        },
      }),
    ),
    helper.accessor('search', { header: '검색', enableSorting: false, enableColumnFilter: false }),
  ])
}

function Raw() {
  const { edition, data } = Route.useLoaderData()
  const questions = useMemo(() => questionsFor(edition) ?? [], [edition])
  const columns = useMemo(() => buildColumns(questions), [questions])
  const entries = useMemo(
    () =>
      data.rows.map(
        (r, i): Entry => ({
          no: data.rows.length - i,
          createdAt: r.createdAt,
          answers: r.answers,
          search: questions
            .map((q) => answerLabel(q, r.answers))
            .join(' ')
            .toLowerCase(),
        }),
      ),
    [data, questions],
  )

  const table = useTable({
    features,
    columns,
    data: entries,
    getRowCanExpand: () => true,
    globalFilterFn: 'includesString',
    getColumnCanGlobalFilter: (column) => column.id === 'search',
    initialState: {
      sorting: [{ id: 'no', desc: true }],
      pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
      columnVisibility: Object.fromEntries([['search', false], ...questions.map((q) => [q.id, DEFAULT_COLUMNS.includes(q.id)])]),
    },
  })

  if (entries.length === 0) return <Text muted>아직 응답이 없어요.</Text>

  const questionColumns = questions.map((q) => ({ q, column: table.getColumn(q.id)! }))
  const shown = questionColumns.filter(({ column }) => column.getIsVisible())
  const filtered = table.getFilteredRowModel().rows.length
  const { pageIndex } = table.state.pagination
  const visibleCount = table.getVisibleLeafColumns().length
  const filtering = table.state.columnFilters.length > 0 || Boolean(table.state.globalFilter)

  return (
    <section aria-label="원본 응답" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 240px', maxWidth: 360 }}>
          <TextInput
            label="검색"
            leadingIcon="search"
            placeholder="답에 들어 있는 말"
            value={String(table.state.globalFilter ?? '')}
            onChange={(e) => table.setGlobalFilter(e.target.value.toLowerCase())}
          />
        </div>
        <details className="admin-picker">
          <summary style={{ gap: 'var(--spacing-8)' }}>
            열 고르기
            <span style={{ padding: '1px 8px', borderRadius: 'var(--radii-full)', background: 'var(--colors-bg-brand-active)', color: 'var(--colors-fg-brand)', fontSize: 13, fontWeight: 600 }}>
              {shown.length}/{MAX_COLUMNS}
            </span>
            <Icon name="chevronDown" size="sm" />
          </summary>
          <div className="admin-picker-panel">
            {[...new Set(questions.map((q) => q.section))].map((section) => (
              <fieldset key={section}>
                <legend>{section}</legend>
                {questionColumns
                  .filter(({ q }) => q.section === section)
                  .map(({ q, column }) => (
                    <Checkbox
                      key={q.id}
                      label={q.label}
                      checked={column.getIsVisible()}
                      disabled={!column.getIsVisible() && shown.length >= MAX_COLUMNS}
                      onChange={(on) => {
                        // 가린 열에 걸린 필터는 보이지 않으니 함께 푼다
                        if (!on) column.setFilterValue(undefined)
                        column.toggleVisibility(on)
                      }}
                    />
                  ))}
              </fieldset>
            ))}
          </div>
        </details>
        {filtering && (
          <Button
            tone="neutral"
            variant="ghost"
            size="sm"
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter('')
            }}
          >
            필터 모두 풀기
          </Button>
        )}
      </div>

      {shown.some(({ q }) => q.type !== 'long') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 'var(--spacing-12)', alignItems: 'end' }}>
          {shown
            .filter(({ q }) => q.type !== 'long')
            .map(({ q, column }) => {
              // 다른 필터가 걸린 상태에서 이 선택지를 고르면 몇 건이 남는지
              const facet = column.getFacetedRowModel().rows
              const count = (code: string) =>
                facet.filter((r) => {
                  const a = r.original.answers[q.id]
                  return Array.isArray(a) ? a.includes(code) : a === code
                }).length
              return (
                <Select
                  key={q.id}
                  label={q.label}
                  placeholder="전체"
                  clearButtonName="필터 풀기"
                  value={String(column.getFilterValue() ?? '')}
                  onChange={(e) => column.setFilterValue(e.target.value || undefined)}
                >
                  {choices(q).map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.label} ({count(o.code).toLocaleString()})
                    </option>
                  ))}
                </Select>
              )
            })}
        </div>
      )}

      {filtering && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)', alignItems: 'center' }}>
          <Text size="sm" weight="semibold" muted>
            걸린 필터
          </Text>
          {table.state.globalFilter && (
            <Tag tone="brand" onRemove={() => table.setGlobalFilter('')}>
              검색: {String(table.state.globalFilter)}
            </Tag>
          )}
          {table.state.columnFilters.map((f) => {
            const q = questions.find((x) => x.id === f.id)
            if (!q) return null
            const label = choices(q).find((o) => o.code === f.value)?.label ?? String(f.value)
            return (
              <Tag key={f.id} tone="brand" onRemove={() => table.getColumn(f.id)?.setFilterValue(undefined)}>
                {q.label}: {label}
              </Tag>
            )
          })}
        </div>
      )}

      <Text size="sm" muted>
        {filtering ? `${entries.length.toLocaleString()}건 중 ${filtered.toLocaleString()}건` : `${entries.length.toLocaleString()}건`} · 번호를 누르면 모든 답이 보여요
      </Text>

      <div className="admin-panel" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                      style={header.column.id === 'no' ? { width: '5.5rem' } : header.column.id === 'createdAt' ? { width: '8.5rem' } : undefined}
                    >
                      {header.column.getCanSort() ? (
                        <button type="button" className="admin-sort" onClick={header.column.getToggleSortingHandler()}>
                          <table.FlexRender header={header} />
                          {sorted && <Icon name="chevronDown" size="xs" style={sorted === 'asc' ? { transform: 'rotate(180deg)' } : undefined} />}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <RowGroup key={row.id} expanded={row.getIsExpanded()} colSpan={visibleCount} questions={questions} answers={row.original.answers}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} data-label={typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : undefined}>
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </RowGroup>
            ))}
          </tbody>
        </table>
        {filtered === 0 && (
          <div style={{ padding: 'var(--spacing-16)' }}>
            <Text muted>조건에 맞는 응답이 없어요.</Text>
          </div>
        )}
        <nav aria-label="페이지" style={pager}>
          <Button tone="neutral" variant="outline" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            이전
          </Button>
          <Text size="sm" muted>
            {filtered === 0 ? 0 : (pageIndex * PAGE_SIZE + 1).toLocaleString()}–{Math.min((pageIndex + 1) * PAGE_SIZE, filtered).toLocaleString()} / {filtered.toLocaleString()}
          </Text>
          <Button tone="neutral" variant="outline" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            다음
          </Button>
        </nav>
      </div>
    </section>
  )
}

// 행 하나와, 펼쳤을 때 그 아래 이어지는 모든 답
function RowGroup({ expanded, colSpan, questions, answers, children }: { expanded: boolean; colSpan: number; questions: Question[]; answers: Answers; children: React.ReactNode }) {
  // 응답자에게 보였던 문항만. 보였는데 답이 없으면 건너뛴 것이다.
  const shown = visibleQuestions(questions, answers)
  const sections = [...new Set(shown.map((q) => q.section))].map((title) => ({ title, items: shown.filter((q) => q.section === title) }))
  return (
    <>
      <tr className={expanded ? 'admin-open' : undefined}>{children}</tr>
      {expanded && (
        <tr className="admin-detail">
          <td colSpan={colSpan}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 'var(--spacing-20) var(--spacing-32)', alignItems: 'start' }}>
              {sections.map((s) => (
                <section key={s.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                  <Text size="sm" weight="semibold" tone="brand">
                    {s.title}
                  </Text>
                  <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                    {s.items.map((q) => (
                      <div key={q.id} style={answerRow}>
                        <dt style={{ flex: '0 1 22rem', color: 'var(--colors-fg-neutral-placeholder)' }}>{q.label}</dt>
                        <dd style={{ flex: '1 1 14rem', margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                          {answers[q.id] === undefined ? (
                            <span style={{ color: 'var(--colors-fg-neutral-placeholder)' }}>건너뜀</span>
                          ) : (
                            <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: 'var(--colors-fg-neutral-active)' }}>{answerLabel(q, answers)}</span>
                          )}
                          {q.type !== 'long' && answers[q.id] !== undefined && (
                            <code style={{ fontFamily: 'var(--fonts-mono)', fontSize: '0.75rem', color: 'var(--colors-fg-neutral-placeholder)' }}>
                              {q.id}: {answerText(answers, q.id)}
                            </code>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

const pager: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--spacing-8)',
  padding: 'var(--spacing-12) var(--spacing-16)',
}

// 좁으면 문항 아래로 답이 내려간다
const answerRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2) var(--spacing-16)',
  lineHeight: 1.5,
}
