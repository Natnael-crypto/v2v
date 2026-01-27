import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { User } from '@/types/user';
import { getUserById } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function signToken(payload: { userId: string }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
        return null;
    }
}

export async function getAuthUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await getUserById(decoded.userId);
    return user || null;
}
