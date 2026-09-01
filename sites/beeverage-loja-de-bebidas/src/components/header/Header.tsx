import Search from "./Search";
import ButtonIcon from "../utils/ButtonIcon";
import { Heart, ShoppingCartSimple, WechatLogo } from "@phosphor-icons/react";
import Profile from "./Profile";
import './Header.css';
import Catalogo from "./Catalogo";
import useMedia from "../../hooks/useMedia";
import React from "react";
import ModalBox from "../utils/ModalBox";
import { Link } from "react-router-dom";

const MenuMobileModal: IModal[] = [
    {
        icon: <ShoppingCartSimple size='1.5rem' weight="fill"/>,
        name: 'Carrinho',
        src: '/carrinho'
    },
    {
        icon: <WechatLogo size='1.5rem' weight="fill"/>,
        name: 'Fale Conosco',
        src: '/faleconosco'
    },
    {
        icon: <Heart size='1.5rem' weight="fill"/>,
        name: 'Favoritos',
        src: '/favoritos'
    },
]

const Header = () => {    
    const mobile = useMedia(1000);
    const [menuMobile, setMenuMobile] = React.useState<boolean>(false);
    
    return (
    <>
        <header>
            <div className="Header">
                { !mobile && <Link to={'/'} className="Logo"></Link> }
                <Search mobile={mobile}/>
                { !mobile ?
                (<>
                    <nav>
                        <ButtonIcon className="icons">
                            <ShoppingCartSimple size='1.5rem' weight="fill"/>
                        </ButtonIcon>
                        <ButtonIcon className="icons">
                            <WechatLogo size='1.5rem' weight="fill"/>
                        </ButtonIcon>
                    </nav>
                </>)
                : (<>
                    <div className="Header_Container">
                        <button className={`Header_MenuMobile ${menuMobile ? 'Active' : ''}`}><div className="MenuMobile_Icon" onClick={() => setMenuMobile(!menuMobile)}></div></button>
                        { menuMobile && <ModalBox modelos={MenuMobileModal}/>}
                    </div>
                </>)
                }               
                <Profile />
            </div>
            <Catalogo mobile={mobile}/>
        </header>
    </>
  )
}

export default Header;