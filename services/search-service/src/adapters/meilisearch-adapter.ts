import { MeiliSearch } from 'meilisearch';
import { SearchAdapter, Product } from './search-adapter.interface';

export class MeiliSearchAdapter implements SearchAdapter {
    private client: MeiliSearch;
    private indexName = 'products';

    constructor(host: string, apiKey?: string) {
        this.client = new MeiliSearch({
            host,
            apiKey,
        });
    }

    async index(product: Product): Promise<void> {
        const index = this.client.index(this.indexName);
        await index.addDocuments([product]);
    }

    async update(product: Product): Promise<void> {
        const index = this.client.index(this.indexName);
        await index.updateDocuments([product]);
    }

    async search(query: string, limit: number = 20): Promise<Product[]> {
        const index = this.client.index(this.indexName);
        const results = await index.search(query, { limit });
        return results.hits as Product[];
    }

    async delete(productId: string): Promise<void> {
        const index = this.client.index(this.indexName);
        await index.deleteDocument(productId);
    }
}
