import http from 'http';

import { AppLogger } from '@notification/utils/logger';
import { Application } from 'express';
import { ejsRenderRoutes, healthRoutes } from '@notification/routes';
import { createConnection } from '@notification/queues/connection';
import { Channel } from 'amqplib';
import { config } from '@notification/config';
import { ServerError } from '@hiep20012003/joblance-shared';
import { consumeAuthEmails } from '@notification/queues/consumers/auth.consumer';

const SERVER_PORT = config.PORT || 4001;

export class NotificationServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  async start(): Promise<void> {
    const operation = 'notification-server-start';

    this.app.set('view engine', 'ejs');
    this.app.use('', healthRoutes());
    this.app.use('', ejsRenderRoutes());

    await this.startQueue();
    this.startServer(this.app, operation);
  }

  private async startQueue(): Promise<void> {
    const operation = 'notification-queue-start';
    const emailChannel: Channel = (await createConnection()) as Channel;

    await Promise.all([
      consumeAuthEmails(emailChannel)
    ]);

    AppLogger.info('Notification queue consumers started', { operation });
  }

  private startServer(app: Application, operation: string): void {
    try {
      const httpServer: http.Server = new http.Server(app);
      this.startHttpServer(httpServer, operation);
    } catch (error) {
      throw new ServerError({
        logMessage: 'Failed to start Notification server',
        cause: error,
        operation: 'notification-server-error'
      });
    }
  }

  private startHttpServer(httpServer: http.Server, operation: string): void {
    try {
      AppLogger.info(`Notification server started with process id ${process.pid}`, { operation });

      httpServer.listen(SERVER_PORT, () => {
        AppLogger.info(`Notification server is running on port ${SERVER_PORT}`, { operation });
      });
    } catch (error) {
      throw new ServerError({
        logMessage: 'Failed to bind HTTP port',
        cause: error,
        operation: 'notification-server-bind-error'
      });
    }
  }
}
