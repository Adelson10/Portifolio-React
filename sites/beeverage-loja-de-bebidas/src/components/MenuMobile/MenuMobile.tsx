import { useCatalogoPage } from '../../utils/context/CatalogoPageProvider.tsx';
import './MenuMobile.css';
import CatalogoContainer from './MenuContainer.tsx';
import MenuHeader from './MenuHeader.tsx';
import { X } from '@phosphor-icons/react';

const CatalogoMobile = ({MenuProps}: {MenuProps: MenuContainerProps[]}) => {
    const { CatalogoPage, setCatalogoPage } = useCatalogoPage();

    function handleClick() {
        if(document.body.style.overflowY==='hidden') {
          document.body.style.overflowY = 'scroll';
        }
        setCatalogoPage(false);
    }
  
  if (CatalogoPage) return (
    <div className='MenuMobile_Container'>
        <div className="MenuMobile_Container_Bg">
            <div className="MenuMobile_Container_Bg_Cevada left"></div>
            <div className="MenuMobile_Container_Bg_Cevada right"></div>
        </div>
        <div className='MenuvMobile_Header'>
            <MenuHeader />
            <div className='AllCatalogoProduct'>
                {MenuProps.map((catalogo, index) => 
                    <CatalogoContainer key={catalogo.title} img={catalogo.img} id={index} title={catalogo.title} src={catalogo.src} categorias={catalogo.categorias}/>
                )}
            </div>
            <div className="MenuMobile_footer">
                <div className='MenuMobile_footer_Image1'></div>
                <div className='MenuMobile_footer_Image2'></div>
                <div className='MenuMobile_footer_Image1 reverse'></div>
            </div>
        </div>
        <button onClick={handleClick} className="MenuMobile_Close"><X size={'2rem'} fill='bold'/></button>
    </div>
  )
}

export default CatalogoMobile;