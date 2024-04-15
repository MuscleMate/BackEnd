require('express')
const router = require('express').Router()

const { getUser, updateUser, getCurrentUser, deleteUser, getNotifications, 
    getCurrentWeight, updateCurrentWeight, getWeightHistory, getFirstName, 
    updateFirstName, getLastName, updateLastName, getEmail, updateEmail, 
    getDateOfBirth, updateDateOfBirth, getHeightHistory, getCurrentHeight, 
    updateCurrentHeight, getGender, updateGender } = require('../controllers/user')

router.route('/').put(updateUser).get(getCurrentUser).delete(deleteUser)
router.route('/notifications').get(getNotifications)
router.route("/firstName").get(getFirstName).put(updateFirstName);
router.route("/lastName").get(getLastName).put(updateLastName);
router.route("/email").get(getEmail).put(updateEmail);
router.route("/dot").get(getDateOfBirth).put(updateDateOfBirth);
router.route("/height-history").get(getHeightHistory);
router.route("/current-height").get(getCurrentHeight).put(updateCurrentHeight);
router.route('/weight-history').get(getWeightHistory)
router.route('/current-weight').get(getCurrentWeight).put(updateCurrentWeight)
router.route('/gender').get(getGender).put(updateGender)
router.route('/:id').get(getUser)

module.exports = router