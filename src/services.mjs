// One page per service, in English and Spanish, built by build.mjs into
//   services/<slug>/index.html  and  es/servicios/<slug>/index.html
// Keep the wording factual: only work JAM actually does, no prices, sizes or guarantees.
// `c` matches the job categories in data/jobs.json, so each page shows its own recent jobs.

export const TOWNS = ["Towson", "Cockeysville", "Timonium", "Hunt Valley", "Lutherville"];

export const SERVICE_PAGES = [
  {
    c: "stone",
    en: {
      slug: "stone-walls",
      name: "Stone Walls & Stone Stairs",
      title: "Stone Walls, Stone Stairs & Fire Pits in Baltimore County, MD | JAM Construction",
      description: "Dry-stack stone walls, retaining walls, stone stairs, stone veneer, fire pits and outdoor fireplaces in Towson, Cockeysville, Timonium and across Baltimore County. Free estimates.",
      h1: "Stone walls & stone stairs in Baltimore County",
      intro: [
        "Jorge Mercado and his crew build natural stone work for homes across Baltimore County: dry-stacked garden walls, retaining walls, stone steps and stairways, and stone veneer on porches and foundations.",
        "They also build stone fire pits and outdoor fireplaces, and finish walls and steps with flagstone caps.",
      ],
      list: ["Dry-stack stone garden walls", "Stone retaining walls", "Stone steps and stairways", "Stone veneer on porches and foundations", "Fire pits and outdoor fireplaces", "Flagstone caps and garden beds"],
    },
    es: {
      slug: "muros-de-piedra",
      name: "Muros y escaleras de piedra",
      title: "Muros de piedra, escaleras de piedra y fogatas en el condado de Baltimore | JAM Construction",
      description: "Muros de piedra apilada en seco, muros de contención, escaleras de piedra, revestimiento de piedra, fogatas y chimeneas al aire libre en Towson, Cockeysville, Timonium y todo el condado de Baltimore. Presupuestos gratis.",
      h1: "Muros y escaleras de piedra en el condado de Baltimore",
      intro: [
        "Jorge Mercado y su equipo hacen trabajos de piedra natural para casas en todo el condado de Baltimore: muros de jardín apilados en seco, muros de contención, escalones y escaleras de piedra, y revestimiento de piedra en porches y cimientos.",
        "También construyen fogatas y chimeneas de piedra al aire libre, y terminan muros y escalones con tapas de laja.",
      ],
      list: ["Muros de jardín de piedra apilada en seco", "Muros de contención de piedra", "Escalones y escaleras de piedra", "Revestimiento de piedra en porches y cimientos", "Fogatas y chimeneas al aire libre", "Tapas de laja y jardineras"],
    },
  },
  {
    c: "pave",
    en: {
      slug: "patios-walkways",
      name: "Patios, Walkways & Pool Decks",
      title: "Paver Patios, Walkways & Pool Decks in Baltimore County, MD | JAM Construction",
      description: "Paver and flagstone patios, front walkways, concrete sidewalks, steps and pool decks in Towson, Cockeysville, Timonium, Hunt Valley and Lutherville. Competitive prices, free estimates.",
      h1: "Patios, walkways & pool decks in Baltimore County",
      intro: [
        "JAM Construction builds paver and flagstone patios, front walkways, concrete sidewalks, steps and pool decks for homes across Baltimore County.",
        "Every patio and walkway is built on a properly compacted base, so it stays flat and solid.",
      ],
      list: ["Paver patios", "Flagstone patios and paths", "Front entry walkways", "Concrete sidewalks", "Pool decks", "Steps and patio fire pits"],
    },
    es: {
      slug: "patios-y-caminos",
      name: "Patios, caminos y terrazas de piscina",
      title: "Patios de adoquín, caminos y terrazas de piscina en el condado de Baltimore | JAM Construction",
      description: "Patios de adoquín y de laja, caminos de entrada, aceras de concreto, escalones y terrazas de piscina en Towson, Cockeysville, Timonium, Hunt Valley y Lutherville. Precios competitivos, presupuestos gratis.",
      h1: "Patios, caminos y terrazas de piscina en el condado de Baltimore",
      intro: [
        "JAM Construction hace patios de adoquín y de laja, caminos de entrada, aceras de concreto, escalones y terrazas de piscina para casas en todo el condado de Baltimore.",
        "Cada patio y camino se hace sobre una base bien compactada, para que quede plano y firme.",
      ],
      list: ["Patios de adoquín", "Patios y senderos de laja", "Caminos de entrada", "Aceras de concreto", "Terrazas de piscina", "Escalones y fogatas en el patio"],
    },
  },
  {
    c: "fence",
    en: {
      slug: "fences-pergolas",
      name: "Fences & Pergolas",
      title: "Fence Installation & Pergolas in Baltimore County, MD | JAM Construction",
      description: "Wood fences, property-line and split-rail fences, privacy screens and pergolas in Towson, Cockeysville, Timonium, Hunt Valley and Lutherville. Free estimates, se habla español.",
      h1: "Fences & pergolas in Baltimore County",
      intro: [
        "JAM Construction installs wood fences, property-line and split-rail fences, and privacy screens, and builds pergolas over patios and decks.",
        "Fences and pergolas are set on solid posts so they stay straight.",
      ],
      list: ["Wood privacy fences", "Property-line fences", "Split-rail fences", "Privacy screens", "Pergolas over patios and decks"],
    },
    es: {
      slug: "cercas-y-pergolas",
      name: "Cercas y pérgolas",
      title: "Instalación de cercas y pérgolas en el condado de Baltimore | JAM Construction",
      description: "Cercas de madera, cercas de lindero y de rieles, paneles de privacidad y pérgolas en Towson, Cockeysville, Timonium, Hunt Valley y Lutherville. Presupuestos gratis.",
      h1: "Cercas y pérgolas en el condado de Baltimore",
      intro: [
        "JAM Construction instala cercas de madera, cercas de lindero y de rieles, y paneles de privacidad, y construye pérgolas sobre patios y decks.",
        "Las cercas y pérgolas van sobre postes firmes para que se mantengan derechas.",
      ],
      list: ["Cercas de privacidad de madera", "Cercas de lindero", "Cercas de rieles", "Paneles de privacidad", "Pérgolas sobre patios y decks"],
    },
  },
  {
    c: "build",
    en: {
      slug: "decks-garages-sheds",
      name: "Decks, Garages & Sheds",
      title: "Deck Builder, Garages & Sheds in Baltimore County, MD | JAM Construction",
      description: "New decks, garages, sheds and other exterior structures in Towson, Cockeysville, Timonium, Hunt Valley and Lutherville. Competitive prices and free estimates.",
      h1: "Decks, garages & sheds in Baltimore County",
      intro: [
        "JAM Construction builds new decks, garages, sheds and other exterior structures for homes across Baltimore County.",
        "Each structure is framed solid and built to last.",
      ],
      list: ["New decks", "Detached garages", "Sheds", "Other exterior structures"],
    },
    es: {
      slug: "decks-garajes-cobertizos",
      name: "Decks, garajes y cobertizos",
      title: "Construcción de decks, garajes y cobertizos en el condado de Baltimore | JAM Construction",
      description: "Decks nuevos, garajes, cobertizos y otras estructuras exteriores en Towson, Cockeysville, Timonium, Hunt Valley y Lutherville. Precios competitivos y presupuestos gratis.",
      h1: "Decks, garajes y cobertizos en el condado de Baltimore",
      intro: [
        "JAM Construction construye decks nuevos, garajes, cobertizos y otras estructuras exteriores para casas en todo el condado de Baltimore.",
        "Cada estructura lleva un armazón firme y está hecha para durar.",
      ],
      list: ["Decks nuevos", "Garajes independientes", "Cobertizos", "Otras estructuras exteriores"],
    },
  },
  {
    c: "exterior",
    en: {
      slug: "siding-prep",
      name: "Siding Prep & Exteriors",
      title: "Exterior Sheathing & Siding Prep in Baltimore County, MD | JAM Construction",
      description: "Exterior wall sheathing, weather barrier and furring strips to prepare homes for new siding in Baltimore County, MD. Free estimates.",
      h1: "Siding prep & exteriors in Baltimore County",
      intro: [
        "Before new siding goes on, JAM Construction prepares the walls: exterior sheathing, weather barrier and furring strips.",
      ],
      list: ["Exterior wall sheathing", "Weather barrier", "Furring strips for new siding"],
    },
    es: {
      slug: "preparacion-de-revestimiento",
      name: "Preparación para revestimiento",
      title: "Revestimiento exterior y preparación para siding en el condado de Baltimore | JAM Construction",
      description: "Revestimiento exterior de paredes, barrera contra el clima y listones para preparar la casa para siding nuevo en el condado de Baltimore. Presupuestos gratis.",
      h1: "Preparación para revestimiento exterior en el condado de Baltimore",
      intro: [
        "Antes de poner revestimiento nuevo, JAM Construction prepara las paredes: revestimiento exterior, barrera contra el clima y listones.",
      ],
      list: ["Revestimiento exterior de paredes", "Barrera contra el clima", "Listones para revestimiento nuevo"],
    },
  },
  {
    c: "interior",
    en: {
      slug: "bathrooms-basements",
      name: "Bathrooms, Basements & Waterproofing",
      title: "Bathroom Remodeling, Basements & Waterproofing in Baltimore County, MD | JAM Construction",
      description: "Bathroom remodels, interior remodeling, basement finishing and basement waterproofing in Towson, Cockeysville, Timonium, Hunt Valley and Lutherville. Free estimates.",
      h1: "Bathrooms, basements & waterproofing in Baltimore County",
      intro: [
        "Inside the house, JAM Construction does bathroom remodels, interior remodeling, basement finishing and basement waterproofing.",
      ],
      list: ["Bathroom remodels", "Interior remodeling", "Basement finishing", "Basement waterproofing"],
    },
    es: {
      slug: "banos-y-sotanos",
      name: "Baños, sótanos e impermeabilización",
      title: "Remodelación de baños, sótanos e impermeabilización en el condado de Baltimore | JAM Construction",
      description: "Remodelación de baños e interiores, acabado de sótanos e impermeabilización de sótanos en Towson, Cockeysville, Timonium, Hunt Valley y Lutherville. Presupuestos gratis.",
      h1: "Baños, sótanos e impermeabilización en el condado de Baltimore",
      intro: [
        "Dentro de la casa, JAM Construction remodela baños e interiores, termina sótanos e impermeabiliza sótanos.",
      ],
      list: ["Remodelación de baños", "Remodelación de interiores", "Acabado de sótanos", "Impermeabilización de sótanos"],
    },
  },
];

export const servicePath = (lang, slug) => (lang === "en" ? `services/${slug}/` : `es/servicios/${slug}/`);
