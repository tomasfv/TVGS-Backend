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
    const apiUrl = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}`)
    const apiUrl2 = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=2`)
    const apiUrl3 = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=3`)
    const apiUrl4 = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=4`)
    const apiUrl5 = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=5`)
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
    // const videogameByName3= await axios.get(videogameByName2.data.next? videogameByName.data.next : 'https://null');
    // const videogameByName4= await axios.get(videogameByName3.data.next? videogameByName.data.next : 'https://null');
    // const videogameByName5= await axios.get(videogameByName4.data.next? videogameByName.data.next : 'https://null');
    
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
// router.get('/videogames/:id', async (req, res) => {
//     const id = req.params.id;                                // es lo mismo que const {id} = req.params
//     const videogamesTotal = await getAllVideogames();
//     const detailsData = await axios.get(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`);
//     const videogameData = detailsData.data;
//     const videogameDetail = {
        
//             developers: videogameData.developers.map(d => d.name),
//             publishers: videogameData.publishers.map(p => p.name),
//             website: videogameData.website,   
//             description: videogameData.description_raw,
//         }

    

//     if(id){
//         let videogamesId = await videogamesTotal.filter( el => el.id == id)
//         videogamesId.length?
//         res.status(200).json(videogamesId.concat(videogameDetail)):
//         res.status(404).send('Video Game Not Found')
//     }
// })

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
