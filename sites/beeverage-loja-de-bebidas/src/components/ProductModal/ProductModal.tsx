import { Link } from 'react-router-dom';
import PhotoProduct from '../utils/PhotoProduct';
import ScoreProduct from '../ListProductShow/ScoreProduct';
import './ProductModal.css';

const ProductModal = ({product}: {product: productModal}) => {  
  return (
    <Link id={`${product.id}`} to={`/produto/${product.categoria}/${product.id}/${product.name.replaceAll('-', '').replaceAll('  ','').replaceAll(' ','-')}`} className='product-modal'>
        <div className="product-modal-image">
        <PhotoProduct
        color1='#FFFFFF'
        color2='#CECECE'
        shadowImage={product.thumbnail.shadowWidth}
        srcImg={product.thumbnail.src}/>
        {product.price!==0 && <div className='product-modal-image-discount'>{(((product.priceNow*100)/product.price)-100).toFixed(0)}%</div>}
        </div>
            <ScoreProduct score={product.score}/>
                <h3>{product.name}</h3>
                <h4 className="product-modal-volume"><strong>Volume:</strong> {product.volume}</h4>
                <div className='product-modal-price-container'>
                { product.price>0 && <h2 className="price"><del>{product.price.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</del></h2>}
                <h2 className="price-now">{product.priceNow.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</h2>
                </div>
        </Link>
  )
}

export default ProductModal;