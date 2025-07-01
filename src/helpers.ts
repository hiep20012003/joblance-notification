import path from 'path';

import { IBaseEmailLocals } from '@hiep20012003/joblance-shared';
import { config } from '@notifications/config';
import { logger } from '@notifications/app';
import Email from 'email-templates';
import nodemailer, { Transporter } from 'nodemailer';

async function emailTemplates(template: string, receiver: string, locals: IBaseEmailLocals): Promise<void> {
  try {
    const smtpTransporter: Transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.SENDER_EMAIL,
        pass: config.SENDER_EMAIL_PASSWORD
      }
    });
    const email: Email = new Email({
      message: {
        from: `Joblance App <${config.SENDER_EMAIL}>`
      },
      send: true,
      preview: false,
      transport: smtpTransporter,
      views: {
        options: {
          extension: 'ejs'
        }
      },
      juice: true,
      juiceResources: {
        preserveImportant: true,
        webResources: {
          relativeTo: path.join(__dirname, '../build')
        }
      }
    });

    await email.send({
      template: path.join(__dirname, '..', 'src/emails', template),
      message: { to: receiver },
      locals
    });
  } catch (error) {
    logger.error('Error occurred in NotificationService emailTemplates() method:', error);
    console.log('Error details:', error);
  }
}

export { emailTemplates };
