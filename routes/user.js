require('express')
const router = require('express').Router()

const { getUser, updateUser, getCurrentUser, deleteUser, getNotifications } = require('../controllers/user')

router.route('/').put(updateUser).get(getCurrentUser).delete(deleteUser)
router.route('/notifications').get(getNotifications)
router.route('/:id').get(getUser)

module.exports = router