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

afterAll(() => app.disconnectDb());

describe('Agent user tests', function () {

    it('Create an announce with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
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
            const response = await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
            expect(response.text
            ).toBe(
                '{"data":{\"createAnnounce\":{\"title\":\"test title\",\"type\":true,\"isPublish\":true,\"statusType\":false,\"availability\":\"2022-11-18T00:00:00.000Z\",\"description\":\"test description\",\"price\":123456}}}');
        })
        ;
        announce.findOne({}, (err, testAnnounce) => {
            expect(err).toBeNull();
            expect(testAnnounce.title).toBe('test title');
            expect(testAnnounce.statusType).toBe(0);
            expect(testAnnounce.isPublish).toBe(true);
            expect(testAnnounce.availability).toStrictEqual(new Date(Date.parse('2022-11-18')));
            expect(testAnnounce.type).toBe(true);
            expect(testAnnounce.price).toBe(123456);
            expect(testAnnounce.description).toBe('test description');
        });
    });

    it('Consult the list of all announces', async () => {
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
                '{"data":{\"announces\":[{\"title\":\"test title\",\"type\":true,\"isPublish\":true,\"statusType\":false,\"availability\":\"2022-11-18T00:00:00.000Z\",\"description\":\"test description\",\"price\":123456}]}}');
        });
    });
});