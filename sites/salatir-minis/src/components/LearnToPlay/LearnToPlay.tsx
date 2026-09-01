import './LearnToPlay.css';

const LearnToPlay = () => {
  return (
    <div className='learn-to-play-container' id='ComoJogar'>
        <h1 className='home-title'>Aprenda a Jogar</h1>
        <h2>Tutoriais em vídeos, cursos de pintura para iniciantes e aprenda toda a atomesfera para iniciar nesse universo.</h2>
        <div className="learn-to-play-video-container">
            <div className="learn-to-play-video">
                <iframe width="560" height="315" src="https://www.youtube.com/embed/NspSBn0X-jA?si=xmdiaMYxDYpBtwAm" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </div>
            <div className="learn-to-play-text">
                <h1>O que é o Tabletop Gaming?</h1>
                <p>O Tabletop é um tipo de jogo de tabuleiro que simula batalhas ou aventuras usando miniaturas e cenários montados em superfícies físicas, como mesas. No caso de jogos de guerra, como Warhammer 40k, ele envolve estratégias detalhadas, onde cada jogador controla um exército de miniaturas que representam soldados, criaturas ou veículos.</p>
            </div>
        </div>
    </div>
  )
}

export default LearnToPlay;