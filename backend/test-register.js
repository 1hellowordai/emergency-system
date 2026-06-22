const axios = require("axios");

const testRegistration = async () => {
  try {
    const response = await axios.post("http://localhost:3000/auth/register", {
      name: "Test User",
      email: `test_${Date.now()}@example.com`,
      password: "password123",
      phone: "99999999",
    });
    console.log("✅ Registration successful:", response.data);
  } catch (error) {
    console.error("❌ Registration failed:");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.response?.data?.message || error.message);
    console.error("Error:", error.response?.data || error);
  }
};

testRegistration();
