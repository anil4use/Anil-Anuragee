import { promisify } from 'node:util';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const scrypt = promisify(scryptCallback);
const readline = createInterface({ input: stdin, output: stdout });

try {
  const password = await readline.question('Admin password (minimum 14 characters): ');
  if (password.length < 14) throw new Error('Password must contain at least 14 characters.');
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  console.log(`ADMIN_PASSWORD_HASH=${salt}:${Buffer.from(hash).toString('hex')}`);
} finally {
  readline.close();
}
