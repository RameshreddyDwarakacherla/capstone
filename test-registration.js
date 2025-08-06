const axios = require('axios');

async function testRegistration() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      firstName: "EPILI ",
      lastName: "ASHOK",
      email: "99220041470@klu.ac.in",
      password: "Ashok@123",
      phone: "7893031396",
      role: "user"
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Full error:', error.message);
    
    // If it's a 500 error, there might be more details
    if (error.response?.status === 500) {
      console.log('Server error details:', error.response.data);
    }
  }
}

testRegistration();