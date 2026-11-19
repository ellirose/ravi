export const locales = ["en", "pt", "es"] as const;
export type Locale = (typeof locales)[number];

export const localeMeta: Record<Locale, { label: string; short: string; htmlLang: string }> = {
  en: { label: "English", short: "EN", htmlLang: "en" },
  pt: { label: "Português (Brasil)", short: "PT", htmlLang: "pt-BR" },
  es: { label: "Español", short: "ES", htmlLang: "es" },
};

type Role = { role: string; company: string; place: string; period: string; bullets: string[] };

export type Dict = {
  nav: { home: string; about: string; collection: string; works: string; motion: string; experience: string; toolkit: string; menu: string; close: string; language: string; cta: string };
  hero: {
    kicker: string; titleA: string; titleHighlight: string; titleB: string; lead: string;
    ctaWorks: string; ctaAbout: string; disciplines: [string, string, string];
    years: string; edits: string; pages: string; scroll: string; rec: string;
  };
  impact: { eyebrow: string; title: string; items: { value: number; prefix?: string; suffix: string; label: string; detail: string }[] };
  about: { eyebrow: string; title: string; body: string; quote: string; location: string; expertiseTitle: string; expertise: { title: string; items: string }[] };
  collection: { eyebrow: string; title: string; body: string; drag: string; prev: string; next: string };
  works: {
    eyebrow: string; title: string; body: string; more: string; less: string; open: string; count: string;
    filters: Record<"all" | "web" | "mobile" | "concept" | "logo" | "type" | "branding" | "marketing" | "apparel", string>;
  };
  motion: { eyebrow: string; title: string; body: string; services: string[]; play: string; pause: string; reel: string; stat: string; statLabel: string };
  experience: { eyebrow: string; title: string; roles: Role[] };
  projects: { eyebrow: string; title: string; items: { year: string; title: string; body: string; metric: string; metricLabel: string }[] };
  toolkit: {
    eyebrow: string; title: string; body: string; sphereHint: string;
    groups: { name: string; tools: string[] }[];
    educationTitle: string; degree: string; school: string; date: string;
    certTitle: string; certs: { name: string; issuer: string; year: string }[];
    languagesTitle: string; languages: { code: "jp" | "us" | "br" | "es"; name: string; level?: string }[];
  };
  footer: { tagline: string; rights: string; backTop: string; crafted: string; explore: string };
  lightbox: { close: string; prev: string; next: string };
  intro: { skip: string };
};

