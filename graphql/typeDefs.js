module.exports = `
    type Query {
        announces: [Announce]
        accounts: [Account]
    }
    
    type Announce {
        title: String!
        type: Boolean!
        isPublish: Boolean!
        statusType: Boolean!
        availbility: Date!
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