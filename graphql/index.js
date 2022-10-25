const Graphql = require('graphql');
const Tools = require('@graphql-tools/schema');
const Announces = require('../models/announce');
const Account = require('../models/account')

const typeDefs = require("./typeDefs")

const resolvers = {
    Query: require('./query'),
    Mutation: require('./mutation')
};

module.exports = Tools.makeExecutableSchema(
    {
        typeDefs, resolvers
    });