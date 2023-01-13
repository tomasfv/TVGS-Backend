const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require('axios');
const {Videogame, Genre} = require('../db');
const {op} = require('sequelize');
const {API_KEY} = process.env;

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

const getApiInfo = async () => {
    const apiUrl = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}`)
    const apiInfo = await apiUrl.data.results.map( el => {
        return {
            id: el.id,
            name: el.name,
            release: el.released,
            image: el.background_image,
            rating: el.rating,
            platforms: el.platforms.map( p => p.platform.name),
            genre: el.genres.map(g => g.name), 

        }
    });
    return apiInfo
};

const getDbInfo = async () => {
    return await Videogame.findAll({
        include:{
            model: Genre,
            attributes: ['name'],
            through: {
                attributes: [],
            },
        }
    })
};

const getAllVideogames = async () => {
    const apiInfo = await getApiInfo();
    const dbInfo = await getDbInfo();
    const infoTotal = apiInfo.concat(dbInfo);
    return infoTotal
}

//ROUTES
// GET /videogames + GET /videogames?name=...

router.get('/videogames', async (req, res) => {
    const name = req.query.name;
    let videogamesTotal = await getAllVideogames();

    if(name){
        let videogameName = await videogamesTotal.filter(el => el.name.toLowerCase().includes(name.toLowerCase()));
        videogameName.length ?
        res.status(200).send(videogameName) :
        res.status(404).send('Video Game Not Found')
    } else {
        res.status(200).send(videogamesTotal)
    }
});

// GET /generes
router.get('/genres', async (req, res) => {
    const apiUrlGenres = await axios.get(`https://api.rawg.io/api/genres?key=${API_KEY}`)
    const genres = apiUrlGenres.data.results.map(el => el.name)
    genres.forEach(g => {
        Genre.findOrCreate({
            where: {
                name: g
            }
        })
    })
    const allGenres = await Genre.findAll();
    res.status(200).send(allGenres);
});

//POST /videogames
router.post('/videogames', async (req, res) => {
    const {name, description, release, rating, platforms, image, genre, createdInDb } = req.body;
    
    let videogameCreated = await Videogame.create({
       
        name,
        description,
        release,
        rating,
        platforms,
        image,
        createdInDb,
    })

    let genreDb = await Genre.findAll({
        where:{
            name: genre,
        }
    })

    videogameCreated.addGenre(genreDb);
    res.status(200).send('Video Game Created Successfully')

});

// GET /videogames/{id}
router.get('/videogames/:id', async (req, res) => {
    const id = req.params.id;                                // es lo mismo que const {id} = req.params
    const videogamesTotal = await getAllVideogames();

    if(id){
        let videogamesId = await videogamesTotal.filter( el => el.id == id)
        videogamesId.length?
        res.status(200).json(videogamesId):
        res.status(404).send('Video Game Not Found')
    }
})



module.exports = router;
