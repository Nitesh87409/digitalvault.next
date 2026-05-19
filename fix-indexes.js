import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
} else {
  console.log('.env.local not found');
}

import connectDB from './lib/mongodb.js';

async function fixIndexes() {
  try {
    await connectDB();
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('customers');
    
    // Drop all unique indexes to be safe (except _id)
    // or just the known ones
    const indexesToDrop = [
      'google_id_1',
      'apple_id_1',
      'truecaller_id_1',
      'telegram_id_1',
      'whatsapp_id_1'
    ];
    
    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`Dropped index: ${indexName}`);
      } catch (err) {
        if (err.codeName === 'IndexNotFound') {
          console.log(`Index not found, skipping: ${indexName}`);
        } else {
          console.error(`Error dropping ${indexName}:`, err.message);
        }
      }
    }
    
    const fieldsToUnset = {
      google_id: null,
      apple_id: null,
      truecaller_id: null,
      telegram_id: null,
      whatsapp_id: null
    };
    
    const updateResult = await collection.updateMany(
      { $or: Object.keys(fieldsToUnset).map(field => ({ [field]: null })) },
      { $unset: fieldsToUnset }
    );
    console.log(`Unset null fields on ${updateResult.modifiedCount} documents`);
    
    // Drop all existing indexes completely for customer to be sure, and let mongoose recreate
    // Actually wait, let's just let Mongoose re-sync.
    const Customer = (await import('./models/Customer.js')).default;
    await Customer.syncIndexes();
    console.log('Indexes synchronized successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

fixIndexes();