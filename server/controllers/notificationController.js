import Notification from '../models/Notification.js';
import Poll from '../models/Poll.js';

// Get unread notifications for the authenticated user
export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(notifications);
  } catch (error) {
    return next(error);
  }
}

// Mark a notification as read
export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const notif = await Notification.findOne({ _id: id, user: userId });
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notif.read = true;
    await notif.save();
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    return next(error);
  }
}

// Mark all as read (optional helper)
export async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return next(error);
  }
}
