module.exports = `
    type Query {
        announces: [Announce]
        accounts: [Account]
    }
    
    input AnnounceTitle {
        title: String
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
    
    input AnnounceModifyInput {
        title: String
        modify: AnnounceInput
    }
    
    type Mutation {
        createAnnounce(input: AnnounceInput): Announce,
        modifyAnnounce(input: AnnounceModifyInput): Announce,
        deleteAnnounce(input: AnnounceTitle): Announce
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