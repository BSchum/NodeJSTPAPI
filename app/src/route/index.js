const router = require('express').Router();

router.use('/user', require('./User'));
router.use('/auth', require('./Auth'));
router.use('/group', require('./Group'));
router.use('/address', require('./Address'));

module.exports = router;
