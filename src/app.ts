import express, { Express } from 'express';
import { NotificationServer } from '@notification/server';
import { AppLogger } from '@notification/utils/logger';
class Application {
  private app: Express;
  private server: NotificationServer;

  constructor() {
    this.app = express();
    this.server = new NotificationServer(this.app);
  }

  public async initialize(): Promise<void> {
    const operation = 'notification-service-init';

    try {
      await this.server.start();
      AppLogger.info('Notification Service initialized', { operation });
    } catch (error) {
      AppLogger.error('', { operation, error });
      process.exit(1);
    }
  }
}

async function bootstrap(): Promise<void> {
  const application = new Application();
  await application.initialize();
}

// ---- Global error handlers ---- //
process.on('uncaughtException', (error) => {
  AppLogger.error('', { operation: 'notification-service-uncaught-exception', error });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  AppLogger.error('', { operation: 'notification-service-unhandled-rejection', error: reason });
  process.exit(1);
});

// ---- App Entry Point ---- //
bootstrap().catch((error) => {
  AppLogger.error('', { operation: 'notification-service-bootstrap-failed', error });
  process.exit(1);
});
