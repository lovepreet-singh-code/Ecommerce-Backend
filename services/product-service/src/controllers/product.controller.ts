import { Request, Response } from 'express';
import { Product } from '../models/product.schema';
import { getCache, setCache, delCache } from '../cache/redisClient';

const CACHE_TTL = 60; // 60 seconds

export const createProduct = async (req: Request, res: Response) => {
    const { title, description, price, images, category, stock, sellerId } = req.body;

    const product = Product.build({
        title,
        description,
        price,
        images,
        category,
        stock,
        sellerId,
    });

    await product.save();

    // Invalidate list cache
    await delCache('products:list:*');

    res.status(201).send(product);
};

export const getProducts = async (req: Request, res: Response) => {
    const cacheKey = `products:list:${JSON.stringify(req.query)}`;

    // Check cache
    const cachedProducts = await getCache(cacheKey);
    if (cachedProducts) {
        console.log('⚡ Cache Hit');
        return res.send(JSON.parse(cachedProducts));
    }

    console.log('🐢 Cache Miss');
    const products = await Product.find(req.query);

    // Set cache
    await setCache(cacheKey, JSON.stringify(products), CACHE_TTL);

    res.send(products);
};

export const getProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    const cacheKey = `products:${id}`;

    // Check cache
    const cachedProduct = await getCache(cacheKey);
    if (cachedProduct) {
        console.log('⚡ Cache Hit');
        return res.send(JSON.parse(cachedProduct));
    }

    console.log('🐢 Cache Miss');
    const product = await Product.findById(id);

    if (!product) {
        return res.status(404).send({ error: 'Product not found' });
    }

    // Set cache
    await setCache(cacheKey, JSON.stringify(product), CACHE_TTL);

    res.send(product);
};

export const updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });

    if (!product) {
        return res.status(404).send({ error: 'Product not found' });
    }

    // Invalidate specific product cache and list cache
    await delCache(`products:${id}`);
    await delCache('products:list:*');

    res.send(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
        return res.status(404).send({ error: 'Product not found' });
    }

    // Invalidate specific product cache and list cache
    await delCache(`products:${id}`);
    await delCache('products:list:*');

    res.status(204).send();
};
