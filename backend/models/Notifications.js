const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    message: String,
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    helperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Helper receiving notification
    isRead: { type: Boolean, default: false },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }, // Timestamp for the notification
});

module.exports = mongoose.model('Notification', NotificationSchema);
