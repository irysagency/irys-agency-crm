import { vi } from 'vitest'

process.env.N8N_WEBHOOK_SECRET = 'test-secret'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test'

vi.stubGlobal('fetch', vi.fn())
