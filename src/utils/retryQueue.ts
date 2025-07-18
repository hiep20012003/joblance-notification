import { Channel } from 'amqplib';
import { AppLogger } from '@notification/utils/logger';

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

  // 1️⃣ Declare Exchanges
  await channel.assertExchange(mainExchange, 'direct', { durable: true });
  await channel.assertExchange(retryExchange, 'direct', { durable: true });
  await channel.assertExchange(deadExchange, 'direct', { durable: true });
  AppLogger.info(`Exchanges setup done for ${baseQueueName}`, {
    operation: 'queue-setup.exchange'
  });

  // 2️⃣ Declare Queues
  await channel.assertQueue(baseQueue, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': retryExchange,
      'x-dead-letter-routing-key': retryRoutingKey
    }
  });

  await channel.assertQueue(retryQueue, {
    durable: true,
    arguments: {
      'x-message-ttl': 10000, // 10s delay
      'x-dead-letter-exchange': mainExchange,
      'x-dead-letter-routing-key': routingKey
    }
  });

  await channel.assertQueue(deadQueue, { durable: true });
  AppLogger.info(`Queues setup done for ${baseQueueName}`, {
    operation: 'queue-setup.queue'
  });

  // 3️⃣ Bind Queues
  await channel.bindQueue(baseQueue, mainExchange, routingKey);
  await channel.bindQueue(retryQueue, retryExchange, retryRoutingKey);
  await channel.bindQueue(deadQueue, deadExchange, deadRoutingKey);
  AppLogger.info(`Bindings setup done for ${baseQueueName}`, {
    operation: 'queue-setup.binding'
  });

  // 4️⃣ Final Completion
  AppLogger.info(`Retry queue setup complete for ${baseQueueName}`, {
    operation: 'queue-setup.complete'
  });
}

export { setupRetryQueue };
