import React from 'react';
import './Experiencia.css'
import {MotionReveal} from '../../utils/Motion/MotionReveal';

const experiencia = [
  {
    empresa: 'Freelancer',
    ocupacao: 'Desginer Web',
    resumo: 'Trabalhei como desenvolvedor web, criando sites utilizando Shopify e Panda, plataformas similares ao WordPress. Durante esse período, utilizei minha experiência em JavaScript, HTML e CSS para implementar melhorias significativas nos projetos. Meu foco estava em personalizar e otimizar a experiência do usuário, garantindo que os sites fossem funcionais, visualmente atraentes e perfeitamente alinhados com as necessidades dos clientes.',
    tecnologias: ['HTML', 'CSS','JavaScript','Shopify'],
    local: 'Remoto',
    tempo: 'jan de 2022 - jul de 2022'
  },
  {
    empresa: 'Freelancer',
    ocupacao: 'Desenvolvedor Full Stack',
    resumo: 'Atuei como desenvolvedor full stack em projetos personalizados, desenvolvendo aplicações web completas desde o front-end até o back-end. Utilizei React no front-end, Node.js no back-end e PostgreSQL como banco de dados, garantindo uma integração eficiente entre as camadas. Meu foco foi entregar soluções robustas e escaláveis, alinhadas às necessidades dos clientes, sempre com atenção à experiência do usuário e à performance da aplicação.',
    tecnologias: ['HTML', 'CSS','JavaScript','React','Node.js','TypeScript','Knex','PostgreSQL'],
    local: 'Remoto',
    tempo: 'jan de 2024 - jul de 2024'
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
