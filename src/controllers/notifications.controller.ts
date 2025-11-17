import {Request, Response} from 'express';
import {StatusCodes, ReasonPhrases} from 'http-status-codes';
import {SuccessResponse} from '@hiep20012003/joblance-shared';
import {notificationsService} from '@notifications/services/notifications.service';

class NotificationsController {
  constructor() {
  }

  getNotifications = async (req: Request, res: Response): Promise<void> => {
    const notifications = await notificationsService.getNotifications(req.query as Record<string, string>);

    new SuccessResponse({
      message: 'Get notifications successfully',
      statusCode: StatusCodes.OK,
      reasonPhrase: ReasonPhrases.OK,
      data: notifications
    }).send(res);
  };

  markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
    const notification = await notificationsService.markNotificationAsRead(req.params.notificationId);

    new SuccessResponse({
      message: 'Mark notification read successfully',
      statusCode: StatusCodes.OK,
      reasonPhrase: ReasonPhrases.OK,
      data: notification
    }).send(res);
  };
}

export const notificationsController: NotificationsController = new NotificationsController();
