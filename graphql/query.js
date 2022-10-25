const Announces = require("../models/announce");
const Account = require("../models/account");

module.exports = {
    announces: async () => await Announces.find({}),
    accounts: async () => await Account.find({})
}