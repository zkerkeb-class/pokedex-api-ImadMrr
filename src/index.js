import express from "express";
import cors from "cors";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";


const mongoURI = "mongodb://localhost:27017"; // Adresse de MongoDB
const dbName = "PokeApp"; // Nom de la base de données
const collectionName = "pokemon"; // Collection qui contient les Pokémon
let db;

// Connexion à MongoDB
MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    console.log("Connecté à MongoDB");
    db = client.db(dbName); // Stocker la connexion à la base
  })
  .catch(err => console.error("Erreur de connexion :", err));



/*const PokemonSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: {
    english: { type: String, required: true },
    japanese: { type: String, required: true },
    chinese: { type: String, required: true },
    french: { type: String, required: true }
  },
  type: { type: [String], required: true },
  base: {
    HP: { type: Number, required: true },
    Attack: { type: Number, required: true },
    Defense: { type: Number, required: true },
    SpAttack: { type: Number, required: true },
    SpDefense: { type: Number, required: true },
    Speed: { type: Number, required: true }
  },
  image: { type: String, required: true },
  imageShiny: { type: String, required: true }
});

const Pokemon = mongoose.model("Pokemon", PokemonSchema);

module.exports = Pokemon;*/




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


const getFirstId = () => {
  return Math.min(...pokemonsList.map(pokemon => pokemon.id));
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

//Route GET par ID

app.get("/api/pokemons/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id); // Convertir en nombre

    if (!db) {
      return res.status(500).send({ error: "Connexion à la base non établie" });
    }

    // Rechercher le Pokémon dans la collection "pokemons"
    const pokemon = await db.collection(collectionName).findOne({ id: id });

    if (!pokemon) {
      return res.status(404).send({ error: "Pokémon non trouvé" });
    }

    res.status(200).json(pokemon);
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).send({ error: "Erreur serveur" });
  }
});



/*app.get("/api/pokemons/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const pokemon = pokemonsList.find(pokemon => pokemon.id === id);

  if (!pokemon) {
    return res.status(404).send({ error: "Pokemon non trouvé" });
  }

  res.status(200).send(pokemon);

});*/

// Route GET home
app.get("/", (req, res) => {
  res.send("bienvenue sur l'API Pokémon");
});

// Route POST créer un Pokemon 
// http://localhost:3000/api/create?name=Samos&type=Humain&hp=40&attack=25&defense=25&SpAttack=90&SpDefense=60&speed=150
app.post("/api/create", (req, res) => {
  
    const { name, type, HP, Attack, Defense, "Sp. Attack": SpAttack, "Sp. Defense": SpDefense, Speed } = req.body;

    if (!name || !type || !HP || !Attack || !Defense || !SpAttack || !SpDefense || !Speed)
      return res.status(400).send({ error: "Tous les champs sont requis" });

    const newId = getLastId() + 1;

    const newPokemon = {
      id: newId,
      name: {
        english: name,
        japanese: name,
        chinese: name,
        french: name
      },
      type,
      base: {
        HP: HP,
        Attack: Attack,
        Defense: Defense,
        "Sp. Attack": SpAttack,
        "Sp. Defense": SpDefense,
        Speed: Speed
      },
        image : "http://localhost:3000/assets/pokemons/" + newId + ".png"
      };

    console.log(req.body);

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
   pokemonsList.splice(pokemonIndex, 1);//On peut utiliser .filter()

  // Mettre à jour les IDs pour éviter les trous
  // pokemonsList.forEach((pokemon, index) => {
  //   pokemon.id = index + 1; //+1 : Pour commencer les id à partir de 1
  // });

  savePokemons();

  res.status(200).send({
  message: `Pokemon n° ${id} supprimé`,
  });
});


// Route GET le premier id disponible
app.get("/api/firstId", (req, res) => {
  res.status(200).send({
    firstID : getFirstId()

  });
});





// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur : http://localhost:${PORT}`);
});
