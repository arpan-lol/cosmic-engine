import fs from 'fs';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const creds = JSON.parse(
  process.env.NODE_ENV == 'production' ? 
  fs.readFileSync(path.join(__dirname, './google-creds.json'), 'utf8') :
  fs.readFileSync(path.join(process.argv[1], '../../google-creds.json'), 'utf8')
);

export const googleClient = new OAuth2Client(
  creds.web.client_id,
  creds.web.client_secret,
  process.env.REDIRECT_URI
);

export const GOOGLE_CLIENT_ID = creds.web.client_id;
