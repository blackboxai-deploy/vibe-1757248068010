"use client";

import { useEffect, useRef, useState } from "react";
import { GameEngine } from "@/lib/gameEngine";
import { AudioManager } from "@/lib/audioManager";

interface SubwaySurfersProps {
  isMobile: boolean;
}

export default function SubwaySurfers({ isMobile }: SubwaySurfersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [fps, setFps] = useState(60);

  // Initialize game
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize game systems
    const gameEngine = new GameEngine(ctx, canvas.width, canvas.height, isMobile);
    const audioManager = new AudioManager();

    gameEngineRef.current = gameEngine;
    audioManagerRef.current = audioManager;

    // Load high score
    const savedHighScore = localStorage.getItem('subway-surfers-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
      gameEngine.setHighScore(parseInt(savedHighScore));
    }

    // Game state callbacks
    gameEngine.onStateChange = (state: string) => {
      setGameState(state as any);
    };

    gameEngine.onScoreChange = (newScore: number) => {
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('subway-surfers-high-score', newScore.toString());
        gameEngine.setHighScore(newScore);
      }
    };

    gameEngine.onFpsChange = (newFps: number) => {
      setFps(Math.round(newFps));
    };

    // Audio callbacks
    gameEngine.onPlaySound = (soundName: string) => {
      audioManager.playSound(soundName);
    };

    // Start game loop
    gameEngine.start();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      gameEngine.stop();
      audioManager.cleanup();
    };
  }, [isMobile, highScore]);

  // Handle user interactions
  const handleStart = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.startGame();
      audioManagerRef.current?.playMusic();
    }
  };

  const handleRestart = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resetGame();
      setScore(0);
    }
  };

  const handlePause = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.pauseGame();
      audioManagerRef.current?.pauseMusic();
    }
  };

  const handleResume = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resumeGame();
      audioManagerRef.current?.playMusic();
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full bg-gradient-to-b from-sky-400 via-blue-500 to-blue-900"
        style={{ touchAction: 'none' }}
      />

      {/* Game UI Overlays */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold mb-4 text-yellow-400 drop-shadow-lg">
              🚇 SUBWAY SURFERS
            </h1>
            <p className="text-xl mb-8">Endless Running Adventure</p>
            <div className="mb-6">
              <p className="text-lg">High Score: <span className="text-yellow-400 font-bold">{highScore}</span></p>
            </div>
            <button
              onClick={handleStart}
              className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 active:scale-95"
            >
              🏃‍♂️ START GAME
            </button>
            <div className="mt-6 text-sm opacity-75">
              <p>Collect coins • Avoid obstacles • Use power-ups</p>
            </div>
          </div>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-6">⏸️ PAUSED</h2>
            <div className="space-y-4">
              <button
                onClick={handleResume}
                className="block mx-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full"
              >
                ▶️ RESUME
              </button>
              <button
                onClick={handleRestart}
                className="block mx-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full"
              >
                🔄 RESTART
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-center text-white">
            <h2 className="text-5xl font-bold mb-4 text-red-400">💥 GAME OVER</h2>
            <div className="mb-6 space-y-2">
              <p className="text-2xl">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
              <p className="text-lg">High Score: <span className="text-yellow-400 font-bold">{highScore}</span></p>
              {score === highScore && score > 0 && (
                <p className="text-green-400 font-bold animate-bounce">🎉 NEW HIGH SCORE! 🎉</p>
              )}
            </div>
            <button
              onClick={handleRestart}
              className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 active:scale-95"
            >
              🔄 PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* In-Game HUD */}
      {gameState === 'playing' && (
        <>
          <div className="absolute top-4 left-4 z-20 text-white text-xl font-bold drop-shadow-lg">
            Score: {score}
          </div>
          <div className="absolute top-4 right-4 z-20 text-white text-sm drop-shadow-lg">
            FPS: {fps}
          </div>
          <button
            onClick={handlePause}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black bg-opacity-50 hover:bg-opacity-75 text-white px-4 py-2 rounded-full transition-all"
          >
            ⏸️ Pause
          </button>
        </>
      )}
    </div>
  );
}