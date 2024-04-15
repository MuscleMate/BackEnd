require('express')
const router = require('express').Router()

const { getUser, updateUser, getCurrentUser, deleteUser, getNotifications, 
    getCurrentWeight, updateCurrentWeight, getWeightHistory, getFirstName, 
    updateFirstName, getLastName, updateLastName, getEmail, updateEmail } = require('../controllers/user')

router.route('/').put(updateUser).get(getCurrentUser).delete(deleteUser)
router.route('/current-weight').get(getCurrentWeight).post(updateCurrentWeight)
router.route('/weights').get(getWeightHistory)
router.route('/notifications').get(getNotifications)
router.route("/firstName").get(getFirstName).put(updateFirstName);
router.route("/lastName").get(getLastName).put(updateLastName);
router.route("/email").get(getEmail).put(updateEmail);
router.route('/:id').get(getUser)

module.exports = router