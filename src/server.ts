import http from 'http';

import {AppLogger} from '@notifications/utils/logger';
import {Application, json, NextFunction, urlencoded, Request, Response} from 'express';
import {
  ApplicationError,
  ErrorResponse,
  NotFoundError,
  ResponseOptions,
  ServerError
} from '@hiep20012003/joblance-shared';
import hpp from 'hpp';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import {config} from '@notifications/config';
import {appRoutes} from '@notifications/routes';
import {initQueue} from '@notifications/queues/connection';
import {database} from '@notifications/database/connection';
import {ejsRenderRoutes} from '@notifications/utils/helper';
import {Server} from 'socket.io';

const SERVER_PORT = config.PORT || 4001;

export class NotificationServer {
  private readonly app: Application;
  private static socketIO: Server;

  constructor(app: Application) {
    this.app = app;
  }

  public static getSocketIO() {
    if (!this.socketIO) {
      throw new ServerError({
        clientMessage: 'Socket.IO not initialized',
        operation: 'sockets:connection'
      });
    }
    return this.socketIO;
  }

  async start(): Promise<void> {

    await database.connect();
    await this.startQueues();
    this.startRedis();
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.errorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.set('trust proxy', 1);
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.API_GATEWAY_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }

  private standardMiddleware(app: Application): void {
    app.set('view engine', 'ejs');
    app.use(compression());
    app.use(json());
    app.use(urlencoded({extended: true, limit: '200mb'}));
  }

  private routesMiddleware(app: Application): void {
    appRoutes(app);
    app.use('', ejsRenderRoutes());
  }

  private startRedis() {
    // cacheStore.connect();
  }

  private async startQueues(): Promise<void> {
    await initQueue();
  }

  private errorHandler(app: Application): void {
    app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
      const operation = 'server:handle-error';

      AppLogger.error(
        `API ${req.originalUrl} unexpected error`,
        {
          operation,
          error: err instanceof ApplicationError ? err.serialize() : {
            name: (err as Error).name,
            message: (err as Error).message,
            stack: (err as Error).stack,
          }
        }
      );

      if (err instanceof ApplicationError) {
        new ErrorResponse({
          ...err.serializeForClient() as ResponseOptions,

        }).send(res, true);
      } else {
        const serverError = new ServerError({
          clientMessage: 'Internal server error',
          cause: err,
          operation
        });
        new ErrorResponse({
          ...serverError.serializeForClient() as ResponseOptions
        }).send(res, true);
      }
    });

    app.use('/*splat', (req: Request, res: Response, _next: NextFunction) => {
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const operation = 'server:route-not-found';

      const err = new NotFoundError({
        clientMessage: `Endpoint not found: ${fullUrl}`,
        operation
      });

      AppLogger.error(
        `API ${req.originalUrl} route not found`,
        {
          operation,
          error: !(err instanceof ApplicationError) ? {
            name: (err as Error).name,
            message: (err as Error).message,
            stack: (err as Error).stack,
          } : err.serialize()
        }
      );
      new ErrorResponse({
        ...err.serializeForClient() as ResponseOptions
      }).send(res, true);
    });
  }

  private startServer(app: Application): void {
    try {
      const httpServer: http.Server = new http.Server(app);
      this.startHttpServer(httpServer);
    } catch (error) {
      throw new ServerError({
        logMessage: 'Failed to start Notification server',
        cause: error,
        operation: 'server:error'
      });
    }
  }

  private startHttpServer(httpServer: http.Server): void {
    try {
      AppLogger.info(`Notification server started with process id ${process.pid}`, {operation: 'server:http-start'});
      httpServer.listen(SERVER_PORT, () => {
        AppLogger.info(`Notification server is running on port ${SERVER_PORT}`, {operation: 'server:http-listening'});
      });
      this.createSocketIO(httpServer);
    } catch (error) {
      throw new ServerError({
        logMessage: 'Failed to bind HTTP port',
        cause: error,
        operation: 'server:bind-error'
      });
    }
  }

  private createSocketIO(httpServer: http.Server): void {
    NotificationServer.socketIO = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });

    const notificationNsp = NotificationServer.socketIO.of('/notifications');

    notificationNsp.on('connection', (socket) => {
      AppLogger.info(`New socket connected: ${socket.id}`, {operation: 'sockets:connection'});

      socket.on('join', async (userId: string) => {
        await socket.join(`user:${userId}`);
        console.log(`User ${userId} joined room user:${userId}`);
      });

      socket.on('disconnect', () => {
        AppLogger.info(`Socket disconnected: ${socket.id}`, {operation: 'sockets:disconnect'});
      });
    });
  }
}
