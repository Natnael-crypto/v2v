import { Pool } from 'pg';
import { User } from '@/types/user';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export async function getUsers(): Promise<User[]> {
    const { rows } = await pool.query('SELECT * FROM users');
    return rows.map(mapRowToUser);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] ? mapRowToUser(rows[0]) : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? mapRowToUser(rows[0]) : undefined;
}

export async function addUser(user: User): Promise<void> {
    const query = `
        INSERT INTO users (id, name, email, password, "totalSeconds", "usageLimitSeconds", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    const values = [
        user.id,
        user.name,
        user.email,
        user.password,
        user.totalSeconds,
        user.usageLimitSeconds,
        user.createdAt,
        user.updatedAt
    ];
    await pool.query(query, values);
}

export async function updateUser(updatedUser: User): Promise<void> {
    const query = `
        UPDATE users
        SET name = $1, email = $2, password = $3, "totalSeconds" = $4, "usageLimitSeconds" = $5, "updatedAt" = $6
        WHERE id = $7
    `;
    const values = [
        updatedUser.name,
        updatedUser.email,
        updatedUser.password,
        updatedUser.totalSeconds,
        updatedUser.usageLimitSeconds,
        new Date().toISOString(),
        updatedUser.id
    ];
    await pool.query(query, values);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToUser(row: any): User {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        password: row.password,
        totalSeconds: row.totalSeconds,
        usageLimitSeconds: row.usageLimitSeconds,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
    };
}
