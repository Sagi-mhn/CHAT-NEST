const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
console.log('DB_URI:', process.env.DB_URI);

jest.setTimeout(30000);

describe('Database Connection', () => {
  beforeAll(() => {
    if (!process.env.DB_URI) {
      throw new Error('DB_URI is not defined in the environment');
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('should throw an error if DB_URI is invalid', async () => {
    const originalUri = process.env.DB_URI;
    process.env.DB_URI = 'mongodb://invalidhost:27017/test';

    await expect(connectDB()).rejects.toThrow();

    process.env.DB_URI = originalUri;
  });

  it('should have DB_URI defined in environment', () => {
    expect(process.env.DB_URI).toBeDefined();
    expect(process.env.DB_URI).not.toBe('');
    expect(process.env.DB_URI.startsWith('mongodb://')).toBeTruthy();
  });
  
});