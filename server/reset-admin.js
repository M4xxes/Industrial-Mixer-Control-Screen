import { v4 as uuidv4 } from 'uuid';
import { run, get } from './db.js';
import crypto from 'crypto';

async function hashPassword(password) {
  try {
    const bcryptModule = await import('bcryptjs');
    const bcrypt = bcryptModule.default || bcryptModule;
    return await bcrypt.hash(password, 10);
  } catch {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }
}

async function main() {
  const username = 'admin';
  const newPassword = 'admin123';

  const existing = await get('SELECT id FROM users WHERE username = ?', [username]);

  const passwordHash = await hashPassword(newPassword);

  if (existing) {
    await run('UPDATE users SET password_hash = ?, role = ? WHERE id = ?', [
      passwordHash,
      'Admin',
      existing.id,
    ]);
    console.log(`✅ Mot de passe mis à jour pour l'utilisateur "${username}" (admin123).`);
  } else {
    const adminId = uuidv4();
    await run(
      `
      INSERT INTO users (id, username, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, 'Admin', CURRENT_TIMESTAMP)
    `,
      [adminId, username, 'admin@local', passwordHash],
    );
    console.log(`✅ Utilisateur admin "${username}" créé (mot de passe: admin123).`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Erreur lors de la réinitialisation de l\'admin:', err);
  process.exit(1);
});

