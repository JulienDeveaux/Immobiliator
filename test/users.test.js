const request = require('supertest');
const app = require('../app');
const accounts = require('../models/account');

// purge users in db for test
beforeAll(async () => await accounts.deleteMany({}));

afterAll(() => app.disconnectDb());

describe('App', function() {
  const server = request(app);

  it('has title in index page (layout test)', (done) =>
  {
    server.get('/').expect(/Immobiliator/, done);
  });

  it('create one test user', async () =>
  {
    await server.post('/register').send({
      username: 'test',
      type: true, // classic user
      password: 'test'
    }).expect(302);

    return expect((await accounts.findOne({})).username).toBe('test');
  });

  it('connect to app with test user', (done) =>
  {
    server.post('/login').send({
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
}); 
