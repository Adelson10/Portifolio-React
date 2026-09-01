import PhotoMold from '../../assets/imagens/PhotoMold/PhotoMold';
import './PhotoProduct.css';

interface PhotoProductProps {
    color1: string;
    color2: string;
    shadowImage: number;
    srcImg: string;
    type?: string;
}

const PhotoProduct = ({color1 ,color2 ,shadowImage, srcImg, type = '' }: PhotoProductProps) => {
    
  return (
    <div className={`PhotoProduct_Container ${type}`}>
        <PhotoMold height={`${type == 'Page' ? 135*2 : 135}px`} width={`${type == 'Page' ? 155*2 : 155}px`} color1={color1} color2={color2}/>
        <div style={{width: `${type == 'Page' ? shadowImage*2 : shadowImage}px`}} className={`shadow_product ${type}`}></div>
        <div style={{backgroundImage: `url(${srcImg})`}} className={`PhotoProduct_Photo ${type}`}></div>
    </div>
  )
}

export default PhotoProduct;