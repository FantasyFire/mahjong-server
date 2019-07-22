const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const config = require('../config.json');
let client = null;
// Use connect method to connect to the Server
MongoClient.connect(config.mongodb.adminUrl, function (err, _client) {
    assert.equal(null, err);
    client = _client;
});

exports.findUser = async (name) => {
    let res = await client.db('admin').collection('user').findOne({name});
    return res;
};