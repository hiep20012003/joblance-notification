import express, {Router} from 'express';
import {notificationsController} from '@notifications/controllers/notifications.controller';
import {
  handleAsyncError,
} from '@hiep20012003/joblance-shared';

class NotificationsRoutes {
  private readonly router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/notifications',
      handleAsyncError(notificationsController.getNotifications));

    this.router.post(
      '/notifications/:notificationId/read',
      handleAsyncError(notificationsController.markNotificationAsRead)
    );
    return this.router;
  }
}

export const notificationsRoutes: NotificationsRoutes = new NotificationsRoutes();
