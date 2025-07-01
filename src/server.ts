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
    this.startQueue();
    this.startServer(this.app);
  }

  async startQueue(): Promise<void> {
    const emailChannel: Channel = (await createConnection()) as Channel;
    await consumeAuthEmailMessages(emailChannel);
    await consumeOrderEmailMessages(emailChannel);

    // const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=123425afadsfasdf`;
    // const messageDetails: IAuthEmailMessageDetails = {
    //   receiverEmail: `nguyendunghiep20012003@gmail.com`,
    //   verifyLink: verificationLink,
    //   template: 'verifyEmail'
    // };

    // // Use more descriptive and consistent exchange and queue names
    // await emailChannel.assertExchange('jbl.auth.notification', 'direct');
    // await emailChannel.assertExchange('jbl.order.notification', 'direct');
    // const message = JSON.stringify(messageDetails);
    // emailChannel.publish('jbl.auth.notification', 'auth.email', Buffer.from(message));
  }

   startServer(app: Application): void {
    try {
      const httpServer: http.Server = new http.Server(app);
      logger.info(`Worker process with PID ${process.pid} has started on Notification Service.`);
      httpServer.listen(SERVER_PORT, () => {
        logger.info(`Notification Service is running on port ${SERVER_PORT}.`);
      });
    } catch (error) {
      logger.error('Error occurred in NotificationService startServer() method', error);
    }
  }
}

export default NotifiactionServer;
