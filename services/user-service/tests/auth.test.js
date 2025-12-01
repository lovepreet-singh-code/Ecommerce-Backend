"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = require("supertest");
const app_1 = require("../src/app");
describe('Auth Routes', () => {
    it('registers a user', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.app)
            .post('/auth/register')
            .send({
            name: 'Test User',
            email: 'test@test.com',
            password: 'password',
        })
            .expect(201);
        expect(res.body.user.email).toEqual('test@test.com');
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
    }));
    it('logs in a user', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(app_1.app)
            .post('/auth/register')
            .send({
            name: 'Test User',
            email: 'test@test.com',
            password: 'password',
        })
            .expect(201);
        const res = yield (0, supertest_1.default)(app_1.app)
            .post('/auth/login')
            .send({
            email: 'test@test.com',
            password: 'password',
        })
            .expect(200);
        expect(res.body.accessToken).toBeDefined();
    }));
    it('accesses protected route', () => __awaiter(void 0, void 0, void 0, function* () {
        const registerRes = yield (0, supertest_1.default)(app_1.app)
            .post('/auth/register')
            .send({
            name: 'Test User',
            email: 'test@test.com',
            password: 'password',
        })
            .expect(201);
        const token = registerRes.body.accessToken;
        const res = yield (0, supertest_1.default)(app_1.app)
            .get('/users/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(res.body.email).toEqual('test@test.com');
    }));
});
