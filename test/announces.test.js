const request = require('supertest');
const app = require('../app');
const announce = require('../models/announce');
const accounts = require('../models/account');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;

// purge announce & users in db for test
beforeAll(async () => {
    const server = request(app);
    await announce.deleteMany({});
    await accounts.deleteMany({});
    await server.post('/users/register').send({
        username: 'agent',
        type: false,
        password: 'test'
    });
});

afterAll(() => app.disconnectDb());

describe('Agent user tests', function () {
    const server = request(app);

    it('Create an announce', async () => {
        await accounts.findOne({}).then(async user => {
            await server
                .post('/announces/add')
                .send({
                    title: 'testAnnounce',
                    statusType: '0', //available
                    isPublish: "on",
                    availability: '2022-11-18',
                    type: true, //sell
                    price: 100,
                    description: 'test description for a test announce'
                })
                .set('Cookie', `token=${user.token};`);
        });
        announce.findOne({}, (err, testAnnounce) => {
            expect(err).toBeNull();
            expect(testAnnounce.title).toBe('testAnnounce');
            expect(testAnnounce.statusType).toBe(0);
            expect(testAnnounce.isPublish).toBe(true);
            expect(testAnnounce.availability).toStrictEqual(new Date(Date.parse('2022-11-18')));
            expect(testAnnounce.type).toBe(true);
            expect(testAnnounce.price).toBe(100);
            expect(testAnnounce.description).toBe('test description for a test announce');
        });
    });

    it('Show all announces', async () => {
        await accounts.findOne({}).then(async user => {
            const page = await server.get('/announces').set('Cookie', `token=${user.token};`);
            const dom = new JSDOM(page.text);
            const table = dom.window.document.querySelector('table');
            expect(table).not.toBeNull();
            expect(table.rows.length).toBe(2);
            expect(table.rows[1].cells[0].textContent).toBe('testAnnounce');
            expect(table.rows[1].cells[1].textContent).toBe('18/11/2022');
            expect(table.rows[1].cells[2].textContent).toBe('100 €');
            expect(table.rows[1].cells[3].textContent).toBe('Vente');
            expect(table.rows[1].cells[4].textContent).toBe('Disponible');
        });
    });

    it('Edit an announce', async () => {
        await accounts.findOne({}).then(async user => {
            const page = await server.get('/announces/testAnnounce').set('Cookie', `token=${user.token};`);
            const dom = new JSDOM(page.text);
            const container = dom.window.document.getElementsByClassName('container m-0 m-md-auto p-1 p-md-2')[0];
            expect(container).not.toBeNull();
            const rows = container.getElementsByClassName('row');
            expect(rows[0].querySelector("h2").textContent).toBe("testAnnounce");

            const firstRowSplit = rows[1].textContent.replace("Publier", "").split("Status");
            expect(firstRowSplit[0]).toBe("true");
            expect(firstRowSplit[1]).toBe("Disponible");

            const secondRowSplit = rows[2].textContent.replace("Date de disponibilité", "").split("Type d'annonce");
            expect(secondRowSplit[0]).toBe("18/11/2022");
            expect(secondRowSplit[1]).toBe("Vente");

            const thirdRow = rows[3].textContent.replace("Prix", "");
            expect(thirdRow).toBe("100 €");

            // delete action now
            await server
                .post('/announces/testAnnounce/edit')
                .send({
                    title: 'testAnnounce',
                    statusType: '0', //available
                    isPublish: "on",
                    availability: '2022-11-18',
                    type: true, //sell
                    price: 200,
                    description: 'test description for a test announce'
                })
                .set('Cookie', `token=${user.token};`);

            const pageEdited = await server.get('/announces/testAnnounce').set('Cookie', `token=${user.token};`);
            const domEdited = new JSDOM(pageEdited.text);
            const containerEdited = domEdited.window.document.getElementsByClassName('container m-0 m-md-auto p-1 p-md-2')[0];
            const editedPrice = containerEdited.getElementsByClassName('row')[3].textContent.replace("Prix", "");
            expect(editedPrice).toBe("200 €");
        });
    });

    it('Delete an announce', async () => {
        await accounts.findOne({}).then(async user => {
            let theAnnounce = await announce.findOne({});
            await server
                .post('/announces/' + theAnnounce.title + '/delete')
                .set('Cookie', `token=${user.token};`);
        });
        announce.findOne({}, (err, testAnnounce) => {
            expect(err).toBeNull();
            expect(testAnnounce).toBeNull();
        });
    });
});