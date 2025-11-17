// import * as connection from '@notifications/queues/connection';
// import amqp from 'amqplib';
// import { consumeAuthEmails } from '@notifications/queues/consumers/auth.consumer';

// jest.mock('@notifications/queues/connection');
// jest.mock('amqplib');
// jest.mock('@hiep20012003/joblance-shared');

// describe('Auth Email Consumer', () => {
//   beforeEach(() => {
//     jest.resetAllMocks();
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('consumeAuthEmails method', () => {
//     it('should be called', async () => {
//       const channel = {
//         assertExchange: jest.fn(),
//         publish: jest.fn(),
//         assertQueue: jest.fn(),
//         bindQueue: jest.fn(),
//         consume: jest.fn()
//       };
//       jest.spyOn(channel, 'assertExchange');
//       jest
//         .spyOn(channel, 'assertQueue')
//         .mockReturnValue({ queue: 'auth.email.queue', messageCount: 0, consumerCount: 0 });
//       jest.spyOn(connection, 'createConnection').mockReturnValue(channel as never);
//       const connectionChannel: amqp.Channel | undefined = await connection.createConnection();
//       await consumeAuthEmails(connectionChannel!);
//       expect(channel.assertExchange).toHaveBeenCalledWith('jbl.auth.notification', 'direct');
//       expect(channel.assertQueue).toHaveBeenCalledTimes(1);
//       expect(channel.consume).toHaveBeenCalledTimes(1);
//       expect(channel.bindQueue).toHaveBeenCalledWith(
//         'auth.email.queue',
//         'jbl.auth.notification',
//         'auth.email'
//       );
//     });
//   });
// });
