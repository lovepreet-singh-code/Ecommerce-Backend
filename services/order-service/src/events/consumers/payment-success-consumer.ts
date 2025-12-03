import { PaymentSuccessEvent, logger } from '@ecommerce-backend/common';
import { Order, OrderStatus } from '../../models/order';

export const paymentSuccessConsumer = async (event: PaymentSuccessEvent) => {
    const { orderId } = event.data;
    const order = await Order.findById(orderId);

    if (!order) {
        logger.error(`Order not found: ${orderId}`);
        return;
    }

    if (order.status === OrderStatus.Cancelled) {
        logger.warn(`Order ${orderId} is cancelled, but payment succeeded. Manual intervention required.`);
        return;
    }

    if (order.status === OrderStatus.Paid || order.status === OrderStatus.Shipped || order.status === OrderStatus.Delivered) {
        logger.info(`Order ${orderId} is already in ${order.status} state, ignoring payment success`);
        return;
    }

    order.set({ status: OrderStatus.Paid });
    await order.save();
    logger.info(`Order ${orderId} status updated to PAID`);
};
