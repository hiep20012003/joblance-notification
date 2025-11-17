import path from 'path';

import { config } from '@notifications/config';
import Email from 'email-templates';
import nodemailer, { Transporter } from 'nodemailer';
import { DependencyError, IEmailPayload } from '@hiep20012003/joblance-shared';
import { AppLogger } from '@notifications/utils/logger';
import { EmailLogModel } from '@notifications/database/models/email.model';

export class EmailService {
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.SENDER_EMAIL,
        pass: config.SENDER_EMAIL_PASSWORD,
      },
    });
  }

  async send(payload: IEmailPayload): Promise<void> {
    const operation = 'email:send';

    AppLogger.info(
      `Start sending email to "${payload.to}" using template "${payload.template}".`,
      { operation }
    );

    const log = await EmailLogModel.create({
      messageId: payload.messageId,
      email: payload.to,
      subject: payload.template,
      payload,
      status: 'pending',
    });

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
        template: path.join(__dirname, 'templates', payload.template.toLowerCase()),
        message: { to: payload.to },
        locals: payload.context,
      });

      await EmailLogModel.findByIdAndUpdate(log._id, {
        status: 'sent',
        updatedAt: new Date(),
      });

      AppLogger.info(
        `Email sent successfully to "${payload.to}" using template "${payload.template}".`,
        { operation }
      );
    } catch (error) {
      await EmailLogModel.findByIdAndUpdate(log._id, {
        status: 'failed',
        error: (error as Error).message,
        updatedAt: new Date(),
      });

      const dependencyError = new DependencyError({
        clientMessage: `Failed to send email`,
        logMessage: `Failed to send email to "${payload.to}" using template "${payload.template}".`,
        operation: 'email:send-error',
        cause: error as Error,
      });

      AppLogger.error(dependencyError.message, {
        operation: 'email:send-error',
        error: dependencyError,
      });

      throw dependencyError;
    }
  }
}
