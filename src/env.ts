import dotenv from 'dotenv';

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
  console.log('using dotenv - non production instance detected');
  dotenv.config();
} else {
  console.log('PRODUCTION ENVIRONMENT DETECTED - IGNORING ANY .env FILE');
}
