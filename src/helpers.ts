import path from 'path';

import { DependencyError, IBaseEmailLocals } from '@hiep20012003/joblance-shared';
import { config } from '@notifications/config';
import Email from 'email-templates';
import nodemailer, { Transporter } from 'nodemailer';
import { Channel } from 'amqplib';
import { logger } from '@notifications/app';

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
    throw new DependencyError(
      'Failed to send email',
      'EmailService',
      'EMAIL_SEND_FAILURE'
    );
  }
}

async function setupRetryQueue(
  channel: Channel,
  baseQueueName: string,
  routingKey: string,
  mainExchange: string,
) {
  const baseQueue = `${baseQueueName}.queue`;
  const retryQueue = `${baseQueueName}.retry.queue`;
  const deadQueue = `${baseQueueName}.dead.queue`;
  
  const retryRoutingKey = `${routingKey}.retry`;
  const deadRoutingKey = `${routingKey}.dead`;
  
  const retryExchange = `${mainExchange}.retry`;
  const deadExchange = `${mainExchange}.dead`;
  
  // for (const queue of [baseQueue, retryQueue, deadQueue]) {
  //   try {
  //     await channel.deleteQueue(queue, { ifUnused: false, ifEmpty: false });
  //     logger.info(`Deleted old queue: ${queue}`);
  //   } catch (err) {
  //     logger.warn(`Queue ${queue} may not exist, skip deletion`);
  //   }
  // }
  
  await channel.assertExchange(mainExchange, 'direct', { durable: true });
  await channel.assertExchange(retryExchange, 'direct', { durable: true });
  await channel.assertExchange(deadExchange, 'direct', { durable: true });
  
  // Main queue
  await channel.assertQueue(baseQueue, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': retryExchange,
      'x-dead-letter-routing-key': retryRoutingKey
    }
  });
  
  // Retry queue
  await channel.assertQueue(retryQueue, {
    durable: true,
    arguments: {
      'x-message-ttl': 10000, // 10s delay
      'x-dead-letter-exchange': mainExchange,
      'x-dead-letter-routing-key': routingKey
    }
  });
  
  await channel.assertQueue(deadQueue, { durable: true });

  await channel.bindQueue(baseQueue, mainExchange, routingKey);
  await channel.bindQueue(retryQueue, retryExchange, retryRoutingKey);
  await channel.bindQueue(deadQueue, deadExchange, deadRoutingKey);

  logger.info(`Retry queue setup complete for ${baseQueueName}`);
}

export { emailTemplates, setupRetryQueue };
