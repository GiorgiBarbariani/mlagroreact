import axios from 'axios';

const API_URL = 'http://localhost:7001/api';

async function testResend() {
  const timestamp = Date.now();
  const testEmail = `resend${timestamp}@example.com`;

  try {
    // Register new user
    console.log('1️⃣ Registering new user...');
    await axios.post(`${API_URL}/auth/register`, {
      email: testEmail,
      username: `resend${timestamp}`,
      password: 'Test123!',
      firstName: 'Resend',
      lastName: 'Test'
    });
    console.log('✅ User registered');

    // Test resend
    console.log('\n2️⃣ Testing resend verification code...');
    const resendResponse = await axios.post(`${API_URL}/auth/resend-verification`, {
      email: testEmail
    });
    console.log('✅ Resend successful!');
    console.log('   Response:', resendResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testResend();