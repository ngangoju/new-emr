#!/usr/bin/env node
import axios from 'axios'
import fs from 'node:fs'
import path from 'node:path'

const API_BASE = process.env.E2E_AUTH_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8888'
const PASSWORD = process.env.E2E_PASSWORD || 'password123'
const RECEPTIONIST_USERNAME = process.env.E2E_RECEPTIONIST_USERNAME || 'receptionist'
const NURSE_USERNAME = process.env.E2E_NURSE_USERNAME || 'ngango'
const CASHIER_USERNAME = process.env.E2E_CASHIER_USERNAME || 'cashier'
const EVIDENCE_DIR = process.env.EMR_SMOKE_EVIDENCE_DIR || '/tmp/emr-qa/evidence/api-smoke'
const STARTUP_TIMEOUT_MS = Number(process.env.EMR_SMOKE_STARTUP_TIMEOUT_MS || 30000)
const STARTUP_POLL_INTERVAL_MS = Number(process.env.EMR_SMOKE_POLL_INTERVAL_MS || 1000)

function nowIso() {
  return new Date().toISOString()
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function assert(condition, message, extra = {}) {
  if (!condition) {
    const error = new Error(message)
    error.details = extra
    throw error
  }
}

function summarizeBody(body) {
  if (body == null) return null
  if (typeof body === 'string') return body.slice(0, 300)
  return body
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function usernameCandidates(primary, fallbacks) {
  return [...new Set([primary, ...fallbacks].filter(Boolean))]
}

function buildHealthBaseCandidates(baseUrl) {
  const trimmed = baseUrl.replace(/\/+$/, '')
  const candidates = [trimmed]

  if (trimmed.includes('://localhost:')) {
    candidates.push(trimmed.replace('://localhost:', '://127.0.0.1:'))
  } else if (trimmed.includes('://127.0.0.1:')) {
    candidates.push(trimmed.replace('://127.0.0.1:', '://localhost:'))
  }

  return [...new Set(candidates)]
}

class SessionClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.cookieJar = new Map()
    this.username = null
  }

  cookieHeader() {
    return [...this.cookieJar.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
  }

  updateCookies(response) {
    const rawHeaders = response?.headers
    const setCookies = typeof rawHeaders?.getSetCookie === 'function'
      ? rawHeaders.getSetCookie()
      : Array.isArray(rawHeaders?.['set-cookie'])
        ? rawHeaders['set-cookie']
        : []

    for (const header of setCookies) {
      const [cookiePart] = header.split(';')
      const separator = cookiePart.indexOf('=')
      if (separator === -1) continue
      const name = cookiePart.slice(0, separator).trim()
      const value = cookiePart.slice(separator + 1).trim()
      this.cookieJar.set(name, value)
    }
  }

  xsrfToken() {
    return this.cookieJar.get('XSRF-TOKEN') ?? ''
  }

  async fetch(method, pathName, body, options = {}) {
    const headers = {
      Accept: 'application/json',
      ...options.headers,
    }

    const cookieHeader = this.cookieHeader()
    if (cookieHeader) {
      headers.Cookie = cookieHeader
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      const xsrf = this.xsrfToken()
      if (xsrf) {
        headers['X-XSRF-TOKEN'] = xsrf
      }
    }

    let response
    try {
      response = await axios.request({
        url: `${this.baseUrl}${pathName}`,
        method,
        headers,
        data: body,
        responseType: 'text',
        transformResponse: [(data) => data],
        validateStatus: () => true,
      })
    } catch (error) {
      const enriched = new Error(`Request failed for ${method} ${pathName}: ${error instanceof Error ? error.message : String(error)}`)
      enriched.cause = error
      throw enriched
    }

    this.updateCookies(response)

    const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const json = safeJsonParse(text)

    return {
      status: response.status,
      headers: response.headers,
      text,
      json,
    }
  }

  async login(username) {
    this.username = username
    const response = await this.fetch('POST', '/auth/login', {
      username,
      password: PASSWORD,
    })

    assert(response.status < 300, `Login failed for ${username}`, {
      status: response.status,
      body: summarizeBody(response.json ?? response.text),
    })

    return response
  }

  get(pathName) {
    return this.fetch('GET', pathName)
  }

  post(pathName, body) {
    return this.fetch('POST', pathName, body)
  }
}

async function loginWithCandidates(baseUrl, usernames) {
  let lastError = null

  for (const username of usernames) {
    const client = new SessionClient(baseUrl)
    try {
      await client.login(username)
      return { client, username }
    } catch (error) {
      lastError = error
    }
  }

  if (lastError instanceof Error) {
    lastError.details = {
      ...(lastError.details ?? {}),
      attemptedUsernames: usernames,
    }
  }

  throw lastError ?? new Error(`Login failed for candidate usernames: ${usernames.join(', ')}`)
}

async function waitForHealth(baseUrl) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  const candidates = buildHealthBaseCandidates(baseUrl)
  const failures = []

  while (Date.now() < deadline) {
    for (const candidate of candidates) {
      const client = new SessionClient(candidate)

      try {
        const response = await client.get('/actuator/health')
        if (response.status < 300) {
          return {
            baseUrl: candidate,
            response,
          }
        }
        failures.push({
          baseUrl: candidate,
          status: response.status,
          body: summarizeBody(response.json ?? response.text),
          timestamp: nowIso(),
        })
      } catch (error) {
        failures.push({
          baseUrl: candidate,
          timestamp: nowIso(),
          message: error instanceof Error ? error.message : String(error),
          cause: error instanceof Error && error.cause && typeof error.cause === 'object'
            ? {
                message: error.cause.message ?? null,
                code: error.cause.code ?? null,
                errno: error.cause.errno ?? null,
                address: error.cause.address ?? null,
                port: error.cause.port ?? null,
              }
            : null,
        })
      }
    }

    await sleep(STARTUP_POLL_INTERVAL_MS)
  }

  const error = new Error(`Backend health did not become ready within ${STARTUP_TIMEOUT_MS}ms`)
  error.details = {
    candidates,
    recentFailures: failures.slice(-6),
  }
  throw error
}

