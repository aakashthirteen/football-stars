// Simple timer test to verify the basic functionality
console.log('🧪 Testing basic timer functionality...');

let counter = 0;
const testTimer = setInterval(() => {
  counter++;
  console.log(`⏱️ Timer tick: ${counter} seconds`);
  
  if (counter >= 5) {
    clearInterval(testTimer);
    console.log('✅ Basic timer test completed successfully');
  }
}, 1000);

console.log('🚀 Started basic timer test - should count to 5 seconds');