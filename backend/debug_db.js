import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from './src/models/patient.model.js';
import fs from 'fs';

dotenv.config();

const debugDB = async () => {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const patients = await Patient.find({});
    console.log(`Found ${patients.length} patients.`);
    
    const data = patients.map(p => ({
        id: p._id,
        name: p.fullname,
        mobile: p.mobile,
        created: p.createdAt
    }));

    fs.writeFileSync('debug_output.txt', JSON.stringify(data, null, 2));
    console.log('Wrote to debug_output.txt');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugDB();
