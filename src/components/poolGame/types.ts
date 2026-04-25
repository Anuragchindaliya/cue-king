export interface Vector2D {
  x: number;
  y: number;
}

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
  isCue: boolean;
  number?: number;
  isStripe?: boolean;
  isPocketed: boolean;
}

export interface Pocket {
  x: number;
  y: number;
  radius: number;
}

export interface TableBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
