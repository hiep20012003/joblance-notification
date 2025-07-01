import { IBaseEmailLocals } from '@hiep20012003/joblance-shared';
import { emailTemplates } from '@notifications/helpers';
import { logger } from '@notifications/app'; // Use the new logger

async function sendEmail(template: string, receiverEmail: string, locals: IBaseEmailLocals): Promise<void> {
  try {
    // email teamplates
    await emailTemplates(template, receiverEmail, locals);
    logger.info('Email sent successfully.');
  } catch (error) {
    logger.error('Error occurred in NotificationService MailTransport sendEmail() method:', error);
  }
}

export { sendEmail };
