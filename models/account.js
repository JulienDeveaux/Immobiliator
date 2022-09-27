const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const Account = new Schema({
    username: String,
    password: String,
    type: Boolean   // true utilisateur, false agent immobilier
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
