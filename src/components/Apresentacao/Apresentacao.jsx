import React from 'react';
import './Apresentacao.css';
import { BsGithub,BsInstagram,BsLinkedin,BsSend,BsArrowDown } from "react-icons/bs";
import { useWidthScreen } from '../../hooks/WidthScreen/useWidthScreen';
import Button from '../../utils/components/Button';

const Apresentacao = () => {

    const { width } = useWidthScreen();

  return (
    <section id="Inicio" className="Apresentacao">
        <div className="Apresentacao__Sociais">
            <a href="https://github.com/Adelson10" target="_blank"><BsGithub size={'1.5rem'}/></a>
            <a href="https://www.instagram.com/barros.adelson21/" target="_blank"><BsInstagram size={'1.5rem'}/></a>
            <a href="https://www.linkedin.com/in/adelson-barros-561a1a24a/" target="_blank"><BsLinkedin size={'1.5rem'}/></a>
        </div>
        <div className="Apresentacao_Texto">
            <h1>Prazer, sou Adelson<span>.</span></h1>
            <h2>Eu sou <strong>Desenvolvedor Full-Stack</strong></h2>
            <p>Sou programador full stack e minha paixão é a criatividade e a inovação. Dedico-me intensamente ao meu trabalho, imerso na busca de soluções inovadoras.</p>
            <Button icon={<BsSend />} href='https://api.whatsapp.com/send/?phone=5511914893849&text&type=phone_number&app_absent=0' >Chama ai</Button>
            { (width >= 960) &&
            (<div className="container__Mouse">
                <div className="Mouse"></div>
                <h3>Role para Baixo</h3>
                <BsArrowDown />
            </div>)}
        </div>
        <div className="Apresentacao__foto">
            <div className="Apresentacao__foto_Imagem"></div>
        </div>
    </section>
  )
}

export default Apresentacao;