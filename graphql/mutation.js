const Announces = require("../models/announce");
const Account = require("../models/account");
const Uuid = require("uuid");

module.exports = {
    createAnnounce: async (root, {input}, context) => {
        if(!await UserAuth(context.cookies.token))
            throw "you must be connected";

        const announceToCreate = inputToObj(input);

        const announce = new Announces(announceToCreate);
        await announce.save();
        return announce;
    },

    modifyAnnounce: async (root, {input}, context) => {
        if(!await UserAuth(context.cookies.token))
            throw "you must be connected";

        const announceToModify = inputToObj(input.modify);

        return Announces.findOneAndUpdate({title: input.title}, announceToModify, {new: true});
    },

    deleteAnnounce: async (root, {input}, context) => {
        if(!await UserAuth(context.cookies.token))
            throw "you must be connected";

        return Announces.findOneAndDelete({title: input.title});
    },

    createQuestion: async (root, {input}, context) => {
        if(!await UserAuth(context.cookies.token))
            throw "you must be connected";

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
        if(!await UserAuth(context.cookies.token))
            throw "you must be connected";

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

    createAccount: async (root, {input}, context) =>
    {
        if(!await UserAuth(context.cookies.token))
            throw "you must be connected";

        const accountToCreate = inputToObj(input);

        const password = accountToCreate["password"];

        if(!password)
            throw "Password required";

        delete accountToCreate["password"];

        return Account.register(new Account({...accountToCreate, passwd: true}), password);
    },

    deleteAccount: async (root, {input}, context) =>
    {
        if(!await UserAuth(context.cookies.token))
            throw "you must be connected";

        return Account.findOneAndDelete({username: input.username});
    },

    modifyAccount: async (root, {input}, context) =>
    {
        if(!await UserAuth(context.cookies.token))
            throw "you must be connected";

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
    },
    user_connection: async (root, args, context) =>
    {
        const authenticate = Account.authenticate();
        const user = await Account.findOne({username: args.identifier.id});

        if(user)
        {
            const res = await authenticate(user.username, args.identifier.mdp);

            if(res.user)
            {
                if(!user.token)
                {
                    user.token = Uuid.v4();
                    user.save();
                }

                return {
                    token: user.token
                }
            }
        }

        throw "id or mdp invalid";
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

async function UserAuth(token)
{
    if(!token)
        return false;

    const user = await Account.where({token: token}).findOne()

    return !!user;
}