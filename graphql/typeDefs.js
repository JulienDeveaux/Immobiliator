module.exports = `
    type Query {
        announces(filters: Filter, orderBy: OrderBy): [Announce]
        accounts(filters: Filter, orderBy: OrderBy): [Account]
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
    
    input AccountInput {
        username: String!
        password: String!
        type: Boolean!
    }
    
    input AccountUsername {
        username: String!
    }
    
    input AccountModify {
        username: String!
        newUsername: String
        oldPassword: String
        newPassword: String
        type: Boolean
    }
    
    type Mutation {
        createAnnounce(input: AnnounceInput): Announce
        modifyAnnounce(input: AnnounceModifyInput): Announce
        deleteAnnounce(input: AnnounceTitle): Announce
        createAccount(input: AccountInput): Account
        deleteAccount(input: AccountUsername): Account
        modifyAccount(input: AccountModify): Account
    }
    
    input OrderBy {
        field: String!
        desc: Boolean!
    }
    
    input Filter {
        keys: [String]!
        values: [String]!
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