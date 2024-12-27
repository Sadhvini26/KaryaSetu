const nodemailer = require('nodemailer');
// If using environment variables

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sadhvinipagidimarri99@gmail.com',  // Your Gmail address
    pass: 'vtcvtehkncfelbcf'      // The generated App Password
  }
});

const mailOptions = {
  from: 'psadhvini26@gmail.com',
  to: 'sadhvinipagidimarri99@gmail.com',
  subject: 'Test Email',
  text: 'This is a test email!'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error: ', error);
    return;
  }
  console.log('Email sent: ', info.response);
});