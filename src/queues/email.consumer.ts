import {
  IAuthEmailLocals,
  IOrderEmailLocals,
  IOrderUpdateEmailLocals,
  IPromotionEmailLocals,
} from '@hiep20012003/joblance-shared';
import { config } from '@notifications/config';
import { Channel, ConsumeMessage } from 'amqplib';
import { createConnection } from '@notifications/queues/connection';
import { sendEmail } from '@notifications/queues/mail.transport';
import { logger } from '@notifications/app';

async function consumeAuthEmailMessages(channel: Channel): Promise<void> {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'jbl.auth.notification';
    const routingKey = 'auth.email';
    const queueName = 'auth.email.queue';

    await channel.assertExchange(exchangeName, 'direct');

    const joblanceQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(joblanceQueue.queue, exchangeName, routingKey);

    channel.consume(joblanceQueue.queue, async (msg: ConsumeMessage | null) => {
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
    });
  } catch (error) {
    logger.error('Error occurred in NotificationService consumeAuthEmailMessages() method:', error);
  }
}

async function consumeOrderEmailMessages(channel: Channel): Promise<void> {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'jbl.order.notification';
    const routingKey = 'order.email';
    const queueName = 'order.email.queue';

    await channel.assertExchange(exchangeName, 'direct');

    const joblanceQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(joblanceQueue.queue, exchangeName, routingKey);

    channel.consume(joblanceQueue.queue, async (msg: ConsumeMessage | null) => {
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
    });
  } catch (error) {
    logger.error('Error occurred in NotificationService consumeOrderEmailMessages() method:', error);
  }
}

export { consumeAuthEmailMessages, consumeOrderEmailMessages };
