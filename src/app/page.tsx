'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Item {
  id: string
  nom: string
  quantite: number
  prix_achat: number
  user_id: string
}

interface Vente {
  id: string
  item_id: string
  quantite_vendue: number
  prix_vente: number
  plateforme: string
  date_vente: string
  user_id: string
}

interface Stats {
  totalAchats: number
  totalVentes: number
  totalInvesti: number
  totalVendu: number
  profit: number
  quantiteTotalVendue: number
  beneficeTotal: number
  quantiteEnStock: number
  valeurStock: number
  totalInvestiAvecVentes: number
  valeurVendue: number
  tauxVente: number
  profitMoyen: number
  roi: number
}

interface ChartData {
  ventesParPlateforme: Array<{ name: string; value: number }>
  ventesParMois: Array<{ mois: string; ventes: number }>
  profitParArticle: Array<{ nom: string; profit: number }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function Home() {
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalAchats: 0,
    totalVentes: 0,
    totalInvesti: 0,
    totalVendu: 0,
    profit: 0,
    quantiteTotalVendue: 0,
    beneficeTotal: 0,
    quantiteEnStock: 0,
    valeurStock: 0,
    totalInvestiAvecVentes: 0,
    valeurVendue: 0,
    tauxVente: 0,
    profitMoyen: 0,
    roi: 0,
  })

  const [chartData, setChartData] = useState<ChartData>({
    ventesParPlateforme: [],
    ventesParMois: [],
    profitParArticle: [],
  })

  useEffect(() => {
    if (loading || !user?.id) return

    async function loadStats() {
      try {
        // ========== FETCH ITEMS ==========
        const { data: achats, error: errorAchats } = await supabase
            .from('items')
            .select('*')
            .eq('user_id', user.id)

        if (errorAchats) throw errorAchats

        // ========== FETCH VENTES ==========
        const { data: ventes, error: errorVentes } = await supabase
            .from('ventes')
            .select('*')
            .eq('user_id', user.id)

        if (errorVentes) throw errorVentes

        // ========== CALCUL STATS ==========
        const achatsArray = (achats || []) as Item[]
        const ventesArray = (ventes || []) as Vente[]

        let quantiteEnStock = 0
        let valeurStock = 0
        let totalInvestiAvecVentes = 0
        let totalQuantiteAchetee = 0
        let totalQuantiteVendue = 0
        let totalVenduMontant = 0
        let profitTotal = 0

        const profitParArticleMap: Record<string, number> = {}
        const ventesParPlat: Record<string, number> = {}
        const ventesParMoisMap: Record<string, number> = {}

        // Parcourir les achats
        achatsArray.forEach((item: Item) => {
          const quantiteVendue = ventesArray
              .filter((v: Vente) => v.item_id === item.id)
              .reduce((sum: number, v: Vente) => sum + v.quantite_vendue, 0)

          const quantiteRestante = item.quantite - quantiteVendue
          const investiItem = item.prix_achat * item.quantite

          totalQuantiteAchetee += item.quantite
          quantiteEnStock += quantiteRestante
          valeurStock += quantiteRestante * item.prix_achat
          totalInvestiAvecVentes += investiItem

          // Profit par article
          const venteItem = ventesArray
              .filter((v: Vente) => v.item_id === item.id)
              .reduce((sum: number, v: Vente) => sum + v.prix_vente * v.quantite_vendue, 0)

          const profitItem = venteItem - item.prix_achat * quantiteVendue
          profitParArticleMap[item.nom] = profitItem
          profitTotal += profitItem
        })

        // Parcourir les ventes
        ventesArray.forEach((vente: Vente) => {
          totalQuantiteVendue += vente.quantite_vendue
          totalVenduMontant += vente.prix_vente * vente.quantite_vendue

          // Ventes par plateforme
          ventesParPlat[vente.plateforme] =
              (ventesParPlat[vente.plateforme] || 0) + vente.prix_vente * vente.quantite_vendue

          // Ventes par mois
          const date = new Date(vente.date_vente)
          const moisKey = `${date.getMonth() + 1}/${date.getFullYear()}`
          ventesParMoisMap[moisKey] =
              (ventesParMoisMap[moisKey] || 0) + vente.prix_vente * vente.quantite_vendue
        })

        // ========== CONSTRUCTION CHART DATA ==========
        const ventesParPlateformeData = Object.entries(ventesParPlat).map(
            ([plateforme, montant]) => ({
              name: plateforme || 'Autre',
              value: montant,
            })
        )

        const ventesParMoisData = Object.entries(ventesParMoisMap)
            .sort()
            .map(([mois, montant]) => ({
              mois,
              ventes: montant,
            }))

        const profitParArticleData = Object.entries(profitParArticleMap)
            .map(([nom, profit]) => ({
              nom,
              profit,
            }))
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 10)

        // ========== CALCUL TAUX & ROI ==========
        const tauxVente = totalQuantiteAchetee > 0 ? (totalQuantiteVendue / totalQuantiteAchetee) * 100 : 0
        const profitMoyen = totalQuantiteVendue > 0 ? profitTotal / totalQuantiteVendue : 0
        const roi = totalInvestiAvecVentes > 0 ? (profitTotal / totalInvestiAvecVentes) * 100 : 0

        // ========== SET STATS ==========
        setStats({
          totalAchats: achatsArray.length,
          totalVentes: ventesArray.length,
          totalInvesti: totalInvestiAvecVentes,
          totalVendu: totalVenduMontant,
          profit: profitTotal,
          quantiteTotalVendue: totalQuantiteVendue,
          beneficeTotal: profitTotal,
          quantiteEnStock,
          valeurStock,
          totalInvestiAvecVentes,
          valeurVendue: totalVenduMontant,
          tauxVente,
          profitMoyen,
          roi,
        })

        setChartData({
          ventesParPlateforme: ventesParPlateformeData,
          ventesParMois: ventesParMoisData,
          profitParArticle: profitParArticleData,
        })
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error)
      }
    }

    loadStats()
  }, [user?.id, loading])

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><p>Chargement...</p></div>
  }

  if (!user?.id) {
    return <div className="flex items-center justify-center h-screen"><p>Vous devez être connecté</p></div>
  }

  return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Tableau de Bord</h1>
            <p className="text-gray-600">Bienvenue {user?.email}</p>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Card 1: Total Investi */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
              <p className="text-sm font-semibold opacity-90">💰 Total Investi</p>
              <p className="text-2xl font-bold mt-2">{stats.totalInvesti.toFixed(2)}€</p>
              <p className="text-xs mt-2 opacity-75">{stats.totalAchats} articles achetés</p>
            </div>

            {/* Card 2: Total Vendu */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
              <p className="text-sm font-semibold opacity-90">💵 Total Vendu</p>
              <p className="text-2xl font-bold mt-2">{stats.totalVendu.toFixed(2)}€</p>
              <p className="text-xs mt-2 opacity-75">{stats.totalVentes} ventes effectuées</p>
            </div>

            {/* Card 3: Profit */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
              <p className="text-sm font-semibold opacity-90">🎯 Profit Total</p>
              <p className="text-2xl font-bold mt-2">{stats.profit.toFixed(2)}€</p>
              <p className="text-xs mt-2 opacity-75">ROI: {stats.roi.toFixed(2)}%</p>
            </div>

            {/* Card 4: Stock */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
              <p className="text-sm font-semibold opacity-90">📦 Stock Actuel</p>
              <p className="text-2xl font-bold mt-2">{stats.quantiteEnStock}</p>
              <p className="text-xs mt-2 opacity-75">Valeur: {stats.valeurStock.toFixed(2)}€</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
              <p className="text-sm text-gray-600 font-semibold">📈 Taux de Vente</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.tauxVente.toFixed(1)}%</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
              <p className="text-sm text-gray-600 font-semibold">💎 Profit Moyen/Unité</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.profitMoyen.toFixed(2)}€</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
              <p className="text-sm text-gray-600 font-semibold">🚀 Quantité Vendue</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.quantiteTotalVendue}</p>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* GRAPH 1: Ventes par Plateforme */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-800">🛒 Ventes par Plateforme</h3>
              {chartData.ventesParPlateforme.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                          data={chartData.ventesParPlateforme}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${typeof value === 'number' ? value.toFixed(2) : 0}€`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                      >
                        {chartData.ventesParPlateforme.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => {
                        const numValue = typeof value === 'number' ? value : 0
                        return `${numValue.toFixed(2)}€`
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
              ) : (
                  <p className="text-gray-500 text-center py-8">Pas de données - Vendez un article pour voir les stats</p>
              )}
            </div>

            {/* GRAPH 2: Ventes par Mois */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-800">📅 Ventes par Mois</h3>
              {chartData.ventesParMois.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.ventesParMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip formatter={(value) => {
                        const numValue = typeof value === 'number' ? value : 0
                        return `${numValue.toFixed(2)}€`
                      }} />
                      <Legend />
                      <Line type="monotone" dataKey="ventes" stroke="#3b82f6" name="Ventes (€)" />
                    </LineChart>
                  </ResponsiveContainer>
              ) : (
                  <p className="text-gray-500 text-center py-8">Pas de données - Vendez un article pour voir les stats</p>
              )}
            </div>
          </div>

          {/* GRAPH 3: Top articles par profit */}
          <div className="bg-white p-6 rounded-lg shadow-lg lg:col-span-2 mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-800">🏆 Top Articles par Profit</h3>
            {chartData.profitParArticle.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.profitParArticle} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nom" type="category" width={150} />
                    <Tooltip formatter={(value) => {
                      const numValue = typeof value === 'number' ? value : 0
                      return `${numValue.toFixed(2)}€`
                    }} />
                    <Legend />
                    <Bar dataKey="profit" fill="#10b981" name="Profit (€)" />
                  </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-gray-500 text-center py-8">Pas de données - Vendez un article pour voir les stats</p>
            )}
          </div>
        </div>
      </div>
  )
}
