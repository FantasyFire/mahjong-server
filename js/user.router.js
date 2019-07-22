const express = require('express');
const router = express.Router();
const db = require('./mongodb');

router.get('/get_info', async (req, res, next) => {
    let user = await db.findUser(req.query.name);
    res.send(user);
});

module.exports = router;