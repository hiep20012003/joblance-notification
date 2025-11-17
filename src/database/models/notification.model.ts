import {Schema, model} from 'mongoose';
import {v4 as uuidv4} from 'uuid';
import {
  INotificationDocument,
  NotificationChannel,
  NotificationType
} from '@hiep20012003/joblance-shared';

const actorRecipientSchema = new Schema(
  {
    id: {type: String, required: true},
    role: {type: String, required: true},
    username: {type: String, required: true},
    avatar: {type: String, required: true},
  },
  {_id: false}
);

const notificationSchema = new Schema<INotificationDocument>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
      required: true,
    },
    actor: {type: actorRecipientSchema, required: true},
    payload: {
      message: {type: String, required: true},
      extra: {type: Schema.Types.Mixed},
    },
    type: {type: String, enum: Object.values(NotificationType)},
    recipient: {type: actorRecipientSchema, required: true},
    channel: {type: String, enum: Object.values(NotificationChannel), default: NotificationChannel.APP},
    read: {type: Boolean, default: false},
    delivered: {type: Boolean, default: false},
    timestamp: {type: String, default: (new Date()).toISOString()},
  },
  {timestamps: true, versionKey: false}
);

export const NotificationModel = model<INotificationDocument>(
  'notifications',
  notificationSchema
);
