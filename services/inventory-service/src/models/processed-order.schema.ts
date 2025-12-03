import mongoose, { Schema, Document } from 'mongoose';

export interface IProcessedOrder extends Document {
    orderId: string;
    status: 'reserved' | 'failed';
    reservationId?: string;
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    reason?: string;
    processedAt: Date;
    createdAt: Date;
}

const processedOrderSchema = new Schema<IProcessedOrder>(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        status: {
            type: String,
            required: true,
            enum: ['reserved', 'failed']
        },
        reservationId: {
            type: String
        },
        items: [{
            productId: { type: String, required: true },
            quantity: { type: Number, required: true }
        }],
        reason: {
            type: String
        },
        processedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

export const ProcessedOrder = mongoose.model<IProcessedOrder>('ProcessedOrder', processedOrderSchema);
