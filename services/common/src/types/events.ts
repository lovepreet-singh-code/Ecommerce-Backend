/**
 * Base event envelope for all Kafka messages
 * Provides consistent structure with metadata for tracing and versioning
 */
export interface EventEnvelope<T> {
    /** Unique identifier for this event */
    eventId: string;

    /** Type of event (e.g., 'order.created', 'payment.success') */
    eventType: string;

    /** Event payload data */
    data: T;

    /** ISO timestamp when event was created */
    timestamp: string;

    /** Correlation ID for tracking related events across services */
    correlationId?: string;

    /** Schema version for backward compatibility */
    version: string;
}

// ==================== Order Events ====================

export interface OrderCreatedPayload {
    orderId: string;
    userId: string;
    items: Array<{
        productId: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: string;
}

export type OrderCreatedEvent = EventEnvelope<OrderCreatedPayload>;

// ==================== Inventory Events ====================

export interface InventoryReservedPayload {
    orderId: string;
    reservationId: string;
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    reservedAt: string;
}

export type InventoryReservedEvent = EventEnvelope<InventoryReservedPayload>;

export interface InventoryFailedPayload {
    orderId: string;
    items: Array<{
        productId: string;
        requestedQuantity: number;
        availableQuantity: number;
    }>;
    reason: string;
    failedAt: string;
}

export type InventoryFailedEvent = EventEnvelope<InventoryFailedPayload>;

// ==================== Payment Events ====================

export interface PaymentSuccessPayload {
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
    paymentMethod: 'card' | 'upi' | 'wallet' | 'netbanking';
    transactionId: string;
    paidAt: string;
}

export type PaymentSuccessEvent = EventEnvelope<PaymentSuccessPayload>;

export interface PaymentFailedPayload {
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
    reason: string;
    errorCode?: string;
    failedAt: string;
}

export type PaymentFailedEvent = EventEnvelope<PaymentFailedPayload>;

// ==================== Product Events ====================

export interface ProductUpdatedPayload {
    productId: string;
    changes: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    updatedBy: string;
    updatedAt: string;
}

export type ProductUpdatedEvent = EventEnvelope<ProductUpdatedPayload>;

// ==================== Notification Events ====================

export interface NotificationEnqueuePayload {
    notificationId: string;
    userId: string;
    type: 'email' | 'sms' | 'push';
    channel: string;
    subject?: string;
    message: string;
    metadata?: Record<string, any>;
    priority: 'low' | 'normal' | 'high';
    scheduledAt?: string;
}

export type NotificationEnqueueEvent = EventEnvelope<NotificationEnqueuePayload>;

// ==================== Helper Functions ====================

/**
 * Create a properly formatted event envelope
 * @param eventType - Type of event
 * @param data - Event payload
 * @param correlationId - Optional correlation ID for tracking
 * @returns Event envelope ready to be sent to Kafka
 */
export function createEvent<T>(
    eventType: string,
    data: T,
    correlationId?: string
): EventEnvelope<T> {
    return {
        eventId: generateEventId(),
        eventType,
        data,
        timestamp: new Date().toISOString(),
        correlationId,
        version: '1.0',
    };
}

/**
 * Generate a unique event ID
 */
function generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
