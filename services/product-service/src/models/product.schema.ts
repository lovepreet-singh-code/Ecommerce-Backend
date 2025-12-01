import mongoose from 'mongoose';

interface ProductAttrs {
    title: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    stock: number;
    sellerId: string;
}

interface ProductDoc extends mongoose.Document {
    title: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    stock: number;
    sellerId: string;
    createdAt: Date;
    updatedAt: Date;
}

interface ProductModel extends mongoose.Model<ProductDoc> {
    build(attrs: ProductAttrs): ProductDoc;
}

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        images: {
            type: [String],
            default: [],
        },
        category: {
            type: String,
            required: true,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        sellerId: {
            type: String,
            required: true,
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

productSchema.statics.build = (attrs: ProductAttrs) => {
    return new Product(attrs);
};

const Product = mongoose.model<ProductDoc, ProductModel>('Product', productSchema);

export { Product };

