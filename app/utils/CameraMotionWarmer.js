/**
 * CameraMotionWarmer - Warms Replicate API model on user interaction
 * Removed motion detection, only responds to touch/click events
 */
export class CameraMotionWarmer {
  constructor(options = {}) {
    // Configuration
    this.isWarming = false;
    this.lastWarmingTime = 0;
    this.lastSuccessfulWarmingTime = 0;
    this.warmingTimer = null;
    
    // Settings
    this.config = {
      // Timing settings
      cooldownPeriod: options.cooldownPeriod || 10000, // 10 seconds cooldown
      
      // Callbacks
      onWarmingStart: options.onWarmingStart || (() => {}),
      onWarmingComplete: options.onWarmingComplete || (() => {}),
      onWarmingError: options.onWarmingError || (() => {}),
    };
  }
  
  
  
  /**
   * Stop any pending warming operations
   */
  stopDetection() {
    if (this.warmingTimer) {
      clearTimeout(this.warmingTimer);
      this.warmingTimer = null;
    }
  }
  
  
  
  
  
  /**
   * Handle user interaction (touch/click)
   */
  handleUserInteraction() {
    this.triggerWarmCall('interaction');
  }
  
  /**
   * Trigger warm call from user interaction
   */
  triggerWarmCall() {
    // Don't queue new warm call if already warming
    if (this.isWarming) {
      console.info(`[Warming] Warm call already in progress, skipping interaction`);
      return;
    }
    
    // Clear any existing warming timer
    if (this.warmingTimer) {
      clearTimeout(this.warmingTimer);
    }
    
    // Calculate remaining cooldown time based on last successful warming
    const now = Date.now();
    const timeSinceLastSuccessfulWarming = now - this.lastSuccessfulWarmingTime;
    const remainingCooldown = Math.max(0, this.config.cooldownPeriod - timeSinceLastSuccessfulWarming);
    
    if (remainingCooldown > 0) {
      console.info(`[Warming] Queueing warm call in ${remainingCooldown}ms (trigger: interaction)`);
      this.warmingTimer = setTimeout(() => {
        this.warmReplicateAPI();
        this.warmingTimer = null;
      }, remainingCooldown);
    } else {
      // No cooldown, fire immediately
      this.warmReplicateAPI();
    }
  }
  
  /**
   * Check if API warming is needed based on cooldown
   * @returns {boolean} True if warming should occur
   */
  shouldWarmAPI() {
    const now = Date.now();
    const timeSinceLastSuccessfulWarming = now - this.lastSuccessfulWarmingTime;
    
    return !this.isWarming && timeSinceLastSuccessfulWarming > this.config.cooldownPeriod;
  }
  
  /**
   * Warm the Replicate API with a dummy call
   */
  async warmReplicateAPI() {
    if (this.isWarming) {
      return;
    }
    
    console.info('[Warming] Making warm call to Replicate API');
    this.isWarming = true;
    
    this.config.onWarmingStart();
    
    try {
      // Create a minimal dummy image for warming
      const dummyImage = this.createDummyImage();
      
      // Send warming request to the API
      const response = await fetch('/api/predictions/warm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: dummyImage,
          target: '/gifs/thumbs_up.gif' // Use a small, reliable GIF
        }),
      });
      
      if (!response.ok) {
        this.config.onWarmingError(new Error(`Warming failed: ${response.status}`));
        return;
      }
      
      const prediction = await response.json();
      
      // Log the returned logs to browser console
      if (prediction.logs) {
        prediction.logs.forEach(log => console.info(`[Warming] ${log}`));
      }
      
      // Poll for completion like the real prediction process
      let finalPrediction = prediction;
      
      while (finalPrediction.status !== 'succeeded' && finalPrediction.status !== 'failed') {
        // Wait 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check prediction status
        const statusResponse = await fetch(`/api/predictions/${prediction.predictionId}`);
        if (statusResponse.ok) {
          finalPrediction = await statusResponse.json();
        } else {
          throw new Error('Failed to check warming prediction status');
        }
      }
      
      // Start cooldown timer after prediction is actually complete
      this.lastWarmingTime = Date.now();
      
      if (finalPrediction.status === 'succeeded') {
        console.info('[Warming] Warm call completed successfully');
        // Only set successful warming time on success
        this.lastSuccessfulWarmingTime = Date.now();
        this.config.onWarmingComplete();
      } else {
        console.info(`[Warming] Warming prediction failed: ${finalPrediction.error || 'Unknown error'}`);
        this.config.onWarmingError(new Error(`Warming prediction failed: ${finalPrediction.error || 'Unknown error'}`));
      }
      
    } catch (error) {
      // Start cooldown timer even if error occurs
      this.lastWarmingTime = Date.now();
      console.info(`[Warming] Warming error: ${error.message}`);
      this.config.onWarmingError(error);
    } finally {
      this.isWarming = false;
    }
  }
  
  /**
   * Create a minimal dummy image for API warming
   * @returns {string} Base64 encoded dummy image
   */
  createDummyImage() {
    // Create a small canvas with a simple pattern
    const dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = 64;
    dummyCanvas.height = 64;
    const ctx = dummyCanvas.getContext('2d');
    
    // Draw a simple pattern that resembles a face
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 64, 64);
    
    // Simple face-like pattern
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, 8, 8); // Eye
    ctx.fillRect(36, 20, 8, 8); // Eye
    ctx.fillRect(28, 36, 8, 4); // Mouth
    
    return dummyCanvas.toDataURL('image/jpeg', 0.7);
  }
  
  /**
   * Freeze warming - prevents any warming calls during actual picture processing
   */
  freezeWarming() {
    this.isWarming = true;
    console.info('[Warming] Warming frozen - user taking picture');
  }

  /**
   * Reset warming cooldown after actual API call is completed
   */
  resetWarmingCooldown() {
    this.isWarming = false;
    this.lastSuccessfulWarmingTime = Date.now();
    console.info('[Warming] Cooldown reset - actual API call completed');
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Get current status
   * @returns {Object} Current status information
   */
  getStatus() {
    return {
      isWarming: this.isWarming,
      lastWarmingTime: this.lastWarmingTime,
      timeSinceLastWarming: Date.now() - this.lastWarmingTime,
      timeSinceLastSuccessfulWarming: Date.now() - this.lastSuccessfulWarmingTime,
      canWarm: this.shouldWarmAPI()
    };
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.stopDetection();
  }
}