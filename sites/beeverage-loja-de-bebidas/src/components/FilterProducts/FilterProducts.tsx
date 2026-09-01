/* eslint-disable react/react-in-jsx-scope */
import { useParams } from 'react-router-dom';
import './FilterProducts.css';
import ModalFilterProducts from './ModalFilterProducts';
import ModalPriceProducts from './ModalPriceProducts';
import { useFilterActive } from '../../utils/context/FilterActiveProvider';
import useMedia from '../../hooks/useMedia';

const listFilterProduct: ModalFilterProducts[] = [
    {
        title: 'Em Promoção',
        filters: ['Promoção']
    },
    {
        title: 'Tipo de Cerveja',
        filters: ['Lager', 'IPA', 'Pilsen', 'Weiss', 'Stout'],
    },
    {
        title: 'Marca',
        filters: ['Heineken', 'Brahma', 'Skol', 'Corona', 'Stella','Artois','Amstel'],
    },
    {
        title: 'Volume',
        filters: ['330ml', '355ml', '600ml', '1L'],
    },
    {
        title: 'Opções de Compra',
        filters: ['Unidade', 'Pack'],
    },
]

const FilterProducts = () => {
    const catalogoProduct = useParams<{catalogo: string}>();
    const CatalogoTitle = `${catalogoProduct.catalogo?.charAt(0).toUpperCase()}${catalogoProduct.catalogo?.substring(1)}`;
    const {filterActive} = useFilterActive();
    const mobile = useMedia(1000);

  if(filterActive || !mobile) return (
    <div className='filter-products-container'>
        <div className="filter-products-title-container">
            <div className="filter-products-container-title-container">
                <h1 style={{display: 'inline-block'}} className='list-products-title'>{CatalogoTitle}</h1>
                <p className='filter-products-title-itens'>(100 itens)</p>
            </div>
            {listFilterProduct.map(({title, filters}) => 
                (<ModalFilterProducts key={title} title={title} filters={filters}/>)
            )}
            <ModalPriceProducts />
        </div>
    </div>
  )
}

export default FilterProducts;