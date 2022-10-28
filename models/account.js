const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const typedef = {
    username: String,
    password: String,
    type: Boolean,   // true utilisateur, false agent immobilier
    token: String
};

const Account = new Schema(typedef);

Account.plugin(passportLocalMongoose);

const model = mongoose.model('Account', Account);
model["typedef"] = typedef;

module.exports = model;
