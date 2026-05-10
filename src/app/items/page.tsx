'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Item, Vente } from '@/lib/types';
import Link from 'next/link';
import { Plus, Edit2, Trash2, ShoppingBag, TrendingUp } from 'lucide-react';

type Tab = 'items' | 'ventes';
type SortBy = 'nom' | 'prix' | 'quantite' | 'date';
type SortOrder = 'asc' | 'desc';

export default function ItemsPage() {
    // ========== STATES ==========
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<any>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [ventes, setVentes] = useState<Vente[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalValue, setTotalValue] = useState(0);
    const [activeTab, setActiveTab] = useState<Tab>('items');

    // ========== MODAL STATES ==========
    const [showVenteModal, setShowVenteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);// ========== ADD ITEM STATES ==========
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState<'cartes' | 'display' | 'coffret' | 'etb' | 'upc' | 'accessoire' | 'autre'>('cartes');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState('1');

    // ========== VENTE MODAL STATES ==========
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [prixVente, setPrixVente] = useState('');
    const [quantiteVendue, setQuantiteVendue] = useState('1');
    const [plateforme, setPlateforme] = useState('ebay');
    const [hasShipping, setHasShipping] = useState(false);
    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [adresse, setAdresse] = useState('');
    const [numSuivi, setNumSuivi] = useState('');
    const [transporteur, setTransporteur] = useState<'mondial-relais' | 'chronopost' | 'colissimo'>('chronopost');

    // ========== EDIT ITEM STATES ==========
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState<'cartes' | 'display' | 'coffret' | 'etb' | 'upc' | 'accessoire' | 'autre'>('cartes');
    const [editPrice, setEditPrice] = useState('');
    const [editQuantity, setEditQuantity] = useState('');

    // ========== FILTER & SEARCH STATES ==========
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // ========== VENTES FILTER STATES ==========
    const [searchTermVentes, setSearchTermVentes] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('all');
    const [sortByVentes, setSortByVentes] = useState('date');
    const [sortOrderVentes, setSortOrderVentes] = useState<SortOrder>('desc');

    useEffect(() => {
        const initializeData = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!authUser) {
                    router.push('/auth/login');
                    return;
                }

                setUser(authUser);
                await fetchItems(authUser.id);
                await fetchVentes(authUser.id);
            } catch (error) {
                console.error('Erreur:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, [router]);

    // ========== FETCH ITEMS ==========
    const fetchItems = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedItems = (data || []).map((dbItem: any) => ({
                id: dbItem.id,
                user_id: dbItem.user_id,
                name: dbItem.nom || '',
                category: dbItem.categorie || 'autre',
                price: Number(dbItem.prix_achat) || 0,
                quantity: Number(dbItem.quantite) || 0,
                created_at: dbItem.created_at,
            }));

            setItems(mappedItems);
            calculateTotalValue(mappedItems);
        } catch (error) {
            console.error('Erreur fetch items:', error);
        }
    };

    // ========== FETCH VENTES ==========
    const fetchVentes = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('ventes')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setVentes(data || []);
        } catch (error) {
            console.error('Erreur fetch ventes:', error);
        }
    };

    // ========== CALCULATE TOTAL VALUE ==========
    const calculateTotalValue = (itemsToCalculate: Item[]) => {
        const total = itemsToCalculate.reduce((sum, item) => {
            const price = item.price || 0;
            const quantity = item.quantity || 0;
            return sum + (price * quantity);
        }, 0);
        setTotalValue(total);
    };

    // ========== ADD ITEM ==========
    const handleAddItem = async () => {
        if (!newItemName || !newItemPrice || !user) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('items')
                .insert([
                    {
                        user_id: user.id,
                        nom: newItemName,
                        categorie: newItemCategory,
                        prix_achat: parseFloat(newItemPrice),
                        quantite: parseInt(newItemQuantity),
                        created_at: new Date().toISOString(),
                    }
                ])
                .select();

            if (error) throw error;

            if (data) {
                const newItems = [
                    {
                        id: data[0].id,
                        user_id: data[0].user_id,
                        name: data[0].nom,
                        category: data[0].categorie,
                        price: data[0].prix_achat,
                        quantity: data[0].quantite,
                        created_at: data[0].created_at,
                    },
                    ...items,
                ];
                setItems(newItems);
                calculateTotalValue(newItems);
                setNewItemName('');
                setNewItemPrice('');
                setNewItemQuantity('1');
                setNewItemCategory('cartes');
                setShowAddItemModal(false);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'ajout');
        }
    };

    // ========== DELETE ITEM ==========
    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;

            const updatedItems = items.filter(item => item.id !== itemId);
            setItems(updatedItems);
            calculateTotalValue(updatedItems);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la suppression');
        }
    };

    // ========== OPEN VENTE MODAL ==========
    const openVenteModal = (itemId: string) => {
        setSelectedItemId(itemId);
        setPrixVente('');
        setQuantiteVendue('1');
        setPlateforme('ebay');
        setHasShipping(false);
        setPrenom('');
        setNom('');
        setAdresse('');
        setNumSuivi('');
        setTransporteur('chronopost');
        setShowVenteModal(true);
    };

    // ========== CLOSE VENTE MODAL ==========
    const closeVenteModal = () => {
        setShowVenteModal(false);
        setSelectedItemId(null);
    };

    // ========== ADD VENTE ==========
    const handleAddVente = async () => {
        if (!prixVente || !quantiteVendue || !selectedItemId) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        if (hasShipping && (!prenom || !nom || !adresse || !numSuivi)) {
            alert('Veuillez remplir tous les champs de livraison');
            return;
        }

        const item = items.find(i => i.id === selectedItemId);
        if (!item) return;

        try {
            const { data, error } = await supabase
                .from('ventes')
                .insert([
                    {
                        user_id: user.id,
                        item_id: selectedItemId,
                        item_nom: item.name,
                        prix_vente: parseFloat(prixVente),
                        quantite_vendue: parseInt(quantiteVendue),
                        plateforme: plateforme,
                        date_vente: new Date().toISOString(),
                        has_shipping: hasShipping,
                        prenom: hasShipping ? prenom : null,
                        nom: hasShipping ? nom : null,
                        adresse: hasShipping ? adresse : null,
                        num_suivi: hasShipping ? numSuivi : null,
                        transporteur: hasShipping ? transporteur : null,
                        created_at: new Date().toISOString(),
                    }
                ])
                .select();

            if (error) throw error;

            if (data) {
                setVentes([...data, ...ventes]);

                // Mettre à jour la quantité de l'article
                const quantityToSubtract = parseInt(quantiteVendue);
                const updatedItems = items.map(item =>
                    item.id === selectedItemId
                        ? { ...item, quantity: Math.max(0, item.quantity - quantityToSubtract) }
                        : item
                );

                setItems(updatedItems);
                calculateTotalValue(updatedItems);

                // Mettre à jour en base de données
                await supabase
                    .from('items')
                    .update({ quantite: updatedItems.find(i => i.id === selectedItemId)?.quantity || 0 })
                    .eq('id', selectedItemId);
            }

            closeVenteModal();
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'ajout de la vente');
        }
    };

    // ========== OPEN EDIT MODAL ==========
    const openEditModal = (item: Item) => {
        setEditingItem(item);
        setEditName(item.name);
        setEditCategory(item.category as any);
        setEditPrice(item.price.toString());
        setEditQuantity(item.quantity.toString());
        setShowEditModal(true);
    };

    // ========== CLOSE EDIT MODAL ==========
    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingItem(null);
    };

    // ========== EDIT ITEM ==========
    const handleEditItem = async () => {
        if (!editingItem || !editName || !editPrice || !editQuantity) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        try {
            const { error } = await supabase
                .from('items')
                .update({
                    nom: editName,
                    categorie: editCategory,
                    prix_achat: parseFloat(editPrice),
                    quantite: parseInt(editQuantity),
                })
                .eq('id', editingItem.id);

            if (error) throw error;

            const updatedItems = items.map(item =>
                item.id === editingItem.id
                    ? {
                        ...item,
                        name: editName,
                        category: editCategory,
                        price: parseFloat(editPrice),
                        quantity: parseInt(editQuantity),
                    }
                    : item
            );

            setItems(updatedItems);
            closeEditModal();
            calculateTotalValue(updatedItems);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la modification');
        }
    };

    // ========== FILTER & SORT ITEMS ==========
    const filteredAndSortedItems = () => {
        let filtered = items;

        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortBy) {
                case 'nom':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'prix':
                    aValue = a.price;
                    bValue = b.price;
                    break;
                case 'quantite':
                    aValue = a.quantity;
                    bValue = b.quantity;
                    break;
                case 'date':
                    aValue = new Date(a.created_at).getTime();
                    bValue = new Date(b.created_at).getTime();
                    break;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    };

    // ========== FILTER & SORT VENTES ==========
    const filteredAndSortedVentes = () => {
        let filtered = ventes;

        if (searchTermVentes) {
            filtered = filtered.filter(vente =>
                vente.item_nom.toLowerCase().includes(searchTermVentes.toLowerCase())
            );
        }

        if (selectedPlatform !== 'all') {
            filtered = filtered.filter(vente => vente.plateforme === selectedPlatform);
        }

        filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortByVentes) {
                case 'date':
                    aValue = new Date(a.created_at).getTime();
                    bValue = new Date(b.created_at).getTime();
                    break;
                case 'prix':
                    aValue = a.prix_vente;
                    bValue = b.prix_vente;
                    break;
                case 'plateforme':
                    aValue = a.plateforme.toLowerCase();
                    bValue = b.plateforme.toLowerCase();
                    break;
            }

            if (sortOrderVentes === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    };

    const displayedItems = filteredAndSortedItems();
    const displayedVentes = filteredAndSortedVentes();

    // ========== LOADING ==========
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            {/* ========== HEADER ========== */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">📦 Inventaire</h1>
                    </div>

                    {/* ========== STATS ========== */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-gray-600 text-sm">Total articles</p>
                            <p className="text-3xl font-bold text-blue-600">{items.length}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-gray-600 text-sm">Stock total</p>
                            <p className="text-3xl font-bold text-green-600">
                                {items.reduce((sum, item) => sum + item.quantity, 0)}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-gray-600 text-sm">Valeur totale</p>
                            <p className="text-3xl font-bold text-purple-600">
                                {totalValue.toFixed(2)}€
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== TABS ========== */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('items')}
                            className={`py-4 px-2 font-semibold border-b-2 transition ${
                                activeTab === 'items'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Articles ({items.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('ventes')}
                            className={`py-4 px-2 font-semibold border-b-2 transition ${
                                activeTab === 'ventes'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Ventes ({ventes.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* ========== CONTENT ========== */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'items' && (
                    <div>
                        {/* ========== BUTTON AJOUTER ARTICLE ========== */}
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Mes articles</h2>
                            <button
                                onClick={() => setShowAddItemModal(true)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                            >
                                <Plus size={20} />
                                Ajouter un article
                            </button>
                        </div>

                        {/* ========== FILTRES ========== */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filtres et tri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Recherche */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Rechercher
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nom de l'article..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Catégorie */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Catégorie
                                    </label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">Toutes</option>
                                        <option value="cartes">Cartes</option>
                                        <option value="display">Display</option>
                                        <option value="coffret">Coffret</option>
                                        <option value="etb">ETB</option>
                                        <option value="upc">UPC</option>
                                        <option value="accessoire">Accessoire</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                </div>

                                {/* Trier par */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Trier par
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="date">Date</option>
                                        <option value="nom">Nom</option>
                                        <option value="prix">Prix</option>
                                        <option value="quantite">Quantité</option>
                                    </select>
                                </div>

                                {/* Ordre */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ordre
                                    </label>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="asc">Croissant</option>
                                        <option value="desc">Décroissant</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ========== TABLE DESKTOP ========== */}
                        {displayedItems.length > 0 ? (
                            <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                            Nom
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                            Catégorie
                                        </th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                                            Prix
                                        </th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                                            Quantité
                                        </th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                    {displayedItems.map((item) => {
                                        const price = item.price || 0;
                                        const quantity = item.quantity || 0;
                                        const total = price * quantity;

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {item.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                                                    {price.toFixed(2)}€
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                                                    {quantity}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-900 font-bold">
                                                    {total.toFixed(2)}€
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            onClick={() => openEditModal(item)}
                                                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                                                        >
                                                            🗑️
                                                        </button>
                                                        <button
                                                            onClick={() => openVenteModal(item.id)}
                                                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
                                                        >
                                                            💰
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <p className="text-gray-600 text-lg">Aucun article trouvé</p>
                            </div>
                        )}

                        {/* ========== CARDS MOBILE ========== */}
                        <div className="md:hidden space-y-4">
                            {displayedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-600"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Prix:</span>
                                            <span className="font-semibold text-gray-900">
                                                {(item.price || 0).toFixed(2)}€
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Quantité:</span>
                                            <span className="font-semibold text-gray-900">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total:</span>
                                            <span className="font-bold text-gray-900">
                                                {((item.price || 0) * item.quantity).toFixed(2)}€
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Date:</span>
                                            <span className="text-gray-900">
                                                {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(item)}
                                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                                        >
                                            ✏️ Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                                        >
                                            🗑️ Supprimer
                                        </button>
                                        <button
                                            onClick={() => openVenteModal(item.id)}
                                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
                                        >
                                            💰 Vendre
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'ventes' && (
                    <div>
                        {/* ========== TITRE VENTES ========== */}
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Historique des ventes</h2>
                        </div>

                        {/* ========== FILTRES VENTES ========== */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filtres et tri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Recherche */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Rechercher
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nom de l'article..."
                                        value={searchTermVentes}
                                        onChange={(e) => setSearchTermVentes(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Plateforme */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Plateforme
                                    </label>
                                    <select
                                        value={selectedPlatform}
                                        onChange={(e) => setSelectedPlatform(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">Toutes</option>
                                        <option value="ebay">eBay</option>
                                        <option value="vinted">Vinted</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                </div>

                                {/* Trier par */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Trier par
                                    </label>
                                    <select
                                        value={sortByVentes}
                                        onChange={(e) => setSortByVentes(e.target.value as any)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="date">Date</option>
                                        <option value="prix">Prix</option>
                                        <option value="plateforme">Plateforme</option>
                                    </select>
                                </div>

                                {/* Ordre */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ordre
                                    </label>
                                    <select
                                        value={sortOrderVentes}
                                        onChange={(e) => setSortOrderVentes(e.target.value as SortOrder)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="asc">Croissant</option>
                                        <option value="desc">Décroissant</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ========== TABLE VENTES DESKTOP ========== */}
                        {displayedVentes.length > 0 ? (
                            <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                            Article
                                        </th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                                            Prix
                                        </th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                                            Quantité
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                            Plateforme
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                            Livraison
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                    {displayedVentes.map((vente) => (
                                        <tr key={vente.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {vente.item_nom}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                                                {vente.prix_vente.toFixed(2)}€
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-900">
                                                {vente.quantite_vendue}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                                    {vente.plateforme}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(vente.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {vente.has_shipping ? (
                                                    <span className="text-green-600 font-bold">✓ Oui</span>
                                                ) : (
                                                    <span className="text-gray-400">✗ Non</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <p className="text-gray-600 text-lg">Aucune vente trouvée</p>
                            </div>
                        )}

                        {/* ========== CARDS MOBILE VENTES ========== */}
                        <div className="md:hidden space-y-4">
                            {displayedVentes.map((vente) => (
                                <div
                                    key={vente.id}
                                    className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-600"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-gray-900">{vente.item_nom}</h3>
                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                            {vente.plateforme}
                                        </span>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Prix:</span>
                                            <span className="font-semibold text-gray-900">
                                                {vente.prix_vente.toFixed(2)}€
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Quantité:</span>
                                            <span className="font-semibold text-gray-900">
                                                {vente.quantite_vendue}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Date:</span>
                                            <span className="text-gray-900">
                                                {new Date(vente.created_at).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Livraison:</span>
                                            <span className="font-semibold text-gray-900">
                                                {vente.has_shipping ? '✓ Oui' : '✗ Non'}
                                            </span>
                                        </div>
                                        {vente.has_shipping && (
                                            <>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">Transporteur:</span>
                                                    <span className="text-gray-900">{vente.transporteur}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">N° Suivi:</span>
                                                    <span className="text-gray-900">{vente.num_suivi}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ========== MODAL ADD ITEM ========== */}
            {showAddItemModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">➕ Ajouter un article</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    Nom de l'article *
                                </label>
                                <input
                                    type="text"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Booster Pokémon"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    Catégorie *
                                </label>
                                <select
                                    value={newItemCategory}
                                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="cartes">Cartes</option>
                                    <option value="display">Display</option>
                                    <option value="coffret">Coffret</option>
                                    <option value="etb">ETB</option>
                                    <option value="upc">UPC</option>
                                    <option value="accessoire">Accessoire</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    Prix d'achat (€) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newItemPrice}
                                    onChange={(e) => setNewItemPrice(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: 15.99"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    Quantité *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newItemQuantity}
                                    onChange={(e) => setNewItemQuantity(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddItemModal(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAddItem}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== MODAL VENTE ========== */}
            {showVenteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Enregistrer une vente</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    Prix de vente (€) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={prixVente}
                                    onChange={(e) => setPrixVente(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Ex: 25.00"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    Quantité vendue *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantiteVendue}
                                    onChange={(e) => setQuantiteVendue(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    Plateforme *
                                </label>
                                <select
                                    value={plateforme}
                                    onChange={(e) => setPlateforme(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="ebay">eBay</option>
                                    <option value="vinted">Vinted</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>

                            {/* ========== CHECKBOX LIVRAISON ========== */}
                            <div className="border-t pt-4 mt-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasShipping}
                                        onChange={(e) => setHasShipping(e.target.checked)}
                                        className="w-5 h-5 rounded cursor-pointer"
                                    />
                                    <span className="text-gray-700 font-semibold">📦 Ajouter infos livraison</span>
                                </label>
                            </div>

                            {/* ========== SHIPPING INFO ========== */}
                            {hasShipping && (
                                <>
                                    <div>
                                        <label className="block text-gray-700 font-bold mb-2">
                                            Prénom *
                                        </label>
                                        <input
                                            type="text"
                                            value={prenom}
                                            onChange={(e) => setPrenom(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-bold mb-2">
                                            Nom *
                                        </label>
                                        <input
                                            type="text"
                                            value={nom}
                                            onChange={(e) => setNom(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-bold mb-2">
                                            Adresse *
                                        </label>
                                        <textarea
                                            value={adresse}
                                            onChange={(e) => setAdresse(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="123 Rue de la Paix, 75000 Paris"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-bold mb-2">
                                            Transporteur *
                                        </label>
                                        <select
                                            value={transporteur}
                                            onChange={(e) => setTransporteur(e.target.value as any)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="chronopost">Chronopost</option>
                                            <option value="colissimo">Colissimo</option>
                                            <option value="mondial-relais">Mondial Relay</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-bold mb-2">
                                            Numéro de suivi *
                                        </label>
                                        <input
                                            type="text"
                                            value={numSuivi}
                                            onChange={(e) => setNumSuivi(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeVenteModal}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAddVente}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition"
                            >
                                Valider la vente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== MODAL EDIT ========== */}
            {showEditModal && editingItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">✏️ Modifier l'article</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    Nom de l'article
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    Catégorie
                                </label>
                                <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value as any)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="cartes">Cartes</option>
                                    <option value="display">Display</option>
                                    <option value="coffret">Coffret</option>
                                    <option value="etb">ETB</option>
                                    <option value="upc">UPC</option>
                                    <option value="accessoire">Accessoire</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    Prix d'achat (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    Quantité
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeEditModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleEditItem}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                            >
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
