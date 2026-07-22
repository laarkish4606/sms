import crypto from 'crypto';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.model.js';

function generatePassword(length = 16) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*-_=+';
  const all = upper + lower + digits + symbols;

  const pick = (chars) => chars[crypto.randomInt(chars.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const rest = Array.from({ length: length - required.length }, () => pick(all));

  const passwordChars = [...required, ...rest];
  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }
  return passwordChars.join('');
}

async function seedSuperAdmin() {
  await connectDB();

  const existing = await User.findOne({ role: 'super_admin' });
  if (existing) {
    console.log(`[seed] A super_admin already exists (${existing.email}). No action taken.`);
    await disconnectDB();
    return;
  }

  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@school.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || generatePassword();

  const admin = await User.create({
    role: 'super_admin',
    firstName: 'Super',
    lastName: 'Admin',
    email,
    password,
  });

  console.log('[seed] Super admin created:');
  console.log(`  email:    ${admin.email}`);
  console.log(`  password: ${password}`);
  console.log('[seed] Store this password securely now — it will not be shown again.');

  await disconnectDB();
}

seedSuperAdmin().catch(async (err) => {
  console.error('[seed] Failed to seed super admin:', err.message);
  await disconnectDB();
  process.exit(1);
});
