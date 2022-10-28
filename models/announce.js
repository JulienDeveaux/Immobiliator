const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const typedef = {
    title: String,
    type: Boolean, // true = vente / false = location
    isPublish: Boolean,
    statusType: Number, // 0 = dispo / 1 = loué / 2 = vendu
    availability: Date,
    description: String,
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
}

const Announce = new Schema(typedef);

const model = mongoose.model('Announce', Announce);
model["typedef"] = typedef;

module.exports = model;