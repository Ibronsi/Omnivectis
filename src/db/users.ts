import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email || 'utilisateur@omnivectis.local',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || 'utilisateur@omnivectis.local',
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Impossible de synchroniser le profil utilisateur en base.', { cause: error });
  }
}
