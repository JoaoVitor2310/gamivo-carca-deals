const express = require('express');
const router = express.Router();


//Controllers
const {offerList, createOffer, searchOfferById, editOffer, offerKeys, returnOfferId, calculatePrices} = require('../controllers/OffersController');

//Middlewares

//Routes
router.get('/offersList', offerList);
router.post('/createOffer', createOffer);
router.get('/search/:id', searchOfferById);
router.put('/editOffer', editOffer);
router.post('/calculatePrices', calculatePrices);
router.get('/returnOfferId/:productId', returnOfferId);
router.get('/offerKeys/:offerId', offerKeys);

module.exports = router;