import React from 'react';
import './BoxProjetos.css';
import { Link } from 'react-router-dom';
import { BsGithub,BsBoxArrowRight } from "react-icons/bs";
import { useWidthScreen } from '../../hooks/WidthScreen/useWidthScreen';
import { MotionReveal, MotionRevealDown } from '../Motion/MotionReveal';

const BoxProjetos = (props) => {
  const { setDateModal } = useWidthScreen();

  function handleClick() {
    document.querySelector('body').style.overflowY = 'hidden';
    setDateModal(props);
  }
  
  return (
    <div className='containerProjeto'>
        <MotionRevealDown>
          <div className='BoxProjeto'>
              <img src={props.image} alt='Projeto' onClick={handleClick}/>
          </div>
        </MotionRevealDown>
        <div className='BoxDescProjeto'>
            <MotionReveal width='100%'>
              <div className='TitleProjeto'>
                  <h2>{props.title}</h2>
                  <div className="line"></div>
                  <div className="botoes">
                      <Link to={props.GitHub} target='_blank' rel='nofollow'><BsGithub /></Link>
                      <Link to={props.Href} target='_blank' rel='nofollow'><BsBoxArrowRight /></Link>
                  </div>
              </div>
            </MotionReveal>
            <MotionReveal><h3 className="TecProjeto">{props.tecProjeto}</h3></MotionReveal>
            <MotionReveal><p className="descProjeto">{props.prevProjeto} <span onClick={handleClick}>Leia mais &gt;</span></p></MotionReveal>
        </div>
    </div>
  )
}

export default BoxProjetos;