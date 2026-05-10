'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddPokemon() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [level, setLevel] = useState('');
    const [image, setImage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !type || !level) {
            alert('Remplis tous les champs !');
            return;
        }

        // Récupère les pokémon existants
        const existing = localStorage.getItem('pokemons');
        const pokemons = existing ? JSON.parse(existing) : [];

        // Ajoute le nouveau pokémon
        const newPokemon = {
            id: Date.now(),
            name,
            type,
            level: parseInt(level),
            image: image || '/pokemon-placeholder.png',
            date: new Date().toLocaleDateString('fr-FR'),
        };

        pokemons.push(newPokemon);
        localStorage.setItem('pokemons', JSON.stringify(pokemons));

        alert('Pokémon ajouté avec succès !');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-500 to-yellow-400 p-4">
            <div className="max-w-md mx-auto mt-10">
                <div className="bg-white rounded-lg shadow-xl p-6">
                    <h1 className="text-3xl font-bold text-center text-red-600 mb-6">
                        Ajouter un Pokémon
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom du Pokémon
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Pikachu"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            >
                                <option value="">Sélectionne un type</option>
                                <option value="Électrique">Électrique</option>
                                <option value="Feu">Feu</option>
                                <option value="Eau">Eau</option>
                                <option value="Plante">Plante</option>
                                <option value="Normal">Normal</option>
                                <option value="Combat">Combat</option>
                                <option value="Vol">Vol</option>
                                <option value="Poison">Poison</option>
                                <option value="Sol">Sol</option>
                                <option value="Roche">Roche</option>
                                <option value="Insecte">Insecte</option>
                                <option value="Fantôme">Fantôme</option>
                                <option value="Acier">Acier</option>
                                <option value="Fée">Fée</option>
                                <option value="Ténèbres">Ténèbres</option>
                                <option value="Dragon">Dragon</option>
                                <option value="Psy">Psy</option>
                                <option value="Glace">Glace</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Niveau
                            </label>
                            <input
                                type="number"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                placeholder="Ex: 25"
                                min="1"
                                max="100"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL de l'image (optionnel)
                            </label>
                            <input
                                type="text"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
                            >
                                Ajouter
                            </button>
                            <Link
                                href="/"
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg text-center transition"
                            >
                                Annuler
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
