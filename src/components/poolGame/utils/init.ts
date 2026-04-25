import { Ball } from '../types';

export function createBalls(startX: number, startY: number, ballRadius: number): Ball[] {
  const balls: Ball[] = [];
  
  // Cue Ball
  balls.push({
    id: 0,
    x: startX - 250,
    y: startY,
    vx: 0,
    vy: 0,
    radius: ballRadius,
    mass: 1,
    color: '#ffffff',
    isCue: true,
    isPocketed: false,
  });

  // Standard 8-ball Rack (Triangle)
  const rows = 5;
  const spacing = ballRadius * 2.05; // slight gap
  let id = 1;
  
  const colors = [
    '#fbbc05', // 1 Yellow
    '#34a853', // 2 Blue -> standard uses dark blue, but distinct visually
    '#ea4335', // 3 Red
    '#673ab7', // 4 Purple
    '#ff6d00', // 5 Orange
    '#188038', // 6 Green
    '#795548', // 7 Brown/Maroon
    '#222222', // 8 Black
    '#fbbc05', // 9 Yellow Stripe
    '#34a853', // 10 Blue Stripe
    '#ea4335', // 11 Red Stripe
    '#673ab7', // 12 Purple Stripe
    '#ff6d00', // 13 Orange Stripe
    '#188038', // 14 Green Stripe
    '#795548', // 15 Brown/Maroon Stripe
  ];

  const solidOrStripe = [
    false, false, false, false, false, false, false, // 1-7 solids
    false, // 8 solid
    true, true, true, true, true, true, true // 9-15 stripes
  ];

  // Specific 8-ball rack pattern (approximation, 8 ball in center of 3rd row)
  const numbersToRack = [1, 9, 2, 10, 8, 3, 11, 4, 12, 13, 5, 14, 6, 15, 7];

  let nIdx = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j <= i; j++) {
       const number = numbersToRack[nIdx];
       const color = colors[number - 1];
       const isStripe = solidOrStripe[number - 1];
       
       balls.push({
         id,
         x: startX + i * spacing * Math.cos(Math.PI / 6),
         y: startY + (j - i / 2) * spacing,
         vx: 0,
         vy: 0,
         radius: ballRadius,
         mass: 1,
         color,
         isCue: false,
         number,
         isStripe,
         isPocketed: false
       });
       
       id++;
       nIdx++;
    }
  }

  return balls;
}
