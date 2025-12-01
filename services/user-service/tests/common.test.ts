import { ApiError } from '@ecommerce-backend/common';

describe('Common Library Test', () => {
    it('should import ApiError', () => {
        const error = new ApiError(400, 'Bad Request');
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Bad Request');
    });
});
