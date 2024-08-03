import React from 'react';
import './Experiencia.css'

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
      <h1>Experiência<span>.</span></h1>
      <div className='line'></div>
    </div>
    {experiencia.map(({empresa, ocupacao, resumo, tecnologias, local, tempo}) => {
      return (
        <div className='Experiencia' key={empresa}>
          <div className='Experiencia__Dados'>
            <h4>{empresa}</h4>
            <p>{tempo}</p>
          </div>
          <div className='Experiencia__Dados'>
            <span className='Experiencia_Ocupacao'>{ocupacao}</span>
            <p>{local}</p>
          </div>
          <p>{resumo}</p>
          <ul className='Habilidades_grid'>
            {tecnologias.map((tecnologia,i) => (<li className='chip' key={tecnologia}>{tecnologia}</li>))}
          </ul>
        </div>
      )
    })}
</section>
  )
}

export default Experiencia;
