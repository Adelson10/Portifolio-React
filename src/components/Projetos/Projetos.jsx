import React from 'react';
import './Projetos.css';
import City from '../../assets/projetos/example-city.png';
import Example from '../../assets/projetos/example-project.jpg';
import BoxProjetos from '../../utils/BoxProjetos/BoxProjetos';

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
{
  image: Example,
  title: 'Paint.app',
  tecProjeto: 'Flutter - MUI - Python - FastAPI',
  prevProjeto: 'A social community for painters to connect with others in their community. I handle everything backend (50K monthly active users).',
  descProjeto: (<>
  <p>The Canvas Club is a social community for painters to connect with others in their community. I work primarily on the backend, a collection of Node & Express microservices. Data is stored primarily in Postgres & cached in Redis.</p>
  <p>The team in total consists of 5 developers. This is a passion project for all of us. Because this isn't real, here's some gibberish to fill space : Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aspernatur quia officia odio nulla consectetur aperiam ad tempora magni magnam nesciunt. Fuga id sapiente facere ipsa eius exercitationem officiis deleniti, rerum dolorum. Deserunt soluta modi culpa animi.</p>
  </>),
  GitHub: 'https://github.com/Adelson10/Estudos-NodeJs-2',
  Href: 'https://city.adelsonbarros.com',
},
{
  image: Example,
  title: 'Paint.app',
  tecProjeto: 'Flutter - MUI - Python - FastAPI',
  prevProjeto: 'A social community for painters to connect with others in their community. I handle everything backend (50K monthly active users).',
  descProjeto: (<>
  <p>The Canvas Club is a social community for painters to connect with others in their community. I work primarily on the backend, a collection of Node & Express microservices. Data is stored primarily in Postgres & cached in Redis.</p>
  <p>The team in total consists of 5 developers. This is a passion project for all of us. Because this isn't real, here's some gibberish to fill space : Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aspernatur quia officia odio nulla consectetur aperiam ad tempora magni magnam nesciunt. Fuga id sapiente facere ipsa eius exercitationem officiis deleniti, rerum dolorum. Deserunt soluta modi culpa animi.</p>
  </>),
  GitHub: 'https://github.com/Adelson10/Estudos-NodeJs-2',
  Href: 'https://city.adelsonbarros.com',
},
{
  image: Example,
  title: 'Paint.app',
  tecProjeto: 'Flutter - MUI - Python - FastAPI',
  prevProjeto: 'A social community for painters to connect with others in their community. I handle everything backend (50K monthly active users).',
  descProjeto: (<>
  <p>The Canvas Club is a social community for painters to connect with others in their community. I work primarily on the backend, a collection of Node & Express microservices. Data is stored primarily in Postgres & cached in Redis.</p>
  <p>The team in total consists of 5 developers. This is a passion project for all of us. Because this isn't real, here's some gibberish to fill space : Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aspernatur quia officia odio nulla consectetur aperiam ad tempora magni magnam nesciunt. Fuga id sapiente facere ipsa eius exercitationem officiis deleniti, rerum dolorum. Deserunt soluta modi culpa animi.</p>
  </>),
  GitHub: 'https://github.com/Adelson10/Estudos-NodeJs-2',
  Href: 'https://city.adelsonbarros.com',
}
]

const Projetos = () => {
  return (
    <section id="Projetos">
        <div className='Title'>
          <h1>Projetos<span>.</span></h1>
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