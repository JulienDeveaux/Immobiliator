const request = require('supertest');
const app = require('../app');
const accounts = require('../models/account');
const announce = require("../models/announce");

beforeAll(async () =>
{
    const server = request(app);
    await announce.deleteMany({});
    await accounts.deleteMany({});

    await server.post('/users/register').send({
        username: 'test',
        type: false,
        password: 'test'
    });
});

describe('Other uncategorized tests', () =>
{
    const server = request(app);

    it('useless basic test', async () =>
    {
        const user = await accounts.findOne({});
        await server.get('/ping').set('Cookie', `token=${user.token}`).expect(/pong!/);
    });
});