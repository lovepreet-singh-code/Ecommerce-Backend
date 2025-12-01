import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { NotFoundError } from '@ecommerce-backend/common';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.currentUser!.userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, addresses } = req.body;
        const user = await User.findByIdAndUpdate(
            req.currentUser!.userId,
            { name, addresses },
            { new: true }
        );
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};
