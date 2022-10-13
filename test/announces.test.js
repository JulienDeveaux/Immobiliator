const request = require('supertest');
const app = require('../app');
const announce = require('../models/announce');
const accounts = require('../models/account');
const jsdom = require('jsdom');
const fs = require("fs");
const {JSDOM} = jsdom;

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
    const server = request(app);

    it('Create an announce', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const addPage = await server.get('/announces/add').set('Cookie', 'token=' + user.token);
            const dom = new JSDOM(addPage.text);
            expect(dom.window.document.querySelectorAll('input').length).toBe(6);
            expect(dom.window.document.querySelector('input[name="title"]').value).toBe('');
            expect(dom.window.document.querySelector('input[name="price"]').textContent).toBe('');
            expect(dom.window.document.querySelector('textarea').value).toBe('');
            expect(dom.window.document.querySelector('input[name="availability"]').textContent).toBe('');
            expect(dom.window.document.querySelector('select[name="statusType"]').value).toBe('0');
            expect(dom.window.document.querySelector('input[name="isPublish"]').value).toBe('on');

            await request(app)
                .post('/announces/add')
                .field('title', 'testAnnounce')
                .field('statusType', '0')
                .field('isPublish', 'on')
                .field('availability', '2022-11-18')
                .field('type', true)
                .field('price', 100)
                .field('description', 'test description for a test announce')
                .field('fileUpload', fs.createReadStream('./test/Image samples/sample-birch-400x300.jpg'))
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
        await accounts.findOne({'username': 'agent'}).then(async user => {
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

    it('View announce', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            let theAnnounce = await announce.findOne({});

            const page = await server.get('/announces/' + theAnnounce.title).set('Cookie', `token=${user.token};`);
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

            expect(rows[4].textContent.replace("Description:", "")).toBe("test description for a test announce");

            expect(rows[5].querySelector("img").src).toBe("/announces/image/" + theAnnounce.title + "/" + theAnnounce.images[0]._id);
        });
    });

    it('fetch image route', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            await announce.findOne({'title': 'testAnnounce'}).then(async announce => {
                const page = await request(app)
                    .get(`/announces/image/${announce.title}/${announce.images[0]._id}`)
                    .set('Cookie', `token=${user.token};`);
                expect(page.headers['content-type']).toBe('image/jpg');
                expect(page.headers['content-length']).toBe('121036');
            });
        });
    });

    it('Edit an announce', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const page = await server.get('/announces/testAnnounce/edit').set('Cookie', `token=${user.token};`);
            const dom = new JSDOM(page.text);
            const container = dom.window.document.getElementsByClassName('container m-0 m-md-auto p-1 p-md-2')[0];
            expect(container).not.toBeNull();
            const rows = container.getElementsByClassName('row');
            expect(rows[0].querySelector("h2").textContent).toBe("Modifier l\'annonce testAnnounce");

            const firstRow = rows[2];
            expect(firstRow.querySelector("input[type='text']").value).toBe("testAnnounce");
            expect(firstRow.querySelector("select").value).toBe("0");       // 0 = Available

            const secondRow = rows[3]
            expect(secondRow.querySelector('input[type="date"]').value).toBe("2022-10-18");
            expect(secondRow.querySelector(('select')).value).toBe("true"); // true = Sell
            expect(secondRow.querySelector('input[type="number"]').value).toBe("100");

            expect(rows[5].querySelector('input[type="checkbox"]').value).toBe("on");
            expect(rows[6].querySelector('textarea').textContent).toBe("test description for a test announce");

            // Edit action now
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
            await request(app)
                .post('/announces/testAnnounce/edit')
                .field('title', 'testAnnounce')
                .field('statusType', '0')
                .field('isPublish', 'on')
                .field('availability', '2022-11-18')
                .field('type', true)
                .field('price', 200)
                .field('description', 'test description for a test announce')
                .field('fileUpload', fs.createReadStream('./test/Image samples/sample-city-park-400x300.jpg'))
                .set('Cookie', `token=${user.token};`);

            const pageEdited = await server.get('/announces/testAnnounce').set('Cookie', `token=${user.token};`);
            const domEdited = new JSDOM(pageEdited.text);
            const containerEdited = domEdited.window.document.getElementsByClassName('container m-0 m-md-auto p-1 p-md-2')[0];
            const editedPrice = containerEdited.getElementsByClassName('row')[3].textContent.replace("Prix", "");
            expect(editedPrice).toBe("200 €");
            //todo image check view
        });
    });

    it('Bad fields in announce creation / edit page', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            /*Creation form*/
            const page = await request(app)
                .post('/announces/add')
                .field('title', 'test')                 // too short
                .field('statusType', '3')               // bad status
                .field('isPublish', 'off')              // impossible value
                .field('availability', '2022-1-1')      // bad date
                .field('type', 3)                       // should be boolean
                .field('price', "one hundred")          // should be a number
                .field('description', 700)              // should be good (anything will be converted to string)
                .field('fileUpload', fs.createReadStream('./test/announces.test.js'))       // obviously not an image
                .set('Cookie', `token=${user.token};`);
            const createDom = new JSDOM(page.text);
            let form = createDom.window.document.querySelector('form');
            let secondRow = form.getElementsByClassName('row')[1];
            let errorList = secondRow.querySelector('ul');
            let errorListContent = Array.from(errorList.children).map(li => li.textContent);
            expect(errorListContent.length).toBe(7);
            expect(errorListContent).toContain("title: Invalid value");
            expect(errorListContent).toContain("statusType: Invalid value");
            expect(errorListContent).toContain("isPublish: Invalid value");
            expect(errorListContent).toContain("availability: Invalid value");
            expect(errorListContent).toContain("type: Invalid value");
            expect(errorListContent).toContain("price: Invalid value");
            expect(errorListContent).toContain("Image: Invalid Image (announces.test.js)")

            /*Edit form*/
            const editPage = await server
                .post('/announces/testAnnounce/edit')
                .send({
                    title: 'test',          // too short
                    statusType: '3',        // bad status
                    isPublish: "off",       // impossible value
                    availability: '20-1-1', // bad date
                    type: 3,                // should be boolean
                    price: "one hundred",   // should be number
                    description: 700        // should be good (anything will be converted to string)
                })
                .set('Cookie', `token=${user.token};`);
            const editDom = new JSDOM(editPage.text);
            form = editDom.window.document.querySelector('form');
            secondRow = form.getElementsByClassName('row')[1];
            errorList = secondRow.querySelector('ul');
            errorListContent = Array.from(errorList.children).map(li => li.textContent);
            expect(errorListContent.length).toBe(6);
            expect(errorListContent).toContain("title: Invalid value");
            expect(errorListContent).toContain("statusType: Invalid value");
            expect(errorListContent).toContain("isPublish: Invalid value");
            expect(errorListContent).toContain("availability: Invalid value");
            expect(errorListContent).toContain("type: Invalid value");
            expect(errorListContent).toContain("price: Invalid value");
        });
    });

    it('Delete confirm page', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const page = await server.get('/announces/testAnnounce/deleteConfirm').set('Cookie', `token=${user.token};`);
            const dom = new JSDOM(page.text);
            expect(dom.window.document.querySelector('form').querySelector("input").value).toBe("Supprimer");
            expect(dom.window.document.querySelector("form>a").textContent).toBe("Annuler");
        });
    });

    it('Delete an announce', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
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

    it('View non existant announce go back to main announce page', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            await server.get('/announces/innexistantAnnounce').set('Cookie', `token=${user.token};`).expect("Location", "/announces");
        });
    });

    it('Edit non existing announce', async () => {
       await accounts.findOne({'username': 'agent'}).then(async user => {
           await server.get('/announces/innexistantAnnounce/edit').set('Cookie', `token=${user.token};`).expect("Location", "/announces");
           await server.post('/announces/innexistantAnnounce/edit').set('Cookie', `token=${user.token};`).expect("Location", "/announces");
       });
    });
});

