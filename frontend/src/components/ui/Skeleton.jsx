import React from 'react'

// Simple Skeleton loader component
// Props: className (tailwind), width, height, rounded
export default function Skeleton({ className = '', width = 'w-full', height = 'h-4', rounded = 'rounded', style = {} }) {
  const base = `${width} ${height} ${rounded} bg-gray-200 dark:bg-zinc-700 overflow-hidden relative`;
  return (
    <div className={`${base} ${className}`} style={style} aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-30 dark:via-white/5 animate-[shimmer_1.2s_infinite]" />
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}} .animate-\\[shimmer_1.2s_infinite\\]{animation:shimmer 1.2s linear infinite}`}</style>
    </div>
  )
}
