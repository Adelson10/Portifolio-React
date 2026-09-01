/* eslint-disable react/react-in-jsx-scope */
//import { useLocation } from "react-router-dom";
import FilterProducts from "../components/FilterProducts/FilterProducts";
import ProductModal from "../components/ProductModal/ProductModal";
// import useFetch from "../hooks/useFetch";
import './Catalogo.css';
import { ProdutoMockup } from "../utils/Mockup/ProductPromo";

const Catalogo = () => {
  // const url = useLocation();  
  // const {json} = useFetch<productModal[]>( !url.search ? url.pathname : `${url.pathname}${url.search}`);
  
  return (
    <div className="page-catalogo-container">
      <FilterProducts />
      <div className="products-grid-container">
        { ProdutoMockup.map((product, index) => 
            <ProductModal key={index} product={product}/>
        ) }
      </div>
    </div>
  )
}

export default Catalogo;