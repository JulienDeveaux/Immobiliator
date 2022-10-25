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

    deleteAnnounce: (root, {input}, context) => {
        return Announces.findOneAndDelete({title: input.title});
    }
}