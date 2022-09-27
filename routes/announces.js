const express = require('express');
const passport = require('passport');
const announces = require("../models/announce");

const router = express.Router();

router.get('/', async function(req, res, ){
    const announcesList = await announces.where({statusType: 0, isPublis: true}).find()

    res.render('announces/index',   { user: req.user, announces: announcesList })
});

module.exports = router;