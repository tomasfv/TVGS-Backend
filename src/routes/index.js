const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require('axios');
const {Videogame, Genres, User} = require('../db');
const {op} = require('sequelize');
const {API_KEY} = process.env;

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

//FUNCIONES CONTROLADORAS


const getApiInfo = async () => {
    const apiUrl = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}`)
    const apiUrl2 = await axios.get(apiUrl.data.next)
    const apiUrl3 = await axios.get(apiUrl2.data.next)
    const apiUrl4 = await axios.get(apiUrl3.data.next)
    const apiUrl5 = await axios.get(apiUrl4.data.next)
    const totalApi = apiUrl.data.results.concat(apiUrl2.data.results).concat(apiUrl3.data.results).concat(apiUrl4.data.results).concat(apiUrl5.data.results)
    
    const apiInfo = await totalApi.map( el => {
        return {
            id: el.id,
            image: el.background_image,
            name: el.name,
            genres: el.genres.map(g => g.name),
            rating: el.rating,
            //release: el.released,
            //screenshots: el.short_screenshots.map( s => s.image),
            //platforms: el.platforms.map( p => p.platform.name),
            //stores: el.stores.map(s => s.store.name), 
            
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
            image: el.background_image,
            name: el.name,
            genres: el.genres.map(g => g.name),
            rating: el.rating,
            //release: el.released, 
            //screenshots: el.short_screenshots.map( s => s.image),
            //platforms: el.platforms.map( p => p.platform.name),
            //stores: el.stores.map(s => s.store.name),

        }
    });
    return moreApiInfo
}




//ROUTES
// GET /videogames

router.get('/videogames', async (req, res) => {
    
    let videogamesTotal = await getAllVideogames();

    
        res.status(200).send(videogamesTotal)
    
    });
//GET /search?name=...

router.get('/search', async(req, res) => {
    const name = req.query.name;
    const videogameByName= await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&search=${name}`);
    // const videogameByName2= await axios.get(videogameByName.data.next? videogameByName.data.next : 'https://null');
    
    const videogameInfo = videogameByName.data.results

    const videogameDet = await videogameInfo.map(el => {
       return {
        id: el.id,
        image: el.background_image,
        name: el.name,
        genres: el.genres.map(g => g.name),
        rating: el.rating,
       }
    })

    if(name){
        videogameDet.length?
        res.status(200).json(videogameDet):
        res.status(404).send('Video Game Not Found')

    }
})


//GET/ getMoreVideogames();   //CADA VEZ QUE LLAMO A LA RUTA, TRAIGO INFO DE LA PÁGINA SIGUIENTE.


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

//GET /genreFilter?genres=...

router.get('/genrefilter', async (req, res) =>{
    let name = req.query.name;
    if(name === 'board games' || name === 'board%20games'){
        name = 'board-games';
    } 
    if(name === 'massively multiplayer' || name === 'massively%20multiplayer'){
        name = 'massively-multiplayer';
    } 
    if(name === 'rpg'){
        name = 'role-playing-games-rpg';
    } 
    console.log(name)
    const genreVideogames = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&genres=${name}`)
    const genreVideogames2 = await axios.get(genreVideogames.data.next)
    const genreVideogames3 = await axios.get(genreVideogames2.data.next)
    const videogamesInfo = genreVideogames.data.results.concat(genreVideogames2.data.results).concat(genreVideogames3.data.results)

    const videogamesList = await videogamesInfo.map(el => {
       return {
        id: el.id,
        image: el.background_image,
        name: el.name,
        genres: el.genres.map(g => g.name),
        rating: el.rating,
       }
    })
        
    if(name){
        videogamesList.length?
        res.status(200).json(videogamesList):
        res.status(404).send('Video Games Not Found')

    }
})

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

//POST /User

router.post('/user', async (req, res) => {
    const {id, name, email, password, img, createdInDb } = req.body;
try {
    
    let userCreated = await User.create({
        id,
        name,
        email,
        password,
        img,
        createdInDb
    })

    res.status(200).send(`User ${name} Created`)

} catch (error) {
    
    res.status(400).send('Error Creating User')
    
}

})

//GET /videogames by id
router.get('/videogames/:id', async (req, res) => {
    const id = req.params.id;
    const details = await axios.get(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`);
    const screenshots = await axios.get(`https://api.rawg.io/api/games/${id}/screenshots?key=${API_KEY}`);
    const detailsData = details.data;
    const screenshotsData = screenshots.data;
    const videogameDetail = [{
            name: detailsData.name,
            id: detailsData.id,
            released: detailsData.released,
            rating: detailsData.rating,
            image: detailsData.background_image,
            screenshots: screenshotsData.results.map( s => s.image),
            platforms: detailsData.parent_platforms.map( p => p.platform.name),
            genres: detailsData.genres.map(g => g.name),
            stores: detailsData.stores.map(s => s.store.name),
            storesWeb: detailsData.stores.map(s => s.store.domain), 
            developers: detailsData.developers.map(d => d.name),
            publishers: detailsData.publishers.map(p => p.name),
            website: detailsData.website,   
            description: detailsData.description_raw,
    }]

    if(id){
        videogameDetail.length?
        res.status(200).json(videogameDetail):
        res.status(404).send('Video Game Not Found')

    }


})



module.exports = router;
