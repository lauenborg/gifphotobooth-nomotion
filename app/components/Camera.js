'use client';

import { forwardRef, useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';

const Camera = forwardRef(function Camera({
  stream,
  countdown,
  countdownProcess,
  onScreenClick,
  cameraError,
  showCamera,
  capturedImage,
  showCapturedImage,
  isProcessing,
  onCameraContainerRef,
  shouldAnimateOut,
  onAnimateOutComplete,
  showIris
}, videoRef) {
  const cameraContainerRef = useRef(null);
  const bouncePosition = useRef({ x: 0, y: 0 }); // Store current bounce position
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 800);
    };

    const handleResize = () => {
      checkMobile();

      // Reposition camera container to center on resize
      if (cameraContainerRef.current && showCamera) {
        const container = cameraContainerRef.current;
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        const elementWidth = window.innerWidth < 800 ? window.innerWidth / 1.1 : window.innerHeight / 2;
        const elementHeight = window.innerWidth < 800 ? window.innerWidth / 1.1 + 25 : window.innerHeight / 2 + 25;

        const centerX = (containerWidth - elementWidth) / 2;
        const centerY = (containerHeight - elementHeight) / 2;

        // Stop any bouncing animation during resize
        if (bounceAnimation.current) {
          bounceAnimation.current.kill();
          bounceAnimation.current = null;
        }

        // Update position smoothly
        gsap.to(container, {
          x: centerX,
          y: centerY,
          duration: 0.3,
          ease: "power2.out"
        });

        bouncePosition.current = { x: centerX, y: centerY };
      }
    };

    checkMobile();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [showCamera]);

  // Expose camera container ref to parent
  useEffect(() => {
    if (onCameraContainerRef) {
      onCameraContainerRef(cameraContainerRef.current);
    }
  }, [onCameraContainerRef, showCamera]);
  const bounceAnimation = useRef(null);

  // Connect stream to video element
  useEffect(() => {
    if (stream && videoRef?.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  // Initial centering with delayed entrance animation
  useEffect(() => {
    if (cameraContainerRef.current && showCamera) {
      const container = cameraContainerRef.current;
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      const elementWidth = window.innerWidth < 800 ? window.innerWidth / 1.1 : window.innerHeight / 2;
      const elementHeight = window.innerWidth < 800 ? window.innerWidth / 1.1 + 25 : window.innerHeight / 2 + 25;

      // Center and set initial scale immediately
      const centerX = (containerWidth - elementWidth) / 2;
      const centerY = (containerHeight - elementHeight) / 2;
      gsap.set(container, {
        x: centerX,
        y: centerY,
        opacity: 0,
        scale: 0.8
      });

      // Animate in with scale up after 0.5 second delay
      gsap.to(container, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        delay: 0.5,
        ease: "back.out(1.2)"
      });
    }
  }, [showCamera]);

  // GSAP positioning - handles both centering and bouncing
  useEffect(() => {
    if (cameraContainerRef.current) {
      const container = cameraContainerRef.current;
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      const elementWidth = window.innerWidth < 800 ? window.innerWidth / 1.1 : window.innerHeight / 2;
      const elementHeight = window.innerWidth < 800 ? window.innerWidth / 1.1 + 25 : window.innerHeight / 2 + 25;

      if (showCapturedImage /* && !shouldAnimateOut */) {
        // BOUNCING MODE: Start from center and bounce around (regardless of isProcessing)
        let x = (containerWidth - elementWidth) / 2;
        let y = (containerHeight - elementHeight) / 2;
        let vx = 3; // velocity x
        let vy = 2; // velocity y

        // Store initial position
        bouncePosition.current = { x, y };

        // Create bouncing animation
        bounceAnimation.current = gsap.to({}, {
          duration: 0.016, // ~60fps
          repeat: -1,
          onRepeat: () => {
            x += vx;
            y += vy;

            // Bounce off edges
            if (x <= 0 || x >= containerWidth - elementWidth) {
              vx = -vx;
              x = Math.max(0, Math.min(x, containerWidth - elementWidth));
            }
            if (y <= 0 || y >= containerHeight - elementHeight) {
              vy = -vy;
              y = Math.max(0, Math.min(y, containerHeight - elementHeight));
            }

            // Update stored position and apply transform
            bouncePosition.current = { x, y };
            gsap.set(container, { x, y });
          }
        });
      } else if (!showCapturedImage && !shouldAnimateOut) {
        // CENTERED MODE: Stop bouncing and stay centered (only when no captured image and not animating out)
        if (bounceAnimation.current) {
          bounceAnimation.current.kill();
          bounceAnimation.current = null;
        }

        // Keep centered using GSAP
        const centerX = (containerWidth - elementWidth) / 2;
        const centerY = (containerHeight - elementHeight) / 2;
        bouncePosition.current = { x: centerX, y: centerY };
        gsap.set(container, { x: centerX, y: centerY });
      }
    }

    return () => {
      if (bounceAnimation.current) {
        bounceAnimation.current.kill();
      }
    };
  }, [showCapturedImage, shouldAnimateOut]);

  // Handle animate out when shouldAnimateOut becomes true
  useEffect(() => {
    if (shouldAnimateOut && cameraContainerRef.current) {
      // Kill bounce animation immediately
      if (bounceAnimation.current) {
        bounceAnimation.current.kill();
        bounceAnimation.current = null;
      }

      // Start exit animation immediately from current position
      gsap.to(cameraContainerRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          if (onAnimateOutComplete) {
            onAnimateOutComplete();
          }
        }
      });
    }
  }, [shouldAnimateOut, onAnimateOutComplete]);

  return (
    <>
      {/* Camera Error Display */}
      {cameraError && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Camera Error: {cameraError}
        </div>
      )}

      {/* Camera Background */}
      {stream && (
        <div className={`w-full h-full absolute ${!showCamera ? "hidden" : ""}`}>
          <div
            ref={cameraContainerRef}
            className={`win98popup shadow gif h-auto absolute z-40 ${isMobile ? 'w-[90vw]' : 'w-[50vh]'}`}
            style={{ opacity: 0 }}
          >
            <div className="bar">
              <p>Photobooth.exe</p>
              <button className="shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="opacity-25" width="8px" height="7px" viewBox="0 0 8 7" fillRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2"><path d="M1 6V5h1V4h1V3h2v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1zm0-4V1H0V0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H2V2H1z" /></svg>
              </button>
            </div>
            <section className="w-full relative">
              {showCapturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="inset-0 w-full h-auto object-cover aspect-square"
                />
              ) : (
                <div>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`inset-0 w-full h-auto object-cover aspect-square scale-x-[-1]`}
                    onClick={onScreenClick}
                  />
                  {!countdown && <Image src="/svg/faceOutline.svg" width={50} height={50} alt="Face Outline" className="absolute opacity-30 top-[50%] left-[50%] translate-[-50%] w-[50%]" />}

                  {/* Countdown Overlay */}
                  {countdown > 0 && (
                    <div className="absolute flex items-center justify-center z-40 w-full h-full top-0 left-0">
                      <div className="absolute meme-text">
                        <h2 className='uppercase'>{countdown}</h2>
                        <h2 className='uppercase'>{countdown}</h2>
                        <h2 className='uppercase'>{countdown}</h2>
                      </div>
                      <svg
                        className="absolute w-[65%]"
                        viewBox="0 0 400 400"
                        style={{ transform: 'rotate(-90deg) scale(1,-1)' }}
                      >
                        <circle
                          cx="200"
                          cy="200"
                          r="180"
                          fill="none"
                          stroke="white"
                          strokeWidth="8"
                          strokeDasharray={`${(2 * Math.PI * 180) - (((2 * Math.PI * 180) / 100) * countdownProcess)} , ${(2 * Math.PI * 180)}`}
                          strokeDashoffset={0}
                        />
                      </svg>

                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      )}



    </>
  );
});

export default Camera;