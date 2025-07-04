import { IBaseEmailLocals, ServerError } from '@hiep20012003/joblance-shared';
import { emailTemplates } from '@notifications/helpers';
import { logger } from '@notifications/app'; // Use the new logger

async function sendEmail(template: string, receiverEmail: string, locals: IBaseEmailLocals): Promise<void> {
  try {
    // email templates
    await emailTemplates(template, receiverEmail, locals);
    logger.info('Email sent successfully.');
  } catch (error) {
    throw new ServerError(
      error instanceof Error ? error.message : 'Failed to send email',
      'sendEmail()',
      'SEND_EMAIL_ERROR'
    );
  }
}

export { sendEmail };
