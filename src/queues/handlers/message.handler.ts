import { IChatMessageQueue, MessageQueueType } from '@hiep20012003/joblance-shared';
import { AppLogger } from '@notifications/utils/logger';
import { NotificationServer } from '@notifications/server';
import { cacheStore } from '@notifications/cache/redis.connection';
import { Server } from 'socket.io';

const THROTTLE_TTL_SECONDS = 5;


export async function handleNewMessage<T extends Required<IChatMessageQueue>>(payload: T) {
  await Promise.resolve();

  const {
    type,
    message, // message có thể là undefined/null trong MESSAGE_READ
    conversation,
    isNewConversation,
    actorId, // ID của người tạo sự kiện (người gửi tin hoặc người đọc tin)
    readAt,
    readUpToMessageId
  } = payload;

  if (!conversation || !conversation?._id) {
    AppLogger.warn(`[Chat Consumer] Payload is invalid or missing conversation data.`, { operation: 'consumer:handler' });
    return;
  }

  const conversationId = conversation._id;

  const recipientIds = conversation.participants;

  const io: Server = NotificationServer.getSocketIO();
  const notificationNamespace = io.of('/notifications');

  switch (type) {
    case MessageQueueType.MESSAGE_SENT: {
      if (!message) return;

      for (const recipientId of recipientIds) {
        const isOnline = await cacheStore.getClient().sismember('loggedInUsers', recipientId);

        if (!isOnline) {
          AppLogger.info(`User ${recipientId} is OFFLINE. Triggering Push Notification logic.`, { operation: 'consumer:handler' });
          // TODO: Kích hoạt dịch vụ Push Notification
          continue;
        }

        const currentViewingRoom = await cacheStore.get(`user:current_room:${recipientId}`);
        const isViewingConversation = currentViewingRoom === conversationId;

        const basePayload = {
          conversation: conversation,
          message: message,
          isNewConversation: isNewConversation as string,
          senderId: actorId
        };

        if (!isViewingConversation) {
          notificationNamespace
            .emit('chat:list_update', recipientId, { ...basePayload, type: 'list_update' });

          AppLogger.info(`List update sent to User ${recipientId} for conversation ${conversationId}.`, { operation: 'consumer:handler' });

          // 2.2. BATCHING VÀ THROTTLING (chat:alert) - CHỈ ÁP DỤNG CHO ALERT
          const throttleKey = `notification:throttle:${recipientId}`;
          const isFirstInBatch = await cacheStore.getClient().set(
            throttleKey, '1', 'EX', THROTTLE_TTL_SECONDS, 'NX'
          );

          if (isFirstInBatch === 'OK' && recipientId !== actorId) {
            // GỬI ALERT (Thông báo trên icon)
            notificationNamespace
              .emit('chat:alert', recipientId, { ...basePayload, type: 'alert' });
            AppLogger.info(`Sent In-App Alert (BATCH START) to User ${recipientId}.`, { context: { throttle: 'START' } });
          } else {
            AppLogger.info(`Notification throttled (Alert only) for User ${recipientId}.`, { context: { throttle: 'SKIPPED' } });
          }

        } else {
          AppLogger.info(`⚡ Sent Real-time Message to User ${recipientId} viewing conversation ${conversationId}.`, { operation: 'consumer:handler' });
        }
      }
      break;
    }

    case MessageQueueType.MESSAGE_READ: {
      // Logic xử lý khi một người dùng đọc tin nhắn của bạn (Read Receipt)

      for (const recipientId of recipientIds) {
        const isOnline = await cacheStore.getClient().sismember('loggedInUsers', recipientId);

        if (!isOnline) {
          continue;
        }

        const currentViewingRoom = await cacheStore.get(`user:current_room:${recipientId}`);
        const needsInAppNotification = (
          currentViewingRoom !== conversationId
        );

        // Payload chỉ cần Conv ID và ID người đọc (actorId)
        if (needsInAppNotification) {

          const readReceiptPayload = {
            conversation: conversation,
            readByUserId: actorId,
            readUpToMessageId: readUpToMessageId as string,
            readAt: readAt as string,
          };

          notificationNamespace
            .emit('conversation:read', recipientId, readReceiptPayload);

          AppLogger.info(`Read Receipt sent to User ${recipientId} for conversation ${conversationId}.`, {
            operation: 'consumer:handler',
            context: { reader: actorId, recipient: recipientId }
          });
        }
      }
      break;
    }

    default:
      AppLogger.warn(`[Chat Consumer Handler] Unhandled event type: ${type}`, { operation: 'consumer:handler' });
      break;
  }
}
