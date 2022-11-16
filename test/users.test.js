const request = require('supertest');
const app = require('../app');
const accounts = require('../models/account');
const Uuid = require("uuid");

// purge users in db for test
beforeAll(async () => await accounts.deleteMany({}));

afterAll(() => app.disconnectDb());

describe('Users tests', function() {
  const server = request(app);

  it('has title in index page (layout test)', (done) =>
  {
    server.get('/').expect(/Immobiliator/, done);
  });

  it('get register page', (done) =>
  {
    server.get('/users/register').expect(/Page de création de compte/).end(done);
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

  it('test register already exist user', async () =>
  {
    await server.post('/users/register').send({
      username: 'test',
      type: true, // classic user
      password: 'test'
    }).expect(/text-danger/);
  });

  it('get login page', (done) =>
  {
    server.get('/users/login').expect(/Page de connexion/).end(done);
  });

  it('login with bad username', (done) =>
  {
    server.post('/users/login').send({
      username: 'badTest',
      password: 'test'
    }).expect(/text-danger/).end(done);
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

  it('test modify user page', async () =>
  {
    const account = await accounts.findOne({});

    await server.get('/users/modifyUser')
        .set('Cookie', `token=${account.token};`)
        .expect(/Modifier l'utilisateur/).expect(/test/);
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

  it('modify user password', async () =>
  {
    const account = await accounts.findOne({});

    await server.post('/users/modifyUser')
        .set('Cookie', `token=${account.token};`)
        .send({
          username: 'testModify',
          type: false,
          password: 'test2',
          oldPassword: 'test'
        }).expect(/Enregistrement effectué/);
  });

  it('modify user password with bad oldPassword', async () =>
  {
    const account = await accounts.findOne({});

    await server.post('/users/modifyUser')
        .set('Cookie', `token=${account.token};`)
        .send({
          username: 'testModify',
          type: false,
          password: 'test3',
          oldPassword: 'test'
        }).expect(/text-danger/);
  });

  it('access to unauthorized route when not connected', (done) =>
  {
    server.get('/users/logout').expect(302).expect('Location', '/').end(done);
  });

  it('logout', async () =>
  {
    const account = await accounts.findOne({});

    await server.get('/users/logout')
        .set('Cookie', `token=${account.token};`)
        .expect(302);


    const newAccount = await accounts.findOne({});
    expect(newAccount.token).toBe("");
  });

  it('test oauth', (done) =>
  {
    server.get('/users/oauth')
        .expect(302)
        .expect('Location', `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fusers%2Foauth%2Fcallback&scope=email%20profile&client_id=562698289154-j55jdbaduc698q6l8laan09qp15ud4hr.apps.googleusercontent.com`, done);
  });

  it('test get token api', (done) =>
  {
    server.post('/users/token')
        .send({
          username: 'testModify',
          password: 'test2'
        })
        .expect(/token/, done);
  });

  it('test failed to get token api', (done) =>
  {
    server.post('/users/token')
        .send({
          username: 'testModify',
          password: 'test'
        })
        .expect(/failed/, done);
  });

  it('test oauth callback with error obviously', (done) =>
  {
    server.get('/users/oauth/callback').expect(302, done);
  });

  it('test add password of user created with oauth', async () =>
  {
    const account = await accounts.create(new accounts({
      username: "test@gmail.com",
      type: true,
      passwd: false,
      token: Uuid.v4()
    }));

    await server.post('/users/modifyUser')
        .set('Cookie', `token=${account.token};`)
        .send({
          username: "test@gmail.com",
          password: 'testOauth1'
        })
        .expect(/Enregistrement effectué/);
  });
}); 
