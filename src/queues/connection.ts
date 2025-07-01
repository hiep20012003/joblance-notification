import { config } from '@notifications/config';
import { logger } from '@notifications/app';
import client, { Channel } from 'amqplib';

async function createConnection(): Promise<Channel | undefined> {
  try {
    const connection = await client.connect(`${config.RABBITMQ_ENDPOINT}`);
    const channel: Channel = (await connection.createChannel()) as Channel;
    logger.info('Notification server connected to queue successfully...');
    closeConnection(channel, connection);
    return channel;
  } catch (error) {
    logger.error('Error occurred in NotificationService createConnection() method:', error);
  }
}

function closeConnection(channel: Channel, connection: any): void {
  process.once('SIGINT', async () => {
    await channel.close();
    await connection.close();
  });
}

export { createConnection };
