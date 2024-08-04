import React from 'react';
import './Apresentacao.css';
import { BsGithub,BsWhatsapp,BsLinkedin,BsSend,BsArrowDown } from "react-icons/bs";
import { useWidthScreen } from '../../hooks/WidthScreen/useWidthScreen';
import Button from '../../utils/Button/Button';
import {MotionReveal} from '../../utils/Motion/MotionReveal';
import { MotionLeft } from '../../utils/Motion/MotionDown';

const Apresentacao = () => {

    const { width } = useWidthScreen();

  return (
    <section id="Inicio" className="Apresentacao">
        <div className="Apresentacao__Sociais">
            <MotionLeft index={0}><a href="https://github.com/Adelson10" target="_blank"><BsGithub size={'1.5rem'}/></a></MotionLeft>
            <MotionLeft index={1}><a href="https://api.whatsapp.com/send/?phone=5511914893849&text&type=phone_number&app_absent=0" target="_blank"><BsWhatsapp size={'1.5rem'}/></a></MotionLeft>
            <MotionLeft index={2}><a href="https://www.linkedin.com/in/adelson-barros-561a1a24a/" target="_blank"><BsLinkedin size={'1.5rem'}/></a></MotionLeft>
        </div>
        <div className="Apresentacao_Texto">
            <MotionReveal><h1>Prazer, sou Adelson<span>.</span></h1></MotionReveal>
            <MotionReveal><h2>Eu sou <strong>Desenvolvedor Full-Stack</strong></h2></MotionReveal>
            <MotionReveal><p>Sou programador full stack e minha paixão é a criatividade e a inovação. Dedico-me intensamente ao meu trabalho, imerso na busca de soluções inovadoras.</p></MotionReveal>
            <MotionReveal><Button icon={<BsSend />} href='https://api.whatsapp.com/send/?phone=5511914893849&text&type=phone_number&app_absent=0' >Chama ai</Button></MotionReveal>
            { (width >= 960) &&
            (<MotionReveal>
                <div className="container__Mouse">
                <div className="Mouse"></div>
                <h3>Role para Baixo</h3>
                <BsArrowDown />
            </div>
            </MotionReveal>)}
        </div>
        <div className="Apresentacao__foto">
            <div className="Apresentacao__foto_Imagem"></div>
        </div>
    </section>
  )
}

export default Apresentacao;