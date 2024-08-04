import { useEffect, useState } from 'react'
import { BsHouseDoor,BsPerson,BsFileEarmarkMedical,BsSuitcaseLg,BsUiChecksGrid,BsXLg } from "react-icons/bs";
import './Header.css';
import { useWidthScreen } from '../../hooks/WidthScreen/useWidthScreen';
import { Link } from 'react-router-dom';
import Button from '../../utils/Button/Button';
import curriculo from '../../assets/curriculo/Curriculo Adelson.pdf';
import { MotionDown } from '../../utils/Motion/MotionDown';
import { MotionReveal } from '../../utils/Motion/MotionReveal';

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
    sectionId: 'Projetos',
    icon: (<BsSuitcaseLg />),
    label: 'Projetos'
  },
  {
    sectionId: 'Experiencia',
    icon: (<BsSuitcaseLg />),
    label: 'Experiência'
  },
  {
    sectionId: 'Contato',
    icon: (<BsSuitcaseLg />),
    label: 'Contato'
  }
]

const Header = ({children}) => {
  const [menuMobile, setMenuMobile] = useState(false);
  const [InitialMenuMobile, setInitialMenuMobile] = useState(false);
  const [activeLink, setActiveLink] = useState('Inicio');
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
        if( rect.top <= 350 && rect.bottom >= 120) { 
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
    return () => {
      window.removeEventListener("scroll", determineActiveSection);
    }
  },[])

  return (
    <>
    <header className={`${menuMobile ? 'ActiveMenuMobile' : ''} ${ InitialMenuMobile && !menuMobile ? 'DisabledHeader ' : ''}`}>
      <div className={`Header__Box ${menuMobile ? 'ActiveMenu' : ''}`}>
          { !menuMobile && (<MotionReveal><h1>Adelson<span>.</span></h1></MotionReveal>)}
          { (width >= 960 || menuMobile) &&
            (
              <nav>
                <ul>
                { (width > 960) ? navSpy.map( ({sectionId, icon,label},i) => {
                    return (
                      <MotionDown index={i}>
                        <li key={i} onClick={() => scrollToSection(sectionId)}>
                          <Link className={ activeLink === sectionId ? 'active' : ''} to='/'>
                            {width < 960 && icon}{label}
                          </Link>
                        </li>
                      </MotionDown>
                    )
                  }) : 
                  navSpy.map( ({sectionId, icon,label},i) => {
                    return (
                        <li key={i} onClick={() => scrollToSection(sectionId)}>
                          <Link className={ activeLink === sectionId ? 'active' : ''} to='/'>
                            {width < 960 && icon}{label}
                          </Link>
                        </li>
                    )
                  })
                  }
                {(width > 960  && !menuMobile ) ? 
                  (<MotionDown index={5}>
                    <Button href={curriculo}>Baixar CV</Button>
                  </MotionDown>)
                  :
                  (<Button Iconizado={'Iconizado'} href={curriculo} icon={<BsFileEarmarkMedical />}></Button>)
                }
                </ul>
              </nav>
            )}
          { (width < 960) && (<button onClick={handleMenu} className='Botao__Menu'>{ !menuMobile ? <BsUiChecksGrid size='1.2rem'/> : <BsXLg size='1.2rem'/> }</button>)}
        </div>
    </header>
    {children}
    </>
  )
}

export default Header;