import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Achat {
  id: string
  nom: string
  prix: number
  date: string
  condition: string
  user_id: string
}

export interface Vente {
  id: string
  achatId: string
  prixVente: number
  dateVente: string
  profit: number
  user_id: string
}

// Récupérer les achats de l'utilisateur connecté
export async function getAchats(userId: string): Promise<Achat[]> {
  const { data, error } = await supabase
      .from('achats')
      .select('*')
      .eq('user_id', userId)

  return error ? [] : (data || [])
}

// Ajouter un achat
export async function addAchat(achat: Achat): Promise<void> {
  await supabase.from('achats').insert([achat])
}

// Supprimer un achat
export async function deleteAchat(id: string): Promise<void> {
  await supabase.from('achats').delete().eq('id', id)
}

// Récupérer les ventes de l'utilisateur connecté
export async function getVentes(userId: string): Promise<Vente[]> {
  const { data, error } = await supabase
      .from('ventes')
      .select('*')
      .eq('user_id', userId)

  return error ? [] : (data || [])
}

// Ajouter une vente
export async function addVente(vente: Vente): Promise<void> {
  await supabase.from('ventes').insert([vente])
}

// Supprimer une vente
export async function deleteVente(id: string): Promise<void> {
  await supabase.from('ventes').delete().eq('id', id)
}
