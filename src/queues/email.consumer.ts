import {
  IAuthEmailLocals,
  IOrderEmailLocals,
  IOrderUpdateEmailLocals,
  IPromotionEmailLocals,
  ServerError,
  TooManyRetriesError,
} from '@hiep20012003/joblance-shared';
import { config } from '@notifications/config';
import { Channel, ConsumeMessage } from 'amqplib';
import { createConnection } from '@notifications/queues/connection';
import { sendEmail } from '@notifications/queues/mail.transport';
import { logger } from '@notifications/app';
import { setupRetryQueue } from '@notifications/helpers';

async function consumeAuthEmailMessages(channel: Channel): Promise<void> {
  if (!channel) {
    channel = (await createConnection()) as Channel;
  }
  const exchangeName = 'jbl.auth.notification';
  const routingKey = 'auth.email';
  const queueName = 'auth.email';

  try {
    await setupRetryQueue(channel, queueName, routingKey, exchangeName);
  } catch (error) {
    throw new ServerError(
      error instanceof Error ? error.message : 'Failed to assert auth email exchange and queue',
      'consumeAuthEmailMessages()',
      'AUTH_EMAIL_QUEUE_ERROR'
    );
  }

  channel.consume(`${queueName}.queue`, async (msg: ConsumeMessage | null) => {
    if (!msg) { return; }
    try {
      const { receiverEmail, username, verifyLink, resetLink, template } = JSON.parse(msg!.content.toString());
      const locals: IAuthEmailLocals = {
        appLink: `${config.CLIENT_URL}`,
        appIcon: 'https://i.ibb.co/sd220v6h/joblance-logo.png',
        username,
        verifyLink,
        resetLink
      };
      await sendEmail(template, receiverEmail, locals);
      channel.ack(msg!);
    } catch (error) {
      const content = msg.content.toString();
      const headers = msg.properties.headers ?? {};
      const deaths = headers['x-death'] as any[] | undefined;
      const retryCount = deaths?.[0]?.count || 0;

      if (retryCount >= 3) {
        const error = new TooManyRetriesError(
          'Email message failed after 3 retries',
          'consumeAuthEmailMessages()'
        );

        logger.error(error, {
          originalMessage: msg?.content.toString(),
        });

        channel.publish(`${exchangeName}.dead`, `${routingKey}.dead`, Buffer.from(content),
          { headers });
        channel.ack(msg);
      } else {
        logger.warn(`Retry ${retryCount + 1} for message`, { content: msg.content.toString() });
        channel.nack(msg, false, false);
      }
    }
  });
}

async function consumeOrderEmailMessages(channel: Channel): Promise<void> {
  if (!channel) {
    channel = (await createConnection()) as Channel;
  }
  const exchangeName = 'jbl.order.notification';
  const routingKey = 'order.email';
  const queueName = 'order.email';

  try {
    await setupRetryQueue(channel, queueName, routingKey, exchangeName);
  } catch (error) {
    throw new ServerError(
      error instanceof Error ? error.message : 'Failed to assert order email exchange and queue',
      'consumeOrderEmailMessages()',
      'ORDER_EMAIL_QUEUE_ERROR'
    );
  }

  channel.consume(`${queueName}.queue`, async (msg: ConsumeMessage | null) => {
    if (!msg) { return; }
    try {
      const {
        receiverEmail,
        offerLink,
        price,
        buyerUsername,
        sellerUsername,
        title,
        description,
        deliveryDays,
        orderId,
        orderDue,
        requirements,
        orderUrl,
        originalDate,
        newDate,
        reason,
        type,
        message,
        serviceFee,
        totalPrice,
        template
      } = JSON.parse(msg!.content.toString());

      const locals: IOrderEmailLocals | IOrderUpdateEmailLocals | IPromotionEmailLocals = {
        appLink: `${config.CLIENT_URL}`,
        appIcon: 'https://i.ibb.co/sd220v6h/joblance-logo.png',
        offerLink,
        price,
        buyerUsername,
        sellerUsername,
        title,
        description,
        deliveryDays,
        orderId,
        orderDue,
        requirements,
        orderUrl,
        originalDate,
        newDate,
        reason,
        type,
        message,
        serviceFee,
        totalPrice
      };
      await sendEmail(template, receiverEmail, locals);
      channel.ack(msg!);
    } catch (error) {
      const content = msg.content.toString();
      const headers = msg.properties.headers ?? {};
      const deaths = headers['x-death'] as any[] | undefined;
      const retryCount = deaths?.[0]?.count || 0;

      if (retryCount >= 3) {
        const error = new TooManyRetriesError(
          'Email message failed after 3 retries',
          'consumeOrderEmailMessages()'
        );

        logger.error(error, {
          originalMessage: msg?.content.toString(),
        });

        channel.publish(`${exchangeName}.dead`, `${routingKey}.dead`, Buffer.from(content),
          { headers });
        channel.ack(msg);
      } else {
        logger.warn(`Retry ${retryCount + 1} for message`, { content: msg.content.toString() });
        channel.nack(msg, false, false);
      }
    }
  });
}

export { consumeAuthEmailMessages, consumeOrderEmailMessages };
