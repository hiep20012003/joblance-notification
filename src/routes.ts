import path from 'path';

import express, { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const router: Router = express.Router();

export function healthRoutes(): Router {
  router.get('/notification-health', (_req: Request, res: Response): void => {
    res.status(StatusCodes.OK).send('Notification Service is healthy and operational.');
  });
  return router;
}

export function ejsRenderRoutes(): Router {
  router.get('/ejs', (_req: Request, res: Response): void => {
    res.render(path.join(__dirname, 'emails/verifyEmail/html.ejs'), {
      appLink: 'http://localhost:4001',
      appIcon: 'https://i.ibb.co/Kj4sgz6H/joblacne-logo.png',
      verifyLink: 'http://localhost:5601'
    });
  });
  return router;
}
