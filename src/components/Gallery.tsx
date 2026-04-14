'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';

import img1 from '@/assets/gallery/2026-04-05.webp';
import img2 from '@/assets/gallery/2026-04-05 (1).webp';
import img3 from '@/assets/gallery/2026-04-05 (2).webp';
import img4 from '@/assets/gallery/unnamed.webp';

const images = [img1, img2, img3, img4];

export function Gallery() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-70%"]);

  return (
    <section ref={targetRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="max-w-7xl px-4 sm:px-6 lg:px-8 w-full mb-8 z-10 relative">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-4xl mt-6 md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-snookerGreen to-goldAccent"
          >
            The Experience
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-xl text-white/70 max-w-2xl"
          >
            A visual tour of our premium tables and atmosphere. Get a glimpse before you break.
          </motion.p>
        </div>
        
        <motion.div style={{ x }} className="flex gap-8 px-4 sm:px-6 lg:px-8 w-max">
          {images.map((image, index) => (
            <div key={index} className="group relative w-[80vw] h-[55vh] md:h-[65vh] max-w-3xl overflow-hidden rounded-4xl border border-white/10 shadow-2xl flex-shrink-0">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
              <Image 
                src={image} 
                alt={`Table showcase ${index + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                placeholder="blur"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
