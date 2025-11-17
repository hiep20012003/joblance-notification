import {Application} from 'express';
import {createVerifyGatewayRequest} from '@hiep20012003/joblance-shared';
import {config} from '@notifications/config';
import {notificationsRoutes} from '@notifications/routes/notifications.route';

import {healthRoutes} from './health.route';

const BASE_PATH = '/api/v1';

export const appRoutes = (app: Application) => {
  app.use('', healthRoutes.routes());
  app.use(BASE_PATH, createVerifyGatewayRequest(`${config.GATEWAY_SECRET_KEY}`), notificationsRoutes.routes());
};
