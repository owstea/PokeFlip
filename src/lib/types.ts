export type Pokemon = {
    id: string | number
    name: string
    type: string
    level: number
    image?: string
    date: string
}

export type Item = {
    id: string
    user_id: string
    name: string
    category: 'pokebox' | 'etb' | 'booster' | 'sleeve' | 'tapis' | 'autre'
    price: number
    quantity: number
    image_url?: string
    created_at: string
    description?: string
}

export type Vente = {
    id: string
    user_id: string
    item_id: string
    item_name: string
    prix_achat: number
    prix_vente: number
    quantite_vendue: number
    plateforme: 'ebay' | 'amazon' | 'vinted' | 'autre'
    date_vente: string
    created_at: string
}

export type Collection = {
    pokemons: Pokemon[]
    items: Item[]
}
