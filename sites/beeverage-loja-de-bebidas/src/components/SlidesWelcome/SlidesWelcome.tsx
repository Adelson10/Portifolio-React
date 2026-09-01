import './SlidesWelcome.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import React from 'react';
import { Swiper as SwiperClass } from 'swiper';
import useMedia from '../../hooks/useMedia';

interface ISlidesWelcome {
  id: number;
  src: string;
}

const SlidesWelcome = ({slides} : { slides: ISlidesWelcome[] }) => {
  const [swiperInstance, setSwiperInstance] = React.useState<SwiperClass | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number>(0);
  const mobile  = useMedia(1000);

  function handleSlideChange(swiper: SwiperClass) {
    setActiveIndex(swiper.activeIndex);
  }

  return (
        <div className='swiper-welcome'>
          <Swiper
          onSwiper={setSwiperInstance}
          onSlideChange={handleSlideChange}
          grabCursor={false}
          centeredSlides={true}
          allowTouchMove={mobile ? true : false}
          slidesPerView={'auto'}
          >
            {slides.map(({id, src}) =>
              <SwiperSlide key={id}>
                <div id={`${id}`} className="swiper-slide-img" style={{backgroundImage: `url(${src})`}}></div>
              </SwiperSlide>
            )}
            {!mobile && 
            <>
              <button className='swiper-button-prev-custom swiper-welcome-buttom' onClick={() => swiperInstance?.slidePrev()}></button>
              <button className='swiper-button-next-custom swiper-welcome-buttom' onClick={() => swiperInstance?.slideNext()}></button>
            </>}

          </Swiper>
          <div className="switer-controller">
              <div className="swiper-pagination-perso">
                {slides.map(({id},index) => 
                  <div key={id} className={ `swiper-pagination-bullet ${activeIndex===index ? 'swiper-pagination-bullet-active' : ''}`}></div>
                )}
              </div>
          </div>
        </div>
  )
}

export default SlidesWelcome;