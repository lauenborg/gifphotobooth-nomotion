'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import { gsap } from 'gsap';

export default function ResultOverlay({ result, onTryAgain, showOverlay, onAnimationComplete, onAnimationStart, onAnimationEnd, onMainButtonClick }) {

  const [visitcard, setVisitcard] = useState(null);
  const [isCreatingVisitcard, setIsCreatingVisitcard] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const hasProcessedRef = useRef(false);
  const currentResultIdRef = useRef(null);
  const hasAnimatedInRef = useRef(false);
  const overlayRef = useRef(null);
  const gifPopupRef = useRef(null);
  const qrPopupRef = useRef(null);

  // Only process once per result
  useEffect(() => {
    // If this is a new result, reset the processing flag
    if (result?.id && result.id !== currentResultIdRef.current) {
      currentResultIdRef.current = result.id;
      hasProcessedRef.current = false;
      hasAnimatedInRef.current = false; // Reset animation flag for new result
      setVisitcard(null);
      setIsCreatingVisitcard(false);
    }

    // Only create visitcard if we haven't processed this result yet
    if (result?.output &&
      !hasProcessedRef.current &&
      !isCreatingVisitcard &&
      isValidUrl(result.output)) {

      hasProcessedRef.current = true;
      createVisitcard(result.output);
    }
  }, [result?.id, result?.output, isCreatingVisitcard]);

  // Animate in when overlay shows
  useEffect(() => {
    if (showOverlay && gifPopupRef.current && !hasAnimatedInRef.current) {
      hasAnimatedInRef.current = true;

      // Initial state is already set in CSS, no need for gsap.set()

      // Create staggered entrance timeline
      const entranceTl = gsap.timeline();

      entranceTl.to(gifPopupRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: "back.out(1.2)"
      }, 0.5);
      
      // Only animate QR popup if it exists (no error)
      if (qrPopupRef.current) {
        entranceTl.to(qrPopupRef.current, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "back.out(1.2)"
        }, 0.7);
      }
    }
  }, [showOverlay]);

  // Expose handleTryAgain to parent component
  useEffect(() => {
    if (onMainButtonClick) {
      onMainButtonClick.current = handleTryAgain;
    }
  }, [onMainButtonClick]);

  // Handle try again with animation
  const handleTryAgain = () => {
    if (isAnimatingOut || !gifPopupRef.current) return;

    setIsAnimatingOut(true);

    // Notify parent that animation is starting
    if (onAnimationStart) {
      onAnimationStart();
    }

    // Create staggered exit timeline
    const exitTl = gsap.timeline({
      onComplete: () => {
        // Animation is complete, now we can safely reset
        setIsAnimatingOut(false);

        // Notify parent that animation has ended
        if (onAnimationEnd) {
          onAnimationEnd();
        }

        // Call the callback to tell parent animation is done
        if (onAnimationComplete) {
          onAnimationComplete();
        } else {
          // Fallback to old behavior
          onTryAgain();
        }
      }
    });

    // Animate QR popup out first if it exists (reverse order of entrance)
    if (qrPopupRef.current) {
      exitTl.to(qrPopupRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.4,
        ease: "power2.in"
      }, 0);
    }
    
    // Always animate GIF popup out
    exitTl.to(gifPopupRef.current, {
      opacity: 0,
      scale: 0.8,
      duration: 0.4,
      ease: "power2.in"
    }, qrPopupRef.current ? 0.15 : 0);
  };

  // Only render when we have a result
  if (!result) return null;

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const createVisitcard = async (gifUrl) => {
    setIsCreatingVisitcard(true);
    try {
      const response = await fetch('/api/visitcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gifUrl: gifUrl,
          metadata: {
            createdAt: new Date().toISOString(),
            originalUrl: gifUrl
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVisitcard(data);
      } else {
        console.error('Failed to create visitcard:', response.statusText);
        // If Supabase isn't configured, we'll just fall back to the original URL
      }
    } catch (error) {
      console.error('Error creating visitcard:', error);
    } finally {
      setIsCreatingVisitcard(false);
    }
  };


  return (
    <div ref={overlayRef} className="absolute inset-0 flex items-center justify-center z-50">
      <div ref={gifPopupRef} className="win98popup shadow gif" style={{ opacity: 0, transform: 'scale(0.8)' }}>
        <div className="bar">
          <p>{result.error ? "error_loading.gif" : result.output ? "you.gif" : "loading.gif"}</p>
          <button className="shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="opacity-25" width="8px" height="7px" viewBox="0 0 8 7" fillRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2"><path d="M1 6V5h1V4h1V3h2v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1zm0-4V1H0V0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H2V2H1z" /></svg>
          </button>
        </div>
        <section className="result_gif">
          {result.error ? <Image
            src="error.gif"
            alt="Generated GIF"
            width={200}
            height={200}
            className="w-full object-cover"
            priority={true}
            unoptimized={true}
            loading="eager"
          /> : result.output ? <Image
            src={result.output}
            alt="Generated GIF"
            width={200}
            height={200}
            className="w-full object-cover"
            priority={true}
            unoptimized={true}
            loading="eager"
          /> : <Image
            src="doneLoading.gif"
            alt="Generated GIF"
            width={200}
            height={200}
            className="w-full object-cover"
            priority={true}
            unoptimized={true}
            loading="eager"
          />}
        </section>
        {!result.error && <div ref={qrPopupRef} className="win98popup shadow gif qr" style={{ opacity: 0, transform: 'scale(0.8)' }}>
          <div className="bar">
            <p>{!visitcard ? "Loading QR code" : "Get your memebership"}</p>
            <button className="shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="opacity-25" width="8px" height="7px" viewBox="0 0 8 7" fillRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2"><path d="M1 6V5h1V4h1V3h2v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1zm0-4V1H0V0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H2V2H1z" /></svg>
            </button>
          </div>
          <section className="w-full">
            {visitcard ? <QRCodeSVG
              value={`${window.location.origin}${visitcard.viewUrl}`}
              size={160}
              level="M"
              includeMargin={true}
            /> : <Image
              src="qrloading.gif"
              alt="Loading GIF"
              width={160}
              height={160}
              className="w-full h-40 aspect-square object-cover"
              priority={true}
              unoptimized={true}
              loading="eager"
            />}
          </section>
        </div>}

      </div>
    </div >
  );
}