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
            expect(testAnnounce.questions[0].answers[0].text).toBe('my test answer');
            expect(testAnnounce.questions[0].answers[0].username).toBe('by me again');
        });
    });
});

describe('Account manipulation with graphql', function () {
    it('Create an account with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    createAccount: {
                        __args: {
                            input: {
                                username: "test username",
                                password: "test password",
                                type: true
                            }
                        },
                        username: true
                    }
                }
            };
            await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
        });
        const query = {
            mutation: {
                user_connection: {
                    __args: {
                        identifier: {
                            id: "test username",
                            mdp: "test password"
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
        accounts.find({}, async (err, user) => {
            const token = response.text.replace("{\"data\":{\"user_connection\":{\"token\":\"", "").replace("\"}}}", "")
            expect(user[2].username).toBe('test username');
            expect(user[2].token).toBe(token)
        });
    });

    it('Modify an account with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    modifyAccount: {
                        __args: {
                            input: {
                                username: "test username",
                                newUsername: "new test username",
                                oldPassword: "test password",
                                newPassword: "new test password",
                                type: false
                            }
                        },
                        username: true
                    }
                }
            };
            await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
        });
        const query = {
            mutation: {
                user_connection: {
                    __args: {
                        identifier: {
                            id: "new test username",
                            mdp: "new test password"
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
        accounts.find({}, async (err, user) => {
            expect(user[2].username).toBe('new test username');
        });
    });

    it('Delete an account with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    deleteAccount: {
                        __args: {
                            input: {
                                username: "new test username"
                            }
                        },
                        username: true
                    }
                }
            };
            await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
        });
        accounts.find({}, (err, user) => {
            expect(user.length).toBe(2);
        });
    });
});

