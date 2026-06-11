import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { config, proxy } from '../proxy'

function makeDashboardRequest(path = '/dashboard/reception', cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : undefined,
  })
}

describe('dashboard proxy', () => {
  it('redirects dashboard requests without an access token cookie', () => {
    const response = proxy(makeDashboardRequest('/dashboard/reception?tab=today'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?next=%2Fdashboard%2Freception%3Ftab%3Dtoday',
    )
  })

  it('allows dashboard requests with an access token cookie', () => {
    const response = proxy(makeDashboardRequest('/dashboard/reception', 'accessToken=token-value'))

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('matches every dashboard route', () => {
    expect(config.matcher).toEqual(['/dashboard/:path*'])
  })
})
