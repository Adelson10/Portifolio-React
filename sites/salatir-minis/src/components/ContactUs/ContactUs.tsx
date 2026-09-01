import './ContactUs.css';

const ContactUs = () => {
  return (
    <div className='contact-us-container' id='FaleConosco'>
        <div className="contact-us-text">
            <h1>Contato</h1>
            <p>Na escuridão do futuro, a determinação é a luz que nos guia.</p>
        </div>
        <form className="contact-us-form">
            <div className="contact-us-name">
                <label htmlFor="name" className="contect-us-label">
                    <input type="text" name="name" id="name" placeholder='Nome' autoComplete='false'/>
                </label>
                <label htmlFor="sobrenome" className="contect-us-label">
                    <input type="text" name="sobrenome" id="sobrenome" placeholder='Sobrenome' autoComplete='false'/>
                </label>
            </div>
            <label className='contact-us-mensagem' htmlFor="mensagem">
                <textarea name="mensagem" id="mensagem" placeholder='Mensagem' rows={3}></textarea>
            </label>
            <button>Inscrição</button>
        </form>
    </div>
  )
}

export default ContactUs;