describe('try to break tests with graphql', function () {
    it('try to create an account with graphql without being logged in', async () => {
        const query = {
            mutation: {
                createAccount: {
                    __args: {
                        input: {
                            username: "test username",
                            password: "test password",
                            type: true
                        }
                    },
                    username: true
                }
            }
        };
        await request(app)
            .post('/graphql')
            .set('Content-Type', 'application/json')
            .send(getQuery(query));
        accounts.find({}, async (err, user) => {
            expect(user.length).toBe(2);
        });
    });

    it('try to create an account with graphql with a bad token', async () => {
        const query = {
            mutation: {
                createAccount: {
                    __args: {
                        input: {
                            username: "test username",
                            password: "test password",
                            type: true
                        }
                    },
                    username: true
                }
            }
        }
        await request(app)
            .post('/graphql')
            .set('Content-Type', 'application/json')
            .send(getQuery(query))
            .set('Cookie', `token=bad token;`);
        accounts.find({}, async (err, user) => {
            expect(user.length).toBe(2);
        });
    });

    it('try to modify an account with graphql without being logged in', async () => {
        const query = {
            mutation: {
                modifyAccount: {
                    __args: {
                        input: {
                            username: "agent",
                            newUsername: "new test username",
                            oldPassword: "test password",
                            newPassword: "new test password",
                            type: false
                        }
                    },
                    username: true
                }
            }
        };
        await request(app)
            .post('/graphql')
            .set('Content-Type', 'application/json')
            .send(getQuery(query));
        accounts.find({}, async (err, user) => {
            expect(user.length).toBe(2);
            expect(user[1].username).toBe('agent');
        });
    });

    it('try to modify an account with graphql with a bad token', async () => {
        const query = {
            mutation: {
                modifyAccount: {
                    __args: {
                        input: {
                            username: "agent",
                            newUsername: "new test username",
                            oldPassword: "test password",
                            newPassword: "new test password",
                            type: false
                        }
                    },
                    username: true
                }
            }
        };
        await request(app)
            .post('/graphql')
            .set('Content-Type', 'application/json')
            .send(getQuery(query))
            .set('Cookie', `token=bad token;`);
        accounts.find({}, async (err, user) => {
            expect(user.length).toBe(2);
            expect(user[1].username).toBe('agent');
        });
    });

    it('try to delete an account with graphql without being logged in', async () => {
        const query = {
            mutation: {
                deleteAccount: {
                    __args: {
                        input: {
                            username: "agent"
                        }
                    },
                    username: true
                }
            }
        };
        await request(app)
            .post('/graphql')
            .set('Content-Type', 'application/json')
            .send(getQuery(query));
        accounts.find({}, async (err, user) => {
            expect(user.length).toBe(2);
        });
    });

    it('try to delete an account with graphql with a bad token', async () => {
        const query = {
            mutation: {
                deleteAccount: {
                    __args: {
                        input: {
                            username: "agent"
                        }
                    },
                    username: true
                }
            }
        };
        await request(app)
            .post('/graphql')
            .set('Content-Type', 'application/json')
            .send(getQuery(query))
            .set('Cookie', `token=bad token;`);
        accounts.find({}, async (err, user) => {
            expect(user.length).toBe(2);
        });
    });

    it('try to get token with graphql without being logged in', async () => {
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

        const token = response.text.replace("{\"data\":{\"user_connection\":{\"token\":\"", "").replace("\"}}}", "")
        accounts.find({}, async (err, user) => {
            expect(user[1].token).toBe(token);
        });
    });

    it('try to get token with graphql with a bad token', async () => {
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
            .send(getQuery(query))
            .set('Cookie', `token=bad token;`);

        const token = response.text.replace("{\"data\":{\"user_connection\":{\"token\":\"", "").replace("\"}}}", "")
        accounts.find({}, async (err, user) => {
            expect(user[1].token).toBe(token);
        });
    });

    it('try to get token with wrong password', async () => {
        const query = {
            mutation: {
                user_connection: {
                    __args: {
                        identifier: {
                            id: "agent",
                            mdp: "wrong password"
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

        expect(response.text).toBe("{\"errors\":[{\"message\":\"Unexpected error value: \\\"id or mdp invalid\\\"\",\"locations\":[{\"line\":1,\"column\":12}],\"path\":[\"user_connection\"]}],\"data\":{\"user_connection\":null}}");
    });

    it('try to get token with wrong username', async () => {
        const query = {
            mutation: {
                user_connection: {
                    __args: {
                        identifier: {
                            id: "wrong username",
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
        expect(response.text).toBe("{\"errors\":[{\"message\":\"Unexpected error value: \\\"id or mdp invalid\\\"\",\"locations\":[{\"line\":1,\"column\":12}],\"path\":[\"user_connection\"]}],\"data\":{\"user_connection\":null}}");
    });

    it('try to modify an account without username with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    modifyAccount: {
                        __args: {
                            input: {
                                newUsername: "new test username",
                                oldPassword: "test password",
                                newPassword: "new test password",
                                type: false
                            }
                        },
                        username: true
                    }
                }
            };
            const response = await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
            expect(response.text).toBe("{\"errors\":[{\"message\":\"Field \\\"AccountModify.username\\\" of required type \\\"String!\\\" was not provided.\",\"locations\":[{\"line\":1,\"column\":34}]}]}");
        });
    });

    it('try to modify an account without oldPassword with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    modifyAccount: {
                        __args: {
                            input: {
                                username: "agent",
                                newUsername: "test username",
                                newPassword: "new test password",
                                type: false
                            }
                        },
                        username: true
                    }
                }
            };
            const response = await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
            expect(response.text).toBe("{\"errors\":[{\"message\":\"Unexpected error value: \\\"old password is require to change password\\\"\",\"locations\":[{\"line\":1,\"column\":12}],\"path\":[\"modifyAccount\"]}],\"data\":{\"modifyAccount\":null}}");
        });
    });

    it('try to modify an innexistant account with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    modifyAccount: {
                        __args: {
                            input: {
                                username: "wrong username",
                                newUsername: "test username",
                                oldPassword: "test password",
                                newPassword: "new test password",
                                type: false
                            }
                        },
                        username: true
                    }
                }
            }
            const response = await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
            expect(response.text).toBe("{\"errors\":[{\"message\":\"Unexpected error value: \\\"account not found\\\"\",\"locations\":[{\"line\":1,\"column\":12}],\"path\":[\"modifyAccount\"]}],\"data\":{\"modifyAccount\":null}}");
        });
    });

    it('try to modify an account without username with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    modifyAccount: {
                        __args: {
                            input: {
                                username: "",
                                newUsername: "test username",
                                oldPassword: "test password",
                                newPassword: "new test password",
                                type: false
                            }
                        },
                        username: true
                    }
                }
            }
            const response = await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
            expect(response.text).toBe("{\"errors\":[{\"message\":\"Unexpected error value: \\\"username is required\\\"\",\"locations\":[{\"line\":1,\"column\":12}],\"path\":[\"modifyAccount\"]}],\"data\":{\"modifyAccount\":null}}");
        });
    });

    it('try to modify an account without newPassword with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    modifyAccount: {
                        __args: {
                            input: {
                                username: "agent",
                                newUsername: "agent",
                                oldPassword: "test password",
                                type: false
                            }
                        },
                        username: true
                    }
                }
            }
            await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
            accounts.find({}, (err, newUser) => {
                expect(newUser[1].token).toBe(user.token);
            });
        });
    });

    it('try to create an account without password with graphql', async () => {
        await accounts.findOne({'username': 'agent'}).then(async user => {
            const query = {
                mutation: {
                    createAccount: {
                        __args: {
                            input: {
                                username: "test username",
                                password: "",
                                type: true
                            }
                        },
                        username: true
                    }
                }
            }
            const response = await request(app)
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send(getQuery(query))
                .set('Cookie', `token=${user.token};`);
            accounts.find({}, (err, newUser) => {
                expect(newUser.length).toBe(2);
                expect(response.text).toBe("{\"errors\":[{\"message\":\"Unexpected error value: \\\"Password required\\\"\",\"locations\":[{\"line\":1,\"column\":12}],\"path\":[\"createAccount\"]}],\"data\":{\"createAccount\":null}}");
            });
        });
    });
});

