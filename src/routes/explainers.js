const express = require('express');
const router = express.Router()
const explainerctrl = require('../controllers/explainer');

//----------------------------------------------------
// Explainer Related Endpoints
//---------------------------------------------------

router.get('/', explainerctrl.list); // Routed to the Explainer API
router.get('/meta', explainerctrl.getMeta); // Routed to the Explainer API
router.post('/', explainerctrl.create);
router.get('/delete', explainerctrl.delete);
module.exports = router;