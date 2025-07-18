import path from 'path';

import { config } from '@notification/config';
import Email from 'email-templates';
import nodemailer, { Transporter } from 'nodemailer';
import { DependencyError, EmailPayload } from '@hiep20012003/joblance-shared';
import { AppLogger } from '@notification/utils/logger';

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.SENDER_EMAIL as string,
        pass: config.SENDER_EMAIL_PASSWORD as string,
      },
    });
  }

  async send(payload: EmailPayload): Promise<void> {
    const operation = 'email-send';

    AppLogger.info(
      `Start sending email to "${payload.to}" using template "${payload.template}".`,
      { operation }
    );

    try {
      const email = new Email({
        message: { from: `Joblance <${config.SENDER_EMAIL}>` },
        send: true,
        preview: false,
        transport: this.transporter,
        views: { options: { extension: 'ejs' } },
        juice: true,
        juiceResources: {
          preserveImportant: true,
          webResources: { relativeTo: path.join(__dirname, '../../build') },
        },
      });

      await email.send({
        template: path.join(__dirname, 'templates', payload.template),
        message: { to: payload.to },
        locals: payload.context,
      });

      AppLogger.info(
        `Email sent successfully to "${payload.to}" using template "${payload.template}".`,
        { operation }
      );
    } catch (error) {
      const dependencyError = new DependencyError({
        clientMessage: `Failed to send email`,
        logMessage: `Failed to send email to "${payload.to}" using template "${payload.template}".`,
        operation,
        cause: error as Error
      });
      throw dependencyError;
    }
  }
}
