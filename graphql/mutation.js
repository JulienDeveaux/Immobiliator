const Announces = require("../models/announce");
const Account = require("../models/account");

module.exports = {
    createAnnounce: async (root, {input}, context) => {
        const announceToCreate = {
            title: input.title,
            type: input.type,
            isPublish: input.isPublish,
            statusType: input.statusType,
            availability: input.availability,
            description: input.description,
            images: input.images,
            price: input.price,
            questions: input.questions
        }

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
        const announceToModify = {
            title: input.modify.title,
            type: input.modify.type,
            isPublish: input.modify.isPublish,
            statusType: input.modify.statusType,
            availability: input.modify.availability,
            description: input.modify.description,
            images: input.modify.images,
            price: input.modify.price,
            questions: input.modify.questions
        }

        Object.keys(announceToModify).forEach(key => {
            if (announceToModify[key] === undefined) {
                delete announceToModify[key];
            }
        });

        return Announces.findOneAndUpdate({title: input.title}, announceToModify, {new: true});
    },

    deleteAnnounce: (root, {input}, context) => {
        return Announces.findOneAndDelete({title: input.title});
    }
}