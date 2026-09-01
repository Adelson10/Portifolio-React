import { useCatalogoPage } from '../../utils/context/CatalogoPageProvider';
import './MenuHeader.css';
import { Link } from 'react-router-dom';

const MenuHeader = () => {
  const {setCatalogoPage} = useCatalogoPage();
  function handleClick() {
    if(document.body.style.overflowY==='hidden') {
      document.body.style.overflowY = 'scroll';
    }
    
    setCatalogoPage(false);
  }

  return (
    <div className='MenuHeader'>
        <div className='MenuHeader_Logo_bg'>
            <Link onClick={handleClick} className='MenuHeader_Logo' to={'/'}></Link>
            <h1 className='MenuHeader_Logo_Title MenuTitle'>MENU</h1>
        </div>
    </div>
  )
}

export default MenuHeader;