describe('Classic user tests', function () { //TODO check security of routes
    const server = request(app);

    it('Create an announce rejection', async () => {
        await accounts.findOne({'username': 'classicUser'}).then(async user => {
            await server.get('/announces/add').set('Cookie', `token=${user.token};`).expect("Location", "/");
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
                .set('Cookie', `token=${user.token};`)
                .expect("Location", "/announces");//TODO : add images
            let annnouce = await announce.findOne({'title': 'testAnnounce'});
            expect(annnouce).toBeNull();
        });
    });

    it('Edit an announce rejection', async () => {
        await accounts.findOne({'username': 'classicUser'}).then(async user => {
            await server.get('/announces/testAnnounce/edit').set('Cookie', `token=${user.token};`).expect("Location", "/announces/testAnnounce");
            await server
                .post('/announces/testAnnounce/edit')
                .send({
                    title: 'testAnnounce',
                    statusType: '0', //available
                    isPublish: "on",
                    availability: '2022-11-18',
                    type: true, //sell
                    price: 100,
                    description: 'test description for a test announce'
                })
                .set('Cookie', `token=${user.token};`)
                .expect("Location", "/announces/testAnnounce");
            let annnouce = await announce.findOne({'title': 'testAnnounce'});
            expect(annnouce).toBeNull();
        });
    });

    it('Create an announce with agent role for the next tests', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
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
    });

    it('Delete an announce rejection', async () => {
        await accounts.findOne({'username': 'classicUser'}).then(async user => {
            await server.get('/announces/testAnnounce/deleteConfirm').set('Cookie', `token=${user.token};`).expect("Location", "/announces");
            await server
                .post('/announces/testAnnounce/delete')
                .set('Cookie', `token=${user.token};`)
                .expect("Location", "/announces");
            let annnouce = await announce.findOne({'title': 'testAnnounce'});
            expect(annnouce).toBeDefined();
        });
    });
});

