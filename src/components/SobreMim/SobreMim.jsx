import React from 'react'
import { BsWindowSidebar,BsFillTerminalFill } from "react-icons/bs";
import './SobreMim.css';

const frontEnd = ['React','TypeScript','HTML','CSS','REDUX','TailwindCss','Figma'];
const backEnd = ['NodeJs','Express','Postgres','MongoDB','GitHub','Knex'];

const SobreMim = () => {
  return (
    <section id="SobreMim">
    <div className='Title'>
        <h1>Sobre Mim<span>.</span></h1>
        <div className='line'></div>
    </div>
      <div className='Texto_SobreMim'>
          <div>
              <p className='Paragrafo_SobreMim Primeiro'>Sou desenvolvedor full-stack com sólidos conhecimentos em UI/UX e um bom domínio em back-end. Minha experiência como designer complementa minhas habilidades técnicas, permitindo-me entregar projetos complexos e desafiadores que superam as expectativas dos clientes com um trabalho de alta qualidade.</p>
              <p className='Paragrafo_SobreMim'>Tenho uma sólida formação em desenvolvimento front-end, onde me especializei na criação de páginas web atraentes e funcionais. Minha paixão pelo design e pela experiência do usuário me impulsionou a aprimorar continuamente minhas habilidades, garantindo que cada projeto entregue seja visualmente agradável e intuitivo para os usuários finais.</p>
              <p className='Paragrafo_SobreMim'>No âmbito do desenvolvimento back-end, possuo conhecimentos em Node.js. Tenho trabalhado para melhorar continuamente minhas habilidades em back-end, desenvolvendo servidores, gerenciando bancos de dados e implementando lógica de negócios. Essa busca constante por aprendizado me permite criar soluções mais integradas e eficientes.</p>
          </div>
          <div className='Habilidades_Box'>
              <div className='Habilidades__frontEnd'>
                <h4><BsWindowSidebar />Front-End</h4>
                <div className='Habilidades_grid'>
                  {frontEnd.map((hab) => {
                    return <span key={hab} className='chip'>{hab}</span>
                  })}
                </div>
              </div>
              <div className='Habilidades__backEnd'>
                <h4><BsFillTerminalFill />Back-End</h4>
                <div className='Habilidades_grid'>
                  {backEnd.map((hab) => {
                    return <span key={hab} className='chip'>{hab}</span>
                  })}
                </div>
              </div>
          </div>
      </div>
    </section>
  )
}

export default SobreMim