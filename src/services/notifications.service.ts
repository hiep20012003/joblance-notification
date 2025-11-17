import {INotificationDocument} from '@hiep20012003/joblance-shared';
import {AppLogger} from '@notifications/utils/logger';
import {NotificationModel} from '@notifications/database/models/notification.model';

export class NotificationsService {
  createNotification = async (payload: INotificationDocument): Promise<INotificationDocument> => {

    const notification = await NotificationModel.create(payload);

    AppLogger.info('Notification created successfully.', {
      operation: 'notification:create',
      context: {recipientId: payload.recipient.id, actorId: payload.actor.id, type: payload.type},
    });
    return notification;
  };

  getNotifications = async (payload: Record<string, string>): Promise<INotificationDocument[]> => {
    const {userId, page = '1', limit = '20'} = payload;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Lấy danh sách thông báo với aggregate
    const notifications = await NotificationModel.aggregate<INotificationDocument>([
      {$match: {'recipient.id': userId}},
      {$sort: {timestamp: -1}},
      {$skip: skip},
      {$limit: limitNum},
    ]);

    // Đánh dấu delivered cho các thông báo chưa gửi
    const undeliveredIds = notifications
      .filter((n) => !n.delivered)
      .map((n) => n._id);

    if (undeliveredIds.length) {
      await NotificationModel.updateMany(
        {_id: {$in: undeliveredIds}},
        {$set: {delivered: true}}
      );
    }

    return notifications;
  };


  markNotificationAsRead = async (notificationId: string): Promise<INotificationDocument | null> => {

    const notification = await NotificationModel.findByIdAndUpdate(notificationId, {read: true}, {new: true}).lean();

    if (notification) {
      AppLogger.info('Notification update successfully.', {
        operation: 'notification:mark-read',
        context: {recipientId: notification.recipient.id, actorId: notification.actor.id, type: notification.type},
      });
    }

    return notification;
  };
}

export const notificationsService = new NotificationsService();
