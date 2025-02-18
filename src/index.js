import express from "express";
import cors from "cors";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";


//JOI pour la validation des données/Blindage


dotenv.config();

// Lire le fichier JSON
const __filename = fileURLToPath(import.meta.url); //nous donne le chemin absolue
const __dirname = path.dirname(__filename);
const pokemonsList = JSON.parse(fs.readFileSync(path.join(__dirname, './data/pokemons.json'), 'utf8'));

const app = express();
const PORT = 3000;

const getLastId = () => {
  return Math.max(...pokemonsList.map(pokemon => pokemon.id));
};

// Fonction pour écrire les données mises à jour dans le fichier JSON
const savePokemons = () => {
  fs.writeFileSync(path.join(__dirname, './data/pokemons.json'), JSON.stringify(pokemonsList, null, 2), 'utf8');
};

// console.log('last id' + getLastId());

// Middleware pour CORS
app.use(cors());

// Middleware pour parser le JSON
app.use(express.json());

// Middleware pour servir des fichiers statiques
// 'app.use' est utilisé pour ajouter un middleware à notre application Express
// '/assets' est le chemin virtuel où les fichiers seront accessibles
// 'express.static' est un middleware qui sert des fichiers statiques
// 'path.join(__dirname, '../assets')' construit le chemin absolu vers le dossier 'assets'
app.use("/assets", express.static(path.join(__dirname, "../assets")));

// Route GET de base
app.get("/api/pokemons", (req, res) => {
  res.status(200).send({
    /*types: [
      "fire",
      "water",
      "grass",
      "electric",
      "ice",
      "fighting",
      "poison",
      "ground",
      "flying",
      "psychic",
      "bug",
      "rock",
      "ghost",
      "dragon",
      "dark",
      "steel",
      "fairy",
    ],*/
    pokemons: pokemonsList,
  });
});

// Route GET home
app.get("/", (req, res) => {
  res.send("bienvenue sur l'API Pokémon");
});

// Route POST créer un Pokemon 
// http://localhost:3000/api/create?name=Samos&type=Humain&hp=40&attack=25&defense=25&SpAttack=90&SpDefense=60&speed=150
app.post("/api/create", (req, res) => {
  

    const { name, type, hp, attack, defense, SpAttack, SpDefense, speed} = req.query;

    if (!name || !type || !hp || !attack || !defense || !SpAttack || !SpDefense || !speed) 
      return res.status(400).send({ error: "Tous les champs sont requis" });

    const newId = getLastId() + 1;

    const newPokemon = {
      id: newId,
      name : {
        english: name,
        japanese: name,
        chinese: name,
        french: name
      },
      type, 
      hp, 
      attack, 
      defense, 
      SpAttack, 
      SpDefense, 
      speed, 
      image : "http://localhost:3000/assets/pokemons/" + newId + ".png"
    };

    pokemonsList.push(newPokemon);
    savePokemons();
  
    res.status(200).send({
      message: "Pokemon créé avec succès",
      pokemons: pokemonsList,
    });
  });

// Route PUT Met à jour un pokemon existant
app.put("/api/update", (req, res) => {
  const { id, name, type, hp, attack, defense, SpAttack, SpDefense, speed } = req.body;

  if (!id) {
    return res.status(400).send({ error: "L'ID est requis" });
  }

  const pokemon = pokemonsList.find(p => p.id === parseInt(id));
  if (!pokemon) {
    return res.status(404).send({ error: "Pokemon non trouvé" });
  }

  if (name) pokemon.name = { ...pokemon.name, ...name };
  if (type) pokemon.type = type;
  if (hp) pokemon.hp = hp;
  if (attack) pokemon.attack = attack;
  if (defense) pokemon.defense = defense;
  if (SpAttack) pokemon.SpAttack = SpAttack;
  if (SpDefense) pokemon.SpDefense = SpDefense;
  if (speed) pokemon.speed = speed;

  savePokemons();

  res.status(200).send({
  message: `Pokemon n° ${id} mis à jour avec succès`,
    pokemons: pokemon,
  });
});

// Route DELETE supprime un pokemon 
app.delete("/api/delete", (req, res) => {
  const {id} = req.body;

  if (!id) {
    return res.status(400).send({ error: "L'ID est requis" });
  }

  const pokemonIndex = pokemonsList.findIndex(p => p.id === parseInt(id));
  if (pokemonIndex === -1) {
    return res.status(404).send({ error: "Pokemon non trouvé" });
  }

   // Supprimer le Pokémon
   pokemonsList.splice(pokemonIndex, 1);

  // Mettre à jour les IDs pour éviter les trous
  pokemonsList.forEach((pokemon, index) => {
    pokemon.id = index + 1; //+1 : Pour commencer les id à partir de 1
  });

  savePokemons();

  res.status(200).send({
  message: `Pokemon n° ${id} supprimé`,
  });
});



// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur : http://localhost:${PORT}`);
});
