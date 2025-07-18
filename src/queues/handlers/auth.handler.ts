import { AuthEmailMessage, EmailPayload, EmailTemplateContext, EmailTemplate, ResetPasswordTemplateContext, VerifyEmailTemplateContext, WelcomeEmailTemplateContext } from '@hiep20012003/joblance-shared';
import { config } from '@notification/config';
import { EmailService } from '@notification/emails/email.service';

export async function handleAuthEmailMessage(payload: AuthEmailMessage): Promise<void> {
  const {
    to,
    username,
    verificationLink,
    resetLink,
    template
  } = payload;

  const baseContext = {
    appLink: config.CLIENT_URL as string,
    appIcon: config.APP_ICON as string
  };

  let subject: string;
  let context: EmailTemplateContext;

  switch (payload.template) {
    case EmailTemplate.VERIFY_EMAIL:
      context = {
        ...baseContext,
        username,
        verificationLink: verificationLink as string
      } satisfies VerifyEmailTemplateContext;
      subject = 'Verify your email address';
      break;

    case EmailTemplate.RESET_PASSWORD:
      context = {
        ...baseContext,
        username,
        resetLink: resetLink as string
      } satisfies ResetPasswordTemplateContext;
      subject = 'Reset your password';
      break;

    case EmailTemplate.WELCOME:
      context = {
        ...baseContext,
        username
      } satisfies WelcomeEmailTemplateContext;
      subject = 'Welcome to Joblance!';
      break;

    default:
      throw new Error(`Unsupported email template: ${template}`);
  }

  const emailPayload: EmailPayload = {
    to,
    subject,
    template,
    context
  };

  const emailService = new EmailService();
  await emailService.send(emailPayload);
}
