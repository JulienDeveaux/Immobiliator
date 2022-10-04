const express = require('express');
const passport = require('passport');
const announces = require("../models/announce");
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.get('/', async function(req, res, ){
    const announcesList = await announces.where({statusType: 0, isPublish: true}).find()

    res.render('announces/index',   { user: req.user, announces: announcesList})
});

router.get('/add', function(req, res, ){
    if(!req.user.type)
        res.render('announces/new',   { user: req.user, announce: {}, errors: [] })
    else
        res.redirect('/');
});

router.post('/add',
    body("title").trim().isLength({min: 5}),
    body("statusType").trim().isInt({min: 0, max: 2}),
    body("isPublish").trim().isIn(["", "on"]),
    body("availability").trim().isDate(),
    body("type").trim().isBoolean(),
    body("price").trim().isNumeric(),

    async function (req, res) {

    const errors = validationResult(req);
    const announce = {
        title: req.body.title,
        statusType: req.body.statusType,
        isPublish: req.body.isPublish === "on",
        availability: req.body.availability,
        type: req.body.type,
        price: req.body.price,
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
});

router.get("/:id", async function(req, res){
    const announce = await announces.where({title: req.params.id}).findOne();

    if(announce)
    {
        res.render("announces/show", {announce: announce, user: req.user});
    }
    else
    {
        res.redirect("/announces")
    }
});

router.post("/:id",
    body("question").trim().isLength({min: 10}),
    body("answer").trim().isString().isLength({min: 0}),
    async function(req, res){
    const announce = await announces.where({title: req.params.id}).findOne();

    if(announce)
    {
        if(!announce.questions)
            announce.questions = [];

        /**
         * @type {[]}
         */
        const questions = announce.questions;

        if(req.body.answer && !req.user.type) // is a response
        {
            const question = questions.find(q => q.text == req.body.question);

            if(!question.answers)
                questions.answers = [];

            question.answers.push({
                username: req.user.username,
                text: req.body.answer,
                date: new Date()
            })
        }
        else if(req.body.question && req.user.type) // is a question
        {
            questions.push({
                username: req.user.username,
                text: req.body.question,
                date: new Date(),
                answers: []
            });
        }

        announce.save();

        res.redirect(`/announces/${req.params.id}`);
    }
    else
    {
        res.redirect("/announces")
    }
});

module.exports = router;