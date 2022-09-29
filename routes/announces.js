const express = require('express');
const passport = require('passport');
const announces = require("../models/announce");
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.get('/', async function(req, res, ){
    const announcesList = await announces.where({statusType: 0, isPublish: true}).find()

    res.render('announces/index',   { user: req.user, announces: announcesList })
});

router.get('/add', function(req, res, ){
    res.render('announces/new',   { user: req.user, announce: {}, errors: [] })
});

router.post('/add',
    body("title").trim().isLength({min: 5}),
    body("statusType").trim().isInt({min: 0, max: 2}),
    body("isPublish").trim().isIn(["", "on"]),
    body("availability").trim().isDate(),
    body("type").trim().isBoolean(),

    async function (req, res) {

    const errors = validationResult(req);
    const announce = {
        title: req.body.title,
        statusType: req.body.statusType,
        isPublish: req.body.isPublish === "on",
        availability: req.body.availability,
        type: req.body.type,
        questions: []
    };

    if(errors.isEmpty())
    {
        const created = await announces.create(announce);

        res.redirect("/announces");
    }
    else
    {
        res.render('announces/new', { user: req.user, announce: announce, errors: errors.array().map(e => `${e.param}: ${e.msg}`) })
    }
})

module.exports = router;