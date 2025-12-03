import { PaymentSuccessEvent, logger } from '@ecommerce-backend/common';
import { Notification, NotificationType } from '../../models/notification';

export const paymentSuccessConsumer = async (event: PaymentSuccessEvent) => {
    const { orderId, amount, paymentMethod } = event.data;

    // Note: In production, you'd fetch the userId from the order
    // For now, we'll use a placeholder or extract from metadata
    const userId = 'user-placeholder'; // TODO: Fetch from order service

    const notification = Notification.build({
        userId,
        type: NotificationType.PaymentSuccess,
        title: 'Payment Successful',
        message: `Your payment of $${amount} via ${paymentMethod} was successful for order #${orderId}.`,
        metadata: {
            orderId,
            amount,
            paymentMethod,
        },
    });

    await notification.save();
    logger.info(`Created payment success notification for order ${orderId}`);
};
