import { useEffect, useRef } from 'react';
import { Ball, Pocket, TableBounds } from '../types';
import { updatePhysics } from '../physics/engine';

export function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  if (ball.isPocketed) return;

  // Shadow
  ctx.beginPath();
  ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();
  
  // Base Color (cue ball is purely white, 8 is pure black)
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();

  // Stripes if applicable
  if (ball.isStripe) {
     ctx.beginPath();
     ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
     ctx.fillStyle = '#ffffff';
     ctx.fill();

     // Stripe band
     ctx.beginPath();
     // Simplifying stripe drawing for performance: draw a thick line across
     ctx.rect(ball.x - ball.radius, ball.y - ball.radius * 0.4, ball.radius * 2, ball.radius * 0.8);
     // Clip to circle
     ctx.save();
     ctx.clip();
     ctx.fillStyle = ball.color;
     ctx.fillRect(ball.x - ball.radius, ball.y - ball.radius * 0.4, ball.radius * 2, ball.radius * 0.8);
     ctx.restore();
  }

  // Number circle
  if (ball.number) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${ball.radius * 0.65}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ball.number.toString(), ball.x, ball.y);
  }
  
  // Highlight reflection for 3D realism
  ctx.beginPath();
  ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fill();
}

export function drawTable(ctx: CanvasRenderingContext2D, width: number, height: number, bounds: TableBounds, pockets: Pocket[]) {
  // Outer Table rim
  ctx.fillStyle = '#2b1810';
  ctx.fillRect(0, 0, width, height);

  // Felt
  ctx.fillStyle = '#0c592e';
  ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);

  // Draw Baulk line (the D line)
  ctx.beginPath();
  ctx.moveTo(bounds.left + (bounds.right - bounds.left) * 0.25, bounds.top);
  ctx.lineTo(bounds.left + (bounds.right - bounds.left) * 0.25, bounds.bottom);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.stroke();

  // Pockets
  pockets.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    // highlight inner rim
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 0.9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.stroke();
  });
}

export function drawAimLine(ctx: CanvasRenderingContext2D, cueBall: Ball, mouseX: number, mouseY: number) {
   if (cueBall.isPocketed) return;
   const dx = cueBall.x - mouseX;
   const dy = cueBall.y - mouseY;
   
   ctx.beginPath();
   ctx.moveTo(cueBall.x, cueBall.y);
   // Draw line extending in opposite direction to represent aim target direction
   ctx.lineTo(cueBall.x + dx, cueBall.y + dy);
   ctx.setLineDash([5, 5]);
   ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
   ctx.lineWidth = 2;
   ctx.stroke();
   ctx.setLineDash([]);
}

export function drawCueStick(ctx: CanvasRenderingContext2D, cueBall: Ball, mousePos: { x: number, y: number } | null, isPulling: boolean) {
   if (!mousePos || cueBall.isPocketed) return;

   const dx = cueBall.x - mousePos.x;
   const dy = cueBall.y - mousePos.y;
   const dist = Math.sqrt(dx*dx + dy*dy);
   
   if (dist === 0) return;
   const nx = dx / dist;
   const ny = dy / dist;

   // Stick distance from ball base
   const baseDist = cueBall.radius + 10;
   // Add pull distance if actively dragging
   const pullOffset = isPulling ? Math.min(dist, 150) : 0;
   const startDist = baseDist + pullOffset;
   const stickLength = 300;

   // Stick Start and End points 
   // It is held *behind* the cue ball based on mouse pos
   const startX = cueBall.x - nx * startDist;
   const startY = cueBall.y - ny * startDist;
   const endX = startX - nx * stickLength;
   const endY = startY - ny * stickLength;

   ctx.beginPath();
   ctx.moveTo(startX, startY);
   ctx.lineTo(endX, endY);
   ctx.lineWidth = 6;
   ctx.lineCap = 'round';
   
   // Linear gradient for stick
   const grad = ctx.createLinearGradient(startX, startY, endX, endY);
   grad.addColorStop(0, '#e6e6e6'); // tip
   grad.addColorStop(0.05, '#111'); // black band
   grad.addColorStop(0.1, '#d4af37'); // maple wood start
   grad.addColorStop(1, '#5c4033'); // dark wood end
   
   ctx.strokeStyle = grad;
   ctx.stroke();
}
