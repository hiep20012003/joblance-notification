import path from 'path';

import express, { Router, Request, Response } from 'express';

export function ejsRenderRoutes(): Router {
  const router: Router = express.Router();
  router.get('/ejs', (_req: Request, res: Response): void => {
    res.render(path.join(__dirname, 'emails/verifyEmail/html.ejs'), {
      appLink: 'http://localhost:3000',
      appIcon: 'https://i.ibb.co/Kj4sgz6H/joblacne-logo.png',
      verifyLink: 'http://localhost:5601'
    });
  });
  return router;
}
