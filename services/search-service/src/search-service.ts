import { SearchAdapter } from './adapters/search-adapter.interface';

class SearchService {
    private _adapter?: SearchAdapter;

    get adapter() {
        if (!this._adapter) {
            throw new Error('Search adapter not initialized');
        }
        return this._adapter;
    }

    set adapter(adapter: SearchAdapter) {
        this._adapter = adapter;
    }
}

export const searchService = new SearchService();
