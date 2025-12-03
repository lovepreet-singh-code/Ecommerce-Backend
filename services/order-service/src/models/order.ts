import mongoose from 'mongoose';

export enum OrderStatus {
    Pending = 'pending',
    Reserved = 'reserved',
    Paid = 'paid',
    Shipped = 'shipped',
    Delivered = 'delivered',
    Cancelled = 'cancelled',
}

interface OrderAttrs {
    userId: string;
    status: OrderStatus;
    items: {
        productId: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
}

interface OrderDoc extends mongoose.Document {
    id: string;
    userId: string;
    status: OrderStatus;
    items: {
        productId: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    version: number;
    createdAt: string;
    updatedAt: string;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
    build(attrs: OrderAttrs): OrderDoc;
}

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: Object.values(OrderStatus),
            default: OrderStatus.Pending,
        },
        items: [
            {
                productId: { type: String, required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
    },
    {
        toJSON: {
            transform(doc, ret: any) {
                ret.id = ret._id;
                delete ret._id;
            },
        },
        timestamps: true,
        optimisticConcurrency: true,
        versionKey: 'version',
    }
);

orderSchema.statics.build = (attrs: OrderAttrs) => {
    return new Order(attrs);
};

const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export { Order };
