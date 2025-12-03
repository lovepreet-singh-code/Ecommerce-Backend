import { OrderCreatedEvent, logger } from '@ecommerce-backend/common';
import { Notification, NotificationType } from '../../models/notification';

export const orderCreatedConsumer = async (event: OrderCreatedEvent) => {
    const { orderId, userId, totalAmount } = event.data;

    const notification = Notification.build({
        userId,
        type: NotificationType.OrderCreated,
        title: 'Order Placed Successfully',
        message: `Your order #${orderId} for $${totalAmount} has been placed successfully.`,
        metadata: {
            orderId,
            amount: totalAmount,
        },
    });

    await notification.save();
    logger.info(`Created order notification for user ${userId}`);
};
