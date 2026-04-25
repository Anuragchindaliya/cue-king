import { useEffect, useRef } from 'react';
import { Ball, Pocket, TableBounds } from '../types';
import { updatePhysics } from '../physics/engine';
import { createBalls } from '../utils/init';
import { drawBall, drawTable, drawAimLine, drawCueStick } from '../utils/render';

export function useGameLoop(canvasRef: React.RefObject<HTMLCanvasElement | null>, playHitSound: () => void) {
  const ballsRef = useRef<Ball[]>([]);
  const boundsRef = useRef<TableBounds>({ left: 0, right: 0, top: 0, bottom: 0 });
  const pocketsRef = useRef<Pocket[]>([]);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const mousePosRef = useRef<{ x: number, y: number } | null>(null);
  
  // Audio throttle ref
  const lastSoundTime = useRef(0);

  const resetGame = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Set table dimensions mapping to standard 2:1 ratio
    const width = 1000; 
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    const rimWidth = 40;
    boundsRef.current = {
      left: rimWidth,
      right: width - rimWidth,
      top: rimWidth,
      bottom: height - rimWidth
    };

    const pocketRadius = 30;
    pocketsRef.current = [
      { x: rimWidth, y: rimWidth, radius: pocketRadius },
      { x: width / 2, y: rimWidth - 10, radius: pocketRadius },
      { x: width - rimWidth, y: rimWidth, radius: pocketRadius },
      { x: rimWidth, y: height - rimWidth, radius: pocketRadius },
      { x: width / 2, y: height - rimWidth + 10, radius: pocketRadius },
      { x: width - rimWidth, y: height - rimWidth, radius: pocketRadius }
    ];

    const ballRadius = 14;
    const headSpotX = width * 0.25;
    const rackSpotX = width * 0.70;
    const centerY = height / 2;

    ballsRef.current = createBalls(rackSpotX, centerY, ballRadius);
    const cueBall = ballsRef.current.find(b => b.isCue);
    if (cueBall) {
       cueBall.x = headSpotX;
       cueBall.y = centerY;
    }
  };

  // Initialize table
  useEffect(() => {
    resetGame();
  }, [canvasRef]);

  // Main loop
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
       const rawDelta = time - lastTime;
       const delta = rawDelta / 16.66; // Normalize to approx 60fps multiplier for consistent physics speeds
       lastTime = time;

       const canvasW = canvasRef.current!.width;
       const canvasH = canvasRef.current!.height;

       // 1. Physics update
       // For stability we prevent huge delta jumps on tab switches
       if (rawDelta < 100) {
         const physicsRes = updatePhysics(ballsRef.current, boundsRef.current, pocketsRef.current, delta);
         
         const now = performance.now();
         if ((physicsRes.ballCollisions > 0 || physicsRes.wallCollisions > 0) && now - lastSoundTime.current > 80) {
             playHitSound(); 
             lastSoundTime.current = now;
         }
       }

       // 2. Clear & Draw Table
       ctx.clearRect(0, 0, canvasW, canvasH);
       drawTable(ctx, canvasW, canvasH, boundsRef.current, pocketsRef.current);

       const cueBall = ballsRef.current.find(b => b.isCue);
       const isCueMoving = cueBall ? Math.abs(cueBall.vx) > 0.1 || Math.abs(cueBall.vy) > 0.1 : false;

       // 3. Draw aiming and stick if interacting
       if (isDraggingRef.current && cueBall && !isCueMoving && !cueBall.isPocketed) {
          drawAimLine(ctx, cueBall, mousePosRef.current!.x, mousePosRef.current!.y);
       }
       if (cueBall && !isCueMoving && !cueBall.isPocketed && mousePosRef.current) {
          drawCueStick(ctx, cueBall, mousePosRef.current, isDraggingRef.current);
       }

       // 4. Draw Balls
       ballsRef.current.forEach(ball => {
         drawBall(ctx, ball);
       });

       animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [canvasRef, playHitSound]);

  // Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
     const cueBall = ballsRef.current.find(b => b.isCue);
     if (!cueBall || cueBall.isPocketed) return;
     const isCueMoving = Math.abs(cueBall.vx) > 0.1 || Math.abs(cueBall.vy) > 0.1;
     if (isCueMoving) return;

     const rect = canvasRef.current!.getBoundingClientRect();
     const scaleX = canvasRef.current!.width / rect.width;
     const scaleY = canvasRef.current!.height / rect.height;
     const x = (e.clientX - rect.left) * scaleX;
     const y = (e.clientY - rect.top) * scaleY;

     dragStartRef.current = { x, y };
     mousePosRef.current = { x, y };
     isDraggingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
     const rect = canvasRef.current?.getBoundingClientRect();
     if (!rect) return;
     const scaleX = canvasRef.current!.width / rect.width;
     const scaleY = canvasRef.current!.height / rect.height;
     mousePosRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
     };
  };

  const handlePointerUp = () => {
     if (!isDraggingRef.current) return;
     isDraggingRef.current = false;
     
     const cueBall = ballsRef.current.find(b => b.isCue);
     if (!cueBall || !mousePosRef.current) return;

     // Calculate power
     const dx = cueBall.x - mousePosRef.current.x;
     const dy = cueBall.y - mousePosRef.current.y;
     
     // Max power limit
     const maxPower = 40;
     const pullFactor = 0.15; // multiplier
     
     cueBall.vx = Math.min(Math.max(dx * pullFactor, -maxPower), maxPower);
     cueBall.vy = Math.min(Math.max(dy * pullFactor, -maxPower), maxPower);
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerOut: handlePointerUp,
    resetGame
  };
}
