import { Ball, Pocket, TableBounds } from '../types';
import { distance, dotProduct } from '../utils/math';

export function resolveWallCollision(ball: Ball, bounds: TableBounds): boolean {
  if (ball.isPocketed) return false;
  
  let hit = false;
  // Damping factor when hitting a cushion
  const DAMPING = 0.8;

  if (ball.x - ball.radius < bounds.left) {
    ball.x = bounds.left + ball.radius;
    ball.vx = -ball.vx * DAMPING;
    ball.vy = ball.vy * DAMPING;
    hit = true;
  } else if (ball.x + ball.radius > bounds.right) {
    ball.x = bounds.right - ball.radius;
    ball.vx = -ball.vx * DAMPING;
    ball.vy = ball.vy * DAMPING;
    hit = true;
  }

  if (ball.y - ball.radius < bounds.top) {
    ball.y = bounds.top + ball.radius;
    ball.vy = -ball.vy * DAMPING;
    ball.vx = ball.vx * DAMPING;
    hit = true;
  } else if (ball.y + ball.radius > bounds.bottom) {
    ball.y = bounds.bottom - ball.radius;
    ball.vy = -ball.vy * DAMPING;
    ball.vx = ball.vx * DAMPING;
    hit = true;
  }
  
  return hit;
}

export function resolveBallCollision(ball1: Ball, ball2: Ball): boolean {
  if (ball1.isPocketed || ball2.isPocketed) return false;

  const dx = ball2.x - ball1.x;
  const dy = ball2.y - ball1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return false;
  
  // Check if colliding
  if (dist < ball1.radius + ball2.radius) {
    // 1. Resolve overlap (static collision)
    const overlap = 0.5 * (ball1.radius + ball2.radius - dist);
    
    // Displace current positions so they don't overlap slightly outside
    const nx = dx / dist;
    const ny = dy / dist;
    
    ball1.x -= overlap * nx;
    ball1.y -= overlap * ny;
    ball2.x += overlap * nx;
    ball2.y += overlap * ny;

    // 2. Resolve velocity (dynamic collision)
    const normal = { x: nx, y: ny };
    const tangent = { x: -ny, y: nx };

    // Dot Product Tangent
    const dpTan1 = dotProduct({ x: ball1.vx, y: ball1.vy }, tangent);
    const dpTan2 = dotProduct({ x: ball2.vx, y: ball2.vy }, tangent);

    // Dot Product Normal
    const dpNorm1 = dotProduct({ x: ball1.vx, y: ball1.vy }, normal);
    const dpNorm2 = dotProduct({ x: ball2.vx, y: ball2.vy }, normal);

    // Conservation of momentum in 1D
    const m1 = ball1.mass;
    const m2 = ball2.mass;
    
    // Inelastic multiplier (balls aren't perfectly bouncy)
    const RESTITUTION = 0.95;

    const m1Norm = (dpNorm1 * (m1 - m2) + 2.0 * m2 * dpNorm2) / (m1 + m2) * RESTITUTION;
    const m2Norm = (dpNorm2 * (m2 - m1) + 2.0 * m1 * dpNorm1) / (m1 + m2) * RESTITUTION;

    // Update velocities
    ball1.vx = tangent.x * dpTan1 + normal.x * m1Norm;
    ball1.vy = tangent.y * dpTan1 + normal.y * m1Norm;
    ball2.vx = tangent.x * dpTan2 + normal.x * m2Norm;
    ball2.vy = tangent.y * dpTan2 + normal.y * m2Norm;
    
    return true; // Collision occurred
  }
  return false;
}

export function checkPocket(ball: Ball, pockets: Pocket[]): boolean {
  if (ball.isPocketed) return false;
  
  for (const pocket of pockets) {
    // For pockets, if the center of ball is within the pocket radius deeply it's pocketed
    if (distance({ x: ball.x, y: ball.y }, { x: pocket.x, y: pocket.y }) < pocket.radius * 0.8) {
       ball.isPocketed = true;
       // We stop it from running
       ball.vx = 0;
       ball.vy = 0;
       return true;
    }
  }
  return false;
}
