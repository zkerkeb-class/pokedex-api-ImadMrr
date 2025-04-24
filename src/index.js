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
// Route GET de base
app.get("/api/pokemons", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).send({ error: "Connexion à la base non établie" });
    }

    // Récupérer tous les Pokémon depuis la collection "pokemon"
    const pokemons = await db.collection(collectionName).find({}).toArray();

    res.status(200).send({
      pokemons: pokemons,
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).send({ error: "Erreur serveur" });
  }
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


// Route GET home
app.get("/", (req, res) => {
  res.send("bienvenue sur l'API Pokémon");
});

// Route POST créer un Pokemon 
app.post("/api/create", async (req, res) => {
  try {
    const { name, image, type, HP, Attack, Defense, "Sp. Attack": SpAttack, "Sp. Defense": SpDefense, Speed } = req.body;

    if (!name || !image || !type || !HP || !Attack || !Defense || !SpAttack || !SpDefense || !Speed) {
      return res.status(400).send({ error: "Tous les champs sont requis" });
    }

    if (!db) {
      return res.status(500).send({ error: "Connexion à la base non établie" });
    }

    // Générer un nouvel ID
    const lastPokemon = await db.collection(collectionName).find().sort({ id: -1 }).limit(1).toArray();
    const newId = lastPokemon.length > 0 ? lastPokemon[0].id + 1 : 1;

    // Créer le nouvel objet Pokémon
    const newPokemon = {
      id: newId,
      name: {
        english: name,
        japanese: name,
        chinese: name,
        french: name,
      },
      type,
      base: {
        HP: HP,
        Attack: Attack,
        Defense: Defense,
        "Sp. Attack": SpAttack,
        "Sp. Defense": SpDefense,
        Speed: Speed,
      },
      image: image,
    };

    // Insérer le Pokémon dans la base de données
    await db.collection(collectionName).insertOne(newPokemon);

    res.status(200).send({
      message: "Pokemon créé avec succès",
      pokemon: newPokemon,
    });
  } catch (error) {
    console.error("Erreur lors de la création du Pokémon :", error);
    res.status(500).send({ error: "Erreur serveur" });
  }
});

// Route PUT Met à jour un pokemon existant
app.put("/api/update", async (req, res) => {
  try {
    const { id, name, type, base, image } = req.body;

    console.log("LOOK", base)

    if (!id) {
      return res.status(400).send({ error: "L'ID est requis" });
    }

    if (!db) {
      return res.status(500).send({ error: "Connexion à la base non établie" });
    }

    // Construire l'objet de mise à jour
    const updateFields = {};
    if (name) updateFields["name"] = name;
    if (type) updateFields["type"] = type;
    if (base) updateFields["base"] = base;
    if (image) updateFields["image"] = image;

    // Rechercher et mettre à jour le Pokémon dans la base de données
    const updatedPokemon = await db.collection(collectionName).findOneAndUpdate(
      { id: parseInt(id) }, // Filtrer par ID
      { $set: updateFields }, // Mettre à jour les champs spécifiés
      { returnDocument: "after" } // Retourner le document mis à jour
    );

    /*if (!updatedPokemon.value) {
      return res.status(404).send({ error: "Pokemon non trouvé" });
    }*/

    res.status(200).send({
      message: `Pokemon n° ${id} mis à jour avec succès`,
      pokemon: updatedPokemon.value,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du Pokémon :", error);
    res.status(500).send({ error: "Erreur serveur" });
  }
});

// Route DELETE supprime un pokemon 
// Route DELETE supprime un pokemon 
app.delete("/api/delete", async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).send({ error: "L'ID est requis" });
    }

    if (!db) {
      return res.status(500).send({ error: "Connexion à la base non établie" });
    }

    // Supprimer le Pokémon de la base de données
    const result = await db.collection(collectionName).deleteOne({ id: parseInt(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "Pokemon non trouvé" });
    }

    res.status(200).send({
      message: `Pokemon n° ${id} supprimé avec succès`,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du Pokémon :", error);
    res.status(500).send({ error: "Erreur serveur" });
  }
});


// Route GET le premier id disponible
app.get("/api/firstId", (req, res) => {
  res.status(200).send({
    firstID : getFirstId()

  });
});



/** COMBAT */
app.post('/api/saveCombat', async (req, res) => {
  const { first, second } = req.body;

  try {
    const combatData = {
      first,
      second,
    };

    await db.collection('combat').insertOne(combatData);
    res.status(200).send({ message: 'Combat enregistré avec succès !' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du combat :', error);
    res.status(500).send({ error: 'Erreur lors de l\'enregistrement du combat.' });
  }
});



app.put('/api/updateHP', async (req, res) => {
  const { id, newHP } = req.body;

  try {
    await db.collection('combat').updateOne(
      { 'first.id': id },
      { $set: { 'first.base.HP': newHP } }
    );

    await db.collection('combat').updateOne(
      { 'second.id': id },
      { $set: { 'second.base.HP': newHP } }
    );

    res.status(200).send({ message: 'PV mis à jour avec succès !' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des PV :', error);
    res.status(500).send({ error: 'Erreur lors de la mise à jour des PV.' });
  }
});


// Endpoint pour récupérer l'image "versus"
app.get('/api/getVersusImage', async (req, res) => {
  try {
    const combat = await db.collection('combat').findOne({}, { projection: { versus: 1 } }); // Récupère uniquement le champ "versus"
    if (!combat || !combat.versus) {
      return res.status(404).send({ error: 'Image "versus" non trouvée.' });
    }
    res.status(200).send({ versus: combat.versus });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'image "versus" :', error);
    res.status(500).send({ error: 'Erreur lors de la récupération de l\'image "versus".' });
  }
});


//QUIZZ

// Endpoint pour récupérer les questions du quiz
app.get('/api/getQuizzQuestions', async (req, res) => {
  try {
    const questions = await db.collection('quizz').find().toArray();
    //console.log(questions);
    res.status(200).send(questions);
  } catch (error) {
    console.error('Erreur lors de la récupération des questions :', error);
    res.status(500).send({ error: 'Erreur lors de la récupération des questions.' });
  }
});


// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur : http://localhost:${PORT}`);
});
