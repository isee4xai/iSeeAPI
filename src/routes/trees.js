const express = require('express');
const router = express.Router()
const treectrl = require('../controllers/trees');
const cbrctrl = require('../controllers/cbr_cycle');

//----------------------------------------------------
// Trees Related Endpoints
//---------------------------------------------------

// Capital P to support the BT Editor Code
router.get('/Projects', treectrl.list);
router.get('/Projects/:id', treectrl.get)

router.post('/Projects', treectrl.create);
router.patch('/Projects/:id', treectrl.update);

// This endpoint retrieve topK from the tree
// router.post('/cbr_retrieve', cbrctrl.queryFromTree);


module.exports = router;