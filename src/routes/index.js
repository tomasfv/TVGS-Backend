const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require('axios');
const {Videogame, Genres} = require('../db');
const {op} = require('sequelize');
const {API_KEY} = process.env;

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

//FUNCIONES CONTROLADORAS


const getApiInfo = async () => {
    // PAGE = 1;
    const apiUrl = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}`)
    const apiUrl2 = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=2`)
    const apiUrl3 = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=3`)
    const apiUrl4 = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=4`)
    const apiUrl5 = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=5`)
    const totalApi = apiUrl.data.results.concat(apiUrl2.data.results).concat(apiUrl3.data.results).concat(apiUrl4.data.results).concat(apiUrl5.data.results)
    
    const apiInfo = await totalApi.map( el => {
        return {
            id: el.id,
            name: el.name,
            release: el.released,
            image: el.background_image,
            rating: el.rating,
            platforms: el.platforms.map( p => p.platform.name),
            genres: el.genres.map(g => g.name), 
            
        }
    });
   
    return apiInfo
};

const getDbInfo = async () => {
    return await Videogame.findAll({
        include:{
            model: Genres,
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
};

var PAGE = 5;
const getMoreVideogames = async () => {
    PAGE++
    const moreApiUrl = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=${PAGE}`);
    const moreApiInfo = await moreApiUrl.data.results.map( el => {
        return {
            id: el.id,
            name: el.name,
            release: el.released,
            image: el.background_image,
            rating: el.rating,
            platforms: el.platforms.map( p => p.platform.name),
            genres: el.genres.map(g => g.name), 

        }
    });
    return moreApiInfo
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

    // getMoreVideogames();   //CADA VEZ QUE LLAMO A LA RUTA, TRAIGO INFO DE LA PÁGINA SIGUIENTE.
});

router.get('/morevideogames', async (req, res) => {
    
    let moreVideogames = await getMoreVideogames();

    res.status(200).send(moreVideogames)
})


// GET /generes
router.get('/genres', async (req, res) => {
    const apiUrlGenres = await axios.get(`https://api.rawg.io/api/genres?key=${API_KEY}`)
    const genres = apiUrlGenres.data.results.map(el => el.name)
    genres.forEach(g => {
        Genres.findOrCreate({
            where: {
                name: g
            }
        })
    })
    const allGenres = await Genres.findAll();
    res.status(200).send(allGenres);
});

//POST /videogames
router.post('/videogames', async (req, res) => {
    const {name, description, release, rating, platforms, image, genres, createdInDb } = req.body;
    
    let videogameCreated = await Videogame.create({
       
        name,
        description,
        release,
        rating,
        platforms,
        image,
        createdInDb,
    })

    let genreDb = await Genres.findAll({
        where:{
            name: genres,
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
