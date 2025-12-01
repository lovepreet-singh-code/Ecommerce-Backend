import request from 'supertest';
import { app } from '../src/app';

describe('Auth Routes', () => {
    it('registers a user', async () => {
        const res = await request(app)
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
    });

    it('logs in a user', async () => {
        await request(app)
            .post('/auth/register')
            .send({
                name: 'Test User',
                email: 'test@test.com',
                password: 'password',
            })
            .expect(201);

        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'test@test.com',
                password: 'password',
            })
            .expect(200);

        expect(res.body.accessToken).toBeDefined();
    });

    it('accesses protected route', async () => {
        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                name: 'Test User',
                email: 'test@test.com',
                password: 'password',
            })
            .expect(201);

        const token = registerRes.body.accessToken;

        const res = await request(app)
            .get('/users/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.email).toEqual('test@test.com');
    });
});
