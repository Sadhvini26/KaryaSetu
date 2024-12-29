const mongoose = require('mongoose');
const JobSchema = new mongoose.Schema({
    title: String,
    description: String,
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hired: { type: Boolean, default: false },
    hiredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The user who hired
});
module.exports = mongoose.model('Job', JobSchema);