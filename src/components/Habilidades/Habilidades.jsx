import React from 'react';

const habilidadesFront = [
    {
      nome: 'Angular',
      level: 'Intermediario'
    },
    {
      nome: 'TypeScript',
      level: 'Intermediario'
    },
    {
      nome: 'HTML',
      level: 'Basico'
    },
    {
      nome: 'CSS',
      level: 'Intermediario'
    },
    {
      nome: 'Bootstrap',
      level: 'Basico'
    },
    {
      nome: 'Git',
      level: 'Basico'
    },
  ]

  const habilidadesBack = [
    {
      nome: 'MongoDB',
      level: 'basico'
    },
    {
      nome: 'NodeJs',
      level: 'Basico'
    },
    {
        nome: 'Express',
        level: 'Basico'
      },
  ]

const Habilidades = () => {
  return (
    <section id="Habilidades">
    <h1>habilidades</h1>
    <p class="subTitle">Meu nível técnico</p>
    <div>
        <article>
            <h3>Front End Developer</h3>
            <ul>
                { habilidadesFront.map(({nome, level}) => {
                    <li key={nome}>
                        <h3 id={nome}>{nome}</h3>
                        <p>{level}</p>
                    </li>
                }) }
            </ul>
        </article>
    </div>
    </section>
  )
}

export default Habilidades;