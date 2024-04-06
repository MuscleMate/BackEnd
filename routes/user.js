require('express')
const router = require('express').Router()

const { getUser, updateUser, getCurrentUser, deleteUser } = require('../controllers/user')

router.route('/').put(updateUser).get(getCurrentUser).delete(deleteUser)
router.route('/:id').get(getUser)

module.exports = router