const toolsEn = [
  { name: "Design", tools: ["Figma", "Illustrator", "Photoshop", "InDesign"] },
  { name: "Video", tools: ["Premiere Pro", "After Effects", "DaVinci Resolve", "Audition"] },
  { name: "Web", tools: ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML5 / CSS3", "WordPress", "Git"] },
  { name: "Marketing", tools: ["GA4", "Tag Manager", "Looker Studio", "Google Ads", "Meta Ads", "HubSpot", "Search Console"] },
  { name: "Operations", tools: ["Notion", "Jira", "Excel", "PowerPoint", "Google Workspace"] },
];

const en: Dict = {
  nav: { home: "Home", about: "About", collection: "Japan", works: "Works", motion: "Motion", experience: "Journey", toolkit: "Toolkit", menu: "Menu", close: "Close", language: "Language", cta: "View works" },
  hero: {
    kicker: "Creative Developer · Tokyo",
    titleA: "Design, motion",
    titleHighlight: "& code",
    titleB: "crafted with Japanese care.",
    lead: "Ten years shaping brands, films and fast websites — where art direction meets analytics, and every frame earns its place.",
    ctaWorks: "Explore works",
    ctaAbout: "My story",
    disciplines: ["Brand & Graphic", "Video & Motion", "Creative Dev"],
    years: "Years crafting",
    edits: "Video edits",
    pages: "Pages launched",
    scroll: "Scroll",
    rec: "REC",
  },
  impact: {
    eyebrow: "Selected impact",
    title: "Craft you can measure.",
    items: [
      { value: 35, suffix: "%", label: "Faster", detail: "Landing-page production through reusable components" },
      { value: 27, suffix: "%", label: "Higher", detail: "Video completion rates across creative tests" },
      { value: 18, suffix: "%", label: "Uplift", detail: "Lead-to-consultation conversion for retained clients" },
      { value: 30, suffix: "%", label: "Quicker", detail: "Median revision turnaround with standardised briefs" },
    ],
  },
  about: {
    eyebrow: "About · 私について",
    title: "One studio mind, many disciplines.",
    body: "I’m Ravi, a Tokyo-based creative developer and multidisciplinary marketer. I combine hands-on production — identity, editing, motion and responsive web — with analytics, stakeholder management and process design, so brands feel cohesive and campaigns actually perform.",
    quote: "Simplicity is the shape of respect for the viewer.",
    location: "Tokyo, Japan",
    expertiseTitle: "Core expertise",
    expertise: [
      { title: "Brand & Graphic", items: "Visual identity · Art direction · Print & digital · Typography · UI/UX · Presentation systems" },
      { title: "Video & Motion", items: "Storyboarding · Commercial editing · Motion graphics · Colour & sound finishing · Vertical video" },
      { title: "Creative Development", items: "React · Next.js · TypeScript · Accessible interfaces · CMS integration · Performance" },
      { title: "Marketing & Growth", items: "SEO · CRO · Paid-media creative · GA4 reporting · CRM operations · Proposals" },
    ],
  },
  collection: {
    eyebrow: "Japan collection · 日本",
    title: "Travel stories, designed.",
    body: "A series of web, app and print concepts inviting the world to Japan — from Fuji at dawn to Kyoto’s lantern streets.",
    drag: "Drag to rotate",
    prev: "Previous",
    next: "Next",
  },
  works: {
    eyebrow: "Portfolio · 作品",
    title: "Selected works",
    body: "Interfaces, identities, typography and apparel — each piece shaped to its purpose.",
    more: "Show more works",
    less: "Show fewer",
    open: "Open",
    count: "pieces",
    filters: { all: "All", web: "Web", mobile: "Mobile", concept: "UI Posters", logo: "Logos", type: "Typography", branding: "Branding", marketing: "Marketing", apparel: "Apparel" },
  },
  motion: {
    eyebrow: "Motion & video · 映像",
    title: "Stories that move at the speed of the scroll.",
    body: "From storyboard to final grade, I cut commercials, product demos and vertical social edits — tested, measured and finished with care for colour and sound.",
    services: ["Storyboarding", "Commercial editing", "Motion graphics", "Colour & sound finishing", "Vertical video"],
    play: "Play reel",
    pause: "Pause reel",
    reel: "Showreel 2026",
    stat: "100+",
    statLabel: "promotional edits & motion explainers",
  },
  experience: {
    eyebrow: "Journey · 経歴",
    title: "A decade, scroll by scroll.",
    roles: [
      {
        role: "Independent Creative Developer & Marketing Consultant", company: "Independent Practice", place: "Tokyo / Remote", period: "2023 — Present",
        bullets: [
          "Leads branding, web, video and campaign work for 12 B2B and consumer clients.",
          "Launched 20+ responsive landing pages and microsites with React and Next.js — 35% faster production.",
          "Produced 100+ promotional edits and motion explainers; video completion up 27%.",
          "Built GA4, Looker Studio and HubSpot reporting — 18% better lead-to-consultation conversion.",
        ],
      },
      {
        role: "Digital Experience & Growth Marketing Designer", company: "Asterwave Digital K.K.", place: "Tokyo", period: "2019 — 2022",
        bullets: [
          "Owned visual production for SaaS launches and demand-generation campaigns.",
          "Edited product demos, customer stories and bilingual JP/EN motion templates.",
          "Lifted campaign click-through by 21% through email journeys, SEO and A/B testing.",
          "Built a Figma component library that cut design-to-dev rework by 25%.",
        ],
      },
      {
        role: "Graphic Designer & Video Editor", company: "Kogane Creative Studio", place: "Osaka", period: "2016 — 2019",
        bullets: [
          "Designed logos, editorial layouts, packaging and social templates for retail and hospitality.",
          "Edited promotional films and short-form commercials, from storyboard to sound.",
          "Coordinated revisions, licensing and delivery for 15+ recurring client accounts.",
        ],
      },
    ],
  },
  projects: {
    eyebrow: "Case studies · 事例",
    title: "Projects with a pulse.",
    items: [
      { year: "2025", title: "Integrated SaaS Product Launch", body: "Unified identity, a 90-second demo, 12 paid-social variants and a tracked Next.js launch site.", metric: "−32%", metricLabel: "asset production time" },
      { year: "2024", title: "Sales Enablement & Reporting", body: "Modular pitch decks, proposal templates, case-study layouts and CRM-linked dashboards.", metric: "−40%", metricLabel: "proposal preparation time" },
      { year: "2021", title: "Video-Led Demand Generation", body: "A six-part educational series with subtitles, landing-page creative and thumbnail tests.", metric: "+21%", metricLabel: "campaign click-through" },
    ],
  },
  toolkit: {
    eyebrow: "Toolkit · 道具",
    title: "The tools behind the craft.",
    body: "A studio’s worth of software, used fluently across design, video, code and growth.",
    sphereHint: "Drag the sphere",
    groups: toolsEn,
    educationTitle: "Education",
    degree: "Bachelor of Fine Arts, Graphic Design",
    school: "Tama Art University, Tokyo",
    date: "2016",
    certTitle: "Certifications",
    certs: [
      { name: "Google Analytics Certification", issuer: "Google Skillshop", year: "2023" },
      { name: "Adobe Certified Professional — Visual Design (Photoshop)", issuer: "Adobe", year: "2022" },
    ],
    languagesTitle: "Languages",
    languages: [
      { code: "jp", name: "Japanese", level: "Native" },
      { code: "us", name: "English", level: "Professional" },
      { code: "br", name: "Portuguese (Brazil)" },
      { code: "es", name: "Spanish" },
    ],
  },
  footer: { tagline: "Design, motion & code — crafted in Tokyo.", rights: "All rights reserved.", backTop: "Back to top", crafted: "Made with Next.js, Canvas & a little washi.", explore: "Explore" },
  lightbox: { close: "Close", prev: "Previous work", next: "Next work" },
  intro: { skip: "Skip intro" },
};

const pt: Dict = {
  nav: { home: "Início", about: "Sobre", collection: "Japão", works: "Trabalhos", motion: "Vídeo", experience: "Trajetória", toolkit: "Ferramentas", menu: "Menu", close: "Fechar", language: "Idioma", cta: "Ver trabalhos" },
  hero: {
    kicker: "Desenvolvedor Criativo · Tóquio",
    titleA: "Design, vídeo",
    titleHighlight: "& código",
    titleB: "com cuidado japonês.",
    lead: "Dez anos criando marcas, filmes e sites rápidos — onde a direção de arte encontra os dados e cada quadro tem um propósito.",
    ctaWorks: "Ver trabalhos",
    ctaAbout: "Minha história",
    disciplines: ["Marca & Gráfico", "Vídeo & Motion", "Dev Criativo"],
    years: "Anos de criação",
    edits: "Edições de vídeo",
    pages: "Páginas lançadas",
    scroll: "Role",
    rec: "REC",
  },
  impact: {
    eyebrow: "Impacto",
    title: "Criatividade que se mede.",
    items: [
      { value: 35, suffix: "%", label: "Mais rápido", detail: "Produção de landing pages com componentes reutilizáveis" },
      { value: 27, suffix: "%", label: "Maior", detail: "Taxa de conclusão de vídeos em testes criativos" },
      { value: 18, suffix: "%", label: "Aumento", detail: "Conversão de lead para consultoria em clientes recorrentes" },
      { value: 30, suffix: "%", label: "Mais ágil", detail: "Tempo médio de revisão com briefings padronizados" },
    ],
  },
  about: {
    eyebrow: "Sobre · 私について",
    title: "Uma mente de estúdio, várias disciplinas.",
    body: "Sou o Ravi, desenvolvedor criativo e profissional de marketing multidisciplinar em Tóquio. Uno produção prática — identidade, edição, motion e web responsiva — com análise de dados, gestão de stakeholders e processos, para que as marcas sejam coesas e as campanhas realmente performem.",
    quote: "Simplicidade é a forma do respeito pelo público.",
    location: "Tóquio, Japão",
    expertiseTitle: "Especialidades",
    expertise: [
      { title: "Marca & Gráfico", items: "Identidade visual · Direção de arte · Impresso & digital · Tipografia · UI/UX · Apresentações" },
      { title: "Vídeo & Motion", items: "Storyboard · Edição comercial · Motion graphics · Cor & som · Vídeo vertical" },
      { title: "Desenvolvimento Criativo", items: "React · Next.js · TypeScript · Interfaces acessíveis · Integração CMS · Performance" },
      { title: "Marketing & Crescimento", items: "SEO · CRO · Criativos de mídia paga · Relatórios GA4 · CRM · Propostas" },
    ],
  },
  collection: {
    eyebrow: "Coleção Japão · 日本",
    title: "Histórias de viagem, desenhadas.",
    body: "Uma série de conceitos de web, app e impresso que convidam o mundo ao Japão — do Fuji ao amanhecer às ruas iluminadas de Kyoto.",
    drag: "Arraste para girar",
    prev: "Anterior",
    next: "Próximo",
  },
  works: {
    eyebrow: "Portfólio · 作品",
    title: "Trabalhos selecionados",
    body: "Interfaces, identidades, tipografia e vestuário — cada peça moldada ao seu propósito.",
    more: "Ver mais trabalhos",
    less: "Ver menos",
    open: "Abrir",
    count: "peças",
    filters: { all: "Todos", web: "Web", mobile: "Mobile", concept: "Pôsteres UI", logo: "Logos", type: "Tipografia", branding: "Branding", marketing: "Marketing", apparel: "Vestuário" },
  },
  motion: {
    eyebrow: "Motion & vídeo · 映像",
    title: "Histórias que se movem no ritmo da rolagem.",
    body: "Do storyboard à finalização de cor, edito comerciais, demos de produto e vídeos verticais — testados, medidos e finalizados com cuidado de cor e som.",
    services: ["Storyboard", "Edição comercial", "Motion graphics", "Finalização de cor & som", "Vídeo vertical"],
    play: "Reproduzir",
    pause: "Pausar",
    reel: "Showreel 2026",
    stat: "100+",
    statLabel: "edições promocionais & explicativos animados",
  },
  experience: {
    eyebrow: "Trajetória · 経歴",
    title: "Uma década, pergaminho a pergaminho.",
    roles: [
      {
        role: "Desenvolvedor Criativo & Consultor de Marketing Independente", company: "Prática Independente", place: "Tóquio / Remoto", period: "2023 — Atual",
        bullets: [
          "Lidera projetos de marca, web, vídeo e campanhas para 12 clientes B2B e de consumo.",
          "Lançou 20+ landing pages e microsites com React e Next.js — produção 35% mais rápida.",
          "Produziu 100+ edições promocionais e explicativos; conclusão de vídeo 27% maior.",
          "Integrou relatórios GA4, Looker Studio e HubSpot — 18% mais conversão para consultoria.",
        ],
      },
      {
        role: "Designer de Experiência Digital & Growth Marketing", company: "Asterwave Digital K.K.", place: "Tóquio", period: "2019 — 2022",
        bullets: [
          "Responsável pela produção visual de lançamentos SaaS e campanhas de geração de demanda.",
          "Editou demos de produto, cases de clientes e templates de motion bilíngues JP/EN.",
          "Aumentou o CTR das campanhas em 21% com e-mail, SEO e testes A/B.",
          "Criou uma biblioteca de componentes no Figma que reduziu o retrabalho em 25%.",
        ],
      },
      {
        role: "Designer Gráfico & Editor de Vídeo", company: "Kogane Creative Studio", place: "Osaka", period: "2016 — 2019",
        bullets: [
          "Criou logos, layouts editoriais, embalagens e templates sociais para varejo e hotelaria.",
          "Editou filmes promocionais e comerciais curtos, do storyboard ao som.",
          "Coordenou revisões, licenças e entregas para 15+ contas recorrentes.",
        ],
      },
    ],
  },
  projects: {
    eyebrow: "Estudos de caso · 事例",
    title: "Projetos com pulso.",
    items: [
      { year: "2025", title: "Lançamento Integrado de Produto SaaS", body: "Identidade unificada, demo de 90 segundos, 12 variações para social pago e site Next.js com rastreamento.", metric: "−32%", metricLabel: "tempo de produção de peças" },
      { year: "2024", title: "Sales Enablement & Relatórios", body: "Decks modulares, templates de proposta, layouts de cases e dashboards ligados ao CRM.", metric: "−40%", metricLabel: "tempo de preparo de propostas" },
      { year: "2021", title: "Geração de Demanda com Vídeo", body: "Série educativa em seis partes com legendas, criativos de landing page e testes de thumbnail.", metric: "+21%", metricLabel: "CTR das campanhas" },
    ],
  },
  toolkit: {
    eyebrow: "Ferramentas · 道具",
    title: "As ferramentas por trás do ofício.",
    body: "Um estúdio inteiro de softwares, usados com fluência em design, vídeo, código e crescimento.",
    sphereHint: "Arraste a esfera",
    groups: [
      { name: "Design", tools: toolsEn[0].tools },
      { name: "Vídeo", tools: toolsEn[1].tools },
      { name: "Web", tools: toolsEn[2].tools },
      { name: "Marketing", tools: toolsEn[3].tools },
      { name: "Operações", tools: toolsEn[4].tools },
    ],
    educationTitle: "Formação",
    degree: "Bacharelado em Belas Artes, Design Gráfico",
    school: "Tama Art University, Tóquio",
    date: "2016",
    certTitle: "Certificações",
    certs: [
      { name: "Certificação Google Analytics", issuer: "Google Skillshop", year: "2023" },
      { name: "Adobe Certified Professional — Design Visual (Photoshop)", issuer: "Adobe", year: "2022" },
    ],
    languagesTitle: "Idiomas",
    languages: [
      { code: "jp", name: "Japonês", level: "Nativo" },
      { code: "us", name: "Inglês", level: "Profissional" },
      { code: "br", name: "Português (Brasil)" },
      { code: "es", name: "Espanhol" },
    ],
  },
  footer: { tagline: "Design, vídeo & código — criados em Tóquio.", rights: "Todos os direitos reservados.", backTop: "Voltar ao topo", crafted: "Feito com Next.js, Canvas e um pouco de washi.", explore: "Explorar" },
  lightbox: { close: "Fechar", prev: "Trabalho anterior", next: "Próximo trabalho" },
  intro: { skip: "Pular intro" },
};

const es: Dict = {
  nav: { home: "Inicio", about: "Sobre mí", collection: "Japón", works: "Trabajos", motion: "Vídeo", experience: "Trayectoria", toolkit: "Herramientas", menu: "Menú", close: "Cerrar", language: "Idioma", cta: "Ver trabajos" },
  hero: {
    kicker: "Desarrollador Creativo · Tokio",
    titleA: "Diseño, vídeo",
    titleHighlight: "y código",
    titleB: "con cuidado japonés.",
    lead: "Diez años creando marcas, películas y webs rápidas — donde la dirección de arte se une a los datos y cada fotograma tiene un propósito.",
    ctaWorks: "Ver trabajos",
    ctaAbout: "Mi historia",
    disciplines: ["Marca y Gráfico", "Vídeo y Motion", "Dev Creativo"],
    years: "Años creando",
    edits: "Ediciones de vídeo",
    pages: "Páginas lanzadas",
    scroll: "Desliza",
    rec: "REC",
  },
  impact: {
    eyebrow: "Impacto",
    title: "Creatividad que se mide.",
    items: [
      { value: 35, suffix: "%", label: "Más rápido", detail: "Producción de landing pages con componentes reutilizables" },
      { value: 27, suffix: "%", label: "Mayor", detail: "Tasa de finalización de vídeo en pruebas creativas" },
      { value: 18, suffix: "%", label: "Aumento", detail: "Conversión de lead a consulta en clientes recurrentes" },
      { value: 30, suffix: "%", label: "Más ágil", detail: "Tiempo medio de revisión con briefs estandarizados" },
    ],
  },
  about: {
    eyebrow: "Sobre mí · 私について",
    title: "Una mente de estudio, muchas disciplinas.",
    body: "Soy Ravi, desarrollador creativo y especialista en marketing multidisciplinar en Tokio. Combino producción práctica — identidad, edición, motion y web responsive — con analítica, gestión de stakeholders y mejora de procesos, para que las marcas sean coherentes y las campañas den resultados.",
    quote: "La sencillez es la forma del respeto hacia quien mira.",
    location: "Tokio, Japón",
    expertiseTitle: "Especialidades",
    expertise: [
      { title: "Marca y Gráfico", items: "Identidad visual · Dirección de arte · Impreso y digital · Tipografía · UI/UX · Presentaciones" },
      { title: "Vídeo y Motion", items: "Storyboard · Edición comercial · Motion graphics · Color y sonido · Vídeo vertical" },
      { title: "Desarrollo Creativo", items: "React · Next.js · TypeScript · Interfaces accesibles · Integración CMS · Rendimiento" },
      { title: "Marketing y Crecimiento", items: "SEO · CRO · Creatividades de pago · Informes GA4 · CRM · Propuestas" },
    ],
  },
  collection: {
    eyebrow: "Colección Japón · 日本",
    title: "Historias de viaje, diseñadas.",
    body: "Una serie de conceptos web, app e impresos que invitan al mundo a Japón — del Fuji al amanecer a las calles con farolillos de Kioto.",
    drag: "Arrastra para girar",
    prev: "Anterior",
    next: "Siguiente",
  },
  works: {
    eyebrow: "Portafolio · 作品",
    title: "Trabajos seleccionados",
    body: "Interfaces, identidades, tipografía y moda — cada pieza pensada para su propósito.",
    more: "Ver más trabajos",
    less: "Ver menos",
    open: "Abrir",
    count: "piezas",
    filters: { all: "Todos", web: "Web", mobile: "Móvil", concept: "Pósters UI", logo: "Logos", type: "Tipografía", branding: "Branding", marketing: "Marketing", apparel: "Moda" },
  },
  motion: {
    eyebrow: "Motion y vídeo · 映像",
    title: "Historias que se mueven al ritmo del scroll.",
    body: "Del storyboard al etalonaje final, edito anuncios, demos de producto y vídeos verticales — probados, medidos y terminados con cuidado de color y sonido.",
    services: ["Storyboard", "Edición comercial", "Motion graphics", "Color y sonido", "Vídeo vertical"],
    play: "Reproducir",
    pause: "Pausar",
    reel: "Showreel 2026",
    stat: "100+",
    statLabel: "ediciones promocionales y explicativos animados",
  },
  experience: {
    eyebrow: "Trayectoria · 経歴",
    title: "Una década, pergamino a pergamino.",
    roles: [
      {
        role: "Desarrollador Creativo y Consultor de Marketing Independiente", company: "Práctica Independiente", place: "Tokio / Remoto", period: "2023 — Actualidad",
        bullets: [
          "Dirige proyectos de marca, web, vídeo y campañas para 12 clientes B2B y de consumo.",
          "Lanzó más de 20 landing pages y micrositios con React y Next.js — producción un 35% más rápida.",
          "Produjo más de 100 ediciones promocionales; finalización de vídeo un 27% mayor.",
          "Integró informes GA4, Looker Studio y HubSpot — un 18% más de conversión a consulta.",
        ],
      },
      {
        role: "Diseñador de Experiencia Digital y Growth Marketing", company: "Asterwave Digital K.K.", place: "Tokio", period: "2019 — 2022",
        bullets: [
          "Responsable de la producción visual de lanzamientos SaaS y campañas de demanda.",
          "Editó demos de producto, casos de clientes y plantillas de motion bilingües JP/EN.",
          "Aumentó el CTR de campañas un 21% con email, SEO y pruebas A/B.",
          "Creó una librería de componentes en Figma que redujo el retrabajo un 25%.",
        ],
      },
      {
        role: "Diseñador Gráfico y Editor de Vídeo", company: "Kogane Creative Studio", place: "Osaka", period: "2016 — 2019",
        bullets: [
          "Diseñó logos, maquetas editoriales, packaging y plantillas sociales para retail y hostelería.",
          "Editó películas promocionales y anuncios cortos, del storyboard al sonido.",
          "Coordinó revisiones, licencias y entregas para más de 15 cuentas recurrentes.",
        ],
      },
    ],
  },
  projects: {
    eyebrow: "Casos · 事例",
    title: "Proyectos con pulso.",
    items: [
      { year: "2025", title: "Lanzamiento Integrado de Producto SaaS", body: "Identidad unificada, demo de 90 segundos, 12 variantes para social de pago y web Next.js con medición.", metric: "−32%", metricLabel: "tiempo de producción de piezas" },
      { year: "2024", title: "Sales Enablement y Reporting", body: "Presentaciones modulares, plantillas de propuesta, casos de estudio y dashboards conectados al CRM.", metric: "−40%", metricLabel: "tiempo de preparación de propuestas" },
      { year: "2021", title: "Generación de Demanda con Vídeo", body: "Serie educativa de seis capítulos con subtítulos, creatividades de landing y pruebas de miniaturas.", metric: "+21%", metricLabel: "CTR de campañas" },
    ],
  },
  toolkit: {
    eyebrow: "Herramientas · 道具",
    title: "Las herramientas detrás del oficio.",
    body: "Todo un estudio de software, usado con soltura en diseño, vídeo, código y crecimiento.",
    sphereHint: "Arrastra la esfera",
    groups: [
      { name: "Diseño", tools: toolsEn[0].tools },
      { name: "Vídeo", tools: toolsEn[1].tools },
      { name: "Web", tools: toolsEn[2].tools },
      { name: "Marketing", tools: toolsEn[3].tools },
      { name: "Operaciones", tools: toolsEn[4].tools },
    ],
    educationTitle: "Formación",
    degree: "Licenciatura en Bellas Artes, Diseño Gráfico",
    school: "Tama Art University, Tokio",
    date: "2016",
    certTitle: "Certificaciones",
    certs: [
      { name: "Certificación Google Analytics", issuer: "Google Skillshop", year: "2023" },
      { name: "Adobe Certified Professional — Diseño Visual (Photoshop)", issuer: "Adobe", year: "2022" },
    ],
    languagesTitle: "Idiomas",
    languages: [
      { code: "jp", name: "Japonés", level: "Nativo" },
      { code: "us", name: "Inglés", level: "Profesional" },
      { code: "br", name: "Portugués (Brasil)" },
      { code: "es", name: "Español" },
    ],
  },
  footer: { tagline: "Diseño, vídeo y código — hechos en Tokio.", rights: "Todos los derechos reservados.", backTop: "Volver arriba", crafted: "Hecho con Next.js, Canvas y un poco de washi.", explore: "Explorar" },
  lightbox: { close: "Cerrar", prev: "Trabajo anterior", next: "Trabajo siguiente" },
  intro: { skip: "Saltar intro" },
};

export const dictionaries: Record<Locale, Dict> = { en, pt, es };
