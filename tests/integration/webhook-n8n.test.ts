import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle, maybeSingle: mockMaybeSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({ from: mockFrom }),
}))

import { POST } from '@/app/api/webhooks/n8n/route'
import type { NextRequest } from 'next/server'

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/webhooks/n8n', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/webhooks/n8n', () => {
  it('401 si pas de Authorization', async () => {
    const res = await POST(makeReq({ nom: 'X', niche: 'Tech & IA' }))
    expect(res.status).toBe(401)
  })

  it('400 si niche invalide', async () => {
    const res = await POST(
      makeReq({ nom: 'X', niche: 'Invalide' }, { Authorization: 'Bearer test-secret' })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('niche')
  })

  it('200 dédup si email déjà existant', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'existing-id' }, error: null })

    const res = await POST(
      makeReq(
        { nom: 'X', niche: 'Tech & IA', email: 'existing@x.com' },
        { Authorization: 'Bearer test-secret' }
      )
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deduplicated).toBe(true)
    expect(body.prospect_id).toBe('existing-id')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('200 dédup si instagram déjà existant (pas d\'email fourni)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'ig-existing' }, error: null })

    const res = await POST(
      makeReq(
        { nom: 'X', niche: 'Tech & IA', instagram: '@handle' },
        { Authorization: 'Bearer test-secret' }
      )
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deduplicated).toBe(true)
  })

  it('201 crée un nouveau prospect si aucun doublon', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSingle.mockResolvedValueOnce({
      data: { id: 'new-id', nom: 'X', statut: 'a_contacter' },
      error: null,
    })

    const res = await POST(
      makeReq(
        { nom: 'X', niche: 'Tech & IA', email: 'new@x.com' },
        { Authorization: 'Bearer test-secret' }
      )
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.prospect.id).toBe('new-id')
    expect(mockInsert).toHaveBeenCalledOnce()
  })
})
