const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    message: String,
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    helperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }, 
});

module.exports = mongoose.model('Notification', NotificationSchema);
