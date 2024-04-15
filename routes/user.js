require('express')
const router = require('express').Router()

const { getUser, updateUser, getCurrentUser, deleteUser, getNotifications, 
    getCurrentWeight, updateCurrentWeight, getWeightHistory, getFirstName, 
    updateFirstName, getLastName, updateLastName, getEmail, updateEmail, 
    getDateOfBirth, updateDateOfBirth, getHeightHistory, getCurrentHeight, 
    updateCurrentHeight, getGender, updateGender, getAllSuplements, getSuplement, 
    addSuplement, getSuplementHistory, updateSuplementDose, updateSuplementName, updateSuplementStatus,
    searchUser, getLevel } = require('../controllers/user')

router.route('/').put(updateUser).get(getCurrentUser).delete(deleteUser)
router.route("/search").post(searchUser)
router.route('/notifications').get(getNotifications)
router.route("/firstName").get(getFirstName).put(updateFirstName);
router.route("/lastName").get(getLastName).put(updateLastName);
router.route("/email").get(getEmail).put(updateEmail);
router.route("/dateOfBirth").get(getDateOfBirth).put(updateDateOfBirth);
router.route("/height").get(getCurrentHeight).put(updateCurrentHeight);
router.route("/height/history").get(getHeightHistory);
router.route('/weight').get(getCurrentWeight).put(updateCurrentWeight)
router.route('/weight/history').get(getWeightHistory)
router.route('/gender').get(getGender).put(updateGender)
router.route('/level').get(getLevel);
router.route('/suplement').get(getSuplement).post(addSuplement)
router.route('/suplement/all').get(getAllSuplements)
router.route('/suplement/doseHistory').get(getSuplementHistory)
router.route('/suplement/dose').put(updateSuplementDose)
router.route('/suplement/name').put(updateSuplementName)
router.route('/suplement/status').put(updateSuplementStatus)
router.route('/:id').get(getUser)

module.exports = router