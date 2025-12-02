export interface CartItem {
    productId: string;
    qty: number;
    priceSnapshot?: number;
}

export interface Cart {
    userId: string;
    items: CartItem[];
    updatedAt: string;
}

export interface AddItemRequest {
    productId: string;
    qty: number;
    priceSnapshot?: number;
}

export interface UpdateItemRequest {
    productId: string;
    qty: number;
}
