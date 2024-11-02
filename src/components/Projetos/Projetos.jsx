import React from 'react';
import './Projetos.css';
import City from '../../assets/projetos/example-city.png';
import Minis from '../../assets/projetos/Minis.png';
import Cerveja from '../../assets/projetos/LojaDeBebidas.png';
import BoxProjetos from '../../utils/BoxProjetos/BoxProjetos';
import {MotionReveal} from '../../utils/Motion/MotionReveal';

const dateProjets = [
{
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
  image: Minis,
  title: 'Salatir Minis',
  tecProjeto: 'React - TypeScript - React-Router-Dom - Frame Motion',
  prevProjeto: 'Desenvolvi uma página de abertura para uma nova loja de miniaturas, que será lançada em breve.',
  descProjeto: (<>
  <p>Desenvolvi uma página de abertura para uma nova loja de miniaturas, que será lançada em breve. A página apresenta um design moderno e responsivo, com um cabeçalho que inclui o logotipo da loja e um menu de navegação intuitivo. O banner principal destaca imagens vibrantes de miniaturas, com chamadas para ação que incentivam os visitantes a explorar os produtos.</p>
  <p>Uma das características mais impressionantes da página são os efeitos 3D de visualização, que permitem que os usuários interajam com as miniaturas de maneira envolvente, proporcionando uma experiência visual imersiva. A seção de destaques exibe uma seleção das miniaturas mais populares, acompanhadas de descrições e preços. Também há categorias para facilitar a navegação e uma seção de depoimentos de clientes, reforçando a confiança na qualidade dos produtos. O layout foi projetado para proporcionar uma experiência de usuário envolvente e acessível em qualquer dispositivo.</p></>),
  GitHub: 'https://github.com/Adelson10/Saladir-Minis',
  Href: 'https://minis.adelsonbarros.com',
},
{
  image: Cerveja,
  title: 'Beeverage: Loja de Bebidas',
  tecProjeto: 'React - TypeScript - React-Router-Dom - Frame Motion',
  prevProjeto: 'Criei uma loja de bebidas alcoólicas utilizando React e TypeScript.',
  descProjeto: (<>
  <p>Criei uma loja de bebidas alcoólicas utilizando React e TypeScript. O objetivo foi criar uma plataforma de e-commerce intuitiva, onde os usuários pudessem explorar uma vasta seleção de produtos, incluindo cervejas, vinhos e destilados.</p>
  <p>A experiência de usuário (UX) foi especialmente otimizada para dispositivos móveis, permitindo uma navegação fluida em telas menores. A aplicação conta com categorias bem definidas, filtros de busca, e uma interface de carrinho de compras que facilita o processo de compra.</p></>),
  GitHub: 'https://github.com/Adelson10/Beeverage-Loja-de-Bebidas',
  Href: 'https://loja.adelsonbarros.com',
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