import http from 'http';

import 'express-async-errors';
// import { IAuthEmailMessageDetails } from '@hiep20012003/joblance-shared';
import { logger } from '@notifications/app';
import { Application } from 'express';
import { ejsRenderRoutes, healthRoutes } from '@notifications/routes';
import { createConnection } from '@notifications/queues/connection';
import { Channel } from 'amqplib';
import { consumeAuthEmailMessages, consumeOrderEmailMessages } from '@notifications/queues/email.consumer';
import { config } from '@notifications/config';
import { DependencyError, errorHandler, IAuthEmailMessageDetails, ServerError } from '@hiep20012003/joblance-shared';

const SERVER_PORT = config.PORT || 4001;

class NotifiactionServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.app.set('view engine', 'ejs');
    this.app.use('', healthRoutes());
    this.app.use('', ejsRenderRoutes());
    this.app.use(errorHandler(logger));
    this.startQueue();
    this.startServer(this.app);
  }

  async startQueue(): Promise<void> {
    const emailChannel: Channel = (await createConnection()) as Channel;
    await consumeAuthEmailMessages(emailChannel);
    await consumeOrderEmailMessages(emailChannel);

    const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=123425afadsfasdf`;
    const messageDetails: IAuthEmailMessageDetails = {
      receiverEmail: `nguyendunghiep20012003@gmail.com`,
      verifyLink: verificationLink,
      template: 'verifyEmail'
    };

    // Use more descriptive and consistent exchange and queue names
    await emailChannel.assertExchange('jbl.auth.notification', 'direct');
    await emailChannel.assertExchange('jbl.order.notification', 'direct');
    const message = JSON.stringify(messageDetails);
    emailChannel.publish('jbl.auth.notification', 'auth.email', Buffer.from(message));
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      await this.startHttpServer(httpServer);
    } catch (error) {
      const err = new ServerError(
        'Failed to start NotificationsService server',
        'NotificationsService.startServer',
        'SERVER_START_FAILURE'
      );
      logger.error(err);
    }
  }

  private async startHttpServer(httpServer: http.Server): Promise<void> {
    try {
      logger.info(`Notifications server started with process id ${process.pid}`);
      httpServer.listen(SERVER_PORT, () => {
        logger.info(`Gateway server is running on port ${SERVER_PORT}`);
      });
    } catch (error) {
      const err = new DependencyError(
        'Failed to bind HTTP port',
        'NotificationsService.startHttpServer',
        'PORT_BIND_FAILURE'
      );
      logger.error(err);
    }
  }

}

export default NotifiactionServer;
