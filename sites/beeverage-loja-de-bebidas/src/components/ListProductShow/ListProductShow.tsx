import useMedia from '../../hooks/useMedia';
import React from 'react';

import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Swiper as SwiperClass } from 'swiper';

import './ListProductShow.css';
import 'swiper/swiper-bundle.css';
import 'swiper/css';
import ProductModal from '../ProductModal/ProductModal';

interface ListProductShowProps {
    title: string;
    productModal: productModal[];
    HasCoverProduct?: {
      img: string;
      src: string;
    }
}

const ListProductShow = ({title, productModal, HasCoverProduct }: ListProductShowProps) => {
  const Tablet = useMedia(1000);
  const Mobile = useMedia(600);

  const [swiperInstance, setSwiperInstance] = React.useState<SwiperClass | null>(null);
  const [isBeginning, setIsBeginning] = React.useState<boolean>(true);
  const [isEnd, setIsEnd] = React.useState<boolean>(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(0);

  const NumberSlidesViewNotCover = Tablet ? Mobile ? 2 : 4 : 5;
  const NumberSlidesView = Tablet ? Mobile ? 1 : 3 : 4;
  const WidthSlidesView = Tablet ? Mobile ? '50%' : '75%' : '80%';
  const NumberLengthSlides = productModal.length-((HasCoverProduct ? NumberSlidesView : NumberSlidesViewNotCover)-1);

  const handleSlideChange = (swiper: SwiperClass) => {
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
    setActiveIndex(swiper.activeIndex);
  };
  
  return (
    <div className='list-products-container'>
      <div className="list-products">
        <h1 className='list-products-title'>{title}</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
        { HasCoverProduct && 
          <Link to={HasCoverProduct.src} className='swiper-cover-product-container'>
            <div className='swiper-cover-product' style={{backgroundImage: `url(${HasCoverProduct.img})`}}></div>
          </Link>
        }
        <Swiper
        onSwiper={setSwiperInstance}
        onSlideChange={handleSlideChange}
        spaceBetween={8}
        style={{width: HasCoverProduct ?  WidthSlidesView : '100%'}}
        slidesPerView={HasCoverProduct ? NumberSlidesView : NumberSlidesViewNotCover}>
            {productModal.map((product) => 
                <SwiperSlide key={product.id}>
                    <ProductModal product={product}/>
                </SwiperSlide>
            )}
        </Swiper>
        </div>
        {!Mobile &&
          <div className="switer-controller">
            <button style={{width: 'auto', visibility: isBeginning ? 'hidden' : 'visible'}} className='swiper-button-prev-custom list-product' onClick={() => swiperInstance?.slidePrev()} disabled={isBeginning} >
                <CaretLeft weight='fill' size={'1.5rem'}/>
            </button>
            <button style={{width: 'auto', visibility: isEnd ? 'hidden' : 'visible'}} className='swiper-button-next-custom list-product' onClick={() => swiperInstance?.slideNext()}>
              <CaretRight weight='fill'size={'1.5rem'}/>
            </button>
          </div>
        }
        </div>
        { productModal.length > NumberSlidesView && 
          <div className="swiper-pagination-perso">
            {[...Array(NumberLengthSlides)].map((_,index) => 
              <div key={index} className={ `swiper-pagination-bullet ${activeIndex===index ? 'swiper-pagination-bullet-active' : ''} product`}></div>
            )}
          </div>
        }
    </div>
  )
}

export default ListProductShow;