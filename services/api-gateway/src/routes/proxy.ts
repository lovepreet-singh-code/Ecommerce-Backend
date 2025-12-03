import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { serviceRoutes } from '../config';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rate-limit';

const router = Router();

// User Service Routes
// Public routes for registration and login
router.use(
    '/api/v1/users/register',
    createProxyMiddleware({
        target: serviceRoutes.user,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${serviceRoutes.user}`);
        },
    })
);

router.use(
    '/api/v1/users/login',
    createProxyMiddleware({
        target: serviceRoutes.user,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${serviceRoutes.user}`);
        },
    })
);

// Protected user routes (profile, etc.)
router.use(
    '/api/v1/users',
    authenticateToken,
    createProxyMiddleware({
        target: serviceRoutes.user,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${serviceRoutes.user}`);
        },
    })
);

// Product Service Routes (optional auth - public reads, admin writes)
router.use(
    '/api/v1/products',
    optionalAuth,
    createProxyMiddleware({
        target: serviceRoutes.product,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${serviceRoutes.product}`);
        },
    })
);

// Cart Service Routes (authenticated)
router.use(
    '/api/v1/cart',
    authenticateToken,
    createProxyMiddleware({
        target: serviceRoutes.cart,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${serviceRoutes.cart}`);
        },
    })
);

router.use(
    '/api/v1/orders',
    authenticateToken,
    createProxyMiddleware({
        target: serviceRoutes.order,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${serviceRoutes.order}`);
        },
    })
);

// Payment Service Routes
router.use(
    '/api/v1/payments',
    authenticateToken,
    paymentLimiter,
    createProxyMiddleware({
        target: serviceRoutes.payment,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${serviceRoutes.payment}`);
        },
    })
);

// Notification Service Routes
router.use(
    '/api/v1/notifications',
    authenticateToken,
    createProxyMiddleware({
        target: serviceRoutes.notification,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${serviceRoutes.notification}`);
        },
    })
);

// Review Service Routes
router.use(
    '/api/v1/reviews',
    optionalAuth, // Reviews can be read without auth, but creation requires auth
    createProxyMiddleware({
        target: serviceRoutes.review,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${serviceRoutes.review}`);
        },
    })
);

// Search Service Routes (public)
router.use(
    '/api/v1/search',
    createProxyMiddleware({
        target: serviceRoutes.search,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${serviceRoutes.search}`);
        },
    })
);

// Inventory Service Routes (admin only for direct access)
router.use(
    '/api/v1/inventory',
    authenticateToken,
    requireRole('admin'),
    createProxyMiddleware({
        target: serviceRoutes.inventory,
        changeOrigin: true,
        pathRewrite: {
            '^/api/v1/inventory': '/api/v1/inventory',
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${serviceRoutes.inventory}`);
        },
    })
);

export { router as proxyRoutes };
