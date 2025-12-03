import { InventoryFailedEvent, logger } from '@ecommerce-backend/common';
import { Order, OrderStatus } from '../../models/order';

export const inventoryFailedConsumer = async (event: InventoryFailedEvent) => {
    const { orderId, reason } = event.data;
    const order = await Order.findById(orderId);

    if (!order) {
        logger.error(`Order not found: ${orderId}`);
        return;
    }

    if (order.status === OrderStatus.Cancelled) {
        return;
    }

    order.set({ status: OrderStatus.Cancelled });
    await order.save();
    logger.info(`Order ${orderId} cancelled due to inventory failure: ${reason}`);
};