describe('queries tests', () =>
{
    it('get all announces with filters', async () =>
    {
        const user = await accounts.findOne({'username': 'agent'});

        const query = {
            query: {
                announces: {
                    __args: {
                        filters: {
                            keys: ['title', 'statusType', 'availability', 'test'],
                            values: ["qui n'existe pas", '0', '2022-12-28', '{key: \'value\'}']
                        }
                    },
                    title: true
                }
            }
        };

        await makeRequest(app, query, user.token)
            .expect(/announces/);
    });

    it('get all accounts with filters', async () =>
    {
        const user = await accounts.findOne({'username': 'agent'});

        const query = {
            query: {
                accounts: {
                    __args: {
                        filters: {
                            keys: ['username', 'type'],
                            values: ["agent", 'false']
                        }
                    },
                    username: true
                }
            }
        };

        await makeRequest(app, query, user.token)
            .expect(/agent/);
    });

    it('get all users with orderBy', async () =>
    {
        const user = await accounts.findOne({'username': 'agent'});

        const query = {
            query: {
                accounts: {
                    __args: {
                        orderBy: {
                            field: 'username',
                            desc: true
                        }
                    },
                    username: true
                }
            }
        };

        await makeRequest(app, query, user.token)
            .expect(/"accounts":\[\{"username":"classicUser"},\{"username":"agent"}]/);
    });

    it('try to get announces without token', async () =>
    {
        const query = {
            query: {
                announces: {
                    title: true
                }
            }
        };

        await makeRequest(app, query, '')
            .expect(/you must be connected/);
    });

    it('try to get accounts without token', async () =>
    {
        const query = {
            query: {
                accounts: {
                    username: true
                }
            }
        };

        await makeRequest(app, query, '')
            .expect(/you must be connected/);
    });

    it('error in filters for announces', async () =>
    {
        const user = await accounts.findOne({'username': 'agent'});

        const query = {
            query: {
                announces: {
                    __args: {
                        filters: {
                            keys: ['title', 'statusType', 'availability'],
                            values: ["qui n'existe pas", '0']
                        }
                    },
                    title: true
                }
            }
        };

        await makeRequest(app, query, user.token)
            .expect(/keys ans values as not same length/);
    });
});

function makeRequest(app, query, token)
{
    return request(app).post('/graphql').set('Content-Type', 'application/json')
    .send(getQuery(query))
    .set('Cookie', `token=${token};`)
}