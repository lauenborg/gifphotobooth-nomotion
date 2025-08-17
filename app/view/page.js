'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '../components/Button';
import Image from "next/image";

function ViewPageContent() {
  const [gifData, setGifData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const gifId = searchParams.get('id');

  useEffect(() => {
    if (!gifId) {
      setError('No GIF ID provided');
      setIsLoading(false);
      return;
    }

    loadGifData(gifId);
  }, [gifId]);

  const loadGifData = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/visitcards?id=${id}`);

      if (!response.ok) {
        throw new Error('GIF not found');
      }

      const data = await response.json();
      setGifData(data);

      // Update meta tags for social sharing
      updateMetaTags(data);

    } catch (error) {
      console.error('Error loading GIF:', error);
      setError('Sorry, this GIF could not be found or has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMetaTags = (data) => {
    // Update page title
    document.title = `GIF Photobooth - ${new Date(data.created_at).toLocaleDateString()}`;

    // Update meta tags for social sharing
    const updateMeta = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('og:title', `GIF Photobooth Creation - ${new Date(data.created_at).toLocaleDateString()}`);
    updateMeta('og:description', 'Check out this awesome GIF created with our photobooth!');
    updateMeta('og:image', data.storage_url);
    updateMeta('og:type', 'website');
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(gifData.storage_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'photobooth-gif.gif';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback - open in new tab
      window.open(gifData.storage_url, '_blank');
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 ">
      <div className>
        <div className="bg-burst"></div>
        <div className="bg-colorchange"></div>
        <div className="bg-overlay"></div>
      </div>
      <div className="max-w-lg w-full text-center z-50">
        <div className="win98popup shadow  gif">
          <div className="bar">
            <p>Memebership ID</p>
            <button className="shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="opacity-25" width="8px" height="7px" viewBox="0 0 8 7" fillRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2"><path d="M1 6V5h1V4h1V3h2v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1zm0-4V1H0V0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H2V2H1z" /></svg>
            </button>
          </div>
          <section className="w-full">
            {isLoading ? <Image
              src="/doneLoading.gif"
              alt="Generated GIF"
              width={200}
              height={200}
              className="w-full h-full object-cover"
              priority={true}
              unoptimized={true}
              loading="eager"
            /> : error ? <Image src="/error.gif"
              alt="Generated GIF"
              width={200}
              height={200}
              className="w-full h-full object-cover"
              priority={true}
              unoptimized={true}
              loading="eager" /> : <Image src={gifData.storage_url}
                alt="Generated GIF"
                width={200}
                height={200}
                className="w-full h-full object-cover"
                priority={true}
                unoptimized={true}
                loading="eager" />}

          </section>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className>
        <div className="bg-burst"></div>
        <div className="bg-colorchange"></div>
        <div className="bg-overlay"></div>
      </div>
      <div className="max-w-lg w-full text-center z-50">
        <div className="win98popup shadow gif">
          <div className="bar">
            <p>loading.gif</p>
            <button className="shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="opacity-25" width="8px" height="7px" viewBox="0 0 8 7" fillRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2"><path d="M1 6V5h1V4h1V3h2v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1zm0-4V1H0V0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H2V2H1z" /></svg>
            </button>
          </div>
          <section className="w-full">
            <Image
              src="/doneLoading.gif"
              alt="Loading GIF"
              width={200}
              height={200}
              className="w-full h-full object-cover"
              priority={true}
              unoptimized={true}
              loading="eager"
            />
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ViewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ViewPageContent />
    </Suspense>
  );
}