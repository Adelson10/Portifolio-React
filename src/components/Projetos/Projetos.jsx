import React from 'react';
import './Projetos.css';
import Minis from '../../assets/projetos/Minis.png';
import Frete from '../../assets/projetos/Gerador.png';
import Cerveja from '../../assets/projetos/LojaDeBebidas.png';
import Colegio from '../../assets/projetos/Colegio.png';
import EnsinaPlus from '../../assets/projetos/EnsinaPlus.png';
import BoxProjetos from '../../utils/BoxProjetos/BoxProjetos';
import {MotionReveal} from '../../utils/Motion/MotionReveal';

const dateProjets = [
{
  image: Minis,
  title: 'Salatir Minis',
  tecProjeto: 'React - TypeScript - React-Router-Dom - Frame Motion',
  prevProjeto: 'Desenvolvi uma página de abertura para uma nova loja de miniaturas, que será lançada em breve.',
  descProjeto: (<>
  <p>Desenvolvi uma página de abertura para uma nova loja de miniaturas, que será lançada em breve. A página apresenta um design moderno e responsivo, com um cabeçalho que inclui o logotipo da loja e um menu de navegação intuitivo. O banner principal destaca imagens vibrantes de miniaturas, com chamadas para ação que incentivam os visitantes a explorar os produtos.</p>
  <p>Uma das características mais impressionantes da página são os efeitos 3D de visualização, que permitem que os usuários interajam com as miniaturas de maneira envolvente, proporcionando uma experiência visual imersiva. A seção de destaques exibe uma seleção das miniaturas mais populares, acompanhadas de descrições e preços. Também há categorias para facilitar a navegação e uma seção de depoimentos de clientes, reforçando a confiança na qualidade dos produtos. O layout foi projetado para proporcionar uma experiência de usuário envolvente e acessível em qualquer dispositivo.</p></>),
  Href: 'https://mini.adelsonbarros.com/',
},
{
  image: Cerveja,
  title: 'Beeverage: Loja de Bebidas',
  tecProjeto: 'React - TypeScript - React-Router-Dom - Frame Motion',
  prevProjeto: 'Criei uma loja de bebidas alcoólicas utilizando React e TypeScript.',
  descProjeto: (<>
  <p>Criei uma loja de bebidas alcoólicas utilizando React e TypeScript. O objetivo foi criar uma plataforma de e-commerce intuitiva, onde os usuários pudessem explorar uma vasta seleção de produtos, incluindo cervejas, vinhos e destilados.</p>
  <p>A experiência de usuário (UX) foi especialmente otimizada para dispositivos móveis, permitindo uma navegação fluida em telas menores. A aplicação conta com categorias bem definidas, filtros de busca, e uma interface de carrinho de compras que facilita o processo de compra.</p></>),
  Href: 'https://loja.adelsonbarros.com/',
},
{
  image: Frete,
  title: 'Gerador de Anúncio de Frete',
  tecProjeto: 'HTML - CSS - JAVASCRIPT',
  prevProjeto: 'Uma ferramenta web simples que gera rapidamente textos prontos para anúncios de frete e transporte.',
  descProjeto: (<><p>O Gerador de Anúncio de Frete é uma aplicação web leve desenvolvida com HTML, CSS e JavaScript, criada para facilitar a criação de anúncios profissionais para serviços de frete e transporte. A ferramenta permite que motoristas, transportadoras e prestadores de serviço gerem textos prontos para divulgação em redes sociais e plataformas de venda.</p></>),
  Href: 'https://gerador.adelsonbarros.com/',
},
{
  image: Colegio,
  title: 'Colégio Albert Einstein Colinas',
  tecProjeto: 'React - Vite - TailwindCSS - Framer Motion',
  prevProjeto: 'Site institucional para um colégio, com história, missão, depoimentos e conquistas da escola.',
  descProjeto: (<>
  <p>Desenvolvi o site institucional do Colégio Albert Einstein Colinas, uma escola com mais de três décadas de atuação. A página apresenta a história e os valores da instituição, a missão e visão pedagógica, e uma linha do tempo com as principais conquistas ao longo dos anos.</p>
  <p>Também conta com uma seção de depoimentos de pais e ex-alunos, carrosséis de imagens do espaço físico e das turmas, e um layout totalmente responsivo, pensado para transmitir confiança a quem está buscando uma escola para os filhos.</p></>),
  Href: 'https://colegio.adelsonbarros.com/',
},
{
  image: EnsinaPlus,
  title: 'Ensina+',
  tecProjeto: 'Next.js - TypeScript - Supabase - Stripe - OpenAI/Gemini',
  prevProjeto: 'Plataforma SaaS que usa IA para gerar atividades, provas e planos de aula para professores.',
  descProjeto: (<>
  <p>O Ensina+ é uma plataforma voltada para professores, que usa inteligência artificial para gerar atividades, provas com questões reais de ENEM/vestibular e planos de aula completos alinhados à BNCC, em poucos minutos.</p>
  <p>O projeto inclui autenticação e banco de dados com Supabase, cobrança recorrente via Stripe, geração de conteúdo com OpenAI e Gemini, exportação para PDF e um painel para o professor organizar suas turmas e materiais.</p></>),
  Href: 'https://ensinaplus.com/',
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