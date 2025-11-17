import { IEmailPayload, IEmailTemplateContext, EmailTemplate, IResetPasswordTemplateContext, IVerifyEmailTemplateContext, MessageQueueType, NotImplementedError, IAuthMessageQueue } from '@hiep20012003/joblance-shared';
import { config } from '@notifications/config';
import { EmailService } from '@notifications/emails/email.service';
import { v4 as uuidv4 } from 'uuid';

export async function handleAuthMessage<T extends Required<IAuthMessageQueue>>(payload: T): Promise<void> {
  const {
    type,
    email,
    username,
    verificationLink,
    resetLink,
    messageId
  } = payload;

  const baseContext = {
    appLink: config.CLIENT_URL,
    appIcon: config.APP_ICON
  };

  let subject: string;
  let context: IEmailTemplateContext;
  let template: EmailTemplate;


  switch (type) {
    case MessageQueueType.USER_CREATED:
      template = EmailTemplate.VERIFY_EMAIL;
      context = {
        ...baseContext,
        username,
        verificationLink: verificationLink
      } satisfies IVerifyEmailTemplateContext;
      subject = 'Verify your email address';
      break;

    case MessageQueueType.USER_PASSWORD_RESET_REQUESTED:
      template = EmailTemplate.FORGOT_PASSWORD;
      context = {
        ...baseContext,
        username,
        resetLink: resetLink
      } satisfies IResetPasswordTemplateContext;
      subject = 'Reset your password';
      break;
    case MessageQueueType.USER_RESEND_VERIFICATION_EMAIL_REQUESTED:
      template = EmailTemplate.VERIFY_EMAIL;
      context = {
        ...baseContext,
        username,
        verificationLink,
      };
      subject = 'Resend email verification';
      break;

    default:
      throw new NotImplementedError({
        clientMessage: `Message type '${type}' not implemented`,
        logMessage: `Unrecognized MessageQueueType: ${type}`,
        operation: 'consumer:handle-email-error'
      });
  }

  const emailPayload: IEmailPayload = {
    to: email,
    messageId: messageId ?? uuidv4(),
    subject,
    template,
    context
  };

  const emailService = new EmailService();
  await emailService.send(emailPayload);
}
