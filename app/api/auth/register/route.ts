import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { addUser, getUserByEmail } from '@/lib/db';
import { User } from '@/types/user';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (await getUserByEmail(email)) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser: User = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            totalSeconds: 0,
            usageLimitSeconds: 120, // 2 minutes limit
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await addUser(newUser);

        return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
