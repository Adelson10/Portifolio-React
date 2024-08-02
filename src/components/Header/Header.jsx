import { useEffect, useState } from 'react'
import { BsHouseDoor,BsPerson,BsFileEarmarkMedical,BsSuitcaseLg,BsImage,BsSend,BsUiChecksGrid,BsXLg } from "react-icons/bs";
import './Header.css';
import { useWidthScreen } from '../../hooks/WidthScreen/useWidthScreen';
import { Link } from 'react-router-dom';
import Button from '../../utils/components/Button';
import curriculo from '../../assets/curriculo/Curriculo Adelson.pdf';

const navSpy = [
  {
    sectionId: 'Inicio',
    icon: (<BsHouseDoor />),
    label: 'Inicio'
  },
  {
    sectionId: 'SobreMim',
    icon: (<BsPerson />),
    label: 'Sobre Mim'
  },
  {
    sectionId: 'Servicos',
    icon: (<BsSuitcaseLg />),
    label: 'Serviços'
  },
]

const Header = ({children}) => {
  const [menuMobile, setMenuMobile] = useState(false);
  const [InitialMenuMobile, setInitialMenuMobile] = useState(false);
  const [activeLink, setActiveLink] = useState("hero");
  const { width } = useWidthScreen();

  function scrollToSection(sectionId){
    const element = document.getElementById(sectionId);
    
    if(element) {
      const marginTop = 0;
      const scrollToY = element.getBoundingClientRect().top + window.scrollY - marginTop;       
      window.scrollTo({top: scrollToY, behavior: "smooth"});
    }
  }

  function determineActiveSection() {
    for(let i = navSpy.length - 1; i>=0; i--) {
      const section = document.getElementById(navSpy[i].sectionId);
      
      if(section) {        
        const rect = section.getBoundingClientRect();        
        if( rect.top <= 120 && rect.bottom >= 120 ) {          
          setActiveLink(navSpy[i].sectionId);
          break;
        }
      }
    }
  }

  function handleMenu(){
    setMenuMobile(() => !menuMobile);
    setInitialMenuMobile(true);
  }

  useEffect(() => {
    window.addEventListener("scroll", determineActiveSection);
    setActiveLink('Inicio');
    return () => {
      window.removeEventListener("scroll", determineActiveSection);
    }
  },[])

  return (
    <>
    <header className={`${menuMobile ? 'ActiveMenuMobile' : ''} ${ InitialMenuMobile && !menuMobile ? 'DisabledHeader ' : ''}`}>
      <div className={`Header__Box ${menuMobile ? 'ActiveMenu' : ''}`}>
          { !menuMobile && (<h1>Adelson<span>.</span></h1>)}
          { (width >= 960 || menuMobile) &&
            (
              <nav>
                <ul>
                  {navSpy.map( ({sectionId, icon,label},i) => {
                    return <li key={i} onClick={() => scrollToSection(sectionId)}><Link className={ activeLink === sectionId ? 'active' : ''} to='/'>{width < 960 && icon}{label}</Link></li>
                  })}
                </ul>
              </nav>
            )}
          { (width >= 960  || menuMobile ) && (<Button href={curriculo} icon={<BsFileEarmarkMedical />}>Baixar CV  </Button>)}
          { (width < 960) && (<button onClick={handleMenu} className='Botao__Menu'>{ !menuMobile ? <BsUiChecksGrid size='1.2rem'/> : <BsXLg size='1.2rem'/> }</button>)}
        </div>
    </header>
    {children}
    </>
  )
}

export default Header;