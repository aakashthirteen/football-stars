// Minimal timer test without server dependencies
console.log('🧪 Testing minimal timer implementation...');

// Simulate the core timer logic
class SimpleTimer {
  constructor() {
    this.currentMinute = 1;
    this.currentSecond = 0;
    this.timer = null;
  }

  start() {
    console.log('⚽ Starting simple timer...');
    
    this.timer = setInterval(() => {
      this.currentSecond++;
      if (this.currentSecond >= 60) {
        this.currentSecond = 0;
        this.currentMinute++;
      }
      
      console.log(`⏱️ Timer: ${this.currentMinute}:${this.currentSecond.toString().padStart(2, '0')}`);
      
      // Stop after 10 seconds for testing
      if (this.currentMinute === 1 && this.currentSecond >= 10) {
        this.stop();
        console.log('✅ Simple timer test completed');
      }
    }, 1000);
    
    console.log('🚀 Simple timer started - will run for 10 seconds');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('🛑 Timer stopped');
    }
  }
}

// Test the simple timer
const timer = new SimpleTimer();
timer.start();