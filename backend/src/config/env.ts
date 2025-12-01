import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env';
dotenv.config({
  path: path.join(process.cwd(), envFile)
});

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'GOOGLE_GENAI_API_KEY',
  'JWT_SECRET',
  'REDIRECT_URI',
  'FRONTEND_ORIGIN',
] as const;

const OPTIONAL_ENV_VARS = [
  { name: 'MILVUS_ADDRESS', default: 'milvus:19530' },
  { name: 'PYTHON_SERVICE_URL', default: 'python-md:3001' },
  { name: 'PORT', default: '3006' },
  { name: 'NODE_ENV', default: 'development' },
  { name: 'FRONTEND_REDIRECT', default: 'http://localhost:3000/auth/callback' },
] as const;

export function validateEnvironment(): void {
  const missing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease create a .env file with all required variables.');
    process.exit(1);
  }

  for (const { name, default: defaultValue } of OPTIONAL_ENV_VARS) {
    if (!process.env[name]) {
      process.env[name] = defaultValue;
      console.log(`Using default for ${name}: ${defaultValue}`);
    } else {
      console.log(`${name}: ${process.env[name]}`);
    }
  }

  console.log('✅ Environment variables validated');
}
