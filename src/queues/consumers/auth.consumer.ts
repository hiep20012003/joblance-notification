import { Channel } from 'amqplib';

import { handleAuthEmailMessage } from '../handlers/auth.handler';

import { baseConsumer } from './base.consumer';

export function consumeAuthEmails(channel: Channel) {
  return baseConsumer({
    channel,
    exchange: 'jbl.auth.notification',
    queue: 'auth.email',
    routingKey: 'auth.email',
    handler: handleAuthEmailMessage
  });
}