describe('More images tests', function () {
    it('Add more than one image with multiple types', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            await request(app)
                .post('/announces/add')
                .field('title', 'imageAnnounce')
                .field('statusType', '0')
                .field('isPublish', 'on')
                .field('availability', '2022-11-18')
                .field('type', true)
                .field('price', 100)
                .field('description', 'test description for a test announce')
                .attach('fileUpload', fs.createReadStream('./test/Image samples/sample-birch-400x300.jpg'))
                .attach('fileUpload', fs.createReadStream('./test/Image samples/sample-bumblebee-400x300.png'))
                .set('Cookie', `token=${user.token};`);
            const annnouce = await announce.findOne({'title': 'imageAnnounce'});
            expect(annnouce).toBeDefined();
            expect(annnouce.images.length).toBe(2);
        });
    });

    it('show png image', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            await announce.findOne({'title': 'imageAnnounce'}).then(async announce => {
                const page = await request(app)
                    .get(`/announces/image/${announce.title}/${announce.images[1]._id}`)
                    .set('Cookie', `token=${user.token};`);
                expect(page.headers['content-type']).toBe('image/png');
                expect(page.headers['content-length']).toBe('195459');
            });
        });
    });


    it('show jpg image', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            await announce.findOne({'title': 'imageAnnounce'}).then(async announce => {
                const page = await request(app)
                    .get(`/announces/image/${announce.title}/${announce.images[0]._id}`)
                    .set('Cookie', `token=${user.token};`);
                expect(page.headers['content-type']).toBe('image/jpg');
                expect(page.headers['content-length']).toBe('121036');
            });
        });
    });

    it('Bad image edit test', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const editPage = await request(app)
                .post('/announces/imageAnnounce/edit')
                .field('title', 'test')                 // too short
                .field('statusType', '3')               // bad status
                .field('isPublish', 'off')              // impossible value
                .field('availability', '2022-1-1')      // bad date
                .field('type', 3)                       // should be boolean
                .field('price', "one hundred")          // should be a number
                .field('description', 700)              // should be good (anything will be converted to string)
                .attach('fileUpload', fs.createReadStream('./test/announces.test.js'))     //obviously not an image
                .attach('fileUpload', fs.createReadStream('./test/users.test.js'))         //obviously not an image
                .set('Cookie', `token=${user.token};`);
            const editDom = new JSDOM(editPage.text);
            form = editDom.window.document.querySelector('form');
            secondRow = form.getElementsByClassName('row')[1];
            errorList = secondRow.querySelector('ul');
            errorListContent = Array.from(errorList.children).map(li => li.textContent);
            expect(errorListContent.length).toBe(8);
            expect(errorListContent).toContain("title: Invalid value");
            expect(errorListContent).toContain("statusType: Invalid value");
            expect(errorListContent).toContain("isPublish: Invalid value");
            expect(errorListContent).toContain("availability: Invalid value");
            expect(errorListContent).toContain("type: Invalid value");
            expect(errorListContent).toContain("price: Invalid value");
            expect(errorListContent).toContain("Image: Invalid Image (announces.test.js)");
            expect(errorListContent).toContain("Image: Invalid Image (users.test.js)");
        });
    });
});

describe('Q&A tests', function () {
    const server = request(app);

    it('Add a question with an agent role', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            await server
                .post('/announces/testAnnounce')
                .send({
                    question: 'test question'
                })
                .set('Cookie', `token=${user.token};`)
                .expect('Location', '/announces/testAnnounce');
            const annnouce = await announce.findOne({'title': 'testAnnounce'});
            expect(annnouce).toBeDefined();
            expect(annnouce.questions.length).toBe(0);
        });
    });

    it('Add a question with a classic user role', async () => {
        await accounts.findOne({'username': 'classicUser'}).then(async user => {
            await server
                .post('/announces/testAnnounce')
                .send({
                    question: 'test question'
                })
                .set('Cookie', `token=${user.token};`);
            const annnouce = await announce.findOne({'title': 'testAnnounce'});
            expect(annnouce).toBeDefined();
            expect(annnouce.questions.length).toBe(1);
            expect(annnouce.questions[0].text).toBe('test question');
        });
    });

    it('Respond to a question with a classic user role', async () => {
        await accounts.findOne({'username': 'classicUser'}).then(async user => {
            await server
                .post('/announces/testAnnounce')
                .send({
                    question: 'test question',
                    answer: 'test answer'
                })
                .set('Cookie', `token=${user.token};`);
            const annnouce = await announce.findOne({'title': 'testAnnounce'});
            expect(annnouce).toBeDefined();
            expect(annnouce.questions.length).toBe(2);
        });
    });

    it('Respond to a question with an agent role', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            await server
                .post('/announces/testAnnounce')
                .send({
                    question: 'test question',
                    answer: 'test answer'
                })
                .set('Cookie', `token=${user.token};`);
            const annnouce = await announce.findOne({'title': 'testAnnounce'});
            expect(annnouce).toBeDefined();
            expect(annnouce.questions[0].answers.length).toBe(1);
            expect(annnouce.questions[0].answers[0].text).toBe('test answer');
        });
    });

    it('Send a question to a non existing announce', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            await server
                .post('/announces/nonExistingAnnounce')
                .send({
                    question: 'test question'
                })
                .set('Cookie', `token=${user.token};`)
                .expect('Location', '/announces');
        });
    });
});