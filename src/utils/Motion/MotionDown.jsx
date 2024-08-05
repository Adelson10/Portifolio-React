import { motion } from 'framer-motion';
import React from 'react';

export const MotionDown = ({children,index}) => {
  return (
    <motion.div
    variants={{
        hidden: {opacity: 0, y: -30 },
        visible: {opacity: 1, y: 0 },
      }}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5 ,delay: (index+1)*0.1 }}
    >{children}</motion.div>
  )
}

export const MotionLeft = ({children,index}) => {
  return (
    <motion.div
    variants={{
        hidden: {opacity: 0, x: -30 },
        visible: {opacity: 1, x: 0 },
      }}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5 ,delay: (index+1)*0.1 }}
    >{children}</motion.div>
  )
}