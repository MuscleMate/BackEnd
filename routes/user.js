require('express')
const router = require('express').Router()

const {getUser, updateUser, getCurrentUser} = require('../controllers/user')

router.route('/').put(updateUser).get(getCurrentUser)
router.route('/:id').get(getUser)

module.exports = router