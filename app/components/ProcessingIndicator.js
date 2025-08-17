'use client';

import Image from "next/image";

export default function ProcessingIndicator({ isProcessing }) {
  if (!isProcessing) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="text-white text-4xl font-bold">
        <Image 
          src="/loading.gif" 
          width={333} 
          height={243} 
          alt="Homer Simpson Running" 
          className="w-50"
        />
      </div>
    </div>
  );
}