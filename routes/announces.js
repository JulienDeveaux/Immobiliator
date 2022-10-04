const express = require('express');
const passport = require('passport');
const announces = require("../models/announce");
const { body, validationResult } = require("express-validator");
const fileupload = require("express-fileupload");

const magicNumber = {
    jpg: 'ffd8ffe0',
    png: '89504e47'
}

const router = express.Router();

router.get('/', async function(req, res, ){
    const announcesList = await (req.user.type ? announces.where({statusType: 0, isPublish: true}) : announces).find();

    res.render('announces/index',   { user: req.user, announces: announcesList})
});

router.get('/add', function(req, res, ){
    if(!req.user.type)
        res.render('announces/form',   { user: req.user, announce: {}, errors: [] })
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
    body("description").trim().isString(),
    async function (req, res) {

    const errors = validationResult(req);

    let images = [];         // array containing base64 version of the image files
    if(req.files) {
        for (let it = 0; it < req.files.fileUpload.length; it++) {
            let bitmap = req.files.fileUpload[it].data;
            if (bitmap.toString('hex', 0, 4) === magicNumber.png ||
                bitmap.toString('hex', 0, 4) === magicNumber.jpg) {
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
        availability: new Date(Date.parse(req.body.availability)),
        type: req.body.type,
        price: req.body.price,
        images: images,
        description: req.body.description,
        questions: []
    };

    if(errors.isEmpty())
    {
        const created = await announces.create(announce);

        res.redirect("/announces");
    }
    else
    {
        res.render('announces/form', { user: req.user, announce: announce, errors: errors.array().map(e => `${e.param}: ${e.msg}`) })
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
        announce.description = announce.description || "";

        res.render("announces/show", {announce: announce, user: req.user, imageIdsUrl : imageIdsUrl});
    }
    else
    {
        res.redirect("/announces")
    }
});

router.get('/image/:annonceId/:imageId', async function(req, res, next)
{
    const announce = await announces.where({title: req.params.annonceId}).findOne();
    let buffer = "";
    for(let i = 0; i < announce.images.length; i++) {
        if(announce.images[i].id == req.params.imageId) {
            buffer = Buffer.from(announce.images[i].data, "base64");
        }
    }

    if(buffer.toString('hex',0,4) === magicNumber.png) {
        res.contentType('image/png');
    } else if(buffer.toString('hex',0,4) === magicNumber.jpg ) {
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

router.get("/:id/deleteConfirm", async function(req, res){
    const announce = await announces.where({title: req.params.id}).findOne();

    if(announce && !req.user.type) {
        res.render("announces/deleteConfirm", {announce: announce, user: req.user});
    }
    else {
        res.redirect("/announces");
    }
});

router.post("/:id/delete", async function(req, res){
    const announce = await announces.where({title: req.params.id}).findOne();

    if(announce && !req.user.type) {
        announce.deleteOne();
    }
    res.redirect("/announces");
});

router.get('/:id/edit', async function(req, res, next)
{
    if(req.user.type)
        return res.redirect(`/announces/${req.params.id}`);

    const announce = await announces.where({title: req.params.id}).findOne();

    let imageIdsUrl = [];
    for(let i = 0; i < announce.images.length; i++) {
        imageIdsUrl.push('/announces/image/' + req.params.id + '/' + announce.images[i].id);
    }

    if(!announce)
        return res.redirect('/announces');

    res.render('announces/form', {
        announce: announce,
        user: req.user,
        imageIdsUrl : imageIdsUrl,
        errors: []
    });
});

router.post('/:id/edit',
    body("title").trim().isLength({min: 5}),
    body("statusType").trim().isInt({min: 0, max: 2}),
    body("isPublish").trim().isIn(["", "on"]),
    body("availability").trim().isDate(),
    body("type").trim().isBoolean(),
    body("price").trim().isNumeric(),
    body("description").trim().isString(),
    async function(req, res, next)
    {
        if(req.user.type)
            return res.redirect(`/announces/${req.params.id}`);

        const announce = await announces.where({title: req.params.id}).findOne();

        if(!announce)
            return res.redirect('/announces');

        let images = [];         // array containing base64 version of the image files
        if(req.files) {
            for (let it = 0; it < req.files.fileUpload.length; it++) {
                let bitmap = req.files.fileUpload[it].data;
                if (bitmap.toString('hex', 0, 4) === magicNumber.png ||
                    bitmap.toString('hex', 0, 4) === magicNumber.jpg) {
                    //encoding to base64
                    let base64Image = new Buffer(bitmap).toString('base64');
                    images.push({data: base64Image});
                } else {
                    errors.errors.push({msg: "Invalid Image (" + req.files.fileUpload[it].name + ")", param: "Image"});
                }
            }
        }

        announce.title = req.body.title;
        announce.statusType = req.body.statusType;
        announce.isPublish = req.body.isPublish === "on";
        announce.availability = req.body.availability;
        announce.type = req.body.type;
        announce.price = parseInt(req.body.price);
        announce.description = req.body.description;
        announce.images = images;

        const errors = validationResult(req);

        if(errors.isEmpty())
        {
            await announce.save();

            res.redirect(`/announces/${req.params.id}`)
        }
        else
        {
            res.render('announces/form', {
                announce: announce,
                user: req.user,
                errors: errors.array().map(e => `${e.param}: ${e.msg}`)
            })
        }
    }
);

module.exports = router;