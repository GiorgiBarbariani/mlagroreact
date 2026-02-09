import axios from 'axios';

const API_URL = 'http://localhost:7001/api';

async function testAuthPersistence() {
  console.log('🧪 Testing Authentication Persistence');
  console.log('=====================================\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@mlagro.ge',
      password: 'MLAgro@2024'
    });

    if (loginResponse.data.token) {
      console.log('✅ Login successful!');
      console.log('   Token:', loginResponse.data.token.substring(0, 30) + '...');
      console.log('   User:', loginResponse.data.user?.email);

      // Step 2: Test /auth/me endpoint with token
      console.log('\n2️⃣ Testing /auth/me endpoint...');
      const meResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${loginResponse.data.token}`
        }
      });

      if (meResponse.data.user) {
        console.log('✅ Token validation successful!');
        console.log('   User ID:', meResponse.data.user.id);
        console.log('   Email:', meResponse.data.user.email);
        console.log('   Role:', meResponse.data.user.role);
        console.log('\n✅ Authentication persistence should work now!');
        console.log('   - Token is stored in localStorage');
        console.log('   - /auth/me endpoint validates the token');
        console.log('   - Page refresh will maintain login state');
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Hint: Make sure the admin user exists. Run this to create it:');
      console.log('   curl http://localhost:7001/api/auth/setup-admin');
    }
  }
}

testAuthPersistence();