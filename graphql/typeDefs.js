module.exports = `
    type Query {
        announces: [Announce]
        accounts: [Account]
    }
    
    input ImageInput {
        data: String!
    }
    
    input AnnounceInput {
        title: String!
        type: Boolean!
        isPublish: Boolean!
        statusType: Boolean!
        availability: Date!
        description: String!
        images: ImageInput
        price: Float!
    }
    
    type Mutation {
        createAnnounce(input: AnnounceInput): Announce
    }
    
    type Announce {
        title: String!
        type: Boolean!
        isPublish: Boolean!
        statusType: Boolean!
        availability: Date!
        description: String!
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
    
    type Account {
        username: String!
        type: Boolean!
        token: String
    }
    
    scalar Date
`;