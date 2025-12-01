"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@ecommerce-backend/common");
describe('Common Library Test', () => {
    it('should import ApiError', () => {
        const error = new common_1.ApiError(400, 'Bad Request');
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Bad Request');
    });
});
