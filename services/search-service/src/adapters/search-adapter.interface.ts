export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category?: string;
    stock?: number;
}

export interface SearchAdapter {
    index(product: Product): Promise<void>;
    update(product: Product): Promise<void>;
    search(query: string, limit?: number): Promise<Product[]>;
    delete(productId: string): Promise<void>;
}
