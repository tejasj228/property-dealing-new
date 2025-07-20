// Copy this into your browser console to test contact form
// Or save as test-contact.js and run with node test-contact.js

const testContactForm = async () => {
  console.log('🧪 Testing Contact Form Submission...\n');
  
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+91-9999999999',
    interest: 'noida',
    message: 'This is a test message from the debug script.'
  };
  
  const API_URLS = [
    'https://property-dealing-qle8.onrender.com',
    'http://localhost:5000'
  ];
  
  for (const API_URL of API_URLS) {
    console.log(`\n🔗 Testing API: ${API_URL}`);
    
    try {
      // Test 1: Health Check
      console.log('1️⃣ Testing health endpoint...');
      const healthResponse = await fetch(`${API_URL}/api/health`);
      console.log(`   Status: ${healthResponse.status}`);
      console.log(`   Response: ${await healthResponse.text()}`);
      
      if (!healthResponse.ok) {
        console.log('❌ Health check failed, skipping contact test');
        continue;
      }
      
      // Test 2: Contact Form Submission
      console.log('\n2️⃣ Testing contact form...');
      const contactResponse = await fetch(`${API_URL}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      console.log(`   Status: ${contactResponse.status}`);
      console.log(`   Status Text: ${contactResponse.statusText}`);
      
      const responseText = await contactResponse.text();
      console.log(`   Response: ${responseText}`);
      
      if (contactResponse.ok) {
        console.log('✅ SUCCESS! Contact form is working!');
        const data = JSON.parse(responseText);
        console.log(`📧 Contact saved with ID: ${data.data?.id}`);
        return true;
      } else {
        console.log('❌ Contact form failed');
        if (contactResponse.status === 404) {
          console.log('   🔍 404 means the /api/contacts route is not found');
          console.log('   📝 Check if your server.js has the contact route');
        }
      }
      
    } catch (error) {
      console.log(`❌ Error testing ${API_URL}:`, error.message);
      
      if (error.message.includes('Failed to fetch')) {
        console.log('   🔌 Cannot connect to server - is it running?');
      }
    }
  }
  
  console.log('\n🔧 Debugging Steps:');
  console.log('1. Make sure your backend server is running');
  console.log('2. Check server console for error messages');
  console.log('3. Verify MongoDB connection is working');
  console.log('4. Test the health endpoint first: /api/health');
  console.log('5. Check your Contact model exists in ./models/Contact.js');
  
  return false;
};

// For Node.js environment
if (typeof require !== 'undefined') {
  const fetch = require('node-fetch');
}

// Auto-run in browser console
if (typeof window !== 'undefined') {
  window.testContactForm = testContactForm;
  console.log('🔧 Debug function loaded! Run: testContactForm()');
} else {
  // Run immediately in Node.js
  testContactForm().then(success => {
    process.exit(success ? 0 : 1);
  });
}