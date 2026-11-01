// questions/<연도>.yaml 을 앱이 import 하는 JSON 으로 바꾼다. Bun 내장 YAML 파서를 써서 의존성을 늘리지 않는다.
import { mkdir } from 'node:fs/promises'

const YEAR = 2026

const raw = Bun.YAML.parse(await Bun.file(`questions/${YEAR}.yaml`).text())
await mkdir('src/questions/generated', { recursive: true })
await Bun.write(`src/questions/generated/${YEAR}.json`, JSON.stringify(raw))
