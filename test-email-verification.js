import axios from 'axios';

const API_URL = 'http://localhost:7001/api';

async function testEmailVerification() {
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testUser = {
    email: testEmail,
    username: `testuser${timestamp}`,
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User'
  };

  console.log('🧪 Testing Email Verification Flow');
  console.log('=====================================\n');

  try {
    // Step 1: Register new user
    console.log('1️⃣ Registering new user...');
    console.log('   Email:', testEmail);

    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);

    if (registerResponse.data.success) {
      console.log('✅ Registration successful!');
      console.log('   Response:', registerResponse.data.message);
      console.log('\n📧 Check the console output above for the 6-digit verification code');
      console.log('   (Look for "Verification Code: XXXXXX")\n');

      // Prompt user to enter code
      console.log('2️⃣ To test verification, run this command with the code from above:');
      console.log(`   node -e "require('axios').post('${API_URL}/auth/verify-email', { email: '${testEmail}', code: 'XXXXXX' }).then(r => console.log('✅ Verification successful!', r.data)).catch(e => console.log('❌ Error:', e.response?.data))"`);

      console.log('\n3️⃣ To test resend code:');
      console.log(`   node -e "require('axios').post('${API_URL}/auth/resend-verification', { email: '${testEmail}' }).then(r => console.log('✅ Code resent!', r.data)).catch(e => console.log('❌ Error:', e.response?.data))"`);
    }
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
  }
}

testEmailVerification();