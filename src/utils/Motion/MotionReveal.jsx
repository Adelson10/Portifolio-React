import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

export const MotionReveal = ({children, width = 'fit-content'}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once:true });

    const mainControls = useAnimation();
    const slideControls = useAnimation();

    useEffect(() => {
        if(isInView) {
            mainControls.start("visible");
            slideControls.start("visible");
        }
    },[isInView])

  return (
    <div ref={ref} style={{ position: 'relative', width , overflow: 'hidden' }}>
        <motion.div
        variants={{
            hidden: { opacity: 0, y: 75 },
            visible: { opacity: 1, y: 0 },
        }}
        initial='hidden'
        animate={mainControls}
        transition={{duration: 0.5, delay: 0.25}}
        >
            {children}
        </motion.div>
        <motion.div
        variants={{
            hidden: {left: 0},
            visible: { left: "100%" }
        }}
        initial="hidden"
        animate={slideControls}
        transition={{duration: 0.5, ease: "easeIn"}}
        style={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: 0,
            right: 0,
            background: "var(--brand)",
            zIndex: 20,
        }}
        />
    </div>
  )
}

export const MotionRevealDown = ({children}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once:true });

    const mainControls = useAnimation();

    useEffect(() => {
        if(isInView) {
            mainControls.start("visible");
        }
    },[isInView])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' , overflow: 'hidden' }}>
        <motion.div
        variants={{
            hidden: { opacity: 0, y: 75 },
            visible: { opacity: 1, y: 0 },
        }}
        initial='hidden'
        animate={mainControls}
        transition={{duration: 0.5, delay: 0.25}}
        >
            {children}
        </motion.div>
    </div>
  )
}

export const MotionRevealDownModal = ({children}) => {
  return (
        <motion.div
        style={{ height: "fit-content"}}
        variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, y: [75,-10,0] },
        }}
        initial='hidden'
        animate='visible'
        transition={{duration: 0.3, delay: 0.1 , ease: 'easeOut'}}
        >
            {children}
        </motion.div>
  )
}