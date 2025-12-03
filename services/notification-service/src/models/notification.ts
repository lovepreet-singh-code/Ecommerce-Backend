import mongoose from 'mongoose';

export enum NotificationType {
    OrderCreated = 'order_created',
    PaymentSuccess = 'payment_success',
    PaymentFailed = 'payment_failed',
}

interface NotificationAttrs {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
}

interface NotificationDoc extends mongoose.Document {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

interface NotificationModel extends mongoose.Model<NotificationDoc> {
    build(attrs: NotificationAttrs): NotificationDoc;
}

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        type: {
            type: String,
            required: true,
            enum: Object.values(NotificationType),
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    {
        toJSON: {
            transform(doc, ret: any) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
            },
        },
        timestamps: true,
    }
);

notificationSchema.statics.build = (attrs: NotificationAttrs) => {
    return new Notification(attrs);
};

const Notification = mongoose.model<NotificationDoc, NotificationModel>(
    'Notification',
    notificationSchema
);

export { Notification };
