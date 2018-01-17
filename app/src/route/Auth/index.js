
const router = require('express').Router();

router.use('/', require('./auth.js'));

module.exports = router ;
