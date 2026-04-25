import { Ball, Pocket, TableBounds } from '../types';
import { resolveBallCollision, resolveWallCollision, checkPocket } from './collision';
import { magnitude } from '../utils/math';

export interface PhysicsEngineResult {
  ballCollisions: number;
  wallCollisions: number;
  pocketedBalls: Ball[];
}

export function updatePhysics(balls: Ball[], bounds: TableBounds, pockets: Pocket[], delta: number): PhysicsEngineResult {
  const FRICTION = 0.985;
  const MIN_VELOCITY = 0.05;
  
  let ballCollisions = 0;
  let wallCollisions = 0;
  const pocketedBalls: Ball[] = [];

  // Update positions based on velocity
  balls.forEach(ball => {
    if (ball.isPocketed) return;

    // Move ball
    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;

    // Apply friction continuously 
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    // Stop complete moving if very slow to avoid endless micro floating
    if (magnitude({ x: ball.vx, y: ball.vy }) < MIN_VELOCITY) {
      ball.vx = 0;
      ball.vy = 0;
    }

    // Check pockets first
    if (checkPocket(ball, pockets)) {
      pocketedBalls.push(ball);
      return; 
    }

    // Wall collision
    if (resolveWallCollision(ball, bounds)) {
      wallCollisions++;
    }
  });

  // Check ball-to-ball collisions
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      if (resolveBallCollision(balls[i], balls[j])) {
        ballCollisions++;
      }
    }
  }

  return {
    ballCollisions,
    wallCollisions,
    pocketedBalls,
  };
}
