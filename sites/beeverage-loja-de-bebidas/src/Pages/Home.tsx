import React from "react";
import { ProdutoMockup } from "../utils/Mockup/ProductPromo";
import { Slides } from "../utils/Mockup/SlidesWelcome";
const ListProductShow = React.lazy(() => import('../components/ListProductShow/ListProductShow'));
const SlidesWelcome = React.lazy(() => import('../components/SlidesWelcome/SlidesWelcome'));
import Cartas from '../assets/imagens/Mockup/Slides/Cartas.png'

const Home = () => {  
  return (
    <>
      <React.Suspense fallback={<div>Carregando...</div>}>
        <SlidesWelcome slides={Slides}/>
      </React.Suspense>
      <React.Suspense fallback={<div>Carregando...</div>}>
        <ListProductShow title={"Promoções"} productModal={ProdutoMockup} />
      </React.Suspense>
      <React.Suspense fallback={<div>Carregando...</div>}>
        <ListProductShow title={"Cervejas"} productModal={ProdutoMockup} HasCoverProduct={{img: Cartas,src: '/catalogo/cervejas'}}/>
      </React.Suspense>
    </>
  )
}

export default Home;