const request = require('supertest');
const app = require('../app');
const announce = require('../models/announce');
const accounts = require('../models/account');
const jsonTOGraphQLQuery = require('json-to-graphql-query').jsonToGraphQLQuery;

function getQuery(query) {
    return '{"query": "' + jsonTOGraphQLQuery(query).replaceAll("\"", "\\\"") + '"}';
}

// purge announce & users in db for test
beforeAll(async () => {
    const server = request(app);
    await announce.deleteMany({});
    await accounts.deleteMany({});
    await server.post('/users/register').send({
        username: 'classicUser',
        type: 'true',
        password: 'test'
    });
    await server.post('/users/register').send({
        username: 'agent',
        type: 'false',
        password: 'test'
    });
});

afterAll(async () => {
    await announce.deleteMany({});
    await accounts.deleteMany({});
});

describe('Agent user tests with graphql', function () {

    it('Get auth token with graphql', async () => {
        const query = {
            mutation: {
                user_connection: {
                    __args: {
                        identifier: {
                            id: "agent",
                            mdp: "test"
                        }
                    },
                    token: true
                }
            }
        };
        const response = await request(app)
            .post('/graphql')
            .set('Content-Type', 'application/json')
            .send(getQuery(query));
        await accounts.findOne({'username': 'agent'}).then(async user => {
            expect(response.text).toBe("{\"data\":{\"user_connection\":{\"token\":\""
                + user.token
                + "\"}}}");
        });
    });

    it('Create an announce with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            let query = {
                mutation: {
                    createAnnounce: {
                        __args: {
                            input: {
                                title: "test title",
                                type: true,
                                isPublish: true,
                                statusType: false,
                                availability: "2022-11-18",
                                description: "test description",
                                price: 123456
                            }
                        },
                        title: true,
                        type: true,
                        isPublish: true,
                        statusType: true,
                        availability: true,
                        description: true,
                        price: true
                    }
                }
            };
            let response = await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
            expect(response.text).toBe(
                '{"data":{\"createAnnounce\":{\"title\":\"test title\",\"type\":true,\"isPublish\":true,\"statusType\":false,\"availability\":\"2022-11-18T00:00:00.000Z\",\"description\":\"test description\",\"price\":123456}}}');
        });
        announce.findOne({title: "test title"}, (err, testAnnounce) => {
            expect(err).toBeNull();
            expect(testAnnounce.title).toBe('test title');
            expect(testAnnounce.statusType).toBe(0);
            expect(testAnnounce.isPublish).toBe(true);
            expect(testAnnounce.availability).toStrictEqual(new Date(Date.parse('2022-11-18')));
            expect(testAnnounce.type).toBe(true);
            expect(testAnnounce.price).toBe(123456);
            expect(testAnnounce.description).toBe('test description');
        });

        const additionalAnnounce = {
            title: "test title 2",
            type: true,
            isPublish: true,
            statusType: false,
            availability: "2022-11-18",
            description: "test description 2",
            price: 123456
        };
        await announce.create(additionalAnnounce);
    });

    it('Consult the list of all announces with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                query: {
                    announces: {
                        title: true,
                        type: true,
                        isPublish: true,
                        statusType: true,
                        availability: true,
                        description: true,
                        price: true
                    }
                }
            };
            const response = await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .set('Cookie', `token=${user.token};`)
                .send(getQuery(query));
            expect(response.text).toBe(
                '{\"data\":' +
                '{\"announces\":[' +
                '{\"title\":\"test title\",\"type\":true,\"isPublish\":true,\"statusType\":false,\"availability\":\"2022-11-18T00:00:00.000Z\",\"description\":\"test description\",\"price\":123456},' +
                '{\"title\":\"test title 2\",\"type\":true,\"isPublish\":true,\"statusType\":false,\"availability\":\"2022-11-18T00:00:00.000Z\",\"description\":\"test description 2\",\"price\":123456}]}}'
            );
        });
    });

    it('Modify an announce with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    modifyAnnounce: {
                        __args: {
                            input: {
                                title: "test title",
                                modify: {
                                    title: "test title",
                                    type: true,
                                    isPublish: true,
                                    statusType: false,
                                    availability: "2022-11-18",
                                    description: "test description modified",
                                    price: 123456
                                }
                            }
                        },
                        title: true,
                        type: true,
                        isPublish: true,
                        statusType: true,
                        availability: true,
                        description: true,
                        price: true
                    }
                }
            };
            const response = await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
            expect(response.text).toBe(
                '{"data":{\"modifyAnnounce\":{\"title\":\"test title\",\"type\":true,\"isPublish\":true,\"statusType\":false,\"availability\":\"2022-11-18T00:00:00.000Z\",\"description\":\"test description modified\",\"price\":123456}}}');
        });
    });

    it('Delete an announce with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    deleteAnnounce: {
                        __args: {
                            input: {
                                title: "test title 2"
                            }
                        },
                        title: true
                    }
                }
            };
            await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
        });
        announce.find({}, (err, testAnnounce) => {
            expect(err).toBeNull();
            expect(testAnnounce.length).toBe(1);
        });
    });
});

describe('Q&A graphql tests', function () {
    it('create question with graphql', async () => {
        await accounts.findOne({'username': 'classicUser'}).then(async user => {
            const query = {
                mutation: {
                    createQuestion: {
                        __args: {
                            input: {
                                announceTitle: "test title",
                                text: "my test question",
                                username: "by me"
                            }
                        },
                        title: true
                    }
                }
            };
            await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
        });
        announce.findOne({}, (err, testAnnounce) => {
            console.log(testAnnounce);
            expect(testAnnounce.questions[0].text).toBe('my test question');
            expect(testAnnounce.questions[0].username).toBe('by me');
        });
    });

    it('create answer with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    createAnswer: {
                        __args: {
                            input: {
                                announceTitle: "test title",
                                questionText: "my test question",
                                text: "my test answer",
                                username: "by me again"
                            }
                        },
                        title: true
                    }
                }
            };
            await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
        });
        announce.findOne({}, (err, testAnnounce) => {
            console.log(testAnnounce);
            expect(testAnnounce.questions[0].answers[0].text).toBe('my test answer');
            expect(testAnnounce.questions[0].answers[0].username).toBe('by me again');
        });
    });
});