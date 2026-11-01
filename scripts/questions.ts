// questions/<회차>.yaml 을 앱이 import 하는 JSON 으로 바꾼다. Bun 내장 YAML 파서를 써서 의존성을 늘리지 않는다.
// Vite 와 bun test 가 함께 읽을 수 있게 import.meta.glob 대신 index.ts 를 만든다.
import { mkdir, readdir } from 'node:fs/promises'

const OUT = 'src/questions/generated'
const ids = (await readdir('questions')).filter((f) => f.endsWith('.yaml')).map((f) => f.slice(0, -'.yaml'.length)).sort()

await mkdir(OUT, { recursive: true })
for (const id of ids) {
  const raw = Bun.YAML.parse(await Bun.file(`questions/${id}.yaml`).text())
  await Bun.write(`${OUT}/${id}.json`, JSON.stringify(raw))
}
const name = (id: string) => `q_${id.replaceAll('-', '_')}`
await Bun.write(
  `${OUT}/index.ts`,
  ids.map((id) => `import ${name(id)} from './${id}.json'`).join('\n') +
    `\n\nexport default { ${ids.map((id) => `'${id}': ${name(id)}`).join(', ')} } as Record<string, unknown>\n`,
)
