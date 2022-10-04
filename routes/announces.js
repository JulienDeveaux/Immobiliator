const express = require('express');
const passport = require('passport');
const announces = require("../models/announce");
const { body, validationResult } = require("express-validator");
const fileupload = require("express-fileupload");

let magicNumber = {
    jpg: 'ffd8ffe0',
    png: '89504e47'
}

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

    async function (req, res) {

    const errors = validationResult(req);

    let images = [];         // array containing base64 version of the image files
    if(req.files) {
        for (let it = 0; it < req.files.fileUpload.length; it++) {
            let bitmap = req.files.fileUpload[it].data;
            if (bitmap.toString('hex', 0, 4) == magicNumber.png ||
                bitmap.toString('hex', 0, 4) == magicNumber.jpg) {
                //encoding to base64
                let base64Image = new Buffer(bitmap).toString('base64');
                images.push({data: base64Image});
            } else {
                errors.errors.push({msg: "Invalid Image (" + req.files.fileUpload[it].name + ")", param: "Image"});
            }
        }
    }

    const announce = {
        title: req.body.title,
        statusType: req.body.statusType,
        isPublish: req.body.isPublish === "on",
        availability: req.body.availability,
        type: req.body.type,
        images: images,
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

    let imageIdsUrl = [];
    for(let i = 0; i < announce.images.length; i++) {
        imageIdsUrl.push('/announces/image/' + req.params.id + '/' + announce.images[i].id);
    }

    if(announce)
    {
        res.render("announces/show", {announce: announce, user: req.user, imageIdsUrl : imageIdsUrl});
    }
    else
    {
        res.redirect("/announces")
    }
});

router.get('image/:annonceId/:imageId', async function(req, res, next)
{
    const announce = await announces.where({title: req.params.annonceId}).findOne();
    let buffer = "";
    for(let i = 0; i < announce.images.length; i++) {
        if(announce.images[i].id == req.params.imageId) {
            buffer = Buffer.from(announce.images[i].data, "base64");
        }
    }

    if(buffer.toString('hex',0,4) ==  magicNumber.png) {
        res.contentType('image/png');
    } else if(buffer.toString('hex',0,4) == magicNumber.jpg ) {
        res.contentType('image/jpg');
    }
    res.send(buffer);
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
                text: req.body.answer
            })
        }
        else if(req.body.question && req.user.type) // is a question
        {
            questions.push({
                username: req.user.username,
                text: req.body.question,
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

router.get("/deleteConfirm/:id", async function(req, res){
    const announce = await announces.where({title: req.params.id}).findOne();

    if(announce && !req.type) {
        res.render("announces/deleteConfirm", {announce: announce, user: req.user});
    }
    else {
        res.redirect("/announces");
    }
});

router.post("/delete/:id", async function(req, res){
    const announce = await announces.where({title: req.params.id}).findOne();

    if(announce && !req.type) {
        announce.deleteOne();
    }
    res.redirect("/announces");
});

module.exports = router;