import ModalBox from './ModalBox';
import './Faccao.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import React from 'react';

const Faccao = ({ faction, type, reverse = false }: { faction: FactionProps, type: string, reverse?: boolean }) => {
  const [index, setIndex] = React.useState<number>(0);

  return (
    <div className={`faccao-container ${reverse ? 'reverse' : ''}`}>
      <ModalBox product={faction.products[index]} type={type} />
      <div className="faccao-text-container">
        <div className="faccao-text-descriptions-container">
          <h1 className='home-title'>{faction.title}</h1>
          <h2>{faction.products[index].name}</h2>
          <p className='faccao-text-description'>{faction.products[index].description}</p>
          <p className={`faccao-text-author ${ reverse ? 'reverse' : ''}`}>
            <div className="line-author"></div>{faction.products[index].author}
          </p>
        </div>
        <div className="faccao-products-list">
          <Swiper
            slidesPerView={2}
            pagination={{ clickable: true }}
            breakpoints={{
              768: { slidesPerView: 2  , spaceBetween: 8 },
              1230: { slidesPerView: 3 , spaceBetween: 8 },
              1550: { slidesPerView: 4 , spaceBetween: 8 },
            }}
            modules={[Pagination]}
          >
            {faction.products.map(({ image, faction, name }, i) => (
              <SwiperSlide key={name}>
                <button className={`faccao-product ${type}`} onClick={() => setIndex(i)}>
                  <div
                    style={{ backgroundImage: `url(${image[0]})` }}
                    className="faccao-product-image"
                  >
                    <div className="faccao-product-text-container">
                      <h2>{faction}</h2>
                      <h3>{name}</h3>
                    </div>
                  </div>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
}

export default Faccao;