const nodemailer = require("nodemailer");
const { BadRequestError } = require("../errors");

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port: 587,
            secure: true,
            auth: {
                user: process.env.USER,
                pass: process.env.PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.USER,
            to: email,
            subject: subject,
            text: text,
        });

    } catch (error) {
        throw new BadRequestError(error);
    }
};

module.exports = sendEmail;
