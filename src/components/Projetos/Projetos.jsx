import React from 'react';
import './Projetos.css';
import City from '../../assets/projetos/example-city.png';
import Example from '../../assets/projetos/example-project.jpg';
import BoxProjetos from '../../utils/BoxProjetos/BoxProjetos';
import {MotionReveal} from '../../utils/Motion/MotionReveal';

const dateProjets = [{
  image: City,
  title: 'City DashBoard',
  tecProjeto: 'React - NodeJs - Express - Postgres - Knex',
  prevProjeto: 'O dashboard City é uma aplicação web simples e eficiente desenvolvida com React no front-end e Node.js no back-end.',
  descProjeto: (<>
  <p>O dashboard City é uma aplicação web simples e eficiente desenvolvida com React no front-end e Node.js no back-end. Foi criada para ajudar a gerenciar e visualizar dados de uma cidade e seus habitantes. A interface é amigável e fácil de usar, permitindo que os usuários encontrem informações importantes de maneira organizada e sem complicações.</p>
  <p>A aplicação apresenta estatísticas básicas sobre a cidade, como população, áreas geográficas e infraestrutura. Além disso, oferece gráficos e tabelas dinâmicas que ajudam a visualizar dados demográficos, econômicos e ambientais de forma clara e compreensível. O objetivo é fornecer uma ferramenta prática que facilite o acesso a dados relevantes para a tomada de decisões.</p></>),
  GitHub: 'https://github.com/Adelson10/Estudos-NodeJs-2',
  Href: 'https://city.adelsonbarros.com',
},
]

const Projetos = () => {
  return (
    <section id="Projetos">
        <div className='Title'>
          <MotionReveal><h1>Projetos<span>.</span></h1></MotionReveal>
          <div className='line'></div>
        </div>
        <div className='Projetos'>
          {dateProjets.map(({image,title,tecProjeto,prevProjeto,GitHub,Href,descProjeto}) => (
            <BoxProjetos key={title} prevProjeto={prevProjeto} image={image} title={title} descProjeto={descProjeto} tecProjeto={tecProjeto} GitHub={GitHub} Href={Href}/>
          ))}
        </div>
    </section>
  )
}

export default Projetos