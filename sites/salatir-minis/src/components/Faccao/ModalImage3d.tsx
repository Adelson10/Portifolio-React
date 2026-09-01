import React, { useEffect, useRef, useState } from 'react';

type DistProps = {
  finalPosition: number;
  startX: number;
  movement: number;
  sideNow: number;
  movePosition?: number;
};

const ModalImage3d = ({ style, images }: { style: string; images: string[] }) => {
  const [dist, setDist] = useState<DistProps>({
    finalPosition: 0,
    startX: 0,
    movement: 0,
    sideNow: 0,
  });
  const boxContainerRef = useRef<HTMLDivElement>(null);
  const [imageLoad, setImageLoad] = React.useState(0);

  function handleStart(event: React.TouchEvent | React.MouseEvent) {
    if(images.length === imageLoad) {
      const startX =
        'touches' in event
          ? event.changedTouches[0].clientX
          : (event as React.MouseEvent).clientX;
      setDist((prevDist) => ({ ...prevDist, startX }));

      if (!(event as React.TouchEvent).touches) {
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
      }
    }
  }

  function handleMove(event: TouchEvent | MouseEvent) {
    if(images.length === imageLoad) {
      const box = boxContainerRef.current?.getBoundingClientRect();
      const pointerPosition =
        'touches' in event
          ? event.changedTouches[0].clientX
          : (event as MouseEvent).clientX;

      if (box && (pointerPosition < box.left || pointerPosition > box.right)) return;

      const finalPosition = updatePosition(pointerPosition);
      if (finalPosition !== undefined) {
        moveImage(Math.round(finalPosition));
      }
    }
  }

  function moveImage(distX: number) {
    const newIndex = Math.abs(distX) % images.length;
    setDist((prevDist) => ({
      ...prevDist,
      movePosition: distX,
      sideNow: newIndex,
    }));
  }

  function updatePosition(clientX: number) {
    const movement = (dist.startX - clientX) * 0.04;
    return dist.finalPosition - movement;
  }

  function handleEnd() {
    if(images.length === imageLoad) {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      setDist((prevDist) => ({ ...prevDist, finalPosition: prevDist.movePosition ?? 0 }));
    }
  }  

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, []);

  useEffect(() => {
    setImageLoad(0);
  }, [images]);

  function handleImageLoad() {
    setImageLoad(imageLoad => imageLoad + 1);
  }

  return (
    <div ref={boxContainerRef} className="box-face-image-char-container">
      {imageLoad !== images.length && <div className='loading-container'><div className="loading-bg"><div style={{maxWidth: `${(imageLoad+1)*5}%`}} className="loading-bar"></div></div></div>}
      {images.map((image, index) => (
        <img
          key={index}
          src={image}
          style={{ display: dist.sideNow === index && imageLoad === images.length ? 'block' : 'none' }}
          className={style}
          onTouchStart={handleStart}
          onTouchMove={(e) => handleMove(e.nativeEvent as TouchEvent)}
          onTouchEnd={handleEnd}
          onMouseDown={handleStart}
          onLoad={handleImageLoad}
        />
      ))}
    </div>
  );
};

export default ModalImage3d;