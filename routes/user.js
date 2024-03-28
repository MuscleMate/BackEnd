require('express')
const router = require('express').Router()

const {getUser, updateUser} = require('../controllers/user')

router.route('/:id').get(getUser).put(updateUser)

module.exports = router