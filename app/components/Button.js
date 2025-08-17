'use client';

export default function Button({
  children,
  onClick,
  className = "",
  position = "bottom-10",
  size = "default",
  disabled = false
}) {
  const sizeClasses = {
    small: "text-sm px-4 py-2",
    default: "text-base px-6 py-3",
    large: "text-lg px-8 py-4"
  };

  return (
    <div className={`absolute bottom-[4%] left-1/2 transform -translate-x-1/2 ${disabled ? 'inactive cursor-not-allowed' : 'cursor-pointer'} ${className}`} onClick={!disabled ? onClick : undefined}>
      <button
        className={`flex justify-center items-center meme-button`}
        disabled={disabled}
      >
        {children}
      </button>
      <div className={`meme-button-base`}></div>
    </div>
  );
}