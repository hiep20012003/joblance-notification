import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'dev'}` });

class Config {
  public NODE_ENV: string | undefined;
  public PORT: string | undefined;
  public LOG_LEVEL: string | undefined;
  public ENABLE_APM: string | undefined;
  public CLIENT_URL: string | undefined;
  public RABBITMQ_ENDPOINT: string | undefined;
  public SENDER_EMAIL: string | undefined;
  public SENDER_EMAIL_PASSWORD: string | undefined;

  constructor() {
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.PORT = process.env.PORT || '';
    this.LOG_LEVEL = process.env.LOG_LEVEL || '';
    this.ENABLE_APM = process.env.ENABLE_APM || '';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || '';
    this.SENDER_EMAIL = process.env.SENDER_EMAIL || '';
    this.SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD || '';
  }
}

export const config: Config = new Config();
