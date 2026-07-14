'use client'

import { motion } from 'framer-motion'

export function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-6 h-6 border-2 border-primary border-t-primary/20 rounded-full"
      aria-label="Loading"
    />
  )
}