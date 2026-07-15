#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const frontendRoot = process.cwd()
const backendRoot = path.resolve(frontendRoot, process.env.BACKEND_DIR ?? '../new-emr-backend')
const frontendSrc = path.join(frontendRoot, 'src')
const backendControllers = path.join(backendRoot, 'src/main/java/com/emr/newemrbackend/controller')

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(fullPath, predicate)
    return predicate(fullPath) ? [fullPath] : []
  })
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length
}

function stripQuery(value) {
  return value.split('?')[0]
}

function normalizePath(value) {
  if (!value) return ''
  let next = value.trim()
  if (!next.startsWith('/')) next = `/${next}`
  next = next.replace(/\/+/g, '/')
  if (next.length > 1 && next.endsWith('/')) next = next.slice(0, -1)
  return stripQuery(next)
}

function normalizeFrontendTemplate(rawValue) {
  const withoutEscapes = rawValue.replace(/\\`/g, '`').replace(/\\'/g, "'").replace(/\\"/g, '"')
  return normalizePath(withoutEscapes.replace(/\$\{[^}]+\}/g, '{param}').replace(/([^/])\{param\}$/g, '$1'))
}

function mappingValues(annotationBody) {
  if (!annotationBody || !annotationBody.trim()) return ['']
  const body = annotationBody
    .replace(/\s+/g, ' ')
    .replace(/"\s*\+\s*[A-Z0-9_]+\s*\+\s*"/g, '')

  // Collect every quoted path literal. Annotation bodies arrive either as a
  // single string ("/foo") or as an array wrapped in (...) or {...}:
  //   ("/count", "/unread-count")   or   { "/cases/{id}", "/{id}" }
  // Path variables like {id} contain braces, so naive brace-matching breaks.
  // We simply take ALL quoted strings; if there is more than one, it's an array.
  const quoted = [...body.matchAll(/"([^"]*)"|'([^']*)'/g)].map(
    (m) => m[1] ?? m[2],
  )
  if (quoted.length > 1) return quoted
  if (quoted.length === 1) return quoted

  const valueMatch = body.match(/(?:value|path)\s*=\s*(?:"([^"]*)"|'([^']*)')/)
  if (valueMatch) return [valueMatch[1] ?? valueMatch[2] ?? '']

  return ['']
}

function cleanBackendPath(value) {
  return normalizePath(
    value
      .replace(/\{([^}:]+):[^}]+\}/g, '{$1}')
      .replace(/\{[^}]+\}/g, '{param}'),
  )
}

function combinePaths(base, methodPath) {
  if (!methodPath) return normalizePath(base)
  if (methodPath.startsWith('/')) {
    return normalizePath(`${base}${methodPath}`)
  }
  return normalizePath(`${base}/${methodPath}`)
}

function extractBackendRoutes() {
  const controllerFiles = walk(backendControllers, (file) => file.endsWith('.java'))
  const routes = []

  for (const file of controllerFiles) {
    const source = fs.readFileSync(file, 'utf8')
    if (!source.includes('@RestController')) continue

    const classIndex = source.search(/\bclass\s+\w+/)
    const classPrefix = classIndex >= 0 ? source.slice(0, classIndex) : ''
    const classMappingMatch = [...classPrefix.matchAll(/@RequestMapping(?:\(([\s\S]*?)\))?/g)].at(-1)
    const basePaths = classMappingMatch ? mappingValues(classMappingMatch[1]).map(cleanBackendPath) : ['']

    const mappingRegex = /@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)(?:\(([\s\S]*?)\))?/g
    for (const match of source.matchAll(mappingRegex)) {
      if (match.index < classPrefix.length) continue
      const annotation = match[1]
      const body = match[2] ?? ''
      const methods = annotation === 'RequestMapping'
        ? [...body.matchAll(/RequestMethod\.(GET|POST|PUT|PATCH|DELETE)/g)].map((item) => item[1])
        : [annotation.replace('Mapping', '').toUpperCase()]
      const effectiveMethods = methods.length ? methods : [...HTTP_METHODS]
      const methodPaths = mappingValues(body).map(cleanBackendPath)

      for (const base of basePaths) {
        for (const methodPath of methodPaths) {
          for (const method of effectiveMethods) {
            routes.push({
              method,
              path: cleanBackendPath(combinePaths(base, methodPath)),
              file,
              line: lineNumber(source, match.index),
            })
          }
        }
      }
    }
  }

  return routes
}

