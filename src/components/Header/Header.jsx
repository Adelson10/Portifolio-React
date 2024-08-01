import { useState } from 'react'
import { BsHouseDoor,BsPerson,BsFileEarmarkText,BsSuitcaseLg,BsImage,BsSend,BsUiChecksGrid,BsXLg } from "react-icons/bs";
import './Header.css';
import { useWidthScreen } from '../../hooks/WidthScreen/useWidthScreen';

const Header = ({children}) => {
  const [menuMobile, setMenuMobile] = useState(false);
  const [isMouseScroll, setMouseScroll] = useState(false);
  const [InitialMenuMobile, setInitialMenuMobile] = useState(false);
  const { width } = useWidthScreen();

  window.addEventListener('scroll', handleScroll);

  function handleScroll() {
    if(window.scrollY >= 60) setMouseScroll(true);
    else setMouseScroll(false);
  }

  function handleMenu(){
    setMenuMobile(() => !menuMobile);
    setInitialMenuMobile(true);
  }

  return (
    <>
    <header className={`${isMouseScroll ? 'OnScroll' : ''} ${menuMobile ? 'ActiveMenuMobile' : ''} ${ InitialMenuMobile && !menuMobile ? 'DisabledHeader ' : ''}`}>
      <div className={`Header__Box ${menuMobile ? 'ActiveMenu' : ''}`}>
          { !menuMobile && (<h1>Adelson<span>.</span></h1>)}
          { (width >= 960 || menuMobile) &&
            (
              <nav>
                <ul>
                    <li><a href="#Inicio">{width < 960 && <BsHouseDoor />}Inicio</a></li>
                    <li><a href="#SobreMim">{width < 960 && <BsPerson />}Sobre Mim</a></li>
                    <li><a href="#Habilidades">{width < 960 && <BsFileEarmarkText />}Habilidades</a></li>
                    <li><a href="#Servicos">{width < 960 && <BsSuitcaseLg />}Serviços</a></li>
                    <li><a href="#Portfolio">{width < 960 && <BsImage />}Portfolio</a></li>
                    <li><a href="#Contato">{width < 960 && <BsSend />}Fale Comigo</a></li>
                </ul>
              </nav>
            )
          }
          { (width < 960) && (<button onClick={handleMenu} className='Botao__Menu'>{ !menuMobile ? <BsUiChecksGrid size='1.2rem'/> : <BsXLg size='1.2rem'/> }</button>)}
        </div>
    </header>
    {children}
    </>
  )
}

export default Header;