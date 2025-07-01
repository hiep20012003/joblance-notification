import { createLogger } from '@hiep20012003/joblance-shared';
import express, { Express } from 'express';
import NotifiactionServer from '@notifications/server';

export const logger = createLogger('NotificationsService');

class Application {
  private app: Express;
  private server: NotifiactionServer;

  constructor() {
    this.app = express();
    this.server = new NotifiactionServer(this.app);
  }

  public initialize(): void {
    this.server.start();
    logger.info('Notification Service initialized.');
  }
}

const application: Application = new Application();
application.initialize();
