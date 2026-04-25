import { Vector2D } from '../types';

export function distance(p1: Vector2D, p2: Vector2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function magnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v: Vector2D): Vector2D {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

export function dotProduct(v1: Vector2D, v2: Vector2D): number {
  return v1.x * v2.x + v1.y * v2.y;
}
