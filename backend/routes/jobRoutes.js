const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Notification = require('../models/Notifications');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to authenticate user
function authenticate(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect("/"); // Redirect to login if no token
    }

    jwt.verify(token, 'shhhh', async (err, decoded) => {
        if (err) return res.status(401).send("Unauthorized");

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).send("Unauthorized");
        }
        req.user = user; // Attach user to request
        next();
    });
}

// Route to post a new job
router.post('/post-job', authenticate, async (req, res) => {
    const { title, description } = req.body;

    // Create a new job
    const newJob = new Job({
        title,
        description,
        postedBy: req.user._id // Associate the job with the logged-in helper
    });

    try {
        await newJob.save();
        res.redirect('/helper-dashboard'); // Redirect to the dashboard after posting the job
    } catch (err) {
        console.error(err);
        res.status(500).send('Error posting job');
    }
});

// Route to get posted jobs
router.get('/posted-jobs', authenticate, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'Helper') {
            return res.status(403).send('Access Denied');
        }

        const jobs = await Job.find({ helperId: req.user._id });
        res.render('helper-dashboard', { username: req.user.name, jobs });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching jobs');
    }
});

// Route to send email
router.post('/send-email', async (req, res) => {
    const { userMail, location, toEmail } = req.body;

    const transporter = nodemailer.createTransport({
        secure: true,
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: userMail,
            pass: 'jgtsvizqclgyhefr', // Make sure to replace this with a secure way of storing the password
        },
    });

    function sendMail(to, sub, msg) {
        transporter.sendMail({
            from: userMail,
            to: to,    // Dynamic recipient email
            subject: sub,
            html: msg,
        }, (err, info) => {
            if (err) {
                console.error('Error sending email:', err);
                res.status(500).json({ message: 'Error sending email' });
            } else {
                console.log('Email sent: ' + info.response);
                res.status(200).json({ message: 'Email sent successfully!' });
            }
        });
    }

    const emailSubject = `Job Interest from ${userMail}`;
    const emailBody = `
        <p><strong>Message from:</strong> ${userMail}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p>This user is interested in the job you posted!</p>
    `;

    sendMail(toEmail, emailSubject, emailBody);
});

// Route to handle hiring a helper
// Route to hire a person for a job
router.post('/hire/:jobId', authenticate, async (req, res) => {
    const jobId = req.params.jobId;

    try {
        // Find the job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).send('Job not found');
        }

        // Find the person who posted the job (the helper)
        const helper = await User.findById(job.postedBy);
        if (!helper) {
            return res.status(404).send('Helper not found');
        }

        // Create a notification for the hired person
        const newNotification = new Notification({
            message: `You have been hired for the job: ${job.title}`,
            jobId: job._id,
            helperId: job.postedBy, // The helper who posted the job
            isRead: false
        });

        await newNotification.save();

        // Redirect to jobs page after hiring
        res.redirect('/jobs');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error hiring for job');
    }
});


// Route to handle posting a new job (dashboard)
router.post('/helper-dashboard/post-job', authenticate, async (req, res) => {
    try {
        const { title, description, location } = req.body;
        const user = req.user;

        // Create a new job
        const newJob = new Job({
            title,
            description,
            location,
            postedBy: user._id,
            status: 'open', // Default status is 'open'
        });

        // Save the job to the database
        await newJob.save();

        // Redirect back to the dashboard with the new job posted
        res.redirect('/helper-dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error posting job');
    }
});

module.exports = router;
