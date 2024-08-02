import React from 'react'
import Button from '../../utils/components/Button';
import { BsFileEarmarkMedical } from "react-icons/bs";
import './SobreMim.css';

const SobreMim = () => {
  return (
    <section id="SobreMim" className='container'>
    <div className='Title'>
        <h1>Sobre Mim<span>.</span></h1>
        <div className='line'></div>
    </div>
    <article>
        <div className="skills">
            <p>Sou desenvolvedor full-stack com sólidos conhecimentos em UI/UX e um bom domínio em back-end. Minha experiência como designer complementa minhas habilidades técnicas, permitindo-me entregar projetos complexos e desafiadores que superam as expectativas dos clientes com um trabalho de alta qualidade.</p>
            <p>Tenho uma sólida formação em desenvolvimento front-end, onde me especializei na criação de páginas web atraentes e funcionais. Minha paixão pelo design e pela experiência do usuário me impulsionou a aprimorar continuamente minhas habilidades, garantindo que cada projeto entregue seja visualmente agradável e intuitivo para os usuários finais.</p>
            <p>No âmbito do desenvolvimento back-end, possuo conhecimentos em Node.js. Tenho trabalhado para melhorar continuamente minhas habilidades em back-end, desenvolvendo servidores, gerenciando bancos de dados e implementando lógica de negócios. Essa busca constante por aprendizado me permite criar soluções mais integradas e eficientes.</p>
            <p>Meu compromisso com a excelência e a inovação se reflete em cada projeto que realizo, onde busco constantemente novas tecnologias e abordagens para entregar resultados de alta qualidade que atendam e superem as expectativas dos clientes.</p>
        </div>
    </article>
    </section>
  )
}

export default SobreMim