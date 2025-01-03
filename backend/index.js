const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 
const app = express();
const Notification = require('./models/Notifications')
const Job = require('./models/Job');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:4000', 
    credentials: true,
}));
app.use(express.static(path.join(__dirname, '../frontend/public')));
mongoose.connect('mongodb://localhost:27017/karyaSetuDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!['Helper', 'User'].includes(role)) {
            return res.status(400).json({ error: "Invalid role selected" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Sending a custom error message with the response
            return res.status(400).json({ error: "User already exists", redirect: "/login" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
        });
        const token = jwt.sign({ email, userId: newUser._id, role: newUser.role }, "shhhh", { expiresIn: '1h' });
        res.cookie("token", token, { httpOnly: true });
        res.status(200).json({ success: true, redirect: role === "Helper" ? "/helper-dashboard" : "/jobs" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Login Route
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password", redirect: "/login" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password", redirect: "/login" });
        }
        const token = jwt.sign({ email, userId: user._id, role: user.role }, "shhhh", { expiresIn: '1h' });
        res.cookie("token", token, { httpOnly: true });
        res.status(200).json({ success: true, redirect: user.role === "Helper" ? "/helper-dashboard" : "/jobs" });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



const transporter = nodemailer.createTransport({
    service: 'gmail', // Using Gmail as the service provider
    auth: {
        user: 'sadhvinipagidimarri99@gmail.com',  // Replace with your email
        pass: 'vtcvtehkncfelbcf'    // Replace with your email password or App Password
    }
});


app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    const mailOptions = {
        from: email,
        to: 'sadhvinipagidimarri99@gmail.com',
        subject: 'New Contact Form Submission',
        text: `
            Name: ${name}
            Email: ${email}
            Message: ${message}
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error details:', error);
            // Redirect with error parameter
            return res.redirect('/?success=false');
        }
        // Redirect with success parameter
        res.redirect('/?success=true');
    });
});

function authenticate(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, 'shhhh', async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }

        req.user = user;
        next();
    });
}

app.get('/jobs', authenticate, async (req, res) => {
    try {
        const jobs = await Job.find();
        res.render('jobs', { jobs, USERNAME: req.user.name });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading jobs');
    }
});
app.post('/jobs/hire/:jobId', authenticate, async (req, res) => {
    const { jobId } = req.params;
    const { location } = req.body;  // Capture the location sent from the frontend

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
    }

    if (!location) {
        return res.status(400).json({ message: 'Location is required' });  // Ensure location is provided
    }

    try {
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.hired) {
            return res.status(400).json({ message: 'This job has already been hired' });
        }

        job.hired = true;
        job.hiredBy = req.user._id;
        job.location = location;  // Store the location in the job object
        await job.save();

        // Create a notification including the location
        const notification = new Notification({
            message: `${req.user.name} has hired you for the job: ${job.title} at ${location}`,  // Include location in the message
            jobId: job._id,
            helperId: job.postedBy,
            isRead: false,
        });

        await notification.save();

        // Return JSON instead of redirect
        res.status(200).json({ success: true, message: 'Job successfully hired!' });
    } catch (err) {
        console.error('Error during hiring:', err);
        res.status(500).json({ success: false, message: 'Error hiring the job' });
    }
});
app.get('/helper-dashboard', authenticate, async (req, res) => {
    try {
        // Fetch notifications and jobs for the helper
        const notifications = await Notification.find({ helperId: req.user._id });
        const jobs = await Job.find({ postedBy: req.user._id }); // Jobs posted by the helper

        // Render the helper's dashboard with the notifications and jobs
        res.render('helper-dashboard', { 
            username: req.user.name, 
            jobs, 
            notifications 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading dashboard');
    }
});
app.get('/your-jobs', authenticate, async (req, res) => {
    try {
        // Fetch jobs posted by the currently logged-in user (helper)
        const jobs = await Job.find({ postedBy: req.user._id });

        // Render the 'your-jobs' page with the jobs
        res.render('your-jobs', { jobs, username: req.user.name });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading your jobs');
    }
});
app.post('/post-job', authenticate, async (req, res) => {
    const { title, description } = req.body;

    const newJob = new Job({
        title,
        description,
        postedBy: req.user._id, // Associate the job with the logged-in helper
    });

    try {
        await newJob.save();
        res.redirect('/helper-dashboard'); // Redirect to dashboard after posting the job
    } catch (err) {
        console.error(err);
        res.status(500).send('Error posting job');
    }
});
app.post('/jobs/hire/:jobId', authenticate, async (req, res) => {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
    }

    try {
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        if (job.hired) {
            return res.status(400).json({ message: 'This job has already been hired' });
        }
        job.hired = true;
        job.hiredBy = req.user._id;
        await job.save();
        const notification = new Notification({
            message: `${req.user.name} has hired you for the job: ${job.title}`,
            jobId: job._id,
            helperId: job.postedBy,
        });

        await notification.save();

        return res.json({ success: true, message: 'Job hired successfully', jobId: job._id });
    } catch (err) {
        console.error('Error during hiring:', err);
        return res.status(500).json({ message: 'Error hiring the job' });
    }
});
app.get('/post-job',authenticate, async (req, res) => {
    res.render('post-job', {username:req.user.name});
});
app.get('/notifications', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({ helperId: req.user._id }).populate('jobId');

        res.render('notifications', { notifications, username: req.user.name });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading notifications');
    }
});
app.get('/user-info', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.json({ loggedIn: false });
    }

    try {
        const decoded = jwt.verify(token, "shhhh");
        res.json({
            loggedIn: true,
            role: decoded.role, // Helper or User
        });
    } catch (err) {
        res.json({ loggedIn: false });
    }
});
app.get('/jobs/edit/:jobId', authenticate, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);

        if (!job) {
            return res.status(404).send('Job not found');
        }

        // Check if the logged-in user is the one who posted the job
        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).send('You are not authorized to edit this job');
        }

        res.render('edit-job', { job });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading job details');
    }
});
app.post('/jobs/edit/:jobId', authenticate, async (req, res) => {
    const { jobId } = req.params;
    const { title, description } = req.body;

    try {
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).send('Job not found');
        }

        // Check if the logged-in user is the one who posted the job
        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).send('You are not authorized to edit this job');
        }

        // Update the job with the new details
        job.title = title || job.title;
        job.description = description || job.description;

        await job.save();

        res.redirect('/helper-dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating job');
    }
});
app.post('/jobs/delete/:id', async (req, res) => {
    const jobId = req.params.id;

    try {
        // Using async/await to delete the job
        const deletedJob = await Job.findByIdAndDelete(jobId);
        
        if (!deletedJob) {
            // If the job doesn't exist
            return res.status(404).send("Job not found");
        }

        // Redirect with success message
        res.redirect('/your-jobs?deleted=true');
    } catch (err) {
        // Handle any errors
        console.error(err);
        res.status(500).send("Error deleting job");
    }
});
app.post("/logout", (req, res) => {
    // Clear the token cookie
    res.clearCookie("token", { path: "/" }); // Clear the token cookie

    // Send a response to indicate logout
    res.json({ message: "Logged out successfully" });
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'login.html')); // Update path if needed
});
app.listen(3000, () => console.log('Server running on http://localhost:3000'));