async function run() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })

  const summary = {
    startedAt: nowIso(),
    apiBase: API_BASE,
    checks: [],
  }

  function record(name, status, details = {}) {
    summary.checks.push({
      name,
      status,
      timestamp: nowIso(),
      ...details,
    })
  }

  try {
    const { baseUrl, response: health } = await waitForHealth(API_BASE)
    summary.apiBase = baseUrl
    record('health', health.status < 300 ? 'passed' : 'failed', {
      httpStatus: health.status,
      body: summarizeBody(health.json ?? health.text),
    })
    assert(health.status < 300, 'Health endpoint is not healthy', { status: health.status, body: summarizeBody(health.json ?? health.text) })

    const receptionistLogin = await loginWithCandidates(
      baseUrl,
      usernameCandidates(RECEPTIONIST_USERNAME, ['receptionist_emr', 'recep_pam']),
    )
    const receptionist = receptionistLogin.client
    record('login-receptionist', 'passed', { username: receptionistLogin.username })

    const stamp = Date.now()
    const patientResp = await receptionist.post('/patients', {
      firstName: 'SmokeApi',
      lastName: `Run${stamp}`,
      dateOfBirth: '1993-03-03',
      gender: 'FEMALE',
      phone: `+2507${String(stamp).slice(-8)}`,
      email: `smoke-api-${stamp}@emr.test`,
    })
    assert(patientResp.status < 300, 'Patient creation failed', {
      status: patientResp.status,
      body: summarizeBody(patientResp.json ?? patientResp.text),
    })
    const patient = patientResp.json
    assert(patient?.id, 'Patient response missing id', { body: summarizeBody(patient) })
    record('create-patient', 'passed', { patientId: patient.id })

    const doctorsResp = await receptionist.get('/api/users/clinical-staff?role=DOCTOR&page=0&size=20')
    assert(doctorsResp.status < 300, 'Doctor lookup failed', {
      status: doctorsResp.status,
      body: summarizeBody(doctorsResp.json ?? doctorsResp.text),
    })
    const doctors = Array.isArray(doctorsResp.json) ? doctorsResp.json : doctorsResp.json?.data
    const doctorId = doctors?.[0]?.id
    assert(doctorId, 'Doctor lookup returned no usable doctor id', { body: summarizeBody(doctorsResp.json) })
    record('lookup-doctor', 'passed', { doctorId })

    const tariffsResp = await receptionist.get('/api/tariffs/category/CONSULTATION')
    assert(tariffsResp.status < 300, 'Consultation tariff lookup failed', {
      status: tariffsResp.status,
      body: summarizeBody(tariffsResp.json ?? tariffsResp.text),
    })
    const tariffs = Array.isArray(tariffsResp.json) ? tariffsResp.json : tariffsResp.json?.data
    const tariff = tariffs?.[0]
    assert(tariff?.id && tariff?.billingCode, 'No consultation tariff available for smoke flow', {
      body: summarizeBody(tariffsResp.json),
    })
    record('lookup-tariff', 'passed', { tariffId: tariff.id, billingCode: tariff.billingCode })

    const visitResp = await receptionist.post('/api/reception/visits', {
      invoice: {
        patientId: patient.id,
        doctorId,
        items: JSON.stringify([
          {
            billing_code: tariff.billingCode,
            quantity: 1,
            unit_price: tariff.basePrice,
            description: tariff.serviceName,
            tariffId: tariff.id,
          },
        ]),
        total: tariff.basePrice,
      },
      queue: {
        patientId: patient.id,
        doctorId,
        priority: 1,
        notes: 'Critical API smoke flow',
      },
    })
    assert(visitResp.status < 300, 'Reception visit creation failed', {
      status: visitResp.status,
      body: summarizeBody(visitResp.json ?? visitResp.text),
    })
    const invoiceId = visitResp.json?.invoice?.id
    assert(invoiceId, 'Reception visit response missing invoice id', { body: summarizeBody(visitResp.json) })
    record('create-reception-visit', 'passed', { invoiceId })

    const nurseLogin = await loginWithCandidates(
      baseUrl,
      usernameCandidates(NURSE_USERNAME, ['nurse_emr', 'nurse_jackie']),
    )
    const nurse = nurseLogin.client
    record('login-nurse', 'passed', { username: nurseLogin.username })

    const vitalsBlockedResp = await nurse.post(`/patients/${patient.id}/vitals`, {
      temperature: 36.8,
      heartRate: 80,
      bloodPressure: '120/80',
      triageNote: 'Pre-payment triage attempt',
      triageDisposition: 'WAIT_FOR_DOCTOR',
    })
    const blockedText = (vitalsBlockedResp.text || '').toLowerCase()
    assert(vitalsBlockedResp.status >= 400 && vitalsBlockedResp.status < 500, 'Vitals pre-payment gate did not block as expected', {
      status: vitalsBlockedResp.status,
      body: summarizeBody(vitalsBlockedResp.json ?? vitalsBlockedResp.text),
    })
    assert(blockedText.includes('payment'), 'Blocked vitals response did not mention payment gate', {
      body: summarizeBody(vitalsBlockedResp.json ?? vitalsBlockedResp.text),
    })
    record('vitals-blocked-before-payment', 'passed', { httpStatus: vitalsBlockedResp.status })

    const cashierLogin = await loginWithCandidates(
      baseUrl,
      usernameCandidates(CASHIER_USERNAME, ['cashier_emr']),
    )
    const cashier = cashierLogin.client
    record('login-cashier', 'passed', { username: cashierLogin.username })

    const invoiceResp = await cashier.get(`/invoices/${invoiceId}`)
    assert(invoiceResp.status < 300, 'Invoice lookup failed before payment', {
      status: invoiceResp.status,
      body: summarizeBody(invoiceResp.json ?? invoiceResp.text),
    })
    const invoice = invoiceResp.json
    const patientDue = Number(invoice?.patientDue ?? invoice?.patient_due ?? 0)
    const total = Number(invoice?.total ?? 0)
    const paymentAmount = patientDue > 0 ? patientDue : total
    assert(paymentAmount > 0, 'Payment amount was not positive', { invoice: summarizeBody(invoice) })

    const paymentResp = await cashier.post('/api/billing/payments', {
      invoiceId,
      amount: paymentAmount,
      method: 'CASH',
      paymentMethod: 'CASH',
    })
    assert(paymentResp.status < 300, 'Payment posting failed', {
      status: paymentResp.status,
      body: summarizeBody(paymentResp.json ?? paymentResp.text),
    })
    record('post-payment', 'passed', { paymentAmount })

    const vitalsAcceptedResp = await nurse.post(`/patients/${patient.id}/vitals`, {
      temperature: 36.9,
      heartRate: 78,
      bloodPressure: '118/76',
      respiratoryRate: 16,
      oxygenSaturation: 98,
      triageNote: 'Post-payment triage complete',
      triageDisposition: 'WAIT_FOR_DOCTOR',
    })
    assert(vitalsAcceptedResp.status < 300, 'Vitals post-payment should succeed', {
      status: vitalsAcceptedResp.status,
      body: summarizeBody(vitalsAcceptedResp.json ?? vitalsAcceptedResp.text),
    })
    record('vitals-accepted-after-payment', 'passed', {
      vitalsId: vitalsAcceptedResp.json?.id ?? null,
    })

    summary.finishedAt = nowIso()
    summary.status = 'passed'
  } catch (error) {
    summary.finishedAt = nowIso()
    summary.status = 'failed'
    summary.error = {
      message: error instanceof Error ? error.message : String(error),
      details: error && typeof error === 'object' && 'details' in error ? error.details : null,
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const evidencePath = path.join(EVIDENCE_DIR, `critical-api-smoke-${stamp}.json`)
  fs.writeFileSync(evidencePath, `${JSON.stringify(summary, null, 2)}\n`)

  console.log(`Critical API smoke evidence written to ${evidencePath}`)
  console.log(JSON.stringify(summary, null, 2))

  if (summary.status !== 'passed') {
    process.exit(1)
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
