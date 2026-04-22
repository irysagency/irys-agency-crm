import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpdateEmail = vi.fn().mockResolvedValue({ error: null })
const mockUpdateProspect = vi.fn().mockResolvedValue({ error: null })

function chain(data: unknown) {
  const fn = async () => ({ data, error: null })
  const obj: Record<string, unknown> = {
    select: () => obj,
    eq: () => obj,
    in: () => obj,
    not: () => obj,
    maybeSingle: fn,
    single: fn,
  }
  ;(obj as unknown as PromiseLike<unknown>).then = (resolve: (v: unknown) => void) =>
    fn().then(resolve)
  return obj
}

const supabaseMock = {
  from: vi.fn((table: string) => {
    if (table === 'emails') {
      return {
        ...chain([
          { id: 'e1', prospect_id: 'p1', gmail_thread_id: 'T1', from_account_id: 'a1', envoye_le: '2026-04-20T00:00:00Z' },
          { id: 'e2', prospect_id: 'p1', gmail_thread_id: 'T1', from_account_id: 'a1', envoye_le: '2026-04-21T00:00:00Z' },
        ]),
        update: vi.fn(() => ({ in: vi.fn(() => mockUpdateEmail()) })),
      }
    }
    if (table === 'email_accounts') {
      return chain([{ id: 'a1', email: 'me@example.com' }])
    }
    if (table === 'prospects') {
      return {
        ...chain([{ id: 'p1', statut: 'envoye' }]),
        update: vi.fn(() => ({ in: vi.fn(() => mockUpdateProspect()) })),
      }
    }
    return chain([])
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => supabaseMock,
}))

vi.mock('@/lib/gmail', () => ({
  getAuthenticatedGmail: vi.fn(async () => ({
    users: {
      threads: {
        get: vi.fn(async () => ({
          data: {
            id: 'T1',
            messages: [
              { payload: { headers: [{ name: 'From', value: 'me@example.com' }] } },
              { payload: { headers: [{ name: 'From', value: 'them@example.com' }] } },
            ],
          },
        })),
      },
    },
  })),
}))

import { POST } from '@/app/api/gmail/sync-replies/route'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/gmail/sync-replies', () => {
  it('détecte une réponse et flag le dernier email sortant du thread', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.flagged_emails).toBe(1)
    expect(body.updated_prospects).toBe(1)
    expect(mockUpdateEmail).toHaveBeenCalledOnce()
  })
})
