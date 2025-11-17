import {AppLogger} from '@notifications/utils/logger';
import {EXCHANGES, MessageQueue} from '@hiep20012003/joblance-shared';
import {handleNewMessage} from '@notifications/queues/handlers/message.handler';

import {consumerChannel} from '../connection';

export async function consumeNewMessage(messageQueue: MessageQueue) {
  const exchange = EXCHANGES.CHATS.name;
  const queue = 'notification.chats';

  await messageQueue.consume({
    channelName: consumerChannel,
    exchange,
    queue,
    handler: handleNewMessage,
    handlerRetryError: (operation: string, context) => {
      AppLogger.error(
        `Exceeded max retries`,
        {
          operation,
          context
        }
      );
    },
    maxRetries: 5,
  });

  AppLogger.info('New message consumer listening to queue', {
    operation: 'consumer:init',
    context: {queue, exchange},
  });
}
