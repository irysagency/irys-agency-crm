import type { NicheType, StatutType } from './index'

export interface Prospect {
  id: string
  created_at: string
  nom: string
  niche: NicheType
  instagram: string | null
  youtube: string | null
  linkedin: string | null
  email: string | null
  whatsapp: string | null
  statut: StatutType
  notes: string | null
  derniere_action: string | null
  nb_ouvertures: number
}

export interface Email {
  id: string
  prospect_id: string
  created_at: string
  objet: string
  corps: string
  envoye_le: string
  ouvert: boolean
  nb_ouvertures: number
  premier_ouverture: string | null
  gmail_thread_id: string | null
}

export interface TrackingPixel {
  id: string
  email_id: string
  prospect_id: string
  ouvert_le: string | null
}

export interface AppSetting {
  key: string
  value: string
  updated_at: string
}
