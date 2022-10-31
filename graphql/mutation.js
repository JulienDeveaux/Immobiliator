const Announces = require("../models/announce");
const Account = require("../models/account");

module.exports = {
    createAnnounce: async (root, {input}, context) => {
        const announceToCreate = inputToObj(input);

        Object.keys(announceToCreate).forEach(key => {
            if (announceToCreate[key] === undefined) {
                delete announceToCreate[key];
            }
        });

        const announce = new Announces(announceToCreate);
        await announce.save();
        return announce;
    },

    modifyAnnounce: async (root, {input}, context) => {
        const announceToModify = inputToObj(input);

        Object.keys(announceToModify).forEach(key => {
            if (announceToModify[key] === undefined) {
                delete announceToModify[key];
            }
        });

        return Announces.findOneAndUpdate({title: input.title}, announceToModify, {new: true});
    },

    deleteAnnounce: (root, {input}, context) => {
        return Announces.findOneAndDelete({title: input.title});
    },

    createQuestion: async (root, {input}, context) => {
        const theAnnounce = await Announces.where({title: input.announceTitle}).findOne();
        const question = {
            text: input.text,
            username: input.username,
            date: new Date().toISOString()
        }
        theAnnounce.questions.push(question);
        theAnnounce.save();
        return theAnnounce;
    },

    createAnswer: async (root, {input}, context) => {
        const theAnnounce = await Announces.where({title: input.announceTitle}).findOne();
        const theQuestion = theAnnounce.questions.find(question => question.text === input.questionText);
        const answer = {
            text: input.text,
            username: input.username,
            date: new Date().toISOString()
        }
        theQuestion.answers.push(answer);
        theAnnounce.save();
        return theAnnounce;
    },

    createAccount: (root, {input}, context) =>
    {
        const accountToCreate = inputToObj(input);

        const password = accountToCreate["password"];

        if(!password)
            throw "Password required";

        delete accountToCreate["password"];

        return Account.register(new Account(accountToCreate), password);
    },

    deleteAccount: (root, {input}, context) => Account.findOneAndDelete({username: input.username}),

    modifyAccount: async (root, {input}, context) =>
    {
        const userToModify = inputToObj(input);

        if(!userToModify["username"])
            throw "username is required";

        const account = await Account.findOne({username: userToModify["username"]});

        if(!account)
            throw "account not found";

        if(userToModify["newUsername"])
            account.username = userToModify["newUsername"];

        if(userToModify["type"] !== undefined)
            account.type = userToModify["type"];

        if(userToModify["newPassword"])
        {
            if(userToModify["oldPassword"] == undefined)
                throw "old password is require to change password";

            account.token = "";

            await account.save();

            return account.changePassword(userToModify["oldPassword"], userToModify["newPassword"]);
        }

        return await account.save();
    }
};

function inputToObj(input)
{
    const obj = {};
    const keys = Object.keys(input);

    for (let i = 0; i < keys.length; i++) {
        obj[keys[i]] = input[keys[i]];
    }

    return obj;
}