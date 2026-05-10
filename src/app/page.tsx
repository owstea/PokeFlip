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

interface User {
  id: string
  email?: string
}

export default function Home() {
  const { user: authUser, loading } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({
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

  const [chartData, setChartData] = useState({
    ventesParPlateforme: [] as Array<{ name: string; value: number }>,
    ventesParMois: [] as Array<{ mois: string; ventes: number }>,
    profitParArticle: [] as Array<{ nom: string; profit: number }>,
  })

  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    if (loading) return

    if (authUser) {
      const typedUser = authUser as User
      setUser(typedUser)
      setUserEmail(typedUser.email || '')
    } else {
      setUser(null)
      setUserEmail('')
    }
  }, [authUser, loading])

  useEffect(() => {
    if (!user?.id) return

    async function loadStats() {
      const currentUser = user
      if (!currentUser?.id) return

      try {
        // ========== FETCH ITEMS (USER) ==========
        const { data: achats, error: errorAchats } = await supabase
            .from('items')
            .select('*')
            .eq('user_id', currentUser.id)

        if (errorAchats) throw errorAchats

        // ========== FETCH VENTES (USER) ==========
        const { data: ventes, error: errorVentes } = await supabase
            .from('ventes')
            .select('*')
            .eq('user_id', currentUser.id)

        if (errorVentes) throw errorVentes

        // ========== CALCULS STOCK & INVESTISSEMENT ==========
        let quantiteEnStock = 0
        let valeurStock = 0
        let totalInvestiAvecVentes = 0
        let totalQuantiteAchetee = 0
        const profitParArticleData: Array<{ nom: string; profit: number }> = []

        ;(achats || []).forEach((item: any) => {
          const quantiteVendue = (ventes || [])
              .filter((v: any) => v.item_id === item.id)
              .reduce((sum: number, v: any) => sum + (v.quantite_vendue || 0), 0)

          const quantiteRestante = (item.quantite || 0) - quantiteVendue

          // Valeur en stock
          quantiteEnStock += quantiteRestante
          valeurStock += quantiteRestante * (item.prix_achat || 0)

          // Total investi (items achetés + items vendus)
          totalInvestiAvecVentes += (item.quantite || 0) * (item.prix_achat || 0)
          totalQuantiteAchetee += item.quantite || 0

          // Profit par article
          const ventesItem = (ventes || []).filter((v: any) => v.item_id === item.id)
          const profitArticle = ventesItem.reduce((sum: number, v: any) => sum + (((v.prix_vente || 0) - (item.prix_achat || 0)) * (v.quantite_vendue || 0)), 0)

          if (ventesItem.length > 0) {
            profitParArticleData.push({
              nom: item.nom || 'Sans nom',
              profit: profitArticle,
            })
          }
        })

        // ========== CALCULS STATS ==========
        const totalInvesti = (achats || []).reduce((sum: number, a: any) => sum + ((a.prix_achat || 0) * (a.quantite || 0)), 0)
        const totalVendu = (ventes || []).reduce((sum: number, v: any) => sum + ((v.prix_vente || 0) * (v.quantite_vendue || 0)), 0)
        const profit = totalVendu - totalInvesti
        const quantiteTotalVendue = (ventes || []).reduce((sum: number, v: any) => sum + (v.quantite_vendue || 0), 0)
        const tauxVente = totalQuantiteAchetee > 0 ? (quantiteTotalVendue / totalQuantiteAchetee) * 100 : 0
        const profitMoyen = quantiteTotalVendue > 0 ? profit / quantiteTotalVendue : 0
        const roi = totalInvesti > 0 ? (profit / totalInvesti) * 100 : 0

        setStats({
          totalAchats: (achats || []).length,
          totalVentes: (ventes || []).length,
          totalInvesti,
          totalVendu,
          profit,
          quantiteTotalVendue,
          beneficeTotal: profit,
          quantiteEnStock,
          valeurStock,
          totalInvestiAvecVentes,
          valeurVendue: totalVendu,
          tauxVente,
          profitMoyen,
          roi,
        })

        // ========== VENTES PAR PLATEFORME ==========
        const ventesParPlat: { [key: string]: number } = {}
        ;(ventes || []).forEach((v: any) => {
          const plateforme = v.plateforme || 'Autre'
          ventesParPlat[plateforme] = (ventesParPlat[plateforme] || 0) + ((v.prix_vente || 0) * (v.quantite_vendue || 0))
        })

        const ventesParPlateforme: Array<{ name: string; value: number }> = Object.entries(ventesParPlat).map(([plateforme, montant]) => ({
          name: plateforme || 'Autre',
          value: typeof montant === 'number' ? montant : 0,
        }))

        // ========== VENTES PAR MOIS ==========
        const ventesParMois: { [key: string]: number } = {}
        ;(ventes || []).forEach((v: any) => {
          const mois = new Date(v.date_vente || new Date()).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
          ventesParMois[mois] = (ventesParMois[mois] || 0) + ((v.prix_vente || 0) * (v.quantite_vendue || 0))
        })

        const ventesParMoisData: Array<{ mois: string; ventes: number }> = Object.entries(ventesParMois).map(([mois, montant]) => ({
          mois,
          ventes: typeof montant === 'number' ? montant : 0,
        }))

        setChartData({
          ventesParPlateforme,
          ventesParMois: ventesParMoisData,
          profitParArticle: profitParArticleData.sort((a, b) => b.profit - a.profit).slice(0, 10),
        })
      } catch (error) {
        console.error('Erreur:', error)
      }
    }

    loadStats()
  }, [user])

  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
          <p className="text-white text-xl">⏳ Chargement...</p>
        </div>
    )
  }

  if (!user) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
          <p className="text-white text-xl">Veuillez vous connecter</p>
        </div>
    )
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          {/* ========== HEADER ========== */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">📊 Tableau de Bord</h1>
            <p className="text-gray-400">Bienvenue, {userEmail || 'Utilisateur'} 👋</p>
          </div>

          {/* ========== STATS CARDS COMPACTES ========== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition">
              <h3 className="text-gray-600 text-xs font-bold mb-1">📦 Items</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalAchats}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition">
              <h3 className="text-gray-600 text-xs font-bold mb-1">💰 Vendus</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.quantiteTotalVendue}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition border-l-4 border-orange-500">
              <h3 className="text-gray-600 text-xs font-bold mb-1">💵 Investi</h3>
              <p className="text-xl font-bold text-orange-600">{stats.totalInvestiAvecVentes.toFixed(2)}€</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition border-l-4 border-cyan-500">
              <h3 className="text-gray-600 text-xs font-bold mb-1">📦 En Stock</h3>
              <p className="text-xl font-bold text-cyan-600">{stats.valeurStock.toFixed(2)}€</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition">
              <h3 className="text-gray-600 text-xs font-bold mb-1">💸 Vendu</h3>
              <p className="text-xl font-bold text-green-600">{stats.valeurVendue.toFixed(2)}€</p>
            </div>

            <div className={`p-4 rounded-lg shadow-lg hover:shadow-xl transition border-l-4 ${stats.profit >= 0 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <h3 className="text-gray-600 text-xs font-bold mb-1">🎉 Bénéfice</h3>
              <p className={`text-xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(2)}€
              </p>
            </div>
          </div>

          {/* ========== RÉSUMÉ INVESTISSEMENT & PERFORMANCE ========== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Résumé Investissement */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
              <h3 className="text-white text-lg font-bold mb-4">💼 Résumé Investissement</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Investissement total :</span>
                  <span className="text-orange-400 font-bold text-lg">{stats.totalInvestiAvecVentes.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Valeur en stock :</span>
                  <span className="text-cyan-400 font-bold text-lg">{stats.valeurStock.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Valeur vendue :</span>
                  <span className="text-green-400 font-bold text-lg">{stats.valeurVendue.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-green-500">
              <h3 className="text-white text-lg font-bold mb-4">📈 Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Taux de vente :</span>
                  <span className="text-blue-400 font-bold text-lg">{stats.tauxVente.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Profit moyen :</span>
                  <span className="text-purple-400 font-bold text-lg">{stats.profitMoyen.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">ROI :</span>
                  <span className="text-yellow-400 font-bold text-lg">{stats.roi.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========== CHARTS ========== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* GRAPH 1: Ventes par plateforme */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-800">🌐 Ventes par Plateforme</h3>
              {chartData.ventesParPlateforme.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                          data={chartData.ventesParPlateforme}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }: any) => `${name}: ${(value || 0).toFixed(0)}€`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                      >
                        {chartData.ventesParPlateforme.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `${(value || 0).toFixed(2)}€`} />
                    </PieChart>
                  </ResponsiveContainer>
              ) : (
                  <p className="text-gray-500 text-center py-8">Pas de données - Vendez un article pour voir les stats</p>
              )}
            </div>

            {/* GRAPH 2: Ventes par mois */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-800">📅 Ventes par Mois</h3>
              {chartData.ventesParMois.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.ventesParMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `${(value || 0).toFixed(2)}€`} />
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
                    <Tooltip formatter={(value: any) => `${(value || 0).toFixed(2)}€`} />
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
