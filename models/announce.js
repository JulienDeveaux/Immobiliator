const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const Schema = mongoose.Schema;

const Announce = new Schema({
    title: String,
    type: Boolean, // true = vente / false = location
    isPublish: Boolean,
    statusType: Number, // 0 = dispo / 1 = loué / 2 = vendu
    availability: Date,
    questions: [
        {
            text: String,
            username: String,
            answers: [
                {
                    text: String,
                    username: String
                }
            ]
        }
    ]
});

Announce.plugin(passportLocalMongoose);

module.exports = mongoose.model('Announce', Announce);