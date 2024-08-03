import React from 'react'
import { Link } from 'react-router-dom';
import { BsEnvelope } from "react-icons/bs";

const Contanto = () => {
  return (
    <section id="Contato">
        <h1>Contato<span>.</span></h1>
        <p>Shoot me an email if you want to connect! You can also find me on Linkedin or Twitter if that's more your speed.</p>
        <Link to={'mailto:barros.adelson101@gmail.com'}><BsEnvelope />barros.adelson101@gmail.com</Link>
    </section>
  )
}

export default Contanto;