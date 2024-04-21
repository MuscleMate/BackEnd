const mongoose = require('mongoose');
const { db } = require('../database/connect');

const TemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide name"],
        minlength: 3,
        maxlength: 50,
    },
    workoutData: {
        title: {
            type: String,
            minlength: 3,
            maxlength: 50,
        },
        description: {
            type: String,
            minlength: 10,
            maxlength: 500,
        },
        exercises: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Exercise",
            },
        ],
        equipment: [
            {
                type: String,
                minlength: 3,
                maxlength: 50,
            },
        ],
    }
});

module.exports = db.model('Template', TemplateSchema, "Templates");