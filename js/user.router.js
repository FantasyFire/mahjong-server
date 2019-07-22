const express = require('express');
const router = express.Router();

router.get('/get_info', (req, res, next) => {
    res.send(`{"msg":"ok"}`);
});

module.exports = router;