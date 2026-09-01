import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Award, Trophy, Users, BookOpen, Star, Menu, X, MapPin, Phone, Mail, Clock, CheckCircle2, Medal, Building2, Sparkles, Target, Eye, HeartHandshake, ArrowUpRight, ArrowUp, ArrowDown, Quote, Landmark, Sigma, Bot, ChevronLeft, ChevronRight, ShieldCheck, TrendingUp, Plus, LockOpen } from 'lucide-react';
import LogoIcon from '../../public/logo.jsx';
const LOGO = '/logo.png';
const IMG = {
  founder: '/suelena.png',
  finance: '/odilon.png',
  // AGORA É UM ARRAY: adicione aqui os caminhos das outras fotos da sala de aula
  classroom: [
    '/sala.png',
    '/sala-2.png',
    '/sala-3.png',
    '/sala-4.png',
    '/sala-5.png',
    '/sala-6.png',
    '/sala-7.png',
    '/sala-8.png'

  ],
  robotica: [
    '/projetos/robotica1.png',
    '/projetos/robotica2.png',
    '/projetos/robotica3.png',
    '/projetos/robotica4.png',
    '/projetos/robotica5.png',
    '/projetos/robotica6.png'
  ],
  library: 'biblioteca.png',
  // NOVOS: coloque aqui os caminhos das fotos reais de cada espaço
  parques: [
    '/parquinho.png',
    '/patio.png',
    '/areia.png',
    '/pebolim.png',
    '/quadra.png',
    '/piscina.jpeg'

  ],
  lab: '/laboratorio.png',
  auditorium: '/auditorio.png',
  lion: '/Lion.png',
  seguranca: '/catraca-cutout.png',
  entrada: '/Entrada.png',
  parque: '/parque.png',
  alunos: [
    '/alunos/IMG_8975.png',
    '/alunos/IMG_8976.png',
  ],
  conquistas: Array.from({ length: 19 }, (_, i) => `/conquistas/imagem${i}.jpg`),
  etapas: {
    maternal: '/etapas/maternal.png',
    infantil: '/etapas/infantil.png',
    fundamental1: '/etapas/Fundamental I.png',
    fundamental2: '/etapas/Fundamental II.png',
    medio: '/etapas/medio.png'
  },
  etapasFrente: {
    maternal: '/etapas/maternal-frente.png',
    infantil: '/etapas/infantil-frente.png',
    fundamental1: '/etapas/Fundamental I-frente.png',
    fundamental2: '/etapas/Fundamental II-frente.png',
    medio: '/etapas/medio-frente.png'
  },
  medalhas: {
    portugues: [
      '/medalha/pot/beaba1.jpg',
      '/medalha/pot/beaba2.jpg',
      '/medalha/pot/op1.jpg',
      '/medalha/pot/op2.jpg',
      '/medalha/pot/op3.jpg'
    ],
    matematica: [
      '/medalha/mat/canguru1.jpg',
      '/medalha/mat/canguru2.jpg',
      '/medalha/mat/canguru3.jpg',
      '/medalha/mat/canguru4.jpg',
      '/medalha/mat/canguru5.jpg',
      '/medalha/mat/canguru6.jpg',
      '/medalha/mat/canguru7.jpg',
      '/medalha/mat/canguru8.jpg',
      '/medalha/mat/canguru9.jpg',
      '/medalha/mat/canguru10.jpg'
    ],
    robotica: [
      '/medalha/rob/obr1.jpg',
      '/medalha/rob/obr2.jpg',
      '/medalha/rob/obr3.jpg'
    ],
    esportes: [
      '/medalha/esp/esporte1.jpg',
      '/medalha/esp/esporte2.jpg'
    ]
  },
};
const NAV = [{
  id: 'historia',
  label: 'História'
}, {
  id: 'missao',
  label: 'Missão'
}, {
  id: 'equipe',
  label: 'Direção'
}, {
  id: 'estrutura',
  label: 'Estrutura'
}, {
  id: 'conquistas',
  label: 'Conquistas'
}, {
  id: 'etapas',
  label: 'Etapas'
}, {
  id: 'medalhas',
  label: 'Medalhas'
}];
const WHATSAPP_URL = 'https://wa.me/5563981228732?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20as%20matr%C3%ADculas';
const fade = {
  hidden: {
    opacity: 0,
    y: 28
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
};
function Reveal({
  children,
  className,
  delay = 0
}) {
  return <motion.div className={className} variants={fade} initial="hidden" whileInView="show" viewport={{
    once: true,
    margin: '-80px'
  }} transition={{
    delay
  }}>
            {children}
        </motion.div>;
}

// ---------------------------------------------------------------------
// Botão em pill com selo circular de seta — vocabulário visual repetido
// em todo o site (CTAs, formulário, navegação).
// ---------------------------------------------------------------------
function PillButton({
  children,
  href,
  onClick,
  variant = 'solid',
  type = 'button',
  className = ''
}) {
  const styles = {
    solid: {
      wrap: 'bg-primary text-primary-foreground hover:brightness-110',
      icon: 'bg-white/15'
    },
    accent: {
      wrap: 'bg-accent text-accent-foreground hover:brightness-105',
      icon: 'bg-black/10'
    },
    outline: {
      wrap: 'border border-primary/20 text-primary hover:bg-primary/5',
      icon: 'bg-primary/10'
    },
    ghost: {
      wrap: 'border border-white/40 text-white hover:bg-white/10',
      icon: 'bg-white/15'
    },
    invert: {
      wrap: 'bg-white text-primary hover:brightness-95',
      icon: 'bg-primary/10'
    }
  };
  const s = styles[variant] || styles.solid;
  const Comp = href ? 'a' : 'button';
  const extra = href ? {
    target: '_blank',
    rel: 'noopener noreferrer'
  } : {
    type
  };
  return <Comp href={href} onClick={onClick} className={`group inline-flex items-center gap-3 rounded-full py-1.5 pl-5 pr-1.5 font-600 text-sm active:scale-[0.98] transition ${s.wrap} ${className}`} {...extra}>
            {children}
            <span className={`grid place-items-center h-8 w-8 rounded-full transition-transform group-hover:translate-x-0.5 ${s.icon}`}>
                <ArrowUpRight className="h-4 w-4" />
            </span>
        </Comp>;
}

// ---------------------------------------------------------------------
// Carrossel de imagens reutilizável (troca automática + bolinhas)
// ---------------------------------------------------------------------
function ImageCarousel({ images, alt, className = '', interval = 4000, onComplete, showArrows = false }) {
  const [index, setIndex] = useState(0);
  const list = Array.isArray(images) ? images : [images];

  const step = dir => {
    setIndex(i => {
      const next = (i + dir + list.length) % list.length;
      if (dir > 0 && next === 0) onComplete?.();
      return next;
    });
  };

  useEffect(() => {
    if (list.length <= 1 && !onComplete) return;
    const timer = setInterval(() => step(1), interval);
    return () => clearInterval(timer);
  }, [list.length, interval, onComplete]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {list.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`${alt} ${i + 1}`}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {showArrows && list.length > 1 && (
        <>
          <button
            onClick={() => step(-1)}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 grid place-items-center h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="h-8 w-8 text-primary" fill="currentColor" />
          </button>
          <button
            onClick={() => step(1)}
            aria-label="Próxima foto"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 grid place-items-center h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="h-8 w-8 text-primary" fill="currentColor" />
          </button>
        </>
      )}
      {list.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2 z-10">
          {list.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Ir para foto ${i + 1}`}
              className={`h-2 w-2 rounded-full transition-all ${
                i === index ? 'bg-accent w-5' : 'bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [overDark, setOverDark] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const isOverDark = ['missao', 'conquistas', 'etapas'].some(id => {
        const el = document.getElementById(id);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= 0 && rect.top >= -100;
      });
      setOverDark(isOverDark);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const go = id => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const effectiveOverDark = overDark && !open;
  return <header className={`${scrolled || open ? 'fixed' : 'absolute'} top-0 inset-x-0 z-50 transition-colors duration-300 ${effectiveOverDark ? 'bg-transparent border-b border-transparent' : scrolled || open ? 'bg-background border-b border-border' : 'bg-transparent border-b border-transparent'}`}>
            <nav className="mx-auto max-w-[90rem] px-5 lg:px-10 h-20 flex items-center justify-between">
                <button onClick={() => go('topo')} className="flex items-center gap-3">
                    <span className="grid place-items-center h-12 w-12 rounded-full bg-white border border-border overflow-hidden">
                        <img src={LOGO} alt="Colégio Albert Einstein" className="h-full w-full object-contain p-0.5" />
                    </span>
                    <span className="leading-tight text-left hidden sm:block">
                       <span className={`block font-display font-900 text-lg tracking-tight transition-colors duration-300 ${effectiveOverDark ? 'text-white' : 'text-primary'}`}>COLÉGIO EINSTEIN</span>
                        <span className="block text-[11px] uppercase tracking-[0.22em] text-accent">COLINAS DO TOCANTINS</span>
                    </span>
                </button>
                <div className="hidden lg:flex items-center gap-8">
                    {NAV.map(n => <button key={n.id} onClick={() => go(n.id)} className={`text-sm font-500 transition-colors ${effectiveOverDark ? 'text-white/80 hover:text-white' : 'text-foreground/70 hover:text-primary'}`}>
                            {n.label}
                        </button>)}
                </div>
                <div className="hidden lg:flex items-center gap-3">
                    <PillButton variant={effectiveOverDark ? 'ghost' : 'outline'} onClick={() => go('medalhas')}>Fale conosco</PillButton>
                    <PillButton href={WHATSAPP_URL} variant={effectiveOverDark ? 'invert' : 'solid'}>Matrículas</PillButton>
                </div>
                <button className={`lg:hidden transition-colors duration-300 ${effectiveOverDark ? 'text-white' : 'text-primary'}`} onClick={() => setOpen(!open)} aria-label="Menu">
                    {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
                </button>
            </nav>
            {open && <div className="lg:hidden bg-background border-t border-border px-5 pb-6 pt-2 flex flex-col gap-1">
                    {NAV.map(n => <button key={n.id} onClick={() => go(n.id)} className="text-left py-3 text-foreground/80 font-500 border-b border-border/60">
                            {n.label}
                        </button>)}
                    <PillButton href={WHATSAPP_URL} variant="solid" className="mt-3 justify-center">Matrículas</PillButton>
                </div>}
        </header>;
}
function AvatarDot({ src, icon: Icon, style }) {
  return <span style={style} className="relative grid place-items-center h-14 w-14 rounded-full ring-2 ring-background overflow-hidden bg-[color-mix(in_srgb,hsl(var(--accent))_15%,hsl(var(--background)))] text-accent">
            {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <Icon className="h-8 w-8" />}
        </span>;
}
function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden bg-background min-h-0 min-[820px]:min-h-[100dvh] flex flex-col">
      <img
        src={IMG.lion}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 h-full w-full object-cover object-center opacity-[0.1] grayscale contrast-125 z-3"
      />
      <div className="flex-1 flex items-center py-14 lg:py-16">
        <div className="mx-auto max-w-[90rem] w-full px-5 lg:px-10">
          <div className="relative grid lg:grid-cols-[0.8fr_1.3fr_0.9fr] gap-8 lg:gap-6 items-center">
            <div className="hidden lg:flex flex-col gap-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="relative overflow-hidden aspect-[4/5] w-full grid place-items-center">
                  <LogoIcon
                    role="img"
                    aria-label="Colégio Albert Einstein"
                    preserveAspectRatio="xMidYMid meet"
                    className="h-full w-full max-h-[85%] max-w-[85%]"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="flex items-center gap-4 justify-center"
              >
                <div className="flex -space-x-3">
                  {[
                    ...IMG.alunos.map(src => ({ src })),
                    { icon: GraduationCap }
                  ].map((avatar, index) => (
                    <AvatarDot key={index} src={avatar.src} icon={avatar.icon} style={{ zIndex: index }} />
                  ))}
                </div>
                <div className="flex w-fit flex-col text-left">
                  <div className="font-display w-fit font-900 text-4xl text-primary leading-none">350+</div>
                  <div className="text-[14px]/3 w-fit whitespace-nowrap text-muted-foreground mt-1 ">Alunos em</div>
                  <div className="text-[14px]/3 w-fit whitespace-nowrap text-muted-foreground mt-1 ">nossa comunidade</div>
                </div>
              </motion.div>
            </div>

            <div className="text-center lg:text-left h-full flex-col flex justify-center gap-8 py-8 lg:p-0">
              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                <h1 className="font-display font-900 leading-[1.05] tracking-tight via-70% text-5xl lg:text-[3.5rem] xl:text-7xl bg-gradient-to-b from-sky-400 via-primary to-primary/80 bg-clip-text text-transparent">
                  Formar mentes
                </h1>
                <span>
                  <h1 className="inline font-display font-900 leading-[1.05] via-70% tracking-tight text-4xl lg:text-[3.5rem] xl:text-7xl bg-gradient-to-b from-sky-400 via-primary to-primary/80 bg-clip-text text-transparent">
                    para o
                  </h1>
                  <h1 className="inline font-display font-900 leading-[1.05] tracking-tight text-4xl lg:text-[3.5rem] xl:text-7xl text-accent">
                    {'  '}futuro.
                  </h1>
                </span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="text-muted-foreground max-w-lg mx-auto lg:ml-0 lg:mr-32 text-balance text-base sm:text-lg"
              >
                Há mais de três décadas, o Colégio Albert Einstein constrói trajetórias de aprendizado com dedicação,
                valores e resultados que se destacam entre as melhores escolas da região.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-4"
              >
                <PillButton href={WHATSAPP_URL} variant="accent">Fale conosco</PillButton>
                <PillButton
                  variant="outline"
                  onClick={() => document.getElementById('historia')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Conheça o colégio
                </PillButton>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="lg:hidden mt-9 flex items-center justify-center gap-4"
              >
                <div className="flex -space-x-3">
                  {[
                    ...IMG.alunos.map(src => ({ src })),
                    { icon: GraduationCap }
                  ].map((avatar, index) => (
                    <AvatarDot key={index} src={avatar.src} icon={avatar.icon} style={{ zIndex: index }} />
                  ))}
                </div>
                <div className="flex w-fit flex-col text-left">
                  <div className="w-fit font-display font-900 text-xl text-primary leading-none">600+</div>
                  <div className="w-fit whitespace-nowrap text-xs text-muted-foreground mt-1">Alunos em nossa comunidade</div>
                </div>
              </motion.div>
            </div>

            <div className="flex flex-col gap-10">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hidden lg:flex flex-col items-start gap-3"
              >
                <GraduationCap className="h-12 w-12 text-accent" strokeWidth={1} />
                <p className="text-sm text-primary leading-snug max-w-[220px]">
                  Um caminho mais inteligente para o futuro dos seus filhos
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <img
                  src={IMG.entrada}
                  alt="Alunos do Colégio Albert Einstein"
                  loading="eager"
                  decoding="async"
                  className="rounded-[2rem] aspect-[4/3] w-full lg:w-[125%] lg:max-w-none lg:-ml-[25%] object-cover"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
const ROW_LOGOS = [
  { src: 'LogoESBaixa_cor.PNG', ratio: 1921 / 672 },
  { src: 'Logo_Roxo_CMYK.png', ratio: 14826 / 5407 },
  { src: 'educacross-site.png', ratio: 305 / 148 },
  { src: 'logo_eduall_bs_cor.png', ratio: 4501 / 1459 },
  { src: 'mm_original_pt.png', ratio: 4267 / 2166 },
  { src: 'sistema_anglo.png', ratio: 2624 / 2624 },
];
function Marquee() {
  const loop = [...ROW_LOGOS, ...ROW_LOGOS];
  return <div className="relative bg-transparent mx-auto max-w-[90rem] w-full px-5 lg:px-10 py-6 sm:py-4 mb-8 sm:mb-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] [@media(max-height:820px)]:mb-20">
            <div className="flex items-center whitespace-nowrap animate-marquee w-max gap-8">
                {loop.map(({ src, ratio }, i) =>
                <img
                  key={i}
                  aria-hidden="true"
                  src={`/row/${src}`}
                  className="mx-8 inline-block h-10 sm:h-10 md:h-12 lg:h-16 shrink-0 object-contain"
                  style={{ aspectRatio: ratio }}
                />)}
            </div>
        </div>;
}
function Historia() {
  return <section id="historia" className="min-h-0 min-[820px]:min-h-screen flex flex-col justify-between py-20 lg:py-28 bg-secondary/50">
            <Marquee />
            <div className="mx-auto max-w-[90rem] px-5 lg:px-10 grid lg:grid-cols-2 gap-14 items-center">
                <Reveal className="relative">
                    <div className="absolute -top-5 -left-5 h-24 w-24 rounded-2xl bg-accent/20 -z-0" />
                    <ImageCarousel images={IMG.classroom} alt="Sala de aula do colégio" className="relative rounded-3xl aspect-[4/3] w-full" />
                    <div className="absolute -bottom-6 -right-4 lg:-right-8 bg-primary text-primary-foreground rounded-2xl p-5 max-w-[200px] z-10">
                        <div className="font-display font-900 text-3xl text-accent">1989</div>
                        <p className="text-xs text-primary-foreground/80 mt-1">Ano de fundação do colégio</p>
                    </div>
                </Reveal>
                <Reveal delay={0.1}>
                    <span className="text-sm font-600 uppercase tracking-[0.2em] text-accent">Nossa história</span>
                    <h2 className="mt-3 font-display font-900 text-3xl md:text-4xl lg:text-5xl text-primary leading-tight">
                        Uma trajetória construída com propósito
                    </h2>
                    <p className="mt-5 text-muted-foreground leading-relaxed text-balance">
                        O Colégio Albert Einstein foi fundado em <strong className="text-foreground">1989</strong> pela
                        educadora <strong className="text-foreground">Suelena Alves Carvalho Torres</strong>, com o sonho
                        de oferecer um ensino de qualidade que unisse conhecimento, valores e cuidado com cada estudante.
                    </p>
                    <p className="mt-4 text-muted-foreground leading-relaxed">Ao longo de mais de três décadas, o colégio se consolidou como referência em educação, mantendo desde 2004/2006 uma sólida parceria com a <strong className="text-foreground">UNOPAR</strong>, que fortalece o material didático e a metodologia de ensino oferecidos aos alunos.</p>
                    <ul className="mt-6 space-y-3">
                        {['Ensino comprometido com valores e resultados', 'Parceria pedagógica consolidada com a UNOPAR', 'Ambiente acolhedor e familiar'].map(t => <li key={t} className="flex items-start gap-3 text-foreground">
                                <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" /> {t}
                            </li>)}
                    </ul>
                </Reveal>
            </div>
        </section>;
}

const VALORES = [
  'Excelência pedagógica',
  'Compromisso com a aprendizagem',
  'Protagonismo do estudante',
  'Parceria entre escola, família e comunidade',
];

function MissaoVisaoValores() {
  const cards = [
    {
      key: 'foto',
      photo: true
    },
    {
      key: 'missao',
      icon: Target,
      title: 'Missão',
      text: 'Inspirar mentes e transformar vidas por meio de uma educação de excelência, compartilhando conhecimento e preparando crianças e jovens para os desafios acadêmicos, profissionais e da vida.'
    },
    {
      key: 'visao',
      icon: Eye,
      title: 'Visão',
      text: 'Ser referência em soluções educacionais, promovendo aprendizagem significativa, inovação e excelência pedagógica, contribuindo para a formação de estudantes protagonistas e preparados para o futuro.'
    },
    {
      key: 'valores',
      icon: HeartHandshake,
      title: 'Valores',
      highlight: true
    }
  ];

  return (
    <section id="missao" className="relative overflow-hidden bg-primary text-primary-foreground min-h-0 min-[820px]:min-h-[100dvh] flex flex-col pt-20 sm:pt-24 pb-4 sm:pb-6 lg:pb-8">
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex-1 min-h-0 flex flex-col justify-center mx-auto max-w-[90rem] w-full px-5 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6 lg:gap-8">
          <Reveal className="max-w-xl">
            <span className="text-xs sm:text-sm font-600 uppercase tracking-[0.2em] text-accent">Nossos pilares</span>
            <h2 className="mt-1.5 sm:mt-3 font-display font-900 text-xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
              O que nos guia todos os dias
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="max-w-md">
            <p className="hidden sm:block text-primary-foreground/75 leading-relaxed text-sm lg:text-base">
              Missão, visão e valores que orientam cada decisão pedagógica e cada relação construída dentro do Colégio Albert Einstein.
            </p>
            <div className="mt-2 sm:mt-5">
              <PillButton variant="accent" onClick={() => document.getElementById('medalhas')?.scrollIntoView({ behavior: 'smooth' })}>
                Fale conosco
              </PillButton>
            </div>
          </Reveal>
        </div>

        <div className="mt-6 sm:mt-8 lg:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {cards.map((c, i) =>
            c.photo ? (
              <Reveal key={c.key} className="rounded-2xl lg:rounded-3xl overflow-hidden aspect-[16/10] sm:aspect-auto">
                <img src={IMG.parque} alt="Alunos em sala de aula" loading="lazy" decoding="async" className="h-full w-full object-cover object-left scale-150" />
              </Reveal>
            ) : (
              <Reveal
                key={c.key}
                delay={i * 0.1}
                className={`rounded-2xl lg:rounded-3xl p-5 lg:p-8 ${c.highlight ? 'bg-white' : 'bg-white/5'} flex flex-col justify-between`}
              >
                <c.icon className={`h-6 w-6 lg:h-10 lg:w-10 ${c.highlight ? 'text-accent' : 'text-white'}`}  strokeWidth={1.8} />
                <div className="flex flex-col gap-1.5 lg:gap-1.5 min-h-0">
                  <h3 className={`mt-2 lg:mt-5 font-display font-700 text-base lg:text-2xl leading-snug ${c.highlight ? 'text-primary' : ''}`}>{c.title}</h3>
                  {c.highlight ? (
                    <ul className="mt-1 lg:mt-3 space-y-1.5 lg:space-y-2 overflow-hidden">
                      {VALORES.map(v => (
                        <li key={v} className="flex items-start gap-2 lg:gap-2.5 text-sm text-foreground text-balance leading-snug">
                          <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          {v}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 lg:mt-3 text-sm text-primary-foreground/70 leading-relaxed text-balance">{c.text}</p>
                  )}
                </div>
              </Reveal>
            )
          )}
        </div>
      </div>
    </section>
  );
}
const TEAM = [{
  img: IMG.founder,
  name: 'Suelena Alves Carvalho Torres',
  role: 'Fundadora e Diretora',
  icon: GraduationCap,
  text: 'Idealizadora do colégio em 1989, dedica sua vida à educação, guiando a instituição com visão e cuidado.'
}, {
  img: IMG.finance,
  name: 'Odilon Torres de Silveira',
  role: 'Diretor Financeiro',
  icon: Landmark,
  text: 'Responsável pela gestão financeira e administrativa, garantindo a solidez e a continuidade do projeto educacional.'
}];
function Equipe() {
  const [active, setActive] = useState(0);
  const current = TEAM[active];

  useEffect(() => {
    if (TEAM.length <= 1) return;
    const timer = setInterval(() => {
      setActive(i => (i + 1) % TEAM.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [active]);

  return <section id="equipe" className="min-h-0 min-[820px]:min-h-screen flex flex-col justify-center py-20 lg:py-32 overflow-hidden">
            <div className="mx-auto max-w-[90rem] px-5 lg:px-10 w-full">
                <div className="grid lg:grid-cols-3 gap-12 lg:gap-8 items-center">
                    <Reveal className="lg:min-h-[380px] flex flex-col justify-between text-center lg:text-left items-center lg:items-start">
                        <div>
                            <span className="text-sm font-600 uppercase tracking-[0.2em] text-accent">Direção</span>
                            <h2 className="mt-3 font-display font-900 text-3xl md:text-4xl lg:text-5xl text-primary leading-tight">
                                Quem conduz o Albert Einstein
                            </h2>
                        </div>
                        <p className="mt-8 lg:mt-0 text-muted-foreground leading-relaxed max-w-xs">
                            Uma equipe comprometida com a excelência e o desenvolvimento de cada estudante.
                        </p>
                    </Reveal>

                    <Reveal delay={0.1} className="flex flex-col items-center gap-6">
                        <current.icon key={current.role} className="h-12 w-12 text-accent" strokeWidth={1.8} />
                        <div className="relative w-full max-w-sm lg:max-w-md aspect-[9/12] rounded-3xl overflow-hidden bg-accent/80">
                            <img key={current.img} src={current.img} alt={current.name} loading="lazy" decoding="async" className="w-full object-cover object-top" />
                        </div>
                    </Reveal>

                    <Reveal delay={0.2} className="lg:min-h-[380px] flex flex-col justify-center gap-8 text-center lg:text-left items-center lg:items-start">
                        <p className="text-lg lg:text-xl text-primary leading-relaxed text-balance">
                            {current.text}
                        </p>
                        <div className="flex items-center gap-3">
                            {TEAM.map((m, i) => <button key={m.name} onClick={() => setActive(i)} aria-label={m.name} className={`h-22 w-16 rounded-3xl overflow-hidden border-2 shrink-0 transition ${active === i ? 'border-accent' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                                    <img src={m.img} alt={m.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                </button>)}
                        </div>
                        <div>
                            <h3 className="font-display font-700 text-xl text-primary">{current.name}</h3>
                            <span className="text-sm text-muted-foreground">{current.role}</span>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>;
}
function Conquistas() {
  return (
    <section id="conquistas" className="relative overflow-hidden bg-primary text-primary-foreground min-h-0 min-[820px]:min-h-[100dvh] flex flex-col pt-20 sm:pt-24 pb-4 sm:pb-6 lg:pb-8">
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex-1 min-h-0 flex flex-col justify-center mx-auto max-w-[90rem] w-full px-5 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-stretch">
          <Reveal>
            <span className="text-sm font-600 uppercase tracking-[0.2em] text-accent">Conquistas</span>
            <h2 className="mt-3 font-display font-900 text-3xl md:text-4xl lg:text-5xl leading-tight">
              Resultados que orgulham nossa comunidade
            </h2>
            <div className="mt-6 flex gap-4">
              <Quote className="h-8 w-8 text-accent shrink-0 rotate-180" fill="currentColor" />
              <p className="text-primary-foreground/80 leading-relaxed text-balance">
                No último ano, o Colégio Albert Einstein alcançou o <strong className="text-accent">3º lugar
                do estado</strong> e o <strong className="text-accent">1º lugar do município</strong>,
                reafirmando sua posição entre as melhores escolas da região. Uma conquista construída pelo
                empenho de alunos, professores e famílias.
                <Quote className="inline-block h-8 w-8 ml-1 mb-1 text-accent" fill="currentColor" />
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-6">
              {[{
                icon: Medal,
                t: '3º lugar do Estado',
                s: 'Desempenho acadêmico'
              }, {
                icon: Trophy,
                t: '1º lugar do Município',
                s: 'Referência local'
              }, {
                icon: Award,
                t: 'Entre as melhores',
                s: 'Reconhecimento constante'
              }, {
                icon: Star,
                t: 'Excelência contínua',
                s: 'Compromisso diário'
              }].map(c => (
                <div key={c.t} className="rounded-2xl lg:rounded-3xl bg-white/5 p-3 lg:p-8 flex flex-col justify-between hover:bg-white/10 transition-colors">
                  <c.icon className="h-5 w-5 lg:h-10 lg:w-10 text-accent" strokeWidth={1.8} />
                  <div className="mt-1.5 lg:mt-5">
                    <div className="font-display font-700 text-xs lg:text-lg leading-snug">{c.t}</div>
                    <div className="mt-1 lg:mt-2 text-[10px] lg:text-sm text-primary-foreground/60">{c.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="relative h-full aspect-[9/10] mx-auto lg:mx-0 rounded-3xl overflow-hidden">
            <ImageCarousel images={IMG.conquistas} alt="Conquistas do colégio" className="w-full h-full" showArrows />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
function Estrutura() {
  const cards = [{
    img: IMG.classroom,
    icon: Building2,
    t: 'Salas de aula',
    s: 'Ambientes preparados para um aprendizado ativo e acolhedor.'
  }, {
    img: IMG.library,
    icon: BookOpen,
    t: 'Sala de estudos',
    s: 'Espaço de leitura e pesquisa para incentivar o hábito de estudar.'
  }, {
    img: IMG.robotica,
    icon: Users,
    t: 'Projetos',
    s: 'Desenvolvemos criatividade, lógica e inovação por meio de aulas práticas de robótica e tecnologia educacional.'
  }, {
    img: IMG.parques,
    icon: Sparkles,
    t: 'Espaço recreativo',
    s: 'Espaço seguro e divertido para brincar, socializar e recarregar as energias.'
  }, {
    img: IMG.lab,
    icon: Target,
    t: 'Laboratórios',
    s: 'Ambientes equipados para aulas práticas e experimentos que dão vida à teoria.'
  }, {
    img: IMG.auditorium,
    icon: GraduationCap,
    t: 'Auditório',
    s: 'Espaço para eventos, apresentações e celebrações que reúnem toda a comunidade escolar.'
  }];
  return <section id="estrutura" className="py-20 lg:py-28">
            <div className="mx-auto max-w-[90rem] px-5 lg:px-10">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                    <Reveal className="max-w-xl">
                        <span className="text-sm font-600 uppercase tracking-[0.2em] text-accent">Estrutura</span>
                        <h2 className="mt-3 font-display font-900 text-3xl md:text-4xl lg:text-5xl text-primary">
                            Um ambiente feito para aprender
                        </h2>
                    </Reveal>
                    <Reveal delay={0.1} className="max-w-sm">
                        <p className="text-muted-foreground">
                            Espaços pensados para o aprendizado prático, a convivência e o bem-estar de cada estudante.
                        </p>
                        <div className="mt-4">
                            <PillButton variant="outline" onClick={() => document.getElementById('medalhas')?.scrollIntoView({
                behavior: 'smooth'
              })}>
                                Agende uma visita
                            </PillButton>
                        </div>
                    </Reveal>
                </div>
                <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
                    {cards.map((c, i) => <Reveal key={c.t} delay={i * 0.08} className="group rounded-3xl overflow-hidden border border-border bg-card hover hover:-translate-y-1 transition-all duration-300">
                            <div className="aspect-[3/2] overflow-hidden">
                                <ImageCarousel images={c.img} alt={c.t} className="h-full w-full" />
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-2 text-accent">
                                    <c.icon className="h-5 w-5" strokeWidth={1.8} />
                                    <span className="text-[11px] font-600 uppercase tracking-wide">Estrutura Einstein</span>
                                </div>
                                <h3 className="mt-3 font-display font-700 text-lg text-primary">{c.t}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{c.s}</p>
                                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                                    <span className="text-sm font-600 text-primary">Conheça o espaço</span>
                                    <PillButton variant="outline" className="!py-1 !pl-4 !pr-1 text-xs" onClick={() => document.getElementById('medalhas')?.scrollIntoView({
                        behavior: 'smooth'
                      })}>
                                        Visitar
                                    </PillButton>
                                </div>
                            </div>
                        </Reveal>)}
                </div>
            </div>
        </section>;
}

const TESTIMONIALS = [

  {
    text: 'Meus filhos estudam no Colégio Albert Einstein desde o início da vida escolar, e somos muito gratos por tudo o que vivemos nesses anos. Além da excelente qualidade de ensino, sempre encontramos uma equipe acolhedora, com coordenação e direção acessíveis e dispostas a caminhar junto com as famílias. É uma alegria vê-los crescer em um ambiente onde são respeitados, incentivados e verdadeiramente acolhidos.',
    
    name: 'Maraysa Chagas — Mãe de aluno do Fundamental I',
    img: '/depoimentos/mae-aluno.jpeg'
  },

 {
    text: 'Ver o Mateus crescendo e feliz aqui no colégio não tem preço! Eu já conhecia a qualidade do Material Anglo da minha época de escola, mas ver o cuidado dos professores e o quanto ele se desenvolve nos dá a certeza de que fizemos a escolha certa. Gratidão a essa equipe incrível!',
    name: 'Pai de aluno do Fundamental I',
    img: '/depoimentos/pai-aluno.jpeg'
  },
  {
    text: 'Tenho a satisfação de falar que pertenci à família Einstein. Conjuntamente com os meus pais, o colégio foi o local a qual aprendi os valores dos aprendizados técnico e humano, essenciais tanto para o meu desempenho acadêmico no ensino superior quanto para a vida.',
    name: 'Ruan Aires - Ex-aluno do Ensino Médio',
    img: '/depoimentos/ex-aluno3.jpeg'
  },

  {
    text: 'Estudar no Colégio Albert Einstein não apenas contribuiu significativamente para meu desempenho acadêmico e para minha entrada no ensino superior, como também me proporcionou amizades que levarei para a vida. Sou muito grato a toda a equipe por fazer parte dessa trajetória.',
    name: 'Nicolas - Ex-aluno do Ensino Médio',
    img: '/depoimentos/ex-aluno.jpeg'
  },
  {
    text: 'Mais do que um colégio, o Albert Einstein foi um lugar onde aprendi, cresci e me preparei para os desafios da vida. Sou grato por tudo o que vivi aqui, pelas amizades que construí e por cada aprendizado que levarei comigo sempre. Sem dúvida, é uma parte da minha trajetória que sempre vou guardar com carinho.',
    name: 'João Ronaldo Tomé - Ex-aluno do Ensino Médio',
    img: '/depoimentos/ex-aluno2.jpeg'
  },
  {
    text: 'Sou muito grato por ter encontrado no Colégio Einstein tanto uma ótima equipe de profissionais dispostos a me auxiliarem quanto um sistema de ensino eficiente. As habilidades que foram desenvolvidas continuam a repercutir na minha jornada acadêmica e me sinto mais preparado para a vida profissional.',
    name: 'Marcos Leite - Ex-aluno do Ensino Médio',
    img: '/depoimentos/ex-aluno4.jpeg'
  },

    {
    text: `Ao longo do tempo, tenho percebido evolução na forma como a escola acolhe, acompanha e valoriza cada estudante, respeitando suas necessidades e potencialidades. Esse compromisso com uma educação inclusiva faz toda a diferença para as famílias.

Como mãe, é gratificante ver a evolução do meu filho. Seu desenvolvimento, tanto na aprendizagem quanto na convivência, reflete o cuidado, a dedicação e o profissionalismo de toda a equipe escolar.

Parabenizo a direção, os professores e todos os profissionais envolvidos por construírem um ambiente acolhedor, respeitoso e comprometido com o desenvolvimento de cada estudante. Que esse trabalho continue inspirando e transformando vidas.`,
    name: 'Mãe de aluno do Fundamental II',
    img: IMG.alunos[0]
  },
];
function Testimonials() {
  const [active, setActive] = useState(0);
  const [pulse, setPulse] = useState(0);
  const current = TESTIMONIALS[active];
  const go = dir => setActive(i => (i + dir + TESTIMONIALS.length) % TESTIMONIALS.length);

  useEffect(() => {
    const timer = setInterval(() => setPulse(p => p + 1), 4000);
    return () => clearInterval(timer);
  }, []);

  return <section id="depoimentos" className="relative overflow-hidden min-h-0 min-[820px]:min-h-[100dvh] flex flex-col justify-center py-20 sm:py-24 bg-secondary/50">
            <div className="mx-auto max-w-[90rem] w-full px-5 lg:px-10 grid lg:grid-cols-2 gap-12 items-center">
                <Reveal>
                    <span className="text-sm font-600 uppercase tracking-[0.2em] text-accent">Depoimentos</span>
                    <h2 className="mt-3 font-display font-900 text-3xl md:text-4xl lg:text-5xl text-primary leading-tight">
                        Histórias reais da nossa comunidade
                    </h2>
                    <p className="mt-4 text-muted-foreground max-w-md">
                        Famílias e alunos que viveram de perto a proposta pedagógica do Colégio Albert Einstein.
                    </p>
                    <div className="mt-8 flex gap-6 rounded-3xl bg-card border border-border p-8 lg:p-10">
                        <div className="flex flex-col items-center gap-2 shrink-0">
                            <button onClick={() => go(-1)} aria-label="Depoimento anterior" className="grid place-items-center h-8 w-8 rounded-full bg-accent/15 text-accent hover:bg-accent/25 transition-colors">
                                <ArrowUp className="h-4 w-4" />
                            </button>
                            <button onClick={() => go(1)} aria-label="Próximo depoimento" className="relative grid place-items-center h-8 w-8 rounded-full bg-primary text-primary-foreground hover:brightness-110 transition">
                                <span key={pulse} className="absolute inset-1 rounded-full bg-primary/80 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_1] pointer-events-none" />
                                <ArrowDown className="relative h-4 w-4" />
                            </button>
                        </div>
                        <div>
                            <Quote className="h-6 w-6 text-accent/60 rotate-180" />
                            <p key={current.text} className="mt-2 text-foreground leading-relaxed">
                                {current.text}
                                <Quote className="inline-block h-6 w-6 ml-1 mb-1 text-accent/60 " />
                            </p>
                            <div className="mt-4 text-sm font-600 text-primary">{current.name}</div>
                        </div>
                    </div>
                </Reveal>
                <Reveal delay={0.1} className="flex justify-center lg:justify-center">
                    <div className="relative h-[28rem] w-72 lg:h-[36rem] lg:w-96">
                        {TESTIMONIALS.map((t, i) => {
                          const isActive = i === active;
                          const deckStyles = ['-rotate-6 -translate-x-4 -translate-y-2', 'rotate-12 translate-x-5 translate-y-3', '-rotate-3 translate-x-1 -translate-y-4'];
                          return <button key={t.img} onClick={() => setActive(i)} aria-label={t.name} style={{ zIndex: isActive ? 10 : i }} className={`absolute inset-0 overflow-hidden rounded-3xl shadow-xl transition-all duration-500 ${isActive ? 'rotate-0 translate-x-0 translate-y-0 scale-100 opacity-100' : `scale-90 opacity-80 hover:opacity-100 ${deckStyles[i % deckStyles.length]}`}`}>
                                <img src={t.img} alt={t.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                            </button>;
                        })}
                        <span key={active} className={`pointer-events-none absolute -bottom-6 -right-6 z-20 grid place-items-center h-24 w-24 lg:h-28 lg:w-28 rounded-full shadow-xl overflow-hidden transition-transform duration-500 ${['rotate-12', '-rotate-6', 'rotate-6'][active % 3]}`}>
                            <img src={LOGO} alt="" aria-hidden="true" className="h-full w-full object-contain" />
                        </span>
                    </div>
                </Reveal>
            </div>
        </section>;
}

const ETAPAS = [{
  key: 'maternal',
  label: 'Maternal',
  idades: '1.5 - 2 anos',
  color: 'bg-[#027DBD]',
  img: IMG.etapas.maternal,
  imgFrente: IMG.etapasFrente.maternal
}, {
  key: 'infantil',
  label: 'Educação Infantil',
  idades: '3 - 5 anos',
  color: 'bg-[#036DAC]',
  img: IMG.etapas.infantil,
  imgFrente: IMG.etapasFrente.infantil
}, {
  key: 'fundamental1',
  label: 'Ensino Fundamental I',
  idades: '6 - 10 anos',
  color: 'bg-[#045D9B]',
  img: IMG.etapas.fundamental1,
  imgFrente: IMG.etapasFrente.fundamental1
}, {
  key: 'fundamental2',
  label: 'Ensino Fundamental II',
  idades: '11 - 14 anos',
  color: 'bg-[#044D8A]',
  img: IMG.etapas.fundamental2,
  imgFrente: IMG.etapasFrente.fundamental2
}, {
  key: 'medio',
  label: 'Ensino Médio',
  idades: '15 - 17 anos',
  color: 'bg-[#053D79]',
  img: IMG.etapas.medio,
  imgFrente: IMG.etapasFrente.medio
}];
function Etapas() {
  return (
    <section id="etapas" className="relative overflow-hidden bg-primary text-primary-foreground min-h-0 min-[820px]:min-h-[100dvh] flex flex-col pt-20 sm:pt-24 pb-4 sm:pb-6 lg:pb-8">
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex-1 min-h-0 flex flex-col justify-center mx-auto max-w-[90rem] w-full px-5 lg:px-10 text-center">
        <Reveal>
          <span className="text-xs sm:text-sm font-600 uppercase tracking-[0.2em] text-accent">Matrículas abertas</span>
          <h2 className="mt-1.5 sm:mt-3 font-display font-900 text-xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
            Mais do que ensinar, formamos futuros.
          </h2>
        </Reveal>
        <div className="mt-16 sm:mt-20 lg:mt-[10rem] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-3 gap-y-16 sm:gap-x-6 sm:gap-y-14 lg:gap-x-8 lg:gap-y-16">
          {ETAPAS.map((e, i) => <Reveal key={e.key} delay={i * 0.1} className="flex flex-col items-center text-center">
                  <div className={`relative w-full aspect-[4/5] ${e.color} rounded-[0px_0px_50%_50%/0px_0px_40%_40%]`}>
                    <img
                      src={e.img}
                      alt={e.label}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-x-0 -bottom-1 h-[115%] w-full sm:h-[145%] sm:w-full object-cover object-top [clip-path:inset(0px_0px_0px_0px_round_0px_0px_70%_70%/0px_0px_50%_50%)] sm:[clip-path:inset(0px_0px_0px_0px_round_0px_0px_68%_68%/0px_0px_36%_36%)]"
                    />
                    <img
                      src={e.imgFrente}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-[115%] w-full max-w-full sm:h-[145%] sm:w-[120%] object-cover object-top sm:max-w-[120%]"
                    />
                  </div>
                  <h3 className="mt-3 sm:mt-5 font-display font-700 text-sm sm:text-2xl   text-primary-foreground">{e.label}</h3>
                  <span className="mt-1 text-xs sm:text-base text-primary-foreground/60">{e.idades}</span>
                </Reveal>)}
        </div>
      </div>
    </section>
  );
}

const OLIMPIADAS = [{
  key: 'portugues',
  label: 'Português',
  s: 'OPA, BEABÁ',
  icon: BookOpen,
  images: IMG.medalhas.portugues
}, {
  key: 'matematica',
  label: 'Matemática',
  s: 'Canguru, OBMEP, OBMEP Mirim',
  icon: Sigma,
  images: IMG.medalhas.matematica
}, {
  key: 'robotica',
  label: 'Robótica',
  s: 'OBR',
  icon: Bot,
  images: IMG.medalhas.robotica
}, {
  key: 'esportes',
  label: 'Esportes',
  s: 'JETS',
  icon: Trophy,
  images: IMG.medalhas.esportes
}];
function Medalhas() {
  const [active, setActive] = useState(OLIMPIADAS[0].key);
  const current = OLIMPIADAS.find(o => o.key === active);
  const goNext = () => setActive(prev => {
    const i = OLIMPIADAS.findIndex(o => o.key === prev);
    return OLIMPIADAS[(i + 1) % OLIMPIADAS.length].key;
  });
  return (
    <section id="medalhas" className="relative overflow-hidden bg-background text-foreground min-h-0 min-[820px]:min-h-[100dvh] flex flex-col pt-20 sm:pt-24 pb-4 sm:pb-6 lg:pb-8">
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex-1 min-h-0 flex flex-col justify-center mx-auto max-w-[90rem] w-full px-5 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-stretch">
          <Reveal>
            <span className="text-sm font-600 uppercase tracking-[0.2em] text-accent">Medalhas</span>
            <h2 className="mt-3 font-display font-900 text-3xl md:text-4xl lg:text-5xl leading-tight text-primary">
              Conquistas que vão além da sala de aula
            </h2>
            <div className="mt-6 flex gap-4">
              <Quote className="h-8 w-8 text-accent shrink-0 rotate-180" fill="currentColor" />
              <p className="text-muted-foreground leading-relaxed text-balance">
                Nossos alunos se destacam tanto nas principais olimpíadas acadêmicas quanto nas
                competições esportivas. Escolha uma área abaixo para conhecer um pouco dessas conquistas.
                <Quote className="inline-block h-8 w-8 ml-1 mb-1 text-accent" fill="currentColor" />
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-6">
              {OLIMPIADAS.map(o => <button key={o.key} onClick={() => setActive(o.key)} className={`rounded-2xl lg:rounded-3xl p-3 lg:p-8 flex flex-col items-start justify-between text-left transition-colors ${active === o.key ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-foreground hover:bg-secondary'}`}>
                                <o.icon className="h-5 w-5 lg:h-10 lg:w-10 text-accent" strokeWidth={1.8} />
                                <div className="mt-1.5 lg:mt-5">
                                    <div className="font-display font-700 text-xs lg:text-lg leading-snug">{o.label}</div>
                                    <div className={`mt-1 lg:mt-2 text-[10px] lg:text-sm leading-snug line-clamp-2 min-h-[2.4em] ${active === o.key ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{o.s}</div>
                                </div>
                            </button>)}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="relative h-full aspect-[9/10] mx-auto lg:mx-0 rounded-3xl overflow-hidden">
            <ImageCarousel key={active} images={current.images} alt={`Olimpíada de ${current.label}`} className="w-full h-full" onComplete={goNext} showArrows />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
function CTAFinal() {
  return <section className="py-20 lg:py-28 bg-background">
            <div className="mx-auto max-w-[90rem] px-5 lg:px-10">
                <Reveal className="relative grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <div className="order-2 lg:order-1 text-center lg:text-left">
                        <h2 className="font-display font-900 text-3xl md:text-4xl lg:text-5xl text-primary leading-tight">
                            Venha construir o futuro dos seus filhos com segurança e excelência.
                        </h2>
                        <p className="mt-5 text-muted-foreground leading-relaxed mx-auto lg:mx-0 text-balance">
                            No Colégio Albert Einstein, a tecnologia trabalha a favor da proteção e do desenvolvimento
                            dos nossos alunos. Contamos com controle de acesso, monitoramento e uma estrutura preparada
                            para oferecer um ambiente seguro, acolhedor e ideal para aprender.
                        </p>
                        <p className="mt-4 text-muted-foreground leading-relaxed mx-auto lg:mx-0 text-balance">
                            Agende uma visita, conheça nossa estrutura e descubra como unimos segurança, inovação e uma
                            educação de alta qualidade.
                        </p>
                        <div className="mt-8 flex justify-center lg:justify-start">
                            <PillButton href={WHATSAPP_URL} variant="solid">Fale pelo WhatsApp</PillButton>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 relative mx-auto lg:mx-0 lg:ml-auto w-[19rem] sm:w-[23rem] lg:w-[27rem] aspect-[4/5]">
                        <div
                          className="pointer-events-none absolute -top-3 -right-3 sm:right-0 grid grid-cols-5 gap-1.5 sm:gap-2 text-accent/50"
                          aria-hidden="true"
                        >
                            {Array.from({ length: 15 }).map((_, i) => <Plus key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={3} />)}
                        </div>
                        <div
                          className="absolute inset-x-6 top-[12rem] bottom-0 rounded-t-[5rem] sm:rounded-t-[4rem] bg-primary"
                          aria-hidden="true"
                        />
                        <img
                          src={IMG.seguranca}
                          alt="Aluno utilizando controle de acesso por catraca no Colégio Albert Einstein"
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-x-0 bottom-0 z-10 mx-auto h-[110%] w-auto max-w-none object-contain object-bottom"
                        />
                        <div className="absolute z-20 top-4 -left-2 sm:-left-6 w-36 rounded-2xl bg-white p-3">
                            <span className="text-[12px] font-700 text-primary leading-tight">Controle de Acesso</span>
                            <div className="mt-2 flex items-center gap-1 rounded-full bg-emerald-100 p-1 w-fit pr-2">
                                <div className="p-1 bg-emerald-300 rounded-full">
                                  <ArrowUp className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                                </div>
                                <span className="text-[11px] font-700 text-emerald-600">+100% Seguro</span>
                            </div>
                        </div>
                        <div className="absolute z-20 bottom-16 sm:bottom-20 -left-3 sm:-left-8 flex items-center gap-2 rounded-2xl bg-white p-3">
                            <span className="grid shrink-0 place-items-center rounded-xl bg-emerald-300 text-accent p-2">
                                <LockOpen className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                            </span>
                            <div className="space-y-1">
                                <div className="text-[12px] font-700 text-primary leading-tight">Catraca Ativa</div>
                                <div className="text-[11px] font-600 text-emerald-600 leading-tight">● Liberado</div>
                            </div>
                        </div>
                        <div className="absolute z-20 bottom-4 right-0 sm:-right-6 flex items-center gap-2.5 rounded-2xl bg-white p-3 w-40">
                            <span className="relative grid h-12 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/20 text-primary">
                                <Users className="h-5 w-5" strokeWidth={2.5} />
                                <span
                                  className="icon-shimmer pointer-events-none absolute inset-0"
                                  aria-hidden="true"
                                />
                            </span>
                            <div className="flex-1">
                                <div className="text-[12px] font-700 text-primary leading-tight">Alunos Monitorados</div>
                                <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary" />
                                <div className="mt-1 h-1.5 w-2/3 rounded-full bg-secondary" />
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>;
}
function Footer() {
  return <footer className="relative overflow-hidden bg-primary text-primary-foreground pt-14 pb-8">
            <div className="mx-auto max-w-[90rem] px-5 lg:px-10">
                <div className="grid md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="grid place-items-center h-12 w-12 rounded-full bg-white overflow-hidden">
                                <img src={LOGO} alt="anglo Einstein" className="h-full w-full object-contain p-0.5" />
                            </span>
                            <span className="font-display font-700 text-lg">Colégio Albert Einstein</span>
                        </div>
                        <p className="mt-4 text-sm text-primary-foreground/70 max-w-xs">
                            Educação de excelência desde 1989, formando gerações com valores e conhecimento.
                        </p>
                        <div className="mt-4 text-xs text-primary-foreground/60 space-y-0.5">
                            <p>SUELENA ALVES DE CARVALHO TORRES LTDA</p>
                            <p>CNPJ: 20.006.238/0001-31</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-600 text-sm uppercase tracking-wider text-accent">Navegação</h4>
                        <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
                            {NAV.map(n => <li key={n.id}>
                                    <button onClick={() => document.getElementById(n.id)?.scrollIntoView({
                behavior: 'smooth'
              })} className="hover:text-accent transition-colors">{n.label}</button>
                                </li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-600 text-sm uppercase tracking-wider text-accent">Contato</h4>
                        <ul className="mt-4 space-y-3 text-sm text-primary-foreground/75">
                            <li className="flex items-start gap-2">
                                <Mail className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                                <span>seceinsteincolinastocantins@outlook.com</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Phone className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                                <span>(63) 98122-8732</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                                <span>Rua Raul do Espírito Santo, 1074</span>
                            </li>
                            <li className="flex items-start gap-2 pt-3 border-t border-white/10 mt-1">
                                <Clock className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                                <span>
                                    Segunda a sexta-feira: 07:00-17:00<br />
                                    Sábado: Fechado<br />
                                    Domingo: Fechado
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/60 sm:pr-20">
                    <p>© {new Date().getFullYear()} Colégio Albert Einstein. Todos os direitos reservados.</p>
                    <p>Parceria com o Sistema Anglo de Ensino desde 1996.</p>
                </div>
            </div>
            <img src="/leaoazul.png" alt="" aria-hidden="true" className="pointer-events-none select-none absolute right-0 top-0 h-full w-auto object-contain opacity-[0.35] mix-blend-multiply translate-x-1/4 scale-125" />
            <span className="pointer-events-none absolute -bottom-[6vw] inset-x-0 text-center font-display font-900 text-[13vw] leading-none select-none whitespace-nowrap bg-gradient-to-b from-white/25 via-white/8 to-transparent bg-clip-text text-transparent">
                EINSTEIN
            </span>
        </footer>;
}
function WhatsAppFloat() {
  return <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Fale conosco pelo WhatsApp" className="fixed bottom-6 right-6 z-50 grid place-items-center h-14 w-14 rounded-full bg-[#25D366] text-white hover:scale-105 active:scale-95 transition-transform animate-floaty">
            <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current">
                <path d="M16.001 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.6 4.44 1.73 6.37L3.2 28.8l6.6-1.7a12.75 12.75 0 0 0 6.2 1.58h.01c7.07 0 12.8-5.73 12.8-12.8s-5.73-12.68-12.81-12.68zm0 23.36h-.01a10.5 10.5 0 0 1-5.37-1.47l-.38-.23-3.92 1.02 1.04-3.82-.25-.4a10.55 10.55 0 0 1-1.6-5.56c0-5.84 4.75-10.6 10.6-10.6 2.83 0 5.49 1.1 7.49 3.11a10.5 10.5 0 0 1 3.1 7.49c-.01 5.84-4.76 10.46-10.7 10.46zm5.82-7.85c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.87-1.76-2.19-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.53-.54-.72-.55-.19-.01-.4-.01-.61-.01a1.18 1.18 0 0 0-.85.4c-.29.32-1.11 1.08-1.11 2.64 0 1.55 1.14 3.05 1.3 3.26.16.21 2.24 3.42 5.43 4.79.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.16-1.51.27-.75.27-1.39.19-1.51-.08-.13-.29-.21-.61-.37z" />
            </svg>
        </a>;
}
const HomePage = () => {
  return <div className="relative overflow-x-hidden bg-background text-foreground">
            <Navbar />
            <main>
                <Hero />
                <Historia />
                <MissaoVisaoValores />
                <Equipe />
                <Estrutura />
                <Conquistas />
                <Testimonials />
                <Etapas />
                <Medalhas />
                <CTAFinal />
            </main>
            <Footer />
            <WhatsAppFloat />
        </div>;
};
export default HomePage;
