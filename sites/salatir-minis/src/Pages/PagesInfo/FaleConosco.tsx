import Footer from '../../components/Footer/Footer';
import './FaleConosco.css';

const FaleConosco = () => {
    document.head.title = 'Fale Conosco';
  return (
    <div>
        <header>
            <div className="header-container">
                <a href="/" className="logo-loja-info"></a>
            </div>
        </header>
        <div className="info-container-description-container">
                <h1 className="home-title">FAQ - Perguntas Frequentes</h1>
                <dl>
                    <dt><h2>1. O que são as miniaturas que vocês vendem?</h2></dt>
                    <dd>Nossas miniaturas são figuras detalhadas de soldados, criaturas, e veículos de guerra em escala reduzida. Inspiradas em cenários de ficção científica e fantasia épica, elas são ideais para jogos de tabuleiro, colecionadores e pintores de miniaturas.</dd>
                    
                    <dt><h2>2. Vocês oferecem opções de personalização nas miniaturas?</h2></dt>
                    <dd>Sim! Oferecemos uma linha de miniaturas com variações personalizáveis, incluindo opções de armas, armaduras e poses, para que você possa criar uma coleção única. Entre em contato para saber mais sobre o processo de personalização.                    </dd>
                    
                    <dt><h2>3. Quais materiais são usados na fabricação das miniaturas?</h2></dt>
                    <dd>Nossas miniaturas são feitas com resina e plástico de alta qualidade, proporcionando durabilidade e excelente acabamento para pintura e montagem.</dd>

                    <dt><h2>4. As miniaturas vêm pintadas ou precisam ser pintadas?</h2></dt>
                    <dd>A maioria de nossas miniaturas vem não pintada, permitindo que você pinte de acordo com o seu estilo. Temos, porém, uma linha limitada de miniaturas pré-pintadas, que podem ser encontradas em nossa seção de produtos especiais.</dd>

                    <dt><h2>5. Vocês vendem acessórios e cenários para jogos de tabuleiro?</h2></dt>
                    <dd>Sim! Além das miniaturas, temos uma coleção de acessórios e cenários, como terrenos, construções e bases, que ajudam a criar um ambiente imersivo para suas batalhas e aventuras.</dd>

                    <dt><h2>6. Como faço para começar a colecionar e montar miniaturas?</h2></dt>
                    <dd>Se você é iniciante, oferecemos kits de entrada que incluem tudo o que você precisa: miniaturas básicas, pincéis, tintas e instruções. Nossa equipe está disponível para ajudar com qualquer dúvida sobre o processo.</dd>

                    <dt><h2>7. Vocês oferecem instruções de pintura para iniciantes?</h2></dt>
                    <dd>Sim, temos tutoriais disponíveis no site, cobrindo desde técnicas básicas até avançadas. Para ajuda prática, também oferecemos workshops e cursos online.</dd>

                    <dt><h2>8. Qual o prazo de entrega das miniaturas?</h2></dt>
                    <dd>O prazo de entrega pode variar de acordo com o tipo de produto e personalização. Miniaturas em estoque são enviadas em até 3 dias úteis, enquanto pedidos personalizados podem levar até 2 semanas. Consulte as condições no ato da compra.</dd>

                    <dt><h2>9. Quais formas de pagamento são aceitas?</h2></dt>
                    <dd>Aceitamos pagamentos via cartão de crédito, boleto bancário e transferência eletrônica. Para pedidos especiais, oferecemos planos de pagamento que podem ser discutidos com nossa equipe.</dd>

                    <dt><h2>10. Vocês oferecem política de troca e devolução?</h2></dt>
                    <dd>Sim, nossa política de troca e devolução cobre produtos com defeitos de fabricação. Caso a miniatura apresente algum defeito, entre em contato conosco em até 7 dias após o recebimento. Avaliaremos a situação e faremos a substituição do produto.</dd>

                    <dt><h2>11. Como faço para saber mais sobre lançamentos e novidades?</h2></dt>
                    <dd>Você pode se inscrever em nossa newsletter e nos seguir nas redes sociais para acompanhar os lançamentos, promoções e eventos. Também realizamos pré-vendas exclusivas para novos lançamentos.</dd>

                    <dt><h2>12. A loja possui um programa de fidelidade?</h2></dt>
                    <dd>Sim! Nosso programa de fidelidade recompensa clientes com pontos que podem ser trocados por descontos e produtos exclusivos. Cadastre-se em nosso site para participar.</dd>

                    <dt><h2>13. Vocês oferecem suporte para criação de exércitos para jogos?</h2></dt>
                    <dd>Sim! Nossa equipe de especialistas pode ajudar a montar exércitos completos, orientando nas escolhas e combinações de miniaturas e acessórios para criar uma força personalizada.</dd>

                    <dt><h2>14. Vocês organizam eventos e torneios?</h2></dt>
                    <dd>Organizamos eventos online e presenciais, incluindo torneios, workshops e sessões de pintura em grupo. Consulte a seção de Eventos em nosso site para ver a programação atual.</dd>

                    <dt><h2>15. Posso visitar a loja física?</h2></dt>
                    <dd>Sim, temos uma loja física onde você pode conferir nossas miniaturas e acessórios pessoalmente, além de participar de eventos e oficinas. Consulte nosso site para ver o endereço e horário de funcionamento.</dd>
                </dl>
            </div>
        <Footer />
    </div>
  )
}

export default FaleConosco;