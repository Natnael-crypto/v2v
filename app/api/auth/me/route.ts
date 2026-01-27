import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return user info without password
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, ...userInfo } = user;
        return NextResponse.json(userInfo);
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
