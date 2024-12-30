let nodemailer = require('nodemailer')

const sendMail = async (toEmail, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'toptennisuk@gmail.com ',
                pass: 'yjapspxbyeaxrirq', // Replace with your app password
            },
        });

        // Email content
        const mailOptions = {
            from: 'toptennisuk@gmail.com ', // Fixed email
            to:toEmail, // Dynamic email passed as a parameter
            subject: subject, // Dynamic subject passed as a parameter
            html: text // Email body passed as a parameter
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);

        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Failed to send email' };
    }
};

module.exports = sendMail;
