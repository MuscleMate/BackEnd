require('express')
const router = require('express').Router()

const { getUser, updateUser, getCurrentUser, deleteUser, getNotifications, getCurrentWeight, updateCurrentWeight, getWeightHistory } = require('../controllers/user')

router.route('/').put(updateUser).get(getCurrentUser).delete(deleteUser)
router.route('/current-weight').get(getCurrentWeight).post(updateCurrentWeight)
router.route('/weights').get(getWeightHistory)
router.route('/notifications').get(getNotifications)
router.route('/:id').get(getUser)

module.exports = router