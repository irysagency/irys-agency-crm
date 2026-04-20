export type NicheType =
  | 'Tech & IA'
  | 'Finance & Wealth'
  | 'Productivité & Second Brain'
  | 'Entrepreneur'
  | 'Marketing & Vente'
  | 'Creator Economy'
  | 'Ecommerce'
  | 'Make Money & Trends'

export type StatutType =
  | 'a_contacter'
  | 'envoye'
  | 'ouvert'
  | 'repondu'
  | 'call_booke'
  | 'signe'
  | 'refuse'

export const NICHES: NicheType[] = [
  'Tech & IA',
  'Finance & Wealth',
  'Productivité & Second Brain',
  'Entrepreneur',
  'Marketing & Vente',
  'Creator Economy',
  'Ecommerce',
  'Make Money & Trends',
]

export const STATUTS: readonly { key: StatutType; label: string }[] = [
  { key: 'a_contacter', label: 'À contacter' },
  { key: 'envoye', label: 'Envoyé' },
  { key: 'ouvert', label: 'Ouvert' },
  { key: 'repondu', label: 'Répondu' },
  { key: 'call_booke', label: 'Call booké' },
  { key: 'signe', label: 'Signé' },
  { key: 'refuse', label: 'Refusé' },
] as const

export const NICHE_COLORS: Record<NicheType, string> = {
  'Tech & IA': '#7F77DD',
  'Finance & Wealth': '#1D9E75',
  'Productivité & Second Brain': '#EF9F27',
  'Entrepreneur': '#E24B4A',
  'Marketing & Vente': '#3B82F6',
  'Creator Economy': '#EC4899',
  'Ecommerce': '#F97316',
  'Make Money & Trends': '#A855F7',
}

export * from './database'
