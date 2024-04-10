require('express')
const router = require('express').Router()

const { getUser, updateUser, getCurrentUser, deleteUser, getNotifications } = require('../controllers/user')

router.route('/').put(updateUser).get(getCurrentUser).delete(deleteUser)
router.route('/:id').get(getUser)
router.route('/:id/notifications').get(getNotifications)

module.exports = router