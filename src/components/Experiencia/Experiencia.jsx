import React from 'react';
import './Experiencia.css'
import {MotionReveal} from '../../utils/Motion/MotionReveal';

const experiencia = [
  {
    empresa: 'Unitins',
    ocupacao: 'Supervisor de TI',
    resumo: 'Trabalhar como supervisor de TI envolve liderar e gerenciar equipes responsáveis pela infraestrutura de tecnologia da informação de uma organização. Essa função requer habilidades técnicas sólidas, conhecimento em sistemas, redes e segurança da informação.',
    tecnologias: ['React', 'Node','MongoDB','Express'],
    local: 'Colinas do Tocantins',
    tempo: '2022 - Presente'
  },
  {
    empresa: 'Unitins',
    ocupacao: 'Supervisor de TI',
    resumo: 'Trabalhar como supervisor de TI envolve liderar e gerenciar equipes responsáveis pela infraestrutura de tecnologia da informação de uma organização. Essa função requer habilidades técnicas sólidas, conhecimento em sistemas, redes e segurança da informação.',
    tecnologias: ['React', 'Node','MongoDB','Express'],
    local: 'Colinas do Tocantins',
    tempo: '2022 - Presente'
  },
  {
    empresa: 'Unitins',
    ocupacao: 'Supervisor de TI',
    resumo: 'Trabalhar como supervisor de TI envolve liderar e gerenciar equipes responsáveis pela infraestrutura de tecnologia da informação de uma organização. Essa função requer habilidades técnicas sólidas, conhecimento em sistemas, redes e segurança da informação.',
    tecnologias: ['React', 'Node','MongoDB','Express'],
    local: 'Colinas do Tocantins',
    tempo: '2022 - Presente'
  },
]

const Experiencia = () => {
  return (
  <section id="Experiencia">
    <div className='Title'>
      <MotionReveal><h1>Experiência<span>.</span></h1></MotionReveal>
      <div className='line'></div>
    </div>
    {experiencia.map(({empresa, ocupacao, resumo, tecnologias, local, tempo}) => {
      return (
        <div className='Experiencia' key={empresa}>
          <div className='Experiencia__Dados'>
            <MotionReveal><h4>{empresa}</h4></MotionReveal>
            <MotionReveal><p>{tempo}</p></MotionReveal>
          </div>
          <div className='Experiencia__Dados'>
            <MotionReveal><span className='Experiencia_Ocupacao'>{ocupacao}</span></MotionReveal>
            <MotionReveal><p>{local}</p></MotionReveal>
          </div>
          <MotionReveal><p>{resumo}</p></MotionReveal>
          <MotionReveal>
            <ul className='Habilidades_grid'>
              {tecnologias.map((tecnologia,i) => (<li className='chip' key={tecnologia}>{tecnologia}</li>))}
            </ul>
          </MotionReveal>
        </div>
      )
    })}
</section>
  )
}

export default Experiencia;
