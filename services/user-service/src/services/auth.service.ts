import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.model';
import { ApiError, BadRequestError } from '@ecommerce-backend/common';

export class AuthService {
    private static ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
    private static REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

    static async register(data: { name: string; email: string; password: string; role?: string }) {
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            throw new BadRequestError('Email already in use');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        const user = new User({
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role || 'user',
        });

        await user.save();
        return this.generateTokens(user);
    }

    static async login(data: { email: string; password: string }) {
        const user = await User.findOne({ email: data.email });
        if (!user) {
            throw new BadRequestError('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(data.password, user.passwordHash);
        if (!isMatch) {
            throw new BadRequestError('Invalid credentials');
        }

        return this.generateTokens(user);
    }

    static async refresh(refreshToken: string) {
        try {
            const secret = process.env.JWT_SECRET as string;
            const payload = jwt.verify(refreshToken, secret) as { userId: string };
            const user = await User.findById(payload.userId);

            if (!user || !user.refreshTokenHash) {
                throw new ApiError(401, 'Invalid refresh token');
            }

            const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
            if (!isMatch) {
                throw new ApiError(401, 'Invalid refresh token');
            }

            return this.generateTokens(user);
        } catch (error) {
            throw new ApiError(401, 'Invalid refresh token');
        }
    }

    private static async generateTokens(user: IUser) {
        const secret = process.env.JWT_SECRET as string;

        const accessToken = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            secret,
            { expiresIn: this.ACCESS_TOKEN_EXPIRY } as any
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            secret,
            { expiresIn: this.REFRESH_TOKEN_EXPIRY } as any
        );

        user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await user.save();

        return { user, accessToken, refreshToken };
    }
}
