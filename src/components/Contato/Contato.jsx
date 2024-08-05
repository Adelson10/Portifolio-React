import React from 'react'
import { Link } from 'react-router-dom';
import { BsEnvelope } from "react-icons/bs";
import './Contato.css';
import {MotionReveal} from '../../utils/Motion/MotionReveal';

const Contato = () => {
  return (
    <section id="Contato">
        <div className='Container'>
          <MotionReveal><h1>Contato<span>.</span></h1></MotionReveal>
          <MotionReveal><p>Envie-me um e-mail se quiser entrar em contato! Você também pode me encontrar no <strong><Link to={'https://www.linkedin.com/in/adelson-barros-561a1a24a/'} target='_blank'>LinkedIn</Link></strong> ou <strong><Link to={'https://api.whatsapp.com/send/?phone=5511914893849&text&type=phone_number&app_absent=0'} target='_blank'>WhatsApp</Link></strong>, conforme sua preferência.</p></MotionReveal>
          <MotionReveal><Link to={'mailto:barros.adelson101@gmail.com'}><BsEnvelope />barros.adelson101@gmail.com</Link></MotionReveal>
        </div>
    </section>
  )
}

export default Contato;