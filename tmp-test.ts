import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load .env.local
dotenv.config({ path: '.env.local' });

// Just define the model directly to test mongoose behavior
const OtpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },
  expiresAt: { type: Date, required: true },
});

const Otp = mongoose.models.Otp || mongoose.model('Otp', OtpSchema);

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found format.');
    return;
  }
  
  await mongoose.connect(uri);
  console.log('Connected to DB');

  const testPhone = "+919999999999";
  const testOtp = "123456";

  await Otp.deleteMany({ phone: testPhone });
  
  const created = await Otp.create({
    phone: testPhone,
    otp: testOtp,
    expiresAt: new Date(Date.now() + 300000)
  });
  
  console.log('Created OTP:', created);

  const found = await Otp.findOne({ phone: testPhone, otp: testOtp });
  console.log('Found OTP:', found);

  await mongoose.disconnect();
}

run().catch(console.error);
