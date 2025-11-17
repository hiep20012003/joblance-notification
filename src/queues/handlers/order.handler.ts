import {
  EmailTemplate,
  IEmailPayload,
  IEmailTemplateContext,
  INotificationDocument,
  IOrderMessageQueue,
  MessageQueueType,
  NotificationType
} from '@hiep20012003/joblance-shared';
import {config} from '@notifications/config';
import {EmailService} from '@notifications/emails/email.service';
import {notificationsService} from '@notifications/services/notifications.service';
import {NotificationServer} from '@notifications/server';
import {v4 as uuidv4} from 'uuid';
import {NotificationModel} from '@notifications/database/models/notification.model';
import {AppLogger} from '@notifications/utils/logger';

export async function handleOrderMessage<T extends Required<IOrderMessageQueue>>(payload: T): Promise<void> {
  const {
    type,
    notification,
    buyerEmail,
    sellerEmail,
    orderId,
    sellerUsername,
    buyerUsername,
    title,
    description,
    expectedDeliveryDate,
    quantity,
    price,
    serviceFee,
    totalAmount,
    orderUrl,
    originalDate,
    newDate,
    expectedDeliveryDays,
    reason,
    messageId

  } = payload;

  console.log(type);

  if (notification) {
    const existing = await NotificationModel.findById(notification._id).lean();

    if (!existing) {
      const doc: INotificationDocument = {
        ...notification,
        type: NotificationType.ORDER,
        delivered: false,
      };

      const newNotification = await notificationsService.createNotification(doc);

      NotificationServer.getSocketIO()
        .of('/notifications')
        .emit('notification:new', newNotification.recipient.id, newNotification);
    } else {
      // Nếu cần debug:
      // console.log(`[SKIP] Duplicate notification for recipient ${notification.recipient.id} on order ${orderId}`);
    }
  }

  const baseContext = {
    appLink: config.CLIENT_URL,
    appIcon: config.APP_ICON
  };

  let context: IEmailTemplateContext;

  const emailPayloads: IEmailPayload[] = [];

  switch (type) {
    case MessageQueueType.ORDER_STARTED:
      context = {
        ...baseContext,
        orderId,
        sellerUsername,
        buyerUsername,
        title,
        description,
        expectedDeliveryDate,
        quantity,
        price,
        serviceFee,
        totalAmount,
        orderUrl,
      };

      emailPayloads.push(
        {
          messageId: messageId ?? uuidv4(),
          to: sellerEmail,
          subject: 'New Order Received – Get Started Now!',
          context,
          template: EmailTemplate.ORDER_PLACED
        },
        {
          messageId: messageId ?? uuidv4(),
          to: buyerEmail,
          subject: 'Order Confirmation – Thank You for Your Purchase!',
          context,
          template: EmailTemplate.ORDER_RECEIPT
        }
      );
      break;

    case MessageQueueType.ORDER_EXTENDED_DELIVERY_REQUEST:
      context = {
        ...baseContext,
        orderId,
        sellerUsername,
        buyerUsername,
        title,
        orderUrl,
        originalDate,
        newDate,
        expectedDeliveryDays,
        reason
      };
      emailPayloads.push({
        messageId: messageId ?? uuidv4(),
        to: buyerEmail,
        subject: `You received a delivery extension request from ${sellerUsername}`,
        context,
        template: EmailTemplate.ORDER_EXTENSION
      });
      break;

    case MessageQueueType.ORDER_EXTENDED_DELIVERY_APPROVED:
      context = {
        ...baseContext,
        orderId,
        sellerUsername,
        buyerUsername,
        title,
        orderUrl,
        newDate,
        expectedDeliveryDays,
        reason
      };
      emailPayloads.push({
        messageId: messageId ?? uuidv4(),
        to: sellerEmail,
        subject: `Order Extension Approved – New Delivery Date Confirmed`,
        context,
        template: EmailTemplate.ORDER_EXTENSION_APPROVED
      });
      break;

    case MessageQueueType.ORDER_EXTENDED_DELIVERY_REJECTED:
      context = {
        ...baseContext,
        orderId,
        sellerUsername,
        buyerUsername,
        title,
        orderUrl,
        originalDate,
        reason
      };
      emailPayloads.push({
        messageId: messageId ?? uuidv4(),
        to: sellerEmail,
        subject: `Your Request to Extend the Order Has Been Declined`,
        context,
        template: EmailTemplate.ORDER_EXTENSION_REJECTED
      });
      break;
    case MessageQueueType.ORDER_DELIVERED:
      context = {
        ...baseContext,
        orderId,
        sellerUsername,
        buyerUsername,
        title,
        orderUrl
      };
      emailPayloads.push({
        messageId: messageId ?? uuidv4(),
        to: buyerEmail,
        subject: `Your Order Has Been Delivered`,
        context,
        template: EmailTemplate.ORDER_DELIVERED
      });
      break;

    case MessageQueueType.ORDER_APPROVED:
      context = {
        ...baseContext,
        orderId,
        sellerUsername,
        buyerUsername,
        title,
        orderUrl
      };
      emailPayloads.push({
        messageId: messageId ?? uuidv4(),
        to: sellerEmail,
        subject: `Your delivery has been approved — you’re getting paid!`,
        context,
        template: EmailTemplate.ORDER_APPROVED
      });
      break;

    case MessageQueueType.ORDER_CANCELED:
      context = {
        ...baseContext,
        orderId,
        sellerUsername,
        buyerUsername,
        title,
        orderUrl
      };
      emailPayloads.push({
        messageId: messageId ?? uuidv4(),
        to: sellerEmail,
        subject: `Order ${orderId} has been cancelled`,
        context,
        template: EmailTemplate.ORDER_CANCELED
      });
      break;
    default:
      AppLogger.warn(`[Notification Order Handler] Unhandled event type: ${type}`, {operation: 'consumer:handler'});

  }

  if (emailPayloads.length > 0) {
    const emailService = new EmailService();
    console.log(payload);
    await Promise.all(emailPayloads.map((payload) => emailService.send(payload)));
  }
}
