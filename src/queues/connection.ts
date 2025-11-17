import {config} from '@notifications/config';
import {AppLogger} from '@notifications/utils/logger';
import {MessageQueue, setupAllQueues} from '@hiep20012003/joblance-shared';
import {consumeOrderMessage} from '@notifications/queues/consumers/order.consumer';
import {consumeNewMessage} from '@notifications/queues/consumers/message.consumer';

import {consumeAuthMessage} from './consumers/auth.consumer';

export const messageQueue = MessageQueue.getInstance(`${config.RABBITMQ_URL}`);

export const publishChannel: string = 'notification-publish-channel';
export const consumerChannel: string = 'notification-consumer-channel';

export async function initQueue() {
  await messageQueue.connect();
  AppLogger.info('RabbitMQ connection established successfully', {
    operation: 'queue:connect'
  });
  await setupAllQueues(messageQueue, (error: Error, queueName?: string) => {
    AppLogger.error(
      `[Setup] Failed to setup queue${queueName ? ` "${queueName}"` : ''}`,
      {
        operation: 'queue:setup-all',
        error: error,
      }
    );
  });
  await consumeAuthMessage(messageQueue);
  await consumeOrderMessage(messageQueue);
  await consumeNewMessage(messageQueue);
}

