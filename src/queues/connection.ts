import { config } from '@notification/config';
import { AppLogger } from '@notification/utils/logger';
import client, { Channel } from 'amqplib';
import { ServerError } from '@hiep20012003/joblance-shared';

async function createConnection(): Promise<Channel | undefined> {
  try {
    const connection = await client.connect(`${config.RABBITMQ_ENDPOINT}`);
    const channel: Channel = await connection.createChannel();

    AppLogger.info('RabbitMQ connection established successfully', { operation: 'rabbitmq-connect' });

    closeConnection(channel, connection);
    return channel;
  } catch (error) {
    throw new ServerError({
      logMessage: 'Failed to establish RabbitMQ connection',
      cause: error,
      operation: 'rabbitmq-connect'
    });
  }
}

function closeConnection(channel: Channel, connection: client.ChannelModel): void {
  process.once('SIGINT', () => {
    channel.close()
      .then(() => connection.close())
      .then(() => {
        AppLogger.info('RabbitMQ connection closed via SIGINT', { operation: 'rabbitmq-disconnect' });
      })
      .catch(err => {
        AppLogger.error(`Error closing RabbitMQ connection`, { operation: 'rabbitmq-disconnect', error: { ...(err as Error) } });
      });
  });
}
export { createConnection };
