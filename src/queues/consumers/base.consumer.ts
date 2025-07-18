import { IEmailMessage, ServerError } from '@hiep20012003/joblance-shared';
import { AppLogger } from '@notification/utils/logger';
import { setupRetryQueue } from '@notification/utils/retryQueue';
import { Channel, ConsumeMessage } from 'amqplib';

interface ConsumerOptions<T extends IEmailMessage = IEmailMessage> {
  channel: Channel;
  exchange: string;
  queue: string;
  routingKey: string;
  handler: (data: T)=> Promise<void>;
  maxRetries?: number;
}

export async function baseConsumer<T extends IEmailMessage>({
  channel,
  exchange,
  queue,
  routingKey,
  handler,
  maxRetries = 3
}: ConsumerOptions<T>): Promise<void> {
  await setupRetryQueue(channel, queue, routingKey, exchange);

  const queueName = `${queue}.queue`;

  channel.consume(queueName, (msg: ConsumeMessage | null) => {
    if (!msg) return;

    (async () => {
      const data: T = JSON.parse(msg.content.toString()) as T;
      await handler(data);
      channel.ack(msg);
    })().catch((error) => {
      const content = msg.content.toString();
      const headers = msg.properties.headers ?? {};
      const deaths = headers['x-death'] as { count: number }[] | undefined;
      const retryCount = deaths?.[0]?.count || 0;

      const messageId: string = (msg.properties.messageId as string) ?? 'unknown-id';

      if (retryCount >= maxRetries) {
        channel.publish(`${exchange}.dead`, `${routingKey}.dead`, Buffer.from(content), { headers });
        channel.ack(msg);
        throw new ServerError({
          logMessage: `Exceeded max retries (${maxRetries}) for messageId: ${messageId}`,
          operation: 'consume-retry-limit',
          context: {
            queue: queueName,
            routingKey,
            messageId,
            maxRetries
          }
        });
      } else {
        channel.nack(msg, false, false);
        AppLogger.warn('Message processing failed, will retry',
          {
            operation: 'consume-retry',
            context: {
              queue: queueName,
              routingKey,
              messageId,
              currentRetry: retryCount + 1,
              maxRetries,
              error: (error as Error).message
            }
          }
        );
      }
    });
  }).catch((error) => {
    throw new ServerError({
      logMessage: `Failed to start consumer`,
      cause: error,
      operation: 'consumer-setup-failed',
      context: {
        queue: queueName,
      }
    });
  });
}
