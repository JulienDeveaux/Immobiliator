const request = require('supertest');
const app = require('../app');
const accounts = require('../models/account');

// purge users in db for test
beforeAll(async () => await accounts.deleteMany({}));

afterAll(() => app.disconnectDb());

describe('Users tests', function() {
  const server = request(app);

  it('has title in index page (layout test)', (done) =>
  {
    server.get('/').expect(/Immobiliator/, done);
  });

  it('create one test user', async () =>
  {
    await server.post('/users/register').send({
      username: 'test',
      type: true, // classic user
      password: 'test'
    }).expect(302);

    return expect((await accounts.findOne({})).username).toBe('test');
  });

  it('connect to app with test user', (done) =>
  {
    server.post('/users/login').send({
      username: 'test',
      password: 'test'
    }).expect(302).expect('Location', '/').end(done);
  });

  it('auto-connect with token', (done) =>
  {
    accounts.findOne({}).then(user =>
    {
      server
          .get('/')
          .set('Cookie', `token=${user.token};`)
          .expect(/Bonjour test/, done);
    });
  });

  it('modify user info (excluding password)', async () =>
  {
    const account = await accounts.findOne({});

    await server.post('/users/modifyUser')
        .set('Cookie', `token=${account.token};`)
        .send({
          username: 'testModify',
          type: false
        }).expect(/Enregistrement effectué/);

    const modifiedAccount = await accounts.findOne({});

    expect(account.username === modifiedAccount.username).toBe(false);
  });

  it('access to unauthorized route when not connected', (done) =>
  {
    server.get('/users/logout').expect(302).expect('Location', '/').end(done);
  });
}); 
