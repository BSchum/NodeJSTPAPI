const router = require('express').Router();

router.use('/', require('./user.js'));

module.exports = router;
