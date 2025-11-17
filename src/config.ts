import path from 'path';

import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
});

class Config {
  // Application
  public NODE_ENV: string = process.env.NODE_ENV || 'development';
  public PORT: number = parseInt(process.env.PORT || '4001', 10);
  public CLIENT_URL: string = process.env.CLIENT_URL || 'http://localhost:3000';
  public APP_ICON: string = process.env.APP_ICON || '';


  public API_GATEWAY_URL: string = process.env.API_GATEWAY_URL || '';

  // Messaging / RabbitMQ
  public RABBITMQ_URL: string =
    process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

  public DATABASE_URL: string =
    process.env.DATABASE_URL || 'amqp://guest:guest@localhost:5672';

  public REDIS_URL: string =
    process.env.REDIS_URL || 'amqp://guest:guest@localhost:5672';

  // Gateway secret for internal JWT
  public GATEWAY_SECRET_KEY: string = process.env.GATEWAY_SECRET_KEY || '';

  // Email sender
  public SENDER_EMAIL: string = process.env.SENDER_EMAIL || '';
  public SENDER_EMAIL_PASSWORD: string = process.env.SENDER_EMAIL_PASSWORD || '';

  // APM
  public ENABLE_APM: boolean = process.env.ENABLE_APM === '1';
  public ELASTIC_APM_SERVER_URL: string = process.env.ELASTIC_APM_SERVER_URL || '';
  public ELASTIC_APM_SECRET_TOKEN: string = process.env.ELASTIC_APM_SECRET_TOKEN || '';
}

export const config = new Config();
