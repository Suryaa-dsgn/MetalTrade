#!/usr/bin/env node
/*
  Sec Phase 5 — client-bundle + generated-HTML secret scan.

  Fails (exit 1) if provider hostnames, key auth headers, key env-var NAMES, or any
  actual secret VALUE from the environment appear where they must never be:
    - the client bundle under .next/static  (served to browsers)
    - prerendered .html under .next/server/app  (shipped to browsers)

  Server JS legitimately contains provider hostnames, so it is NOT scanned for
  hostnames — only prerendered HTML is scanned, and only for actual secret values.
  Real secret values are never printed; only the offending file and the matched
  pattern LABEL are reported.

  Run after `next build`. Portable across CI providers (plain Node, no deps).
*/
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const STATIC_DIR = join(ROOT, ".next", "static")
const APP_HTML_DIR = join(ROOT, ".next", "server", "app")

// Things that must never appear in the client bundle (labels only in output).
const CLIENT_FORBIDDEN = [
  { label: "provider host: metalpriceapi", re: /api\.metalpriceapi\.com/ },
  { label: "provider host: metals.dev", re: /api\.metals\.dev/ },
  { label: "provider host: eia.gov", re: /api\.eia\.gov/ },
  { label: "auth header X-API-KEY", re: /X-API-KEY/i },
  { label: "env name METALPRICE_API_KEY", re: /METALPRICE_API_KEY/ },
  { label: "env name METALS_DEV_API_KEY", re: /METALS_DEV_API_KEY/ },
  { label: "env name EIA_API_KEY", re: /EIA_API_KEY/ },
]

// Actual secret VALUES present in the environment (scanned everywhere below).
const SECRET_ENV_NAMES = ["METALPRICE_API_KEY", "METALS_DEV_API_KEY", "EIA_API_KEY"]
const secretValues = SECRET_ENV_NAMES.map((name) => ({ name, value: process.env[name] }))
  .filter((s) => typeof s.value === "string" && s.value.trim().length >= 8)
  .map((s) => ({ label: `secret value of ${s.name}`, value: s.value.trim() }))

function walk(dir, filter) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...walk(full, filter))
    else if (filter(full)) out.push(full)
  }
  return out
}

const findings = []

function scan(files, patterns, includeSecretValues) {
  for (const file of files) {
    let text
    try {
      text = readFileSync(file, "utf8")
    } catch {
      continue
    }
    for (const p of patterns) {
      if (p.re.test(text)) findings.push({ file, label: p.label })
    }
    if (includeSecretValues) {
      for (const s of secretValues) {
        if (text.includes(s.value)) findings.push({ file, label: s.label })
      }
    }
  }
}

if (!existsSync(join(ROOT, ".next"))) {
  console.error("secret-scan: .next not found — run `npm run build` first.")
  process.exit(2)
}

const staticFiles = walk(STATIC_DIR, (f) => f.endsWith(".js"))
const htmlFiles = walk(APP_HTML_DIR, (f) => f.endsWith(".html"))

scan(staticFiles, CLIENT_FORBIDDEN, true)
scan(htmlFiles, [], true) // HTML: actual secret values only

if (findings.length > 0) {
  console.error("secret-scan: FAILED — forbidden content in browser-served files:")
  for (const f of findings) {
    console.error(`  - ${f.label}  →  ${f.file.replace(ROOT, ".")}`)
  }
  process.exit(1)
}

console.log(
  `secret-scan: OK — scanned ${staticFiles.length} client JS + ${htmlFiles.length} HTML file(s); no leaks.`
)
