export const CRM_ERRORS = {
  MISSING_SETTING: 'CRM-001: setting app manquant',
  INVALID_NICHE: 'CRM-002: niche invalide',
  DUPLICATE_PROSPECT: 'CRM-003: prospect déjà existant',
  SUPABASE_ERROR: 'CRM-500: erreur base de données',
} as const

export type CrmErrorCode = keyof typeof CRM_ERRORS
