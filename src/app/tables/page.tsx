'use client';
import { motion } from 'framer-motion';
import { TableGrid } from '@/components/TableGrid';

export default function TablesPage() {
  return (
    <div className="relative min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="backdrop-blur-md bg-white/5 border border-white/10 shadow-glass rounded-3xl overflow-hidden w-full"
      >
        <TableGrid />
      </motion.div>
    </div>
  );
}
