import { Planet, QuestionMark, Phone } from "@phosphor-icons/react";
import './Header.css';
import LogoAliens from "../../assets/icons/LogoAliens";
import useMedia from "../../Hooks/useMedia";
import React from "react";

const Header = () => {
    const mobile = useMedia(600);
    const [navMobile, setNavMobile] = React.useState<boolean>(false);

    React.useEffect(() => {
        if(navMobile) {
            document.body.style.overflowY = 'hidden';
        } else {
            document.body.style.overflowY = 'scroll';
        }
    }, [navMobile])
    if (mobile) {
        return (
            <header>
                <div className={`header-mobile ${navMobile ? 'close' : ''}`} onClick={() => setNavMobile(navMobile => !navMobile)}></div>
                <div className="logo-loja"></div>
                { navMobile &&
                    <nav>
                        <ul>
                            <li><a target="_self" href="#Universo" onClick={() => setNavMobile(navMobile => !navMobile)}><Planet /> O universo</a></li>
                            <li><a target="_self" href="#Faccao" onClick={() => setNavMobile(navMobile => !navMobile)}><LogoAliens />Facções</a></li>
                            <li><a target="_self" href="#ComoJogar" onClick={() => setNavMobile(navMobile => !navMobile)}><QuestionMark /> Como Jogar</a></li>
                            <li><a target="_self" href="#FaleConosco" onClick={() => setNavMobile(navMobile => !navMobile)}><Phone /> Fale Conosco</a></li>
                        </ul>
                    </nav>
                }
            </header>
        )
    } else {
        return (
            <header>
                <nav>
                    <ul>
                        <li><a target="_self" href="#Universo"  ><Planet /> O universo</a></li>
                        <li><a target="_self" href="#Faccao"><LogoAliens />Facções</a></li>
                    </ul>
                    <div className="header-logo-storie">
                        <div className="logo-loja"></div>
                    </div>
                    <ul>
                        <li><a target="_self" href="#ComoJogar"><QuestionMark /> Como Jogar</a></li>
                        <li><a target="_self" href="#FaleConosco"><Phone /> Fale Conosco</a></li>
                    </ul>
                </nav>
            </header>
          )
    }
}

export default Header;