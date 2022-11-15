const Announces = require("../models/announce");
const Account = require("../models/account");

module.exports = {
    announces: (root, args, context) =>
    {
        return Announces.find(getFilter(Announces, args.filters)).sort(getOrderBy(args.orderBy));
    },
    accounts: (root, args, context) =>
    {
        return Account.find(getFilter(Account, args.filters)).sort(getOrderBy(args.orderBy));
    }
}

/**
 *
 * @param {Account | Announces} type
 * @param {{keys: [], values: []}} filter
 * @returns {{}}
 */
function getFilter(type, filter)
{
    if(!filter)
        return {};

    const keys = filter.keys;
    const values = filter.values;

    const filters = {};

    if(keys.length !== values.length)
        throw "keys ans values as not same length"

    for (let i = 0; i < keys.length; i++)
        filters[keys[i]] = toMongoFilter(
            type,
            keys[i],
            values[i]);

    return filters;
}

/**
 *
 * @param {{field: string, desc: boolean}} orderBy
 * @returns {{}}
 */
function getOrderBy(orderBy)
{
    if(!orderBy)
        return {};

    const sort = {};

    sort[orderBy.field] = orderBy.desc ? "desc" : "asc";

    return sort;
}

/**
 *
 * @param {Account | Announces} type
 * @param {string} key
 * @param {string} obj
 * @returns {{$regex: RegExp}|{}|boolean|Date|number}
 */
function toMongoFilter(type, key, obj)
{
    if(type.typedef[key] === String)
        return {
            $regex: new RegExp(obj, "i")
        };
    else if(type.typedef[key] === Boolean)
        return obj === "true";
    else if(type.typedef[key] === Number)
        return parseFloat(obj);
    else if (type.typedef[key] === Date)
        return new Date(obj);
    else
    {
        const tmp = {};
        const keys = Object.keys(obj);

        for (let i = 0; i < keys.length; i++)
            tmp[keys[i]] = toMongoFilter(type, keys[i], obj[keys[i]]);

        return tmp;
    }
}