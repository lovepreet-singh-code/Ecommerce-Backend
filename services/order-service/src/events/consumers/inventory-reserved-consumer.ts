import { InventoryReservedEvent, logger } from '@ecommerce-backend/common';
import { Order, OrderStatus } from '../../models/order';

export const inventoryReservedConsumer = async (event: InventoryReservedEvent) => {
    const { orderId } = event.data;
    const order = await Order.findById(orderId);

    if (!order) {
        logger.error(`Order not found: ${orderId}`);
        return;
    }

    if (order.status === OrderStatus.Cancelled) {
        logger.warn(`Order ${orderId} is already cancelled, ignoring inventory reservation`);
        return;
    }

    if (order.status === OrderStatus.Reserved || order.status === OrderStatus.Paid || order.status === OrderStatus.Shipped || order.status === OrderStatus.Delivered) {
        logger.info(`Order ${orderId} is already in ${order.status} state, ignoring inventory reservation`);
        return;
    }

    order.set({ status: OrderStatus.Reserved });
    await order.save();
    logger.info(`Order ${orderId} status updated to RESERVED`);
};