function extractFrontendCalls() {
  const sourceFiles = walk(frontendSrc, (file) => /\.(tsx?|jsx?)$/.test(file) && !file.includes(`${path.sep}test${path.sep}`))
  const calls = []
  const skipped = []

  const apiCallRegex = /\bapi\.(get|post|put|patch|delete)(?:<[^>]+>)?\s*\(\s*(['"`])([\s\S]*?)\2/g
  const requestCallRegex = /\bapiRequest\s*\(\s*(['"`])(GET|POST|PUT|PATCH|DELETE)\1\s*,\s*(['"`])([\s\S]*?)\3/g

  for (const file of sourceFiles) {
    const source = fs.readFileSync(file, 'utf8')

    for (const match of source.matchAll(apiCallRegex)) {
      const rawPath = match[3]
      if (!rawPath.startsWith('/')) {
        skipped.push({ file, line: lineNumber(source, match.index), reason: `dynamic api.${match[1]} path` })
        continue
      }
      const normalized = normalizeFrontendTemplate(rawPath)
      // Skip paths that still contain an unresolved template expression
      // (e.g. nested template literals like `?days=${days}` break the regex
      // and leave a dangling "${"). These are dynamic query-string artifacts,
      // not static route mismatches.
      if (normalized.includes('${')) {
        skipped.push({ file, line: lineNumber(source, match.index), reason: `dynamic api.${match[1]} path (unresolved template)` })
        continue
      }
      calls.push({
        method: match[1].toUpperCase(),
        path: normalized,
        file,
        line: lineNumber(source, match.index),
      })
    }

    for (const match of source.matchAll(requestCallRegex)) {
      const rawPath = match[4]
      if (!rawPath.startsWith('/')) {
        skipped.push({ file, line: lineNumber(source, match.index), reason: 'dynamic apiRequest path' })
        continue
      }
      calls.push({
        method: match[2],
        path: normalizeFrontendTemplate(rawPath),
        file,
        line: lineNumber(source, match.index),
      })
    }
  }

  return { calls, skipped }
}

function pathPatternToRegex(routePath) {
  const escaped = routePath
    .split('/')
    .map((segment) => (segment === '{param}' ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/')
  return new RegExp(`^${escaped}$`)
}

function pathsMatch(frontendPath, backendPath) {
  const frontendSegments = frontendPath.split('/').filter(Boolean)
  const backendSegments = backendPath.split('/').filter(Boolean)
  if (frontendSegments.length !== backendSegments.length) return false

  return frontendSegments.every((segment, index) => {
    const backendSegment = backendSegments[index]
    return segment === '{param}' || backendSegment === '{param}' || segment === backendSegment
  })
}

function routeMatches(call, routes) {
  return routes.some((route) => route.method === call.method && (
    pathsMatch(call.path, route.path) || pathPatternToRegex(route.path).test(call.path)
  ))
}

function uniqueCalls(calls) {
  const seen = new Set()
  return calls.filter((call) => {
    const key = `${call.method} ${call.path} ${call.file}:${call.line}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

if (!fs.existsSync(backendControllers)) {
  console.log(`Backend controllers not found at ${backendControllers}; skipping API contract check.`)
  process.exit(0)
}

const routes = extractBackendRoutes()
const { calls, skipped } = extractFrontendCalls()
const unmatched = uniqueCalls(calls).filter((call) => !routeMatches(call, routes))

if (unmatched.length) {
  console.error('Frontend API calls without matching backend controller routes:')
  for (const call of unmatched) {
    console.error(`- ${call.method} ${call.path} (${path.relative(frontendRoot, call.file)}:${call.line})`)
  }
  console.error(`\nChecked ${calls.length} static frontend API calls against ${routes.length} backend routes.`)
  process.exit(1)
}

console.log(`API contract check passed: ${calls.length} static frontend calls matched ${routes.length} backend routes.`)
if (skipped.length) {
  console.log(`Skipped ${skipped.length} dynamic frontend API call(s).`)
}
