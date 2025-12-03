import mongoose from 'mongoose';

export enum PaymentStatus {
    Pending = 'pending',
    Success = 'success',
    Failed = 'failed',
}

export enum PaymentMethod {
    Card = 'card',
    UPI = 'upi',
    Wallet = 'wallet',
    Netbanking = 'netbanking',
}

interface PaymentAttrs {
    orderId: string;
    transactionId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    simulationParams?: {
        shouldFail?: boolean;
        delayMs?: number;
    };
}

interface PaymentDoc extends mongoose.Document {
    id: string;
    orderId: string;
    transactionId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    webhookProcessed: boolean;
    simulationParams?: {
        shouldFail?: boolean;
        delayMs?: number;
    };
    createdAt: string;
    updatedAt: string;
}

interface PaymentModel extends mongoose.Model<PaymentDoc> {
    build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            index: true,
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
            default: 'USD',
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: Object.values(PaymentMethod),
        },
        status: {
            type: String,
            required: true,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.Pending,
        },
        webhookProcessed: {
            type: Boolean,
            default: false,
        },
        simulationParams: {
            shouldFail: { type: Boolean, default: false },
            delayMs: { type: Number, default: 0 },
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

paymentSchema.statics.build = (attrs: PaymentAttrs) => {
    return new Payment(attrs);
};

const Payment = mongoose.model<PaymentDoc, PaymentModel>('Payment', paymentSchema);

export { Payment };
