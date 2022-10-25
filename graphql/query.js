const Announces = require("../models/announce");
const Account = require("../models/account");

module.exports = {
    announces: (root, args, context) => {
        const filters = {};

        if(args.filters)
        {
            if(args.filters.keys.length !== args.filters.values.length)
                throw "keys ans values as not same length"

            for (let i = 0; i < args.filters.keys.length; i++)
                filters[args.filters.keys[i]] = args.filters.values[i]
        }

        const sort = {};

        if(args.orderBy)
        {
            sort[args.orderBy.field] = args.orderBy.desc ? "desc" : "asc"
        }

        return Announces.find(filters).sort(sort);
    },
    accounts: async () => await Account.find({})
}