import { PaymentFailedEvent, logger } from '@ecommerce-backend/common';
import { Notification, NotificationType } from '../../models/notification';

export const paymentFailedConsumer = async (event: PaymentFailedEvent) => {
    const { orderId, amount, reason } = event.data;

    const userId = 'user-placeholder'; // TODO: Fetch from order service

    const notification = Notification.build({
        userId,
        type: NotificationType.PaymentFailed,
        title: 'Payment Failed',
        message: `Your payment of $${amount} failed for order #${orderId}. Reason: ${reason}`,
        metadata: {
            orderId,
            amount,
            reason,
        },
    });

    await notification.save();
    logger.info(`Created payment failed notification for order ${orderId}`);
};
