import { MagnifyingGlass, SlidersHorizontal } from "@phosphor-icons/react";
import ButtonIcon from "../utils/ButtonIcon";
import './Search.css';
import Button from "../utils/Button";
import { useLocation } from "react-router-dom";
import { useFilterActive } from "../../utils/context/FilterActiveProvider";

interface SearchProps {
  mobile: boolean | null;
}

const Search = ({mobile}: SearchProps) => {
  const location = useLocation();
  const isCatalogoRoute = location.pathname.includes('/catalogo');
  const {filterActive, setFilterActive} = useFilterActive();

  return (
    <div className="header_search">
      { !mobile ? (
        <>
          <label htmlFor="header_search">
            <input id="header_search" type="text" placeholder="Pesquisar produto"/>
          </label>
          <ButtonIcon className="header_search_button"><MagnifyingGlass size='1.3rem' weight="bold"/></ButtonIcon>
        </>
      ) : (
      <>  
        <label htmlFor="header_search">
            <ButtonIcon className="header_search_button"><MagnifyingGlass size='1.3rem' weight="bold"/></ButtonIcon>
            <input id="header_search" type="text" placeholder="Pesquisar produto"/>
        </label>
        { isCatalogoRoute && <Button style={{background: filterActive ? 'linear-gradient(-68deg, var(--brand-dark) 0%, var(--brand) 100%)' : 'white'}} onClick={() => setFilterActive(filterActive => !filterActive)}><SlidersHorizontal size='2rem' color={filterActive ? 'white' : 'var(--brand)'}/></Button>}
      </>
      )
      }
    </div>
  )
}

export default Search;