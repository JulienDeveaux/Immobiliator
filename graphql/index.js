const Graphql = require('graphql');
const Tools = require('@graphql-tools/schema');
const Announces = require('../models/announce')

const typeDefs = `
    type Query {
        announces: [Announce]
    }
    
    type Announce {
        title: String!
        type: Boolean!
        isPublish: Boolean!
        statusType: Boolean!
        availbility: Date!
        images: [Image]
        price: Float!
        questions: [Question]
    }
    
    type Image {
        data: String!
    }
    
    type Question {
        text: String
        username: String!
        date: Date!
        answers: [Answer]
    }
    
    type Answer {
        text: String
        username: String!
        date: Date!
    }
    
    scalar Date
`;

const resolvers = {
    Query: {
        announces: async () => await Announces.find({})
    }
};

module.exports = Tools.makeExecutableSchema(
    {
        typeDefs, resolvers
    });