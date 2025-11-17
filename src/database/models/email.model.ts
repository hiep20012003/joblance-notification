import { Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IEmailLog } from '@hiep20012003/joblance-shared';

const emailLogSchema = new Schema<IEmailLog>(
  {
    _id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    messageId: {
      type: String,
      default: uuidv4,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    payload: {
      type: Object,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const EmailLogModel = model<IEmailLog>('EmailLog', emailLogSchema);
