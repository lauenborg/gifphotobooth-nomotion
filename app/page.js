'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';
import GifSelector from './components/GifSelector';
import Camera from './components/Camera';
import ResultOverlay from './components/ResultOverlay';
import Button from './components/Button';
import { CameraMotionWarmer } from './utils/CameraMotionWarmer';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedGif, setSelectedGif] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const [result, setResult] = useState(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [countdownProcess, setCountdownProcess] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isOverlayAnimating, setIsOverlayAnimating] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [gifsLoaded, setGifsLoaded] = useState(false);
  const [headerText, setHeaderText] = useState('Choose a gif');
  const [buttonIcon, setButtonIcon] = useState('select');
  const [showCamera, setShowCamera] = useState(false);

  const [shouldAnimateCameraOut, setShouldAnimateCameraOut] = useState(false);
  const [showCapturedImage, setShowCapturedImage] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showIris, setShowIris] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const gifSelectorRef = useRef(null);
  const overlayAnimationRef = useRef(null);
  const audioRef = useRef(null);
  const motionWarmerRef = useRef(null);
  const cameraTimeoutRef = useRef(null);
  const [warmingLogs, setWarmingLogs] = useState([]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === 'memebership') {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
      setPasswordInput('');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    startCamera();
    loadGifs();

    // Create audio element for camera sound
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/camera-shutter.mp3');
      audioRef.current.volume = 0.5;
    }

    // Initialize motion warmer for touch/click events only
    if (typeof window !== 'undefined') {
      motionWarmerRef.current = new CameraMotionWarmer({
        cooldownPeriod: 45000, // 45 seconds between warming calls

        // Callbacks
        onWarmingStart: () => {
          // Model warming started
        },
        onWarmingComplete: (logs) => {
          // Model warming completed
          if (logs) setWarmingLogs(prev => [...prev, ...logs]);
        },
        onWarmingError: (error, logs) => {
          // Model warming failed
          if (logs) setWarmingLogs(prev => [...prev, ...logs]);
        }
      });
    }

    // Set up touch/click listeners for user interaction warm calls
    const handleUserInteraction = () => {
      if (motionWarmerRef.current) {
        motionWarmerRef.current.triggerWarmCall();
      }
    };

    // Add touch and click event listeners
    if (typeof window !== 'undefined') {
      document.addEventListener('touchstart', handleUserInteraction);
      document.addEventListener('click', handleUserInteraction);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (motionWarmerRef.current) {
        motionWarmerRef.current.destroy();
      }
      if (cameraTimeoutRef.current) {
        clearTimeout(cameraTimeoutRef.current);
      }

      // Clean up event listeners
      if (typeof window !== 'undefined') {
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('click', handleUserInteraction);
      }
    };
  }, [isAuthenticated]);

  const generateFallbackGifs = async () => {
    // Try to get actual available GIF files from the server
    try {
      const response = await fetch('/api/available-gifs');
      if (response.ok) {
        const { gifs } = await response.json();
        return gifs;
      }
    } catch (error) {
      console.log('Could not fetch available GIFs, using numbered fallback');
    }

    // If we can't get the actual files, create numbered fallbacks
    const numberedGifs = [];
    for (let i = 1; i <= 20; i++) {
      numberedGifs.push(`gif-${i}.gif`);
    }
    return numberedGifs;
  };

  const loadGifs = async () => {
    try {
      const response = await fetch('/api/gifs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.gifs && data.gifs.length > 0) {
        // Set GIFs immediately and preload in background
        setGifs(data.gifs);
        // Preload all images in background
        preloadImages(data.gifs).then(() => {
          setGifsLoaded(true);
          console.log('All GIFs preloaded successfully');
          // Trigger animation after GIFs are preloaded
          setTimeout(() => {
            if (gifSelectorRef.current) {
              gifSelectorRef.current.animateIn();
            }
          }, 300);
        }).catch((error) => {
          console.error('Error preloading images:', error);
          // Still trigger animation even if preloading fails
          setTimeout(() => {
            if (gifSelectorRef.current) {
              gifSelectorRef.current.animateIn();
            }
          }, 300);
        });
      } else {
        // Fallback to dynamic GIF list if API fails
        const fallbackGifs = await generateFallbackGifs();
        setGifs(fallbackGifs);
        // Preload fallback images in background
        preloadImages(fallbackGifs).then(() => {
          setGifsLoaded(true);
          console.log('Fallback GIFs preloaded successfully');
          // Trigger animation after fallback GIFs are preloaded
          setTimeout(() => {
            if (gifSelectorRef.current) {
              gifSelectorRef.current.animateIn();
            }
          }, 300);
        }).catch((error) => {
          console.error('Error preloading fallback images:', error);
          // Still trigger animation even if preloading fails
          setTimeout(() => {
            if (gifSelectorRef.current) {
              gifSelectorRef.current.animateIn();
            }
          }, 300);
        });
      }
    } catch (error) {
      console.error('Failed to load gifs:', error);
      // Fallback to dynamic GIF list
      const fallbackGifs = await generateFallbackGifs();
      setGifs(fallbackGifs);
      // Preload fallback images in background
      preloadImages(fallbackGifs).then(() => {
        setGifsLoaded(true);
        console.log('Catch block - Fallback GIFs preloaded successfully');
        // Trigger animation after catch block fallback GIFs are preloaded
        setTimeout(() => {
          if (gifSelectorRef.current) {
            gifSelectorRef.current.animateIn();
          }
        }, 300);
      }).catch((error) => {
        console.error('Error preloading catch block fallback images:', error);
        // Still trigger animation even if preloading fails
        setTimeout(() => {
          if (gifSelectorRef.current) {
            gifSelectorRef.current.animateIn();
          }
        }, 300);
      });
    }
  };

  const preloadImages = (imageArray) => {
    return Promise.all(
      imageArray.map((gifName) => {
        return new Promise((resolve, reject) => {
          const img = document.createElement('img');
          img.onload = () => {
            // Clean up the image element after loading
            img.onload = null;
            img.onerror = null;
            img.src = '';
            resolve();
          };
          img.onerror = () => {
            // Clean up the image element on error
            img.onload = null;
            img.onerror = null;
            img.src = '';
            reject();
          };
          img.src = `/gifs/${gifName}`;
        });
      })
    );
  };



  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);




  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        },
        audio: false
      });

      setStream(mediaStream);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError(`Camera access failed: ${err.message}`);
    }
  };

  const startCountdown = () => {
    // Clear camera timeout since user is taking picture
    clearCameraTimeout();

    // Freeze warming since we're about to make the actual API call
    if (motionWarmerRef.current) {
      motionWarmerRef.current.freezeWarming();
    }

    setHeaderText('Get ready!');
    setCountdown(3);
    setCountdownProcess(0);

    let currentSecond = 0;
    const startTime = Date.now();

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          clearInterval(processTimer);
          setCountdownProcess(0);
          capturePhoto();
          return 0;
        }
        currentSecond++;
        return prev - 1;
      });
    }, 1000);

    // Process counter from 0-100 each second
    const processTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentSecondElapsed = elapsed % 1000;
      const progress = (currentSecondElapsed / 1000) * 100;
      setCountdownProcess(progress);
    }, 16); // ~60fps

  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Wait for next frame to ensure fresh capture
      requestAnimationFrame(() => {
        // Trigger iris effect
        setShowIris(true);
        setTimeout(() => setShowIris(false), 800);

        // Trigger flash effect
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 750);

        // Play camera sound
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }

        const ctx = canvas.getContext('2d');

        // Calculate square dimensions from center
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const squareSize = Math.min(videoWidth, videoHeight);
        const offsetX = (videoWidth - squareSize) / 2;
        const offsetY = (videoHeight - squareSize) / 2;

        // Set canvas to square dimensions
        canvas.width = squareSize;
        canvas.height = squareSize;

        // Flip the image horizontally to match the preview
        ctx.scale(-1, 1);
        // Draw the cropped square from center of video
        ctx.drawImage(
          video,
          offsetX, offsetY, squareSize, squareSize, // source rectangle (crop from center)
          -squareSize, 0, squareSize, squareSize    // destination rectangle (flipped)
        );

        const imageDataUrl = canvas.toDataURL('image/png');
        setCapturedImage(imageDataUrl);
        setShowCapturedImage(true);

        // Auto-process since GIF is already selected in this new flow
        if (selectedGif) {
          setTimeout(() => processImages(imageDataUrl, selectedGif), 500);
        }
      });
    }
  };

  const resetToCamera = () => {
    // Don't reset if overlay is still animating
    if (isOverlayAnimating) {
      return;
    }

    // Clear any camera timeout since we're resetting
    clearCameraTimeout();

    // Reset all state - no camera animation needed here since overlay handles its own exit
    setCapturedImage(null);
    setShowCapturedImage(false);
    setResult(null);
    setShowOverlay(false);
    setSelectedGif(null);
    setShowCamera(false);
    setShouldAnimateCameraOut(false);
    setHeaderText('Choose a gif');
    setButtonIcon('select');

    // Animate GIFs back in after a short delay
    setTimeout(() => {
      if (gifSelectorRef.current) {
        gifSelectorRef.current.animateIn();
      }
    }, 300);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const processImages = async (image = capturedImage, gif = selectedGif) => {
    if (!image || !gif || processingRef.current) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setResult(null);
    setHeaderText('Creating your GIF...');

    try {

      // Step 1: Create the prediction
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: image,
          target: `/gifs/${gif}`
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);

        try {
          const errorJson = JSON.parse(errorText);
          setResult({ error: errorJson.error || 'API request failed' });
        } catch {
          setResult({ error: `API request failed: ${response.status} ${response.statusText}` });
        }
        return;
      }

      const prediction = await response.json();

      // Step 2: Poll for completion
      let finalPrediction = prediction;

      while (finalPrediction.status !== 'succeeded' && finalPrediction.status !== 'failed') {
        console.log('Prediction status:', finalPrediction.status);
        setResult({
          ...finalPrediction,
          message: `Processing... Status: ${finalPrediction.status}`
        });

        // Wait 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check prediction status
        const statusResponse = await fetch(`/api/predictions/${prediction.id}`);
        if (statusResponse.ok) {
          finalPrediction = await statusResponse.json();
        } else {
          throw new Error('Failed to check prediction status');
        }
      }

      console.log('Final prediction result:', finalPrediction);

      // Check if prediction failed and normalize the error
      if (finalPrediction.status === 'failed' || finalPrediction.error) {
        const errorMessage = finalPrediction.error ||
          (finalPrediction.logs && finalPrediction.logs.length > 0 ?
            finalPrediction.logs[finalPrediction.logs.length - 1] :
            'Prediction failed');

        setResult({
          ...finalPrediction,
          error: errorMessage
        });
        setHeaderText('Something went wrong');
      } else if (finalPrediction.status === 'succeeded' && finalPrediction.output) {
        setResult(finalPrediction);
        setHeaderText('Your GIF is ready!');
      } else {
        // Handle unexpected states
        setResult({
          ...finalPrediction,
          error: 'Unexpected prediction state'
        });
        setHeaderText('Something went wrong');
      }
      setButtonIcon('back');

      // Don't set showOverlay immediately - let it be handled after camera animation

    } catch (err) {
      console.error('Error processing images:', err);
      setResult({ error: `Network error: ${err.message}` });
      setHeaderText('Something went wrong');
      setButtonIcon('back');

      // Don't set showOverlay immediately - let it be handled after camera animation
    } finally {
      // Complete reset of all states at page level
      processingRef.current = false;
      setIsProcessing(false);
      // DON'T clear capturedImage or showCapturedImage here - let animation callback handle it
      setSelectedGif(null);
      setCountdown(0);
      setButtonIcon('back');

      // Reset warming cooldown since actual API call is completed
      if (motionWarmerRef.current) {
        motionWarmerRef.current.resetWarmingCooldown();
      }
    }
  };

  const handleScreenClick = () => {
    if (showOverlay) {
      // Use the overlay's animation function instead of directly resetting
      if (overlayAnimationRef.current) {
        overlayAnimationRef.current();
      } else {
        // Fallback if ref isn't set yet
        resetToCamera();
      }
    } else if (showCamera && selectedGif && !capturedImage && !countdown) {
      startCountdown();
    }
  };


  // Handle showing overlay after result is ready
  useEffect(() => {
    if (result && !showOverlay && !isProcessing) {
      // If camera is visible, trigger its exit animation
      if (showCamera) {
        setShouldAnimateCameraOut(true);
      } else {
        // Don't immediately show overlay here - let the animation callback handle it
      }
    }
  }, [result, showOverlay, isProcessing, showCamera]);

  // Handle camera timeout animation complete
  const handleCameraTimeoutAnimateOutComplete = useCallback(() => {
    setShouldAnimateCameraOut(false);
    setShowCamera(false);
    setSelectedGif(null);
    setHeaderText('Choose a gif');
    setButtonIcon('select');

    // Animate GIFs back in
    setTimeout(() => {
      if (gifSelectorRef.current) {
        gifSelectorRef.current.animateIn();
      }
    }, 300);
  }, []);

  // Handle camera animation complete - this is when we show the overlay
  const handleCameraAnimateOutComplete = useCallback(() => {
    // Check if this is a timeout animation (no result) or regular processing animation
    if (!result) {
      // This is a timeout - use the timeout handler
      handleCameraTimeoutAnimateOutComplete();
      return;
    }

    setShouldAnimateCameraOut(false);
    setShowCamera(false);

    // Now safe to clear captured image since animation is done
    setCapturedImage(null);
    setShowCapturedImage(false);

    // Now it's safe to restart the camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setTimeout(() => {
        startCamera();
      }, 200);
    }

    // Add a small delay before showing overlay to let camera animation be more visible
    setTimeout(() => {
      setShowOverlay(true);
    }, 50);
  }, [stream, result, handleCameraTimeoutAnimateOutComplete]);

  // Update header and button text based on current state
  useEffect(() => {
    if (!capturedImage && !countdown && !isProcessing && !showOverlay && !showCamera && !result) {
      setHeaderText('Choose a gif');
      setButtonIcon('select');
    }
  }, [capturedImage, countdown, isProcessing, showOverlay, showCamera, result]);

  const handleGifSelect = (gif, image) => {
    setSelectedGif(gif);
    // Don't auto-process anymore, just select the GIF
  };

  const startCameraTimeout = () => {
    // Clear any existing timeout
    if (cameraTimeoutRef.current) {
      clearTimeout(cameraTimeoutRef.current);
    }

    // Set 30-second timeout
    cameraTimeoutRef.current = setTimeout(() => {
      returnToGifSelection();
    }, 30000);
  };

  const clearCameraTimeout = () => {
    if (cameraTimeoutRef.current) {
      clearTimeout(cameraTimeoutRef.current);
      cameraTimeoutRef.current = null;
    }
  };

  const returnToGifSelection = () => {
    // Clear the timeout
    clearCameraTimeout();

    // Animate camera out first
    setShouldAnimateCameraOut(true);
  };

  const handleSelectGifButtonClick = () => {
    if (!selectedGif) return;

    // Show camera mode after GIF selection
    setShowCamera(true);
    setHeaderText('SAY CHEEEEEESE');
    setButtonIcon('camera');

    // Start 30-second timeout to return to GIF selection
    startCameraTimeout();

    // Animate GIFs out
    if (gifSelectorRef.current) {
      gifSelectorRef.current.animateOut();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh w-dvw flex items-center justify-center p-4 overflow-hidden">
        <div>
          <div className="bg-burst"></div>
          <div className="bg-colorchange"></div>
          <div className="bg-overlay"></div>
        </div>
        <div className="max-w-lg w-full z-50">
          <div className="win98popup shadow">
            <div className="bar">
              <p>Authentication Required</p>
            </div>
            <section className="p-4 w-full">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Enter Password:
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="shadow-inv w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                    autoFocus
                  />
                </div>
                {passwordError && (
                  <div className="text-red-500 text-sm">{passwordError}</div>
                )}
                <button className="shadow" style={{ "margin-left": 0 }}>
                  <p className="mx-3 my-1"><u>E</u>nter</p>
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh relative overflow-hidden">

      <div>
        <div className="bg-burst"></div>
        <div className="bg-colorchange"></div>
        <div className="bg-overlay"></div>
      </div>
      <div className="absolute flex justify-self-center top-1/12  meme-text">
        <h2 className='text-6xl uppercase '>{headerText}</h2>
        <h2 className='text-6xl uppercase '>{headerText}</h2>
        <h2 className='text-6xl uppercase '>{headerText}</h2>
      </div>

      <Camera
        ref={videoRef}
        stream={stream}
        countdown={countdown}
        countdownProcess={countdownProcess}
        onScreenClick={handleScreenClick}
        cameraError={cameraError}
        showCamera={showCamera}
        capturedImage={capturedImage}
        showCapturedImage={showCapturedImage}
        isProcessing={isProcessing}
        shouldAnimateOut={shouldAnimateCameraOut}
        onAnimateOutComplete={handleCameraAnimateOutComplete}
        showIris={showIris}
      />

      {!showOverlay && !showCamera && (
        <GifSelector
          ref={gifSelectorRef}
          gifs={gifs}
          selectedGif={selectedGif}
          onGifSelect={handleGifSelect}
          onScreenClick={handleSelectGifButtonClick}
          capturedImage={capturedImage}
          buttonIcon={buttonIcon}
          buttonDisabled={!selectedGif}
        />
      )}

      {((!showOverlay && showCamera) || showOverlay) && (
        <Button
          onClick={handleScreenClick}
          disabled={countdown > 0 || isProcessing}
          className={showOverlay ? "z-[60]" : ""}
        >
          <Image src={`/svg/${buttonIcon}.svg`} alt={buttonIcon} width={64} height={64} className="w-[50%]" />
        </Button>
      )}

      {showOverlay && (
        <ResultOverlay
          result={result}
          onTryAgain={resetToCamera}
          onAnimationComplete={resetToCamera}
          showOverlay={showOverlay}
          onAnimationStart={() => setIsOverlayAnimating(true)}
          onAnimationEnd={() => setIsOverlayAnimating(false)}
          onMainButtonClick={overlayAnimationRef}
        />
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Camera flash overlay */}
      {showFlash && (
        <div
          className="fixed inset-0 bg-white z-[70] pointer-events-none"
          style={{
            animation: 'flash 0.75s ease-out',
          }}
        />
      )}

      <style jsx>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
