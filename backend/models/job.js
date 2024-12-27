

// const mongoose = require('mongoose');

// const jobSchema = new mongoose.Schema({
//     title: { type: String, required: true },
//     description: { type: String, required: true },
//     postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     hired: { type: Boolean, default: false },
//     hiredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
// }, { timestamps: true });

// module.exports = mongoose.model('Job', jobSchema);

const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: String,
    description: String,
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hired: { type: Boolean, default: false },
    hiredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The user who hired
});

module.exports = mongoose.model('Job', JobSchema);

