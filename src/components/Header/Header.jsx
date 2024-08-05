import { useEffect, useState } from 'react'
import { BsHouseDoor,BsPerson,BsFileEarmarkMedical,BsSuitcaseLg,BsUiChecksGrid,BsXLg,BsEnvelope,BsTerminal } from "react-icons/bs";
import './Header.css';
import { useWidthScreen } from '../../hooks/WidthScreen/useWidthScreen';
import { Link } from 'react-router-dom';
import Button from '../../utils/Button/Button';
import curriculo from '../../assets/curriculo/Curriculo Adelson.pdf';
import { MotionDown } from '../../utils/Motion/MotionDown';
import { MotionReveal } from '../../utils/Motion/MotionReveal';

// Variaveis que guarda os dados do nav
const navSpy = [
  {
    sectionId: 'Inicio',
    icon: (<BsHouseDoor size='1.1rem'/>),
    label: 'Inicio'
  },
  {
    sectionId: 'SobreMim',
    icon: (<BsPerson size='1.1rem'/>),
    label: 'Sobre Mim'
  },
  {
    sectionId: 'Projetos',
    icon: (<BsTerminal size='1.1rem'/>),
    label: 'Projetos'
  },
  {
    sectionId: 'Experiencia',
    icon: (<BsSuitcaseLg size='1.1rem'/>),
    label: 'Experiência'
  },
  {
    sectionId: 'Contato',
    icon: (<BsEnvelope size='1.1rem'/>),
    label: 'Contato'
  }
]

const Header = ({children}) => {
  // variavel de Ativação do Menu na versão Mobile
  const [menuMobile, setMenuMobile] = useState(false);
  // Variavel de reset para cancelar a animação inicial do Menu no Mobile
  const [InitialMenuMobile, setInitialMenuMobile] = useState(false);
  // Variavel de Ativação no elemento atual da pagina
  const [activeLink, setActiveLink] = useState('Inicio');
  // Comprimento da tela do Browser
  const { width } = useWidthScreen();
  
  // Função de Scroll para mover a pagina para o elemento ancorado
  function scrollToSection(sectionId){
    // Puxa o elemento atual da pagina que foi selecionada
    const element = document.getElementById(sectionId);

    // Verifica se o elemento existe
    if(element) {
      // Marca a margin do Top como 0
      const marginTop = 0;
      //  Fornece informações sobre sua posição em relação à janela de visualização + Retorna o número de pixels que o documento já rolou verticalmente - a Margin top selecionada.
      const scrollToY = element.getBoundingClientRect().top + window.scrollY - marginTop;
      // Move para a posição do elemento e suavisa o deslize com behavior    
      window.scrollTo({top: scrollToY, behavior: "smooth"});
    }
  }

  // Função de determinar o selection ativo
  function determineActiveSection() {
    // Loop de tras pra frente 4,3,2,1
    for(let i = navSpy.length - 1; i>=0; i--) {
      // Seleciona o array de ids de list do nav
      const section = document.getElementById(navSpy[i].sectionId);
      
      // Se o valor existir
      if(section) {
        // fornece informações sobre o tamanho de um elemento e seu posição em relação à janela de visualização.
        const rect = section.getBoundingClientRect();
        // Se o valor da distancia da janela visualizada for menor que 350 e maior que 120 
        if( rect.top <= 350 && rect.bottom >= 120) { 
          // ao encontrar o valor que esta dentro dos parametros ele salva o valor
          setActiveLink(navSpy[i].sectionId);
          break;
        }
      }
    }
  }

  // Função que ao clicar no botão ativa e desativa o Menu Mobile
  function handleMenu(){
    setMenuMobile(() => !menuMobile);
    setInitialMenuMobile(true);
  }

  useEffect(() => {
    // Adiciona o evento que determina qual section está ativa
    window.addEventListener("scroll", determineActiveSection);
    return () => {
      // Remove o evento do js
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
                        <li key={i} onClick={() => scrollToSection(sectionId)}>
                          <MotionDown index={i}>
                          <Link className={ activeLink === sectionId ? 'active' : ''} to='/'>
                            {width < 960 && icon}{label}
                          </Link>
                          </MotionDown>
                        </li>
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
          { (width < 960) && (<button onClick={handleMenu} className='Botao__Menu'>{ !menuMobile ? (<h1>{activeLink}<BsUiChecksGrid size='1.2rem'/></h1>) : <BsXLg size='1.2rem'/> }</button>)}
        </div>
    </header>
    {children}
    </>
  )
}

export default Header;