import axios from 'axios';

async function testRegistration() {
  try {
    const response = await axios.post('http://localhost:7001/api/auth/register', {
      email: 'testuser@example.com',
      username: 'testuser123',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User'
    });

    console.log('Registration successful:', response.data);
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
  }
}

testRegistration();