import React from 'react';
import './Catalogo.css';
import { List } from '@phosphor-icons/react';
import { Link, useHref } from 'react-router-dom';
import { useCatalogoPage } from '../../utils/context/CatalogoPageProvider';
import { MenuProps, QuickAcess, sizeIcon } from '../../utils/ProductsMenu/ProductsMenu';

const Catalogo = ({mobile} : {mobile: boolean}) => {
    const {CatalogoPage, setCatalogoPage} = useCatalogoPage();
    const pageNow = useHref({}).split('/').filter((path) => path!=='');

    const [showCategories, setShowCategories] = React.useState(false);
    
    function handleClick() {
        if(!CatalogoPage) document.body.style.overflowY = 'hidden';
        else document.body.style.overflowY = 'scroll'
        setCatalogoPage(!CatalogoPage);
    }

    return (
    <div className={'Catalogo'}>
        <ul>
                { mobile ? 
                <li>
                    <button className='catalogo_button' onClick={handleClick}><List size={sizeIcon} />Menu</button>
                </li>
                :
                <li>
                    <button onClick={() => setShowCategories(!showCategories)} className={`catalogo_button ${showCategories ? 'active' : ''}`}>
                    <div className={`noCategories ${ showCategories ? 'active' : ''}` }></div>Catálogo</button>
                </li>
                }
                {QuickAcess.map((catalogo) => {
                    const pageButton = catalogo.src.split('/').filter((path) => path!=='');
                    const filterPageNow = pageNow.filter((path, index) => index<= 1 && path == pageButton[index]);
                    const filterActive = pageButton.every((value, index) => value == filterPageNow[index]);                    
                    
                    return <li key={catalogo.name}><Link to={catalogo.src} className={`catalogo_button ${ filterActive? 'active' : ''}`}>
                        {catalogo.icon}{catalogo.name}
                    </Link></li>
                })}
            </ul>
            { showCategories && 
            <ul className='ModalCatalogo_Container'>
                {MenuProps.map((catalogo) => 
                        <li key={catalogo.title}><h3>{catalogo.title}</h3>
                            <ul className='ModalCatalogo_List'>
                                {catalogo.categorias.map((catalogo) => 
                                    <li key={catalogo.name}><Link onClick={() => setShowCategories(false)} to={catalogo.src}>{catalogo.name}</Link></li>
                                )}
                            </ul>
                        </li>
                )}
            </ul>
            }
        </div>
  )
}

export default Catalogo