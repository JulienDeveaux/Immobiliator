const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Announce = new Schema({
    title: String,
    type: Boolean, // true = vente / false = location
    isPublish: Boolean,
    statusType: Number, // 0 = dispo / 1 = loué / 2 = vendu
    availability: Date,
    images: [
        {
            data: String
        }
    ],
    price: Number,
    questions: [
        {
            text: String,
            username: String,
            date: Date,
            answers: [
                {
                    text: String,
                    username: String,
                    date: Date
                }
            ]
        }
    ]
});

module.exports = mongoose.model('Announce', Announce);