import Footer from '../../components/Footer/Footer';
import './FaleConosco.css';

const Termos = () => {
    document.head.title = 'Termos de Uso';

  return (
    <div>
        <header>
            <div className="header-container">
                <a href="/" className="logo-loja-info"></a>
            </div>
        </header>
        <div className="info-container-description-container">
                <h1 className="home-title">Política de Privacidade</h1>
                <dl>
                    <dt><h2>1. Informações que Coletamos</h2></dt>
                    <dd>Coletamos informações fornecidas por você, como nome, e-mail, endereço e informações de pagamento para processar pedidos e aprimorar sua experiência de compra. Também coletamos dados de navegação, como páginas visitadas e tempo de permanência, para entender como você utiliza nosso site.</dd>
                    
                    <dt><h2>2. Uso das Informações</h2></dt>
                    <dd>
                    As informações coletadas são utilizadas para:
                        <ul>
                            <li>Processar pedidos e realizar envios.</li>
                            <li>Enviar notificações de atualização sobre o pedido.</li>
                            <li>Fornecer suporte ao cliente.</li>
                            <li>Melhorar nosso site e serviços através de análises de uso.</li>
                        </ul>
                    </dd>
                    
                    <dt><h2>3. Compartilhamento de Informações</h2></dt>
                    <dd>Não compartilhamos suas informações pessoais com terceiros, exceto com parceiros essenciais para a operação do nosso negócio (por exemplo, processadores de pagamento e empresas de envio), sempre seguindo práticas de segurança e confidencialidade.</dd>

                    <dt><h2>4. Segurança dos Dados</h2></dt>
                    <dd>Utilizamos medidas de segurança para proteger seus dados pessoais contra acesso não autorizado, perda ou alteração. Apesar dos nossos esforços, nenhum método de transmissão de dados pela Internet é totalmente seguro.</dd>

                    <dt><h2>5. Cookies</h2></dt>
                    <dd>Nosso site utiliza cookies para melhorar a navegação e personalizar a sua experiência. Você pode optar por desativar os cookies no seu navegador, mas isso pode afetar algumas funcionalidades do site.</dd>

                    <dt><h2>6. Acesso e Controle das Informações</h2></dt>
                    <dd>Você pode solicitar o acesso, correção ou exclusão de suas informações pessoais a qualquer momento. Entre em contato conosco através do e-mail informado no site para realizar essas solicitações.</dd>

                    <dt><h2>7. Alterações na Política de Privacidade</h2></dt>
                    <dd>Podemos atualizar nossa Política de Privacidade periodicamente. Alterações serão notificadas nesta página e, quando significativas, informaremos por e-mai</dd>

                    </dl>
            </div>
        <Footer />
    </div>
  )
}

export default Termos;