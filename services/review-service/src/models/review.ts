import mongoose from 'mongoose';

interface ReviewAttrs {
    productId: string;
    userId: string;
    rating: number;
    comment: string;
}

interface ReviewDoc extends mongoose.Document {
    id: string;
    productId: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
}

interface ReviewModel extends mongoose.Model<ReviewDoc> {
    build(attrs: ReviewAttrs): ReviewDoc;
}

const reviewSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            required: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            maxlength: 1000,
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

// Compound index for user + product (prevent duplicate reviews)
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

reviewSchema.statics.build = (attrs: ReviewAttrs) => {
    return new Review(attrs);
};

const Review = mongoose.model<ReviewDoc, ReviewModel>('Review', reviewSchema);

export { Review };
