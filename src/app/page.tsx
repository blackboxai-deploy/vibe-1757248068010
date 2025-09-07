"use client";

import { useEffect, useState } from "react";
import SubwaySurfers from "@/components/SubwaySurfers";

export default function HomePage() {
  const [gameReady, setGameReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    // Initialize game after component mount
    const initGame = () => {
      checkMobile();
      setGameReady(true);
    };

    // Prevent scrolling on mobile
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener('touchstart', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });

    initGame();

    return () => {
      document.removeEventListener('touchstart', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  if (!gameReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Subway Surfers</h2>
          <p className="text-blue-200">Preparing your endless adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Game Instructions Overlay */}
      <div className="absolute top-4 left-4 z-50 bg-black bg-opacity-50 rounded-lg p-3 text-white text-sm max-w-xs">
        <h3 className="font-bold mb-2">Controls:</h3>
        {isMobile ? (
          <ul className="space-y-1">
            <li>• Swipe left/right: Change lanes</li>
            <li>• Swipe up: Jump</li>
            <li>• Swipe down: Slide</li>
            <li>• Tap: Start/Restart</li>
          </ul>
        ) : (
          <ul className="space-y-1">
            <li>• ←/→ arrows: Change lanes</li>
            <li>• ↑ arrow/Space: Jump</li>
            <li>• ↓ arrow: Slide</li>
            <li>• Enter: Start/Restart</li>
          </ul>
        )}
      </div>

      {/* Performance Info */}
      <div className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 rounded-lg p-2 text-white text-xs">
        <div id="fps-counter">FPS: --</div>
        <div id="score-display">Score: 0</div>
      </div>

      {/* Main Game Component */}
      <SubwaySurfers isMobile={isMobile} />

      {/* Footer Info */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40 text-center text-white text-sm opacity-75">
        <p>🚇 Subway Surfers - Endless Runner Adventure</p>
      </div>
    </div>
  );
}