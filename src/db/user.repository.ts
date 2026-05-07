import { Env, User, UserRole } from '@/db/types';
import {
  generateId,
  boolToNumber,
  numberToBool,
  now,
  queryFirst,
  queryAll,
  execute,
  count
} from '@/db/db';
import prisma from '@/lib/database';

/**
 * Unified UserRepository that works with both D1 (Cloudflare) and Prisma (local dev)
 */
export class UserRepository {
  /**
   * Find user by email - works with both D1 and Prisma
   */
  static async findByEmail(env: Env | null, email: string): Promise<User | null> {
    // If env is null or env.DB doesn't exist (local dev), use Prisma query
    if (!env || !env.DB) {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      return user as User | null;
    }

    // Otherwise use D1 query
    return queryFirst<User>(
      env,
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      email
    );
  }

  /**
   * Find user by ID
   */
  static async findById(env: Env | null, id: string): Promise<User | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      return user as User | null;
    }

    return queryFirst<User>(
      env,
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      id
    );
  }

  /**
   * Find user by password reset token
   */
  static async findByResetToken(env: Env | null, token: string): Promise<User | null> {
    const currentTime = now();

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gt: currentTime }
        }
      });
      return user as User | null;
    }

    // Use D1
    return queryFirst<User>(
      env,
      'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ? LIMIT 1',
      token,
      currentTime
    );
  }

  /**
   * Create new user
   */
  static async create(env: Env | null, data: {
    email: string;
    name?: string;
    phone?: string;
    password: string;
    role?: UserRole;
    emailVerified?: boolean;
  }): Promise<User> {
    const id = generateId();
    const currentTime = now();

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const user = await prisma.user.create({
        data: {
          id,
          email: data.email,
          name: data.name || null,
          phone: data.phone || null,
          password: data.password,
          role: data.role || 'user',
          emailVerified: data.emailVerified !== undefined
            ? (data.emailVerified ? 1 : 0)
            : 1,
          createdAt: currentTime,
          updatedAt: currentTime
        }
      });
      return user as unknown as User;
    }

    // Use D1
    await execute(
      env,
      `INSERT INTO users (id, email, name, phone, password, role, emailVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.email,
      data.name || null,
      data.phone || null,
      data.password,
      data.role || 'user',
      boolToNumber(data.emailVerified !== undefined ? data.emailVerified : true),
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update user
   */
  static async update(env: Env | null, id: string, data: Partial<User>): Promise<User | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const updateData: any = {};
      const prismaMapping: Record<string, string> = {
        name: 'name',
        phone: 'phone',
        address: 'address',
        password: 'password',
        emailVerified: 'emailVerified',
        emailToken: 'emailToken',
        newEmail: 'newEmail',
        resetToken: 'resetToken',
        resetTokenExpiry: 'resetTokenExpiry'
      };

      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && prismaMapping[key]) {
          updateData[prismaMapping[key]] = value;
          // Convert number to boolean for emailVerified
          if (key === 'emailVerified' && typeof value === 'number') {
            updateData[prismaMapping[key]] = numberToBool(value);
          }
          // resetTokenExpiry should remain as string
        }
      }

      if (Object.keys(updateData).length === 0) {
        return this.findById(env, id);
      }

      updateData.updatedAt = now();

      await prisma.user.update({
        where: { id },
        data: updateData
      });

      return this.findById(env, id);
    }

    // Use D1
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone);
    }
    if (data.address !== undefined) {
      updates.push('address = ?');
      values.push(data.address);
    }
    if (data.password !== undefined) {
      updates.push('password = ?');
      values.push(data.password);
    }
    if (data.emailVerified !== undefined) {
      updates.push('emailVerified = ?');
      values.push(typeof data.emailVerified === 'boolean' ? boolToNumber(data.emailVerified) : data.emailVerified);
    }
    if (data.emailToken !== undefined) {
      updates.push('emailToken = ?');
      values.push(data.emailToken);
    }
    if (data.newEmail !== undefined) {
      updates.push('newEmail = ?');
      values.push(data.newEmail);
    }
    if (data.resetToken !== undefined) {
      updates.push('resetToken = ?');
      values.push(data.resetToken);
    }
    if (data.resetTokenExpiry !== undefined) {
      updates.push('resetTokenExpiry = ?');
      values.push(data.resetTokenExpiry);
    }

    if (updates.length === 0) return this.findById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Delete user
   */
  static async delete(env: Env | null, id: string): Promise<void> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.user.delete({
        where: { id }
      });
      return;
    }

    // Use D1
    await execute(env, 'DELETE FROM users WHERE id = ?', id);
  }

  /**
   * Get all users (with pagination)
   */
  static async findAll(
    env: Env | null,
    options: { limit?: number; offset?: number; role?: UserRole } = {}
  ): Promise<User[]> {
    const { limit = 50, offset = 0, role } = options;

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const where: any = {};
      if (role) where.role = role;

      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
      return users as unknown as User[];
    }

    // Use D1
    const whereClause = role ? 'WHERE role = ?' : '';
    return queryAll<User>(
      env,
      `SELECT * FROM users ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      ...(role ? [role] : []),
      limit,
      offset
    );
  }

  /**
   * Count users
   */
  static async count(env: Env | null, role?: UserRole): Promise<number> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const where: any = {};
      if (role) where.role = role;

      return await prisma.user.count({ where });
    }

    // Use D1
    return count(env, 'users', role ? 'WHERE role = ?' : '', ...(role ? [role] : []));
  }
}
