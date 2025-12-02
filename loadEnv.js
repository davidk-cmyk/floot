import fs from 'fs'

let envConfig = {};
try {
  if (fs.existsSync('env.json')) {
    envConfig = JSON.parse(fs.readFileSync('env.json', 'utf8'));
  }
} catch (err) {
  console.warn('env.json not found or invalid, using environment variables only');
}

Object.keys(envConfig).forEach(key => {
  if (!process.env[key]) {
    process.env[key] = envConfig[key];
  }
});

if (!process.env.FLOOT_DATABASE_URL && process.env.DATABASE_URL) {
  process.env.FLOOT_DATABASE_URL = process.env.DATABASE_URL;
}

if (!process.env.JWT_SECRET && process.env.SESSION_SECRET) {
  process.env.JWT_SECRET = process.env.SESSION_SECRET;
}