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

async function resetSuperAdminPassword() {
  await connectDB();

  const email = process.env.SUPER_ADMIN_EMAIL;
  const admin = email
    ? await User.findOne({ role: 'super_admin', email })
    : await User.findOne({ role: 'super_admin' });

  if (!admin) {
    console.log('[reset] No super_admin found. Run `npm run seed` to create one.');
    await disconnectDB();
    return;
  }

  const password = process.env.SUPER_ADMIN_PASSWORD || generatePassword();
  admin.password = password;
  await admin.save();

  console.log('[reset] Super admin password updated:');
  console.log(`  email:    ${admin.email}`);
  console.log(`  password: ${password}`);
  console.log('[reset] Store this password securely now — it will not be shown again.');

  await disconnectDB();
}

resetSuperAdminPassword().catch(async (err) => {
  console.error('[reset] Failed to reset super admin password:', err.message);
  await disconnectDB();
  process.exit(1);
});
