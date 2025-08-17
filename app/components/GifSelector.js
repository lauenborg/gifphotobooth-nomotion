'use client';

import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import Image from "next/image";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay'
import { gsap } from 'gsap';
import Button from './Button';

const GifSelector = forwardRef(function GifSelector({
  gifs,
  selectedGif,
  onGifSelect,
  onScreenClick,
  capturedImage,
  buttonIcon = 'select',
  buttonDisabled = false
}, ref) {
  const gifsContainerRef = useRef(null);
  const emblaContainerRef = useRef(null);
  const autoplayRef = useRef(Autoplay({ 
    delay: 50,
    jump: false,
    stopOnInteraction: true,
    stopOnMouseEnter: true,
    playOnInit: true
  }));
  const inactivityTimerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    animateIn: () => {
      // Reset the embla container position first
      if (emblaContainerRef.current) {
        gsap.set(emblaContainerRef.current, { x: 0 });
      }

      if (gifsContainerRef.current) {
        const gifSlides = gifsContainerRef.current.querySelectorAll('.embla__slide');

        gsap.from(gifSlides, {
          opacity: 0,
          y: 100,
        });

        gsap.to(gifSlides, {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.08,
          ease: "back.inOut(1.7)",
        });
      }
    },
    animateOut: () => {
      if (emblaContainerRef.current) {
        gsap.to(emblaContainerRef.current, {
          x: "-100vw",
          duration: 0.8,
          ease: "power2.inOut"
        });
      }
    }
  }));
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    dragFree: true,
    skipSnaps: true,
    duration: 30000
  }, [autoplayRef.current]);

  // Handle restarting autoplay after inactivity
  const restartAutoplayAfterDelay = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    inactivityTimerRef.current = setTimeout(() => {
      if (autoplayRef.current && emblaApi) {
        // Clear selected GIF when autoplay restarts
        onGifSelect(null, capturedImage);
        autoplayRef.current.play();
      }
    }, 5000); // Restart after 5 seconds of inactivity
  };

  useEffect(() => {
    if (emblaApi) {
      // Set up event listeners for interactions
      const onPointerDown = () => {
        if (autoplayRef.current) {
          autoplayRef.current.stop();
        }
        restartAutoplayAfterDelay();
      };

      const onMouseEnter = () => {
        if (autoplayRef.current) {
          autoplayRef.current.stop();
        }
        restartAutoplayAfterDelay();
      };

      const onMouseLeave = () => {
        restartAutoplayAfterDelay();
      };

      emblaApi.on('pointerDown', onPointerDown);
      
      // Add mouse enter/leave to the embla container
      const emblaContainer = emblaApi.containerNode();
      if (emblaContainer) {
        emblaContainer.addEventListener('mouseenter', onMouseEnter);
        emblaContainer.addEventListener('mouseleave', onMouseLeave);
      }

      return () => {
        emblaApi.off('pointerDown', onPointerDown);
        if (emblaContainer) {
          emblaContainer.removeEventListener('mouseenter', onMouseEnter);
          emblaContainer.removeEventListener('mouseleave', onMouseLeave);
        }
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    }
  }, [emblaApi]);

  const handleGifClick = (e, gif) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent default touch behavior
    onGifSelect(gif, capturedImage);
    let deg;
    do {
      deg = Math.random() * 6 - 3;   // -3…+2, could be 0
    } while (deg < 0.5 && deg > -0.5);

    e.currentTarget.style.setProperty('--r', `${deg}deg`);
  };

  const handleGifTouch = (e, gif) => {
    // Handle touch events for mobile/iPad
    e.stopPropagation();
    e.preventDefault();
    onGifSelect(gif, capturedImage);
    let deg;
    do {
      deg = Math.random() * 6 - 3;   // -3…+2, could be 0
    } while (deg < 0.5 && deg > -0.5);

    e.currentTarget.style.setProperty('--r', `${deg}deg`);
  };

  const handleSelectGifClick = () => {
    // Don't do anything if button is disabled
    if (buttonDisabled) return;
    
    // Animate out the carousel first
    if (emblaContainerRef.current) {
      gsap.to(emblaContainerRef.current, {
        x: "-100vw",
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          // Call the screen click handler after animation
          onScreenClick();
        }
      });
    } else {
      // Fallback if ref is not available
      onScreenClick();
    }
  };

  return (
    <div className="absolute h-full w-full flex justify-center items-center z-30">
      <div className="embla w-full h-full flex items-center overflow-hidden" ref={emblaContainerRef}>
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container flex" ref={gifsContainerRef}>
            {gifs.map((gif) => (
              <div key={gif} className="embla__slide flex-none w-auto px-2">
                <div 
                  className={`win98popup shadow  gif ${selectedGif === gif ? 'gif-selected' : ''}`} 
                  onClick={(e) => handleGifClick(e, gif)}
                  onTouchEnd={(e) => handleGifTouch(e, gif)}
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className="bar">
                    <p>{gif}</p>
                    <button className="shadow">
                      <svg xmlns="http://www.w3.org/2000/svg" className="opacity-25" width="8px" height="7px" viewBox="0 0 8 7" fillRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2"><path d="M1 6V5h1V4h1V3h2v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1zm0-4V1H0V0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H2V2H1z" /></svg>
                    </button>
                  </div>
                  <section className="w-full gif_selector">
                    <Image
                      src={`/gifs/${gif}`}
                      alt={gif}
                      width={200}
                      height={200}
                      className="object-cover"
                      priority={true}
                      unoptimized={true}
                      loading="eager"
                    />
                  </section>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSelectGifClick} 
        position="bottom-20"
        disabled={buttonDisabled}
      >
        <Image src={`/svg/${buttonIcon}.svg`} alt={buttonIcon} width={32} height={32} className="w-[50%]" />
      </Button>
    </div>
  );
});

export default GifSelector;