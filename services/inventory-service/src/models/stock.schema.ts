import mongoose, { Schema, Document } from 'mongoose';

export interface IStock extends Document {
    productId: string;
    available: number;
    reserved: number;
    updatedAt: Date;
    createdAt: Date;
}

const stockSchema = new Schema<IStock>(
    {
        productId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        available: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'Available quantity cannot be negative']
        },
        reserved: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'Reserved quantity cannot be negative']
        }
    },
    {
        timestamps: true
    }
);

// Method to check if sufficient stock is available
stockSchema.methods.hasSufficientStock = function (quantity: number): boolean {
    return this.available >= quantity;
};

export const Stock = mongoose.model<IStock>('Stock', stockSchema);
