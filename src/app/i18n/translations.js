export const supportedLanguages = [
  { code: "en", shortLabel: "EN", nativeLabel: "English" },
  { code: "es", shortLabel: "ES", nativeLabel: "Español" },
  { code: "fr", shortLabel: "FR", nativeLabel: "Français" },
  { code: "pt", shortLabel: "PT", nativeLabel: "Português" },
  { code: "ru", shortLabel: "RU", nativeLabel: "Русский" },
  { code: "zh", shortLabel: "中文", nativeLabel: "中文" },
];

export const resources = {
  en: {
    translation: {
      language: { select: "Select language" },
      nav: {
        home: "Home",
        markets: "Markets",
        leaderboard: "Leaderboard",
        portfolio: "Portfolio",
        more: "More",
        about: "About",
        governance: "Governance",
        utilities: "Utilities",
        main: "Main navigation",
        open: "Open navigation",
      },
      wallet: {
        connect: "Connect Wallet", garthBalance: "GARTH Balance", quBalance: "QU Balance",
        govBalance: "QTRYGOV Balance", unavailable: "Unavailable", settings: "Wallet Settings",
        missingGarthBefore: "Do not see your GARTH? Go to", missingGarthAfter: "and use Transfer Share Management Rights.",
      },
      theme: { switchToLight: "Switch to light mode", switchToDark: "Switch to dark mode" },
      status: {
        label: "Status: {{status}}",
        open: "Open",
        closed: "Closed",
        resolved: "Resolved",
        archived: "Archived",
        cancelled: "Cancelled",
        canceled: "Canceled",
        pending: "Pending",
        win: "Win",
        lose: "Lose",
        matched: "Matched",
        partiallyMatched: "Partially matched",
        returned: "Returned",
      },
      home: {
        eyebrow: "Qubic-native prediction markets",
        titleStart: "Predict to",
        titleAccent: "profit",
        description: "Trade YES and NO outcome shares through transparent order books, indexed portfolios, and on-chain settlement powered by Qubic.",
        wholeShare: "Whole share",
        settlement: "Settlement",
        settlementValue: "On-chain",
        data: "Data",
        dataValue: "Live indexed",
        explore: "Explore Markets",
        about: "About",
        recent: "Recent Markets",
        all: "All Markets",
        emptyTitle: "No markets found",
        emptyDescription: "Markets will appear here once the indexer returns active events.",
      },
      marketCard: {
        ended: "Ended",
        tradedVolume: "Traded volume",
        openOrdersVolume: "Open orders volume",
        resultYes: "Result YES",
        resultNo: "Result NO",
      },
      markets: {
        pageTitle: "Markets", archivePageTitle: "Archived markets", eyebrow: "Qubic-native prediction markets",
        title: "Markets", description: "Discover active outcomes, compare market depth, and review archived settlement history.",
        refresh: "Refresh markets", active: "Active", archive: "Archive ({{count}})", activeMarkets: "Active markets",
        archivedMarkets: "Archived markets", tradedVolume: "Traded volume", openOrders: "Open orders",
        connectTitle: "Connect wallet to browse markets", connectDescription: "Market data is loaded through your configured Qubic connection.",
        search: "Search markets...", clearSearch: "Clear search", sort: "Sort: {{value}}", sortTraded: "Traded volume",
        sortOpen: "Open orders volume", sortNewest: "Newest", sortEnding: "Ending soon", sortCreated: "Created date",
        sortArchived: "Archived date", directionNewest: "Newest", directionOldest: "Oldest", showZero: "Show zero volume markets",
        all: "All", allMarkets: "All Markets", allGroup: "All {{group}}", failedArchive: "Failed to load archived markets",
        noArchive: "No archived markets found", noArchiveHint: "Try changing search, sort, or zero-volume filter.",
        noMarkets: "No markets found", noMarketsHint: "Try changing search, category, or sort filters.",
        event: "Event", eventFallback: "Event #{{id}}", winner: "Winner", volume: "Volume", createdTick: "Created tick",
        finalizedTick: "Finalized tick", archivedTick: "Archived tick", pending: "Pending", yes: "Yes", no: "No",
        collapse: "Collapse {{label}}", expand: "Expand {{label}}",
        groups: { crypto: "Crypto", "qubic-ecosystem": "Qubic Ecosystem", sports: "Sports", finance: "Finance", other: "Other" },
        tags: { general: "General", crypto: "Crypto", sport: "Sport", football: "Football", basketball: "Basketball", tennis: "Tennis", hockey: "Hockey", chess: "Chess", stocks: "Stocks", economy: "Economy", cinema: "Cinema", science: "Science", politics: "Politics", weather: "Weather", gaming: "Gaming", celebrity: "Celebrity", medicine: "Medicine" },
      },
      eventDetails: {
        event: "Event", eventFallback: "Event #{{id}}", notFound: "Event not found", invalidEvent: "This event is missing or the event ID is invalid.", back: "Back to Markets",
        pending: "Pending", result: "Result: {{option}}", priceToBeat: "Price to beat", finalPrice: "Final price", oracleOpeningPrice: "Oracle opening price", refreshOrderBook: "Refresh order book", orderBook: "Order Book",
        noBuyOrders: "No buy orders", noSellOrders: "No sell orders", tradeOption: "Trade {{option}}", yes: "YES", no: "NO",
        price: "Price", shares: "Shares", total: "Total", bid: "Bid: {{value}}", spread: "Spread: {{value}}", ask: "Ask: {{value}}",
        option0: "Option 0", option1: "Option 1", loadingOrderBook: "Loading order book...", aiContext: "AI Context", moreDetails: "More Details",
        open: "Open", end: "End", disputer: "Disputer: {{identity}} (Amount: {{amount}})", votes: "Computor votes — No: {{no}} / Yes: {{yes}}",
        dispute: "Dispute Result", disputeHint: "Requires deposit. Triggers computor vote to overturn the published result.", rules: "Rules",
        tradePanel: "Trade panel", tradeDescription: "Choose side, outcome, shares and price.", buy: "Buy", sell: "Sell", cost: "Cost",
        signing: "Signing...", placeBuy: "Place Buy Order", placeSell: "Place Sell Order",
        insufficientGarth: "Insufficient GARTH: need {{needed}}, available {{available}}.", insufficientShares: "Insufficient shares: need {{needed}}, available {{available}}.",
        mintHint: "Mint: matches if a buy order on the opposite option has price ≥ {{price}}", sellHint: "Trade: matches if a buy order on the same option has price ≥ your sell price",
        available: "Available: {{value}} {{unit}}", availableUnavailable: "Available: unavailable", unavailable: "Unavailable", maxShares: "Max {{value}} shares",
        probability: "Probability: {{value}}%", priceOutOf: "Price (out of 100,000)", shareUnit: "shares", goBack: "Go back",
        eventEnded: "EVENT ENDED", timeLeft: "TIME LEFT", ended: "ENDED", months: "MONTHS", days: "DAYS", hours: "HRS", minutes: "MINS", seconds: "SECS",
      },
      footer: {
        terms: "Terms of service",
        privacy: "Privacy Policy",
        network: "Network Status",
        version: "Version {{version}}",
      },
    },
  },
  es: {
    translation: {
      language: { select: "Seleccionar idioma" },
      nav: {
        home: "Inicio", markets: "Mercados", leaderboard: "Clasificación", portfolio: "Portafolio",
        more: "Más", about: "Acerca de", governance: "Gobernanza", utilities: "Utilidades",
        main: "Navegación principal", open: "Abrir navegación",
      },
      wallet: {
        connect: "Conectar billetera", garthBalance: "Saldo de GARTH", quBalance: "Saldo de QU",
        govBalance: "Saldo de QTRYGOV", unavailable: "No disponible", settings: "Configuración de la billetera",
        missingGarthBefore: "¿No ves tu GARTH? Ve a", missingGarthAfter: "y usa Transfer Share Management Rights.",
      },
      theme: { switchToLight: "Cambiar al modo claro", switchToDark: "Cambiar al modo oscuro" },
      status: {
        label: "Estado: {{status}}", open: "Abierto", closed: "Cerrado", resolved: "Resuelto",
        archived: "Archivado", cancelled: "Cancelado", canceled: "Cancelado", pending: "Pendiente",
        win: "Ganada", lose: "Perdida", matched: "Ejecutada", partiallyMatched: "Parcialmente ejecutada", returned: "Devuelta",
      },
      home: {
        eyebrow: "Mercados de predicción nativos de Qubic", titleStart: "Predice para", titleAccent: "ganar",
        description: "Opera participaciones de resultados SÍ y NO mediante libros de órdenes transparentes, portafolios indexados y liquidación on-chain impulsada por Qubic.",
        wholeShare: "Participación completa", settlement: "Liquidación", settlementValue: "On-chain",
        data: "Datos", dataValue: "Indexación en vivo", explore: "Explorar mercados", about: "Acerca de",
        recent: "Mercados recientes", all: "Todos los mercados", emptyTitle: "No se encontraron mercados",
        emptyDescription: "Los mercados aparecerán cuando el indexador devuelva eventos activos.",
      },
      marketCard: { ended: "Finalizado", tradedVolume: "Volumen operado", openOrdersVolume: "Volumen de órdenes abiertas", resultYes: "Resultado SÍ", resultNo: "Resultado NO" },
      markets: {
        pageTitle: "Mercados", archivePageTitle: "Mercados archivados", eyebrow: "Mercados de predicción nativos de Qubic",
        title: "Mercados", description: "Descubre resultados activos, compara la profundidad del mercado y revisa el historial de liquidaciones archivadas.",
        refresh: "Actualizar mercados", active: "Activos", archive: "Archivo ({{count}})", activeMarkets: "Mercados activos",
        archivedMarkets: "Mercados archivados", tradedVolume: "Volumen operado", openOrders: "Órdenes abiertas",
        connectTitle: "Conecta la billetera para explorar mercados", connectDescription: "Los datos del mercado se cargan mediante tu conexión Qubic configurada.",
        search: "Buscar mercados...", clearSearch: "Limpiar búsqueda", sort: "Ordenar: {{value}}", sortTraded: "Volumen operado",
        sortOpen: "Volumen de órdenes abiertas", sortNewest: "Más recientes", sortEnding: "Próximos a cerrar", sortCreated: "Fecha de creación",
        sortArchived: "Fecha de archivo", directionNewest: "Más recientes", directionOldest: "Más antiguos", showZero: "Mostrar mercados sin volumen",
        all: "Todos", allMarkets: "Todos los mercados", allGroup: "Todo: {{group}}", failedArchive: "No se pudieron cargar los mercados archivados",
        noArchive: "No se encontraron mercados archivados", noArchiveHint: "Cambia la búsqueda, el orden o el filtro de volumen cero.",
        noMarkets: "No se encontraron mercados", noMarketsHint: "Cambia la búsqueda, la categoría o el orden.",
        event: "Evento", eventFallback: "Evento #{{id}}", winner: "Ganador", volume: "Volumen", createdTick: "Tick de creación",
        finalizedTick: "Tick de finalización", archivedTick: "Tick de archivo", pending: "Pendiente", yes: "Sí", no: "No",
        collapse: "Contraer {{label}}", expand: "Expandir {{label}}",
        groups: { crypto: "Cripto", "qubic-ecosystem": "Ecosistema Qubic", sports: "Deportes", finance: "Finanzas", other: "Otros" },
        tags: { general: "General", crypto: "Cripto", sport: "Deporte", football: "Fútbol", basketball: "Baloncesto", tennis: "Tenis", hockey: "Hockey", chess: "Ajedrez", stocks: "Acciones", economy: "Economía", cinema: "Cine", science: "Ciencia", politics: "Política", weather: "Clima", gaming: "Videojuegos", celebrity: "Celebridades", medicine: "Medicina" },
      },
      eventDetails: {
        event: "Evento", eventFallback: "Evento #{{id}}", notFound: "Evento no encontrado", invalidEvent: "El evento no existe o su ID no es válido.", back: "Volver a Mercados",
        pending: "Pendiente", result: "Resultado: {{option}}", priceToBeat: "Precio a superar", finalPrice: "Precio final", oracleOpeningPrice: "Precio de apertura del oráculo", refreshOrderBook: "Actualizar libro de órdenes", orderBook: "Libro de órdenes",
        noBuyOrders: "No hay órdenes de compra", noSellOrders: "No hay órdenes de venta", tradeOption: "Operar {{option}}", yes: "SÍ", no: "NO",
        price: "Precio", shares: "Participaciones", total: "Total", bid: "Compra: {{value}}", spread: "Diferencial: {{value}}", ask: "Venta: {{value}}",
        option0: "Opción 0", option1: "Opción 1", loadingOrderBook: "Cargando libro de órdenes...", aiContext: "Contexto de IA", moreDetails: "Más detalles",
        open: "Apertura", end: "Fin", disputer: "Impugnador: {{identity}} (Cantidad: {{amount}})", votes: "Votos de computors — No: {{no}} / Sí: {{yes}}",
        dispute: "Impugnar resultado", disputeHint: "Requiere un depósito. Inicia una votación de computors para revocar el resultado publicado.", rules: "Reglas",
        tradePanel: "Panel de operación", tradeDescription: "Elige lado, resultado, participaciones y precio.", buy: "Comprar", sell: "Vender", cost: "Coste",
        signing: "Firmando...", placeBuy: "Crear orden de compra", placeSell: "Crear orden de venta",
        insufficientGarth: "GARTH insuficiente: se necesitan {{needed}}, disponibles {{available}}.", insufficientShares: "Participaciones insuficientes: se necesitan {{needed}}, disponibles {{available}}.",
        mintHint: "Mint: coincide si una orden de compra de la opción opuesta tiene precio ≥ {{price}}", sellHint: "Operación: coincide si una orden de compra de la misma opción tiene precio ≥ tu precio de venta",
        available: "Disponible: {{value}} {{unit}}", availableUnavailable: "Disponible: no disponible", unavailable: "No disponible", maxShares: "Máx. {{value}} participaciones",
        probability: "Probabilidad: {{value}}%", priceOutOf: "Precio (de 100.000)", shareUnit: "participaciones", goBack: "Volver",
        eventEnded: "EVENTO FINALIZADO", timeLeft: "TIEMPO RESTANTE", ended: "FINALIZADO", months: "MESES", days: "DÍAS", hours: "H", minutes: "MIN", seconds: "SEG",
      },
      footer: { terms: "Términos del servicio", privacy: "Política de privacidad", network: "Estado de la red", version: "Versión {{version}}" },
    },
  },
  fr: {
    translation: {
      language: { select: "Choisir la langue" },
      nav: {
        home: "Accueil", markets: "Marchés", leaderboard: "Classement", portfolio: "Portefeuille",
        more: "Plus", about: "À propos", governance: "Gouvernance", utilities: "Utilitaires",
        main: "Navigation principale", open: "Ouvrir la navigation",
      },
      wallet: {
        connect: "Connecter le portefeuille", garthBalance: "Solde GARTH", quBalance: "Solde QU",
        govBalance: "Solde QTRYGOV", unavailable: "Indisponible", settings: "Paramètres du portefeuille",
        missingGarthBefore: "Vous ne voyez pas votre GARTH ? Allez dans", missingGarthAfter: "et utilisez Transfer Share Management Rights.",
      },
      theme: { switchToLight: "Passer au thème clair", switchToDark: "Passer au thème sombre" },
      status: {
        label: "Statut : {{status}}", open: "Ouvert", closed: "Fermé", resolved: "Résolu",
        archived: "Archivé", cancelled: "Annulé", canceled: "Annulé", pending: "En attente",
        win: "Gagnée", lose: "Perdue", matched: "Exécuté", partiallyMatched: "Partiellement exécuté", returned: "Restitué",
      },
      home: {
        eyebrow: "Marchés prédictifs natifs de Qubic", titleStart: "Prédire pour", titleAccent: "gagner",
        description: "Négociez des parts de résultat OUI et NON via des carnets d'ordres transparents, des portefeuilles indexés et un règlement on-chain propulsé par Qubic.",
        wholeShare: "Part entière", settlement: "Règlement", settlementValue: "On-chain",
        data: "Données", dataValue: "Indexées en direct", explore: "Explorer les marchés", about: "À propos",
        recent: "Marchés récents", all: "Tous les marchés", emptyTitle: "Aucun marché trouvé",
        emptyDescription: "Les marchés apparaîtront lorsque l'indexeur renverra des événements actifs.",
      },
      marketCard: { ended: "Terminé", tradedVolume: "Volume négocié", openOrdersVolume: "Volume des ordres ouverts", resultYes: "Résultat OUI", resultNo: "Résultat NON" },
      markets: {
        pageTitle: "Marchés", archivePageTitle: "Marchés archivés", eyebrow: "Marchés prédictifs natifs de Qubic",
        title: "Marchés", description: "Découvrez les résultats actifs, comparez la profondeur des marchés et consultez l'historique des règlements archivés.",
        refresh: "Actualiser les marchés", active: "Actifs", archive: "Archives ({{count}})", activeMarkets: "Marchés actifs",
        archivedMarkets: "Marchés archivés", tradedVolume: "Volume négocié", openOrders: "Ordres ouverts",
        connectTitle: "Connectez votre portefeuille pour parcourir les marchés", connectDescription: "Les données sont chargées via votre connexion Qubic configurée.",
        search: "Rechercher des marchés...", clearSearch: "Effacer la recherche", sort: "Trier : {{value}}", sortTraded: "Volume négocié",
        sortOpen: "Volume des ordres ouverts", sortNewest: "Plus récents", sortEnding: "Fin proche", sortCreated: "Date de création",
        sortArchived: "Date d'archivage", directionNewest: "Plus récents", directionOldest: "Plus anciens", showZero: "Afficher les marchés sans volume",
        all: "Tous", allMarkets: "Tous les marchés", allGroup: "Tous : {{group}}", failedArchive: "Échec du chargement des marchés archivés",
        noArchive: "Aucun marché archivé trouvé", noArchiveHint: "Modifiez la recherche, le tri ou le filtre de volume nul.",
        noMarkets: "Aucun marché trouvé", noMarketsHint: "Modifiez la recherche, la catégorie ou le tri.",
        event: "Événement", eventFallback: "Événement #{{id}}", winner: "Gagnant", volume: "Volume", createdTick: "Tick de création",
        finalizedTick: "Tick de finalisation", archivedTick: "Tick d'archivage", pending: "En attente", yes: "Oui", no: "Non",
        collapse: "Réduire {{label}}", expand: "Développer {{label}}",
        groups: { crypto: "Crypto", "qubic-ecosystem": "Écosystème Qubic", sports: "Sports", finance: "Finance", other: "Autres" },
        tags: { general: "Général", crypto: "Crypto", sport: "Sport", football: "Football", basketball: "Basket-ball", tennis: "Tennis", hockey: "Hockey", chess: "Échecs", stocks: "Actions", economy: "Économie", cinema: "Cinéma", science: "Science", politics: "Politique", weather: "Météo", gaming: "Jeux vidéo", celebrity: "Célébrités", medicine: "Médecine" },
      },
      eventDetails: {
        event: "Événement", eventFallback: "Événement #{{id}}", notFound: "Événement introuvable", invalidEvent: "Cet événement est absent ou son ID est invalide.", back: "Retour aux Marchés",
        pending: "En attente", result: "Résultat : {{option}}", priceToBeat: "Prix à battre", finalPrice: "Prix final", oracleOpeningPrice: "Prix d'ouverture de l'oracle", refreshOrderBook: "Actualiser le carnet d'ordres", orderBook: "Carnet d'ordres",
        noBuyOrders: "Aucun ordre d'achat", noSellOrders: "Aucun ordre de vente", tradeOption: "Négocier {{option}}", yes: "OUI", no: "NON",
        price: "Prix", shares: "Parts", total: "Total", bid: "Offre : {{value}}", spread: "Écart : {{value}}", ask: "Demande : {{value}}",
        option0: "Option 0", option1: "Option 1", loadingOrderBook: "Chargement du carnet d'ordres...", aiContext: "Contexte IA", moreDetails: "Plus de détails",
        open: "Ouverture", end: "Fin", disputer: "Contestataire : {{identity}} (Montant : {{amount}})", votes: "Votes des computors — Non : {{no}} / Oui : {{yes}}",
        dispute: "Contester le résultat", disputeHint: "Nécessite un dépôt. Déclenche un vote des computors pour renverser le résultat publié.", rules: "Règles",
        tradePanel: "Panneau de négociation", tradeDescription: "Choisissez le côté, le résultat, les parts et le prix.", buy: "Acheter", sell: "Vendre", cost: "Coût",
        signing: "Signature...", placeBuy: "Placer un ordre d'achat", placeSell: "Placer un ordre de vente",
        insufficientGarth: "GARTH insuffisant : {{needed}} requis, {{available}} disponible.", insufficientShares: "Parts insuffisantes : {{needed}} requises, {{available}} disponibles.",
        mintHint: "Mint : correspond si un ordre d'achat sur l'option opposée a un prix ≥ {{price}}", sellHint: "Négociation : correspond si un ordre d'achat sur la même option a un prix ≥ à votre prix de vente",
        available: "Disponible : {{value}} {{unit}}", availableUnavailable: "Disponible : indisponible", unavailable: "Indisponible", maxShares: "Max. {{value}} parts",
        probability: "Probabilité : {{value}} %", priceOutOf: "Prix (sur 100 000)", shareUnit: "parts", goBack: "Retour",
        eventEnded: "ÉVÉNEMENT TERMINÉ", timeLeft: "TEMPS RESTANT", ended: "TERMINÉ", months: "MOIS", days: "JOURS", hours: "H", minutes: "MIN", seconds: "SEC",
      },
      footer: { terms: "Conditions d'utilisation", privacy: "Politique de confidentialité", network: "État du réseau", version: "Version {{version}}" },
    },
  },
  pt: {
    translation: {
      language: { select: "Selecionar idioma" },
      nav: {
        home: "Início", markets: "Mercados", leaderboard: "Classificação", portfolio: "Portfólio",
        more: "Mais", about: "Sobre", governance: "Governança", utilities: "Utilitários",
        main: "Navegação principal", open: "Abrir navegação",
      },
      wallet: {
        connect: "Conectar carteira", garthBalance: "Saldo GARTH", quBalance: "Saldo QU",
        govBalance: "Saldo QTRYGOV", unavailable: "Indisponível", settings: "Configurações da carteira",
        missingGarthBefore: "Não vê seu GARTH? Vá para", missingGarthAfter: "e use Transfer Share Management Rights.",
      },
      theme: { switchToLight: "Mudar para o tema claro", switchToDark: "Mudar para o tema escuro" },
      status: {
        label: "Status: {{status}}", open: "Aberto", closed: "Fechado", resolved: "Resolvido",
        archived: "Arquivado", cancelled: "Cancelado", canceled: "Cancelado", pending: "Pendente",
        win: "Ganha", lose: "Perdida", matched: "Executada", partiallyMatched: "Parcialmente executada", returned: "Devolvida",
      },
      home: {
        eyebrow: "Mercados de previsão nativos da Qubic", titleStart: "Preveja para", titleAccent: "lucrar",
        description: "Negocie participações de resultados SIM e NÃO por meio de livros de ordens transparentes, portfólios indexados e liquidação on-chain com tecnologia Qubic.",
        wholeShare: "Participação completa", settlement: "Liquidação", settlementValue: "On-chain",
        data: "Dados", dataValue: "Indexação ao vivo", explore: "Explorar mercados", about: "Sobre",
        recent: "Mercados recentes", all: "Todos os mercados", emptyTitle: "Nenhum mercado encontrado",
        emptyDescription: "Os mercados aparecerão quando o indexador retornar eventos ativos.",
      },
      marketCard: { ended: "Encerrado", tradedVolume: "Volume negociado", openOrdersVolume: "Volume de ordens abertas", resultYes: "Resultado SIM", resultNo: "Resultado NÃO" },
      markets: {
        pageTitle: "Mercados", archivePageTitle: "Mercados arquivados", eyebrow: "Mercados de previsão nativos da Qubic",
        title: "Mercados", description: "Descubra resultados ativos, compare a profundidade do mercado e consulte o histórico de liquidações arquivadas.",
        refresh: "Atualizar mercados", active: "Ativos", archive: "Arquivo ({{count}})", activeMarkets: "Mercados ativos",
        archivedMarkets: "Mercados arquivados", tradedVolume: "Volume negociado", openOrders: "Ordens abertas",
        connectTitle: "Conecte a carteira para explorar mercados", connectDescription: "Os dados do mercado são carregados pela sua conexão Qubic configurada.",
        search: "Pesquisar mercados...", clearSearch: "Limpar pesquisa", sort: "Ordenar: {{value}}", sortTraded: "Volume negociado",
        sortOpen: "Volume de ordens abertas", sortNewest: "Mais recentes", sortEnding: "Encerrando em breve", sortCreated: "Data de criação",
        sortArchived: "Data de arquivamento", directionNewest: "Mais recentes", directionOldest: "Mais antigos", showZero: "Mostrar mercados sem volume",
        all: "Todos", allMarkets: "Todos os mercados", allGroup: "Todos: {{group}}", failedArchive: "Falha ao carregar mercados arquivados",
        noArchive: "Nenhum mercado arquivado encontrado", noArchiveHint: "Altere a pesquisa, a ordenação ou o filtro de volume zero.",
        noMarkets: "Nenhum mercado encontrado", noMarketsHint: "Altere a pesquisa, a categoria ou a ordenação.",
        event: "Evento", eventFallback: "Evento #{{id}}", winner: "Vencedor", volume: "Volume", createdTick: "Tick de criação",
        finalizedTick: "Tick de finalização", archivedTick: "Tick de arquivamento", pending: "Pendente", yes: "Sim", no: "Não",
        collapse: "Recolher {{label}}", expand: "Expandir {{label}}",
        groups: { crypto: "Cripto", "qubic-ecosystem": "Ecossistema Qubic", sports: "Esportes", finance: "Finanças", other: "Outros" },
        tags: { general: "Geral", crypto: "Cripto", sport: "Esporte", football: "Futebol", basketball: "Basquete", tennis: "Tênis", hockey: "Hóquei", chess: "Xadrez", stocks: "Ações", economy: "Economia", cinema: "Cinema", science: "Ciência", politics: "Política", weather: "Clima", gaming: "Jogos", celebrity: "Celebridades", medicine: "Medicina" },
      },
      eventDetails: {
        event: "Evento", eventFallback: "Evento #{{id}}", notFound: "Evento não encontrado", invalidEvent: "Este evento não existe ou o ID é inválido.", back: "Voltar aos Mercados",
        pending: "Pendente", result: "Resultado: {{option}}", priceToBeat: "Preço a superar", finalPrice: "Preço final", oracleOpeningPrice: "Preço de abertura do oráculo", refreshOrderBook: "Atualizar livro de ordens", orderBook: "Livro de ordens",
        noBuyOrders: "Sem ordens de compra", noSellOrders: "Sem ordens de venda", tradeOption: "Negociar {{option}}", yes: "SIM", no: "NÃO",
        price: "Preço", shares: "Participações", total: "Total", bid: "Compra: {{value}}", spread: "Spread: {{value}}", ask: "Venda: {{value}}",
        option0: "Opção 0", option1: "Opção 1", loadingOrderBook: "Carregando livro de ordens...", aiContext: "Contexto de IA", moreDetails: "Mais detalhes",
        open: "Abertura", end: "Fim", disputer: "Contestador: {{identity}} (Valor: {{amount}})", votes: "Votos dos computors — Não: {{no}} / Sim: {{yes}}",
        dispute: "Contestar resultado", disputeHint: "Requer depósito. Inicia uma votação dos computors para reverter o resultado publicado.", rules: "Regras",
        tradePanel: "Painel de negociação", tradeDescription: "Escolha lado, resultado, participações e preço.", buy: "Comprar", sell: "Vender", cost: "Custo",
        signing: "Assinando...", placeBuy: "Criar ordem de compra", placeSell: "Criar ordem de venda",
        insufficientGarth: "GARTH insuficiente: necessário {{needed}}, disponível {{available}}.", insufficientShares: "Participações insuficientes: necessário {{needed}}, disponível {{available}}.",
        mintHint: "Mint: combina se uma ordem de compra na opção oposta tiver preço ≥ {{price}}", sellHint: "Negociação: combina se uma ordem de compra na mesma opção tiver preço ≥ ao seu preço de venda",
        available: "Disponível: {{value}} {{unit}}", availableUnavailable: "Disponível: indisponível", unavailable: "Indisponível", maxShares: "Máx. {{value}} participações",
        probability: "Probabilidade: {{value}}%", priceOutOf: "Preço (de 100.000)", shareUnit: "participações", goBack: "Voltar",
        eventEnded: "EVENTO ENCERRADO", timeLeft: "TEMPO RESTANTE", ended: "ENCERRADO", months: "MESES", days: "DIAS", hours: "H", minutes: "MIN", seconds: "SEG",
      },
      footer: { terms: "Termos de serviço", privacy: "Política de privacidade", network: "Status da rede", version: "Versão {{version}}" },
    },
  },
  ru: {
    translation: {
      language: { select: "Выбрать язык" },
      nav: {
        home: "Главная", markets: "Маркеты", leaderboard: "Лидерборд", portfolio: "Портфолио",
        more: "Ещё", about: "О проекте", governance: "Управление", utilities: "Инструменты",
        main: "Основная навигация", open: "Открыть навигацию",
      },
      wallet: {
        connect: "Подключить кошелёк", garthBalance: "Баланс GARTH", quBalance: "Баланс QU",
        govBalance: "Баланс QTRYGOV", unavailable: "Недоступно", settings: "Настройки кошелька",
        missingGarthBefore: "Не видите свой GARTH? Перейдите в", missingGarthAfter: "и используйте Transfer Share Management Rights.",
      },
      theme: { switchToLight: "Включить светлую тему", switchToDark: "Включить тёмную тему" },
      status: {
        label: "Статус: {{status}}", open: "Открыт", closed: "Закрыт", resolved: "Результат опубликован",
        archived: "В архиве", cancelled: "Отменён", canceled: "Отменён", pending: "Ожидается",
        win: "Выигрыш", lose: "Проигрыш", matched: "Исполнен", partiallyMatched: "Частично исполнен", returned: "Возвращён",
      },
      home: {
        eyebrow: "Рынки прогнозов на базе Qubic", titleStart: "Прогнозируй, чтобы", titleAccent: "зарабатывать",
        description: "Торгуйте долями исходов ДА и НЕТ через прозрачные книги ордеров, индексируемые портфолио и on-chain расчёты на базе Qubic.",
        wholeShare: "Полная доля", settlement: "Расчёты", settlementValue: "On-chain",
        data: "Данные", dataValue: "Индексация в реальном времени", explore: "Открыть маркеты", about: "О проекте",
        recent: "Новые маркеты", all: "Все маркеты", emptyTitle: "Маркеты не найдены",
        emptyDescription: "Маркеты появятся после получения активных событий от индексера.",
      },
      marketCard: { ended: "Завершён", tradedVolume: "Объём торгов", openOrdersVolume: "Объём открытых ордеров", resultYes: "Результат ДА", resultNo: "Результат НЕТ" },
      markets: {
        pageTitle: "Маркеты", archivePageTitle: "Архивные маркеты", eyebrow: "Рынки прогнозов на базе Qubic",
        title: "Маркеты", description: "Изучайте активные исходы, сравнивайте глубину рынка и просматривайте историю расчётов в архиве.",
        refresh: "Обновить маркеты", active: "Активные", archive: "Архив ({{count}})", activeMarkets: "Активные маркеты",
        archivedMarkets: "Архивные маркеты", tradedVolume: "Объём торгов", openOrders: "Открытые ордера",
        connectTitle: "Подключите кошелёк для просмотра маркетов", connectDescription: "Данные маркетов загружаются через настроенное подключение к Qubic.",
        search: "Поиск маркетов...", clearSearch: "Очистить поиск", sort: "Сортировка: {{value}}", sortTraded: "По объёму торгов",
        sortOpen: "По объёму открытых ордеров", sortNewest: "Сначала новые", sortEnding: "Скоро завершатся", sortCreated: "По дате создания",
        sortArchived: "По дате архивации", directionNewest: "Сначала новые", directionOldest: "Сначала старые", showZero: "Показывать маркеты с нулевым объёмом",
        all: "Все", allMarkets: "Все маркеты", allGroup: "Все: {{group}}", failedArchive: "Не удалось загрузить архивные маркеты",
        noArchive: "Архивные маркеты не найдены", noArchiveHint: "Измените поиск, сортировку или фильтр нулевого объёма.",
        noMarkets: "Маркеты не найдены", noMarketsHint: "Измените поиск, категорию или сортировку.",
        event: "Событие", eventFallback: "Событие #{{id}}", winner: "Победитель", volume: "Объём", createdTick: "Тик создания",
        finalizedTick: "Тик финализации", archivedTick: "Тик архивации", pending: "Ожидается", yes: "Да", no: "Нет",
        collapse: "Свернуть {{label}}", expand: "Развернуть {{label}}",
        groups: { crypto: "Криптовалюты", "qubic-ecosystem": "Экосистема Qubic", sports: "Спорт", finance: "Финансы", other: "Другое" },
        tags: { general: "Общее", crypto: "Криптовалюты", sport: "Спорт", football: "Футбол", basketball: "Баскетбол", tennis: "Теннис", hockey: "Хоккей", chess: "Шахматы", stocks: "Акции", economy: "Экономика", cinema: "Кино", science: "Наука", politics: "Политика", weather: "Погода", gaming: "Игры", celebrity: "Знаменитости", medicine: "Медицина" },
      },
      eventDetails: {
        event: "Событие", eventFallback: "Событие #{{id}}", notFound: "Событие не найдено", invalidEvent: "Событие отсутствует или указан неверный ID.", back: "Вернуться к маркетам",
        pending: "Ожидается", result: "Результат: {{option}}", priceToBeat: "Цена для сравнения", finalPrice: "Цена закрытия", oracleOpeningPrice: "Цена открытия Oracle", refreshOrderBook: "Обновить книгу ордеров", orderBook: "Книга ордеров",
        noBuyOrders: "Нет ордеров на покупку", noSellOrders: "Нет ордеров на продажу", tradeOption: "Торговля {{option}}", yes: "ДА", no: "НЕТ",
        price: "Цена", shares: "Доли", total: "Всего", bid: "Бид: {{value}}", spread: "Спред: {{value}}", ask: "Аск: {{value}}",
        option0: "Опция 0", option1: "Опция 1", loadingOrderBook: "Загрузка книги ордеров...", aiContext: "Контекст ИИ", moreDetails: "Подробнее",
        open: "Открытие", end: "Завершение", disputer: "Оспоривший: {{identity}} (Сумма: {{amount}})", votes: "Голоса computors — Нет: {{no}} / Да: {{yes}}",
        dispute: "Оспорить результат", disputeHint: "Требуется депозит. Запускает голосование computors для пересмотра опубликованного результата.", rules: "Правила",
        tradePanel: "Торговая панель", tradeDescription: "Выберите сторону, исход, количество долей и цену.", buy: "Купить", sell: "Продать", cost: "Стоимость",
        signing: "Подписание...", placeBuy: "Разместить ордер на покупку", placeSell: "Разместить ордер на продажу",
        insufficientGarth: "Недостаточно GARTH: требуется {{needed}}, доступно {{available}}.", insufficientShares: "Недостаточно долей: требуется {{needed}}, доступно {{available}}.",
        mintHint: "Mint: исполнится, если цена ордера на покупку противоположного исхода ≥ {{price}}", sellHint: "Сделка: исполнится, если цена ордера на покупку того же исхода ≥ вашей цены продажи",
        available: "Доступно: {{value}} {{unit}}", availableUnavailable: "Доступно: неизвестно", unavailable: "Недоступно", maxShares: "Макс. {{value}} долей",
        probability: "Вероятность: {{value}}%", priceOutOf: "Цена (из 100 000)", shareUnit: "долей", goBack: "Назад",
        eventEnded: "СОБЫТИЕ ЗАВЕРШЕНО", timeLeft: "ОСТАЛОСЬ ВРЕМЕНИ", ended: "ЗАВЕРШЕНО", months: "МЕС", days: "ДНИ", hours: "Ч", minutes: "МИН", seconds: "СЕК",
      },
      footer: { terms: "Условия использования", privacy: "Политика конфиденциальности", network: "Состояние сети", version: "Версия {{version}}" },
    },
  },
  zh: {
    translation: {
      language: { select: "选择语言" },
      nav: {
        home: "首页", markets: "市场", leaderboard: "排行榜", portfolio: "投资组合",
        more: "更多", about: "关于", governance: "治理", utilities: "工具",
        main: "主导航", open: "打开导航",
      },
      wallet: {
        connect: "连接钱包", garthBalance: "GARTH 余额", quBalance: "QU 余额",
        govBalance: "QTRYGOV 余额", unavailable: "不可用", settings: "钱包设置",
        missingGarthBefore: "看不到您的 GARTH？请前往", missingGarthAfter: "并使用 Transfer Share Management Rights。",
      },
      theme: { switchToLight: "切换到浅色模式", switchToDark: "切换到深色模式" },
      status: {
        label: "状态：{{status}}", open: "开放", closed: "已关闭", resolved: "已结算",
        archived: "已归档", cancelled: "已取消", canceled: "已取消", pending: "待定",
        win: "获胜", lose: "失败", matched: "已成交", partiallyMatched: "部分成交", returned: "已退回",
      },
      home: {
        eyebrow: "Qubic 原生预测市场", titleStart: "预测并", titleAccent: "获利",
        description: "通过透明订单簿交易“是”和“否”的结果份额，使用实时索引投资组合，并由 Qubic 提供链上结算。",
        wholeShare: "完整份额", settlement: "结算", settlementValue: "链上",
        data: "数据", dataValue: "实时索引", explore: "探索市场", about: "关于",
        recent: "最新市场", all: "所有市场", emptyTitle: "未找到市场",
        emptyDescription: "索引器返回活跃事件后，市场将显示在这里。",
      },
      marketCard: { ended: "已结束", tradedVolume: "成交量", openOrdersVolume: "未结订单量", resultYes: "结果 是", resultNo: "结果 否" },
      markets: {
        pageTitle: "市场", archivePageTitle: "已归档市场", eyebrow: "Qubic 原生预测市场",
        title: "市场", description: "发现活跃结果、比较市场深度并查看已归档的结算历史。",
        refresh: "刷新市场", active: "活跃", archive: "归档 ({{count}})", activeMarkets: "活跃市场",
        archivedMarkets: "已归档市场", tradedVolume: "成交量", openOrders: "未结订单",
        connectTitle: "连接钱包以浏览市场", connectDescription: "市场数据通过您配置的 Qubic 连接加载。",
        search: "搜索市场...", clearSearch: "清除搜索", sort: "排序：{{value}}", sortTraded: "成交量",
        sortOpen: "未结订单量", sortNewest: "最新", sortEnding: "即将结束", sortCreated: "创建日期",
        sortArchived: "归档日期", directionNewest: "最新", directionOldest: "最早", showZero: "显示零成交量市场",
        all: "全部", allMarkets: "所有市场", allGroup: "所有{{group}}", failedArchive: "无法加载已归档市场",
        noArchive: "未找到已归档市场", noArchiveHint: "请更改搜索、排序或零成交量筛选条件。",
        noMarkets: "未找到市场", noMarketsHint: "请更改搜索、类别或排序条件。",
        event: "事件", eventFallback: "事件 #{{id}}", winner: "获胜方", volume: "成交量", createdTick: "创建 Tick",
        finalizedTick: "最终确认 Tick", archivedTick: "归档 Tick", pending: "待定", yes: "是", no: "否",
        collapse: "收起{{label}}", expand: "展开{{label}}",
        groups: { crypto: "加密货币", "qubic-ecosystem": "Qubic 生态", sports: "体育", finance: "金融", other: "其他" },
        tags: { general: "综合", crypto: "加密货币", sport: "体育", football: "足球", basketball: "篮球", tennis: "网球", hockey: "冰球", chess: "国际象棋", stocks: "股票", economy: "经济", cinema: "电影", science: "科学", politics: "政治", weather: "天气", gaming: "游戏", celebrity: "名人", medicine: "医学" },
      },
      eventDetails: {
        event: "事件", eventFallback: "事件 #{{id}}", notFound: "未找到事件", invalidEvent: "该事件不存在或事件 ID 无效。", back: "返回市场",
        pending: "待定", result: "结果：{{option}}", priceToBeat: "目标价格", finalPrice: "最终价格", oracleOpeningPrice: "预言机开盘价", refreshOrderBook: "刷新订单簿", orderBook: "订单簿",
        noBuyOrders: "暂无买单", noSellOrders: "暂无卖单", tradeOption: "交易 {{option}}", yes: "是", no: "否",
        price: "价格", shares: "份额", total: "总额", bid: "买价：{{value}}", spread: "价差：{{value}}", ask: "卖价：{{value}}",
        option0: "选项 0", option1: "选项 1", loadingOrderBook: "正在加载订单簿...", aiContext: "AI 背景", moreDetails: "更多详情",
        open: "开放", end: "结束", disputer: "争议发起人：{{identity}}（金额：{{amount}}）", votes: "Computor 投票 — 否：{{no}} / 是：{{yes}}",
        dispute: "质疑结果", disputeHint: "需要保证金。将触发 computor 投票以推翻已发布的结果。", rules: "规则",
        tradePanel: "交易面板", tradeDescription: "选择方向、结果、份额和价格。", buy: "买入", sell: "卖出", cost: "成本",
        signing: "签名中...", placeBuy: "下买单", placeSell: "下卖单",
        insufficientGarth: "GARTH 不足：需要 {{needed}}，可用 {{available}}。", insufficientShares: "份额不足：需要 {{needed}}，可用 {{available}}。",
        mintHint: "铸造：当相反选项的买单价格 ≥ {{price}} 时成交", sellHint: "交易：当同一选项的买单价格 ≥ 您的卖价时成交",
        available: "可用：{{value}} {{unit}}", availableUnavailable: "可用：未知", unavailable: "不可用", maxShares: "最多 {{value}} 份额",
        probability: "概率：{{value}}%", priceOutOf: "价格（满额 100,000）", shareUnit: "份额", goBack: "返回",
        eventEnded: "事件已结束", timeLeft: "剩余时间", ended: "已结束", months: "月", days: "天", hours: "时", minutes: "分", seconds: "秒",
      },
      footer: { terms: "服务条款", privacy: "隐私政策", network: "网络状态", version: "版本 {{version}}" },
    },
  },
};

Object.assign(resources.en.translation.eventDetails, { odds: "Odds {{value}}" });
Object.assign(resources.es.translation.eventDetails, { odds: "Cuota {{value}}" });
Object.assign(resources.fr.translation.eventDetails, { odds: "Cote {{value}}" });
Object.assign(resources.pt.translation.eventDetails, { odds: "Cotação {{value}}" });
Object.assign(resources.ru.translation.eventDetails, { odds: "Коэффициент {{value}}" });
Object.assign(resources.zh.translation.eventDetails, { odds: "赔率 {{value}}" });

const leaderboardTranslations = {
  en: {
    pageTitle: "Leaderboard", eyebrow: "Accounts", title: "Leaderboard", description: "Ranked by realized PnL or traded volume",
    accounts: "Accounts", topRealizedPnl: "Top realized PnL", topTradedVolume: "Top traded volume",
    rank: "#", address: "Address", realizedPnl: "Realized PnL", tradedVolume: "Traded volume", trades: "Trades", transfers: "Transfers", lastSeenTick: "Last seen tick",
    search: "Search address", typedAddress: "Open pasted address", volumePnl: "Volume {{volume}} | PnL {{pnl}}",
    openPortfolio: "Open portfolio", refresh: "Refresh leaderboard", refreshing: "Refreshing", bestPnl: "Best PnL", topVolume: "Top volume",
    openExplorer: "Open address in explorer", noAccounts: "No indexed accounts found.", failedLoad: "Failed to load leaderboard",
  },
  es: {
    pageTitle: "Clasificación", eyebrow: "Cuentas", title: "Clasificación", description: "Clasificada por PnL realizado o volumen operado",
    accounts: "Cuentas", topRealizedPnl: "Mejor PnL realizado", topTradedVolume: "Mayor volumen operado",
    rank: "#", address: "Dirección", realizedPnl: "PnL realizado", tradedVolume: "Volumen operado", trades: "Operaciones", transfers: "Transferencias", lastSeenTick: "Último tick visto",
    search: "Buscar dirección", typedAddress: "Abrir dirección pegada", volumePnl: "Volumen {{volume}} | PnL {{pnl}}",
    openPortfolio: "Abrir portafolio", refresh: "Actualizar clasificación", refreshing: "Actualizando", bestPnl: "Mejor PnL", topVolume: "Mayor volumen",
    openExplorer: "Abrir dirección en el explorador", noAccounts: "No se encontraron cuentas indexadas.", failedLoad: "No se pudo cargar la clasificación",
  },
  fr: {
    pageTitle: "Classement", eyebrow: "Comptes", title: "Classement", description: "Classé par PnL réalisé ou volume échangé",
    accounts: "Comptes", topRealizedPnl: "Meilleur PnL réalisé", topTradedVolume: "Plus grand volume échangé",
    rank: "#", address: "Adresse", realizedPnl: "PnL réalisé", tradedVolume: "Volume échangé", trades: "Transactions", transfers: "Transferts", lastSeenTick: "Dernier tick vu",
    search: "Rechercher une adresse", typedAddress: "Ouvrir l'adresse collée", volumePnl: "Volume {{volume}} | PnL {{pnl}}",
    openPortfolio: "Ouvrir le portefeuille", refresh: "Actualiser le classement", refreshing: "Actualisation", bestPnl: "Meilleur PnL", topVolume: "Meilleur volume",
    openExplorer: "Ouvrir l'adresse dans l'explorateur", noAccounts: "Aucun compte indexé trouvé.", failedLoad: "Impossible de charger le classement",
  },
  pt: {
    pageTitle: "Ranking", eyebrow: "Contas", title: "Ranking", description: "Classificado por PnL realizado ou volume negociado",
    accounts: "Contas", topRealizedPnl: "Maior PnL realizado", topTradedVolume: "Maior volume negociado",
    rank: "#", address: "Endereço", realizedPnl: "PnL realizado", tradedVolume: "Volume negociado", trades: "Negociações", transfers: "Transferências", lastSeenTick: "Último tick visto",
    search: "Buscar endereço", typedAddress: "Abrir endereço colado", volumePnl: "Volume {{volume}} | PnL {{pnl}}",
    openPortfolio: "Abrir portfólio", refresh: "Atualizar ranking", refreshing: "Atualizando", bestPnl: "Melhor PnL", topVolume: "Maior volume",
    openExplorer: "Abrir endereço no explorador", noAccounts: "Nenhuma conta indexada encontrada.", failedLoad: "Não foi possível carregar o ranking",
  },
  ru: {
    pageTitle: "Лидерборд", eyebrow: "Аккаунты", title: "Лидерборд", description: "Рейтинг по реализованному PnL или торговому объему",
    accounts: "Аккаунты", topRealizedPnl: "Лучший реализованный PnL", topTradedVolume: "Наибольший торговый объем",
    rank: "#", address: "Адрес", realizedPnl: "Реализованный PnL", tradedVolume: "Торговый объем", trades: "Сделки", transfers: "Трансферы", lastSeenTick: "Последний тик",
    search: "Поиск адреса", typedAddress: "Открыть вставленный адрес", volumePnl: "Объем {{volume}} | PnL {{pnl}}",
    openPortfolio: "Открыть портфель", refresh: "Обновить лидерборд", refreshing: "Обновление", bestPnl: "Лучший PnL", topVolume: "Наибольший объем",
    openExplorer: "Открыть адрес в эксплорере", noAccounts: "Индексированные аккаунты не найдены.", failedLoad: "Не удалось загрузить лидерборд",
  },
  zh: {
    pageTitle: "排行榜", eyebrow: "账户", title: "排行榜", description: "按已实现盈亏或交易量排序",
    accounts: "账户", topRealizedPnl: "最高已实现盈亏", topTradedVolume: "最高交易量",
    rank: "#", address: "地址", realizedPnl: "已实现盈亏", tradedVolume: "交易量", trades: "交易", transfers: "转账", lastSeenTick: "最后出现的 Tick",
    search: "搜索地址", typedAddress: "打开粘贴的地址", volumePnl: "交易量 {{volume}} | 盈亏 {{pnl}}",
    openPortfolio: "打开投资组合", refresh: "刷新排行榜", refreshing: "正在刷新", bestPnl: "最佳盈亏", topVolume: "最高交易量",
    openExplorer: "在浏览器中打开地址", noAccounts: "未找到已索引账户。", failedLoad: "无法加载排行榜",
  },
};

Object.entries(leaderboardTranslations).forEach(([language, translations]) => {
  resources[language].translation.leaderboard = translations;
});

Object.assign(resources.en.translation.leaderboard, { searchName: "Search address or name" });
Object.assign(resources.es.translation.leaderboard, { searchName: "Buscar direccion o nombre" });
Object.assign(resources.fr.translation.leaderboard, { searchName: "Rechercher une adresse ou un nom" });
Object.assign(resources.pt.translation.leaderboard, { searchName: "Buscar endereco ou nome" });
Object.assign(resources.ru.translation.leaderboard, { searchName: "Поиск адреса или имени" });
Object.assign(resources.zh.translation.leaderboard, { searchName: "搜索地址或名称" });
Object.assign(resources.en.translation.leaderboard, { allTime: "All time", weekly: "Weekly" });
Object.assign(resources.es.translation.leaderboard, { allTime: "Todo el periodo", weekly: "Semanal" });
Object.assign(resources.fr.translation.leaderboard, { allTime: "Tout l'historique", weekly: "Hebdomadaire" });
Object.assign(resources.pt.translation.leaderboard, { allTime: "Todo o periodo", weekly: "Semanal" });
Object.assign(resources.ru.translation.leaderboard, { allTime: "За всё время", weekly: "За неделю" });
Object.assign(resources.zh.translation.leaderboard, { allTime: "全部时间", weekly: "每周" });
Object.assign(resources.en.translation.leaderboard, { thisWeek: "This week", selectEpoch: "Select epoch", epochValue: "Epoch {{epoch}}" });
Object.assign(resources.es.translation.leaderboard, { thisWeek: "Esta semana", selectEpoch: "Elegir época", epochValue: "Época {{epoch}}" });
Object.assign(resources.fr.translation.leaderboard, { thisWeek: "Cette semaine", selectEpoch: "Choisir l'époque", epochValue: "Époque {{epoch}}" });
Object.assign(resources.pt.translation.leaderboard, { thisWeek: "Esta semana", selectEpoch: "Escolher época", epochValue: "Época {{epoch}}" });
Object.assign(resources.ru.translation.leaderboard, { thisWeek: "Эта неделя", selectEpoch: "Выбрать эпоху", epochValue: "Эпоха {{epoch}}" });
Object.assign(resources.zh.translation.leaderboard, { thisWeek: "本周", selectEpoch: "选择纪元", epochValue: "纪元 {{epoch}}" });
Object.assign(resources.en.translation.leaderboard, { epoch: "Epoch", select: "Select" });
Object.assign(resources.es.translation.leaderboard, { epoch: "Época", select: "Elegir" });
Object.assign(resources.fr.translation.leaderboard, { epoch: "Époque", select: "Choisir" });
Object.assign(resources.pt.translation.leaderboard, { epoch: "Época", select: "Escolher" });
Object.assign(resources.ru.translation.leaderboard, { epoch: "Эпоха", select: "Выбрать" });
Object.assign(resources.zh.translation.leaderboard, { epoch: "纪元", select: "选择" });

const portfolioTranslations = {
  en: {
    pageTitle: "Portfolio", connectedWallet: "Connected wallet", account: "Account", myPortfolio: "My Portfolio", portfolio: "Portfolio",
    refresh: "Refresh portfolio", connectToOpen: "Connect wallet to open your portfolio", connectHint: "Connect your wallet to open your portfolio, or search an identity from the leaderboard.", invalidIdentity: "Invalid identity format.",
    utilitiesTitle: "Transfers, reward claiming, and wallet tools", utilitiesDescription: "Utilities contains the actions connected to this portfolio.", goToUtilities: "Go to Utilities",
    pnl: "PnL", tradedVolume: "Traded volume", openBidVolume: "Open bid volume", openAskVolume: "Open ask volume", trades: "Trades", transfers: "Transfers", firstSeenTick: "First seen tick", lastSeenTick: "Last seen tick",
    indexed: "Indexed: {{tick}}", live: "Live: {{tick}}", lag: "Lag: {{value}}", lagHint: "Txs after {{tick}} will appear after indexing catches up.", notIndexed: "This identity is not indexed yet.",
    positions: "Positions", orders: "Orders", active: "Active ({{count}})", closed: "Closed ({{count}})", refreshing: "Refreshing",
    event: "Event", status: "Status", option: "Option", side: "Side", amount: "Amount", price: "Price", avgPrice: "Avg price", possibleProfit: "Possible profit", netPayout: "Net payout", token: "Token", source: "Source", destination: "Destination", hash: "Hash", tick: "Tick", time: "Time",
    yes: "Yes", no: "No", optionFallback: "Option {{option}}", bid: "Bid", ask: "Ask", estimated: "est.", pending: "Pending",
    noPositions: "No {{state}} positions found.", noOrders: "No {{state}} orders found.", noTransfers: "No transfers found.",
    copyAddress: "Copy address", copied: "Copied", openExplorer: "Open address in explorer", cancel: "Cancel", cancelOrder: "Cancel order", connectToCancel: "Connect wallet to cancel", claim: "Claim", claimReward: "Claim reward", connectToClaim: "Connect wallet to claim",
    ownPosition: "Connect the wallet that owns this position.", ownOrder: "Connect the wallet that owns this order.", walletKeyMissing: "Wallet public key not found.", walletNotReady: "Wallet or network connection is not ready.",
    claimDeposit: "Claim requires {{amount}} QU deposit.", invalidEvent: "Invalid event ID.", currentTickFailed: "Failed to get current tick from network.", contractInfoFailed: "Failed to get contract info.", signClaim: "Sign claim transaction in wallet.", signCancel: "Sign cancellation transaction in wallet.", claimFailed: "Claim failed: {{error}}", cancelFailed: "Failed to cancel order: {{error}}", noOpenAmount: "This order has no open amount to cancel.",
    claimTrack: "Claim reward for {{event}}", eventFallback: "event {{id}}", cancelTrack: "Cancel {{side}} {{amount}} {{option}} @ {{price}}",
  },
  es: {
    pageTitle: "Portafolio", connectedWallet: "Billetera conectada", account: "Cuenta", myPortfolio: "Mi portafolio", portfolio: "Portafolio",
    refresh: "Actualizar portafolio", connectToOpen: "Conecta la billetera para abrir tu portafolio", connectHint: "Conecta tu billetera para abrir tu portafolio o busca una identidad en la clasificación.", invalidIdentity: "Formato de identidad no válido.",
    utilitiesTitle: "Transferencias, reclamación de recompensas y herramientas de billetera", utilitiesDescription: "Utilidades contiene las acciones conectadas a este portafolio.", goToUtilities: "Ir a Utilidades",
    pnl: "PnL", tradedVolume: "Volumen operado", openBidVolume: "Volumen de compra abierto", openAskVolume: "Volumen de venta abierto", trades: "Operaciones", transfers: "Transferencias", firstSeenTick: "Primer tick visto", lastSeenTick: "Último tick visto",
    indexed: "Indexado: {{tick}}", live: "En vivo: {{tick}}", lag: "Retraso: {{value}}", lagHint: "Las transacciones posteriores a {{tick}} aparecerán cuando el indexador se ponga al día.", notIndexed: "Esta identidad aún no está indexada.",
    positions: "Posiciones", orders: "Órdenes", active: "Activas ({{count}})", closed: "Cerradas ({{count}})", refreshing: "Actualizando",
    event: "Evento", status: "Estado", option: "Opción", side: "Lado", amount: "Cantidad", price: "Precio", avgPrice: "Precio medio", possibleProfit: "Beneficio posible", netPayout: "Pago neto", token: "Token", source: "Origen", destination: "Destino", hash: "Hash", tick: "Tick", time: "Hora",
    yes: "Sí", no: "No", optionFallback: "Opción {{option}}", bid: "Compra", ask: "Venta", estimated: "est.", pending: "Pendiente",
    noPositions: "No se encontraron posiciones {{state}}.", noOrders: "No se encontraron órdenes {{state}}.", noTransfers: "No se encontraron transferencias.",
    copyAddress: "Copiar dirección", copied: "Copiado", openExplorer: "Abrir dirección en el explorador", cancel: "Cancelar", cancelOrder: "Cancelar orden", connectToCancel: "Conecta la billetera para cancelar", claim: "Reclamar", claimReward: "Reclamar recompensa", connectToClaim: "Conecta la billetera para reclamar",
    ownPosition: "Conecta la billetera propietaria de esta posición.", ownOrder: "Conecta la billetera propietaria de esta orden.", walletKeyMissing: "No se encontró la clave pública de la billetera.", walletNotReady: "La billetera o la conexión de red no están listas.",
    claimDeposit: "Reclamar requiere un depósito de {{amount}} QU.", invalidEvent: "ID de evento no válido.", currentTickFailed: "No se pudo obtener el tick actual de la red.", contractInfoFailed: "No se pudo obtener la información del contrato.", signClaim: "Firma la transacción de reclamación en la billetera.", signCancel: "Firma la transacción de cancelación en la billetera.", claimFailed: "Error al reclamar: {{error}}", cancelFailed: "Error al cancelar la orden: {{error}}", noOpenAmount: "Esta orden no tiene cantidad abierta para cancelar.",
    claimTrack: "Reclamar recompensa de {{event}}", eventFallback: "evento {{id}}", cancelTrack: "Cancelar {{side}} {{amount}} {{option}} @ {{price}}",
  },
  fr: {
    pageTitle: "Portefeuille", connectedWallet: "Portefeuille connecté", account: "Compte", myPortfolio: "Mon portefeuille", portfolio: "Portefeuille",
    refresh: "Actualiser le portefeuille", connectToOpen: "Connectez un portefeuille pour ouvrir votre portefeuille", connectHint: "Connectez votre portefeuille pour l'ouvrir ou recherchez une identité dans le classement.", invalidIdentity: "Format d'identité invalide.",
    utilitiesTitle: "Transferts, réclamation de récompenses et outils de portefeuille", utilitiesDescription: "Utilitaires contient les actions liées à ce portefeuille.", goToUtilities: "Aller aux utilitaires",
    pnl: "PnL", tradedVolume: "Volume échangé", openBidVolume: "Volume d'achat ouvert", openAskVolume: "Volume de vente ouvert", trades: "Transactions", transfers: "Transferts", firstSeenTick: "Premier tick vu", lastSeenTick: "Dernier tick vu",
    indexed: "Indexé : {{tick}}", live: "En direct : {{tick}}", lag: "Retard : {{value}}", lagHint: "Les transactions après {{tick}} apparaîtront lorsque l'indexation sera à jour.", notIndexed: "Cette identité n'est pas encore indexée.",
    positions: "Positions", orders: "Ordres", active: "Actives ({{count}})", closed: "Fermées ({{count}})", refreshing: "Actualisation",
    event: "Événement", status: "Statut", option: "Option", side: "Sens", amount: "Quantité", price: "Prix", avgPrice: "Prix moyen", possibleProfit: "Profit possible", netPayout: "Paiement net", token: "Jeton", source: "Source", destination: "Destination", hash: "Hash", tick: "Tick", time: "Heure",
    yes: "Oui", no: "Non", optionFallback: "Option {{option}}", bid: "Achat", ask: "Vente", estimated: "est.", pending: "En attente",
    noPositions: "Aucune position {{state}} trouvée.", noOrders: "Aucun ordre {{state}} trouvé.", noTransfers: "Aucun transfert trouvé.",
    copyAddress: "Copier l'adresse", copied: "Copié", openExplorer: "Ouvrir l'adresse dans l'explorateur", cancel: "Annuler", cancelOrder: "Annuler l'ordre", connectToCancel: "Connectez le portefeuille pour annuler", claim: "Réclamer", claimReward: "Réclamer la récompense", connectToClaim: "Connectez le portefeuille pour réclamer",
    ownPosition: "Connectez le portefeuille qui possède cette position.", ownOrder: "Connectez le portefeuille qui possède cet ordre.", walletKeyMissing: "Clé publique du portefeuille introuvable.", walletNotReady: "Le portefeuille ou la connexion réseau n'est pas prêt.",
    claimDeposit: "La réclamation requiert un dépôt de {{amount}} QU.", invalidEvent: "ID d'événement invalide.", currentTickFailed: "Impossible d'obtenir le tick actuel du réseau.", contractInfoFailed: "Impossible d'obtenir les informations du contrat.", signClaim: "Signez la transaction de réclamation dans le portefeuille.", signCancel: "Signez la transaction d'annulation dans le portefeuille.", claimFailed: "Échec de la réclamation : {{error}}", cancelFailed: "Échec de l'annulation de l'ordre : {{error}}", noOpenAmount: "Cet ordre n'a aucun montant ouvert à annuler.",
    claimTrack: "Réclamer la récompense pour {{event}}", eventFallback: "événement {{id}}", cancelTrack: "Annuler {{side}} {{amount}} {{option}} @ {{price}}",
  },
  pt: {
    pageTitle: "Portfólio", connectedWallet: "Carteira conectada", account: "Conta", myPortfolio: "Meu portfólio", portfolio: "Portfólio",
    refresh: "Atualizar portfólio", connectToOpen: "Conecte a carteira para abrir seu portfólio", connectHint: "Conecte sua carteira para abrir seu portfólio ou pesquise uma identidade no ranking.", invalidIdentity: "Formato de identidade inválido.",
    utilitiesTitle: "Transferências, resgate de recompensas e ferramentas da carteira", utilitiesDescription: "Utilitários contém as ações conectadas a este portfólio.", goToUtilities: "Ir para Utilitários",
    pnl: "PnL", tradedVolume: "Volume negociado", openBidVolume: "Volume de compra aberto", openAskVolume: "Volume de venda aberto", trades: "Negociações", transfers: "Transferências", firstSeenTick: "Primeiro tick visto", lastSeenTick: "Último tick visto",
    indexed: "Indexado: {{tick}}", live: "Ao vivo: {{tick}}", lag: "Atraso: {{value}}", lagHint: "As transações após {{tick}} aparecerão quando a indexação alcançar.", notIndexed: "Esta identidade ainda não foi indexada.",
    positions: "Posições", orders: "Ordens", active: "Ativas ({{count}})", closed: "Fechadas ({{count}})", refreshing: "Atualizando",
    event: "Evento", status: "Status", option: "Opção", side: "Lado", amount: "Quantidade", price: "Preço", avgPrice: "Preço médio", possibleProfit: "Lucro possível", netPayout: "Pagamento líquido", token: "Token", source: "Origem", destination: "Destino", hash: "Hash", tick: "Tick", time: "Hora",
    yes: "Sim", no: "Não", optionFallback: "Opção {{option}}", bid: "Compra", ask: "Venda", estimated: "est.", pending: "Pendente",
    noPositions: "Nenhuma posição {{state}} encontrada.", noOrders: "Nenhuma ordem {{state}} encontrada.", noTransfers: "Nenhuma transferência encontrada.",
    copyAddress: "Copiar endereço", copied: "Copiado", openExplorer: "Abrir endereço no explorador", cancel: "Cancelar", cancelOrder: "Cancelar ordem", connectToCancel: "Conecte a carteira para cancelar", claim: "Resgatar", claimReward: "Resgatar recompensa", connectToClaim: "Conecte a carteira para resgatar",
    ownPosition: "Conecte a carteira que possui esta posição.", ownOrder: "Conecte a carteira que possui esta ordem.", walletKeyMissing: "Chave pública da carteira não encontrada.", walletNotReady: "A carteira ou a conexão de rede não está pronta.",
    claimDeposit: "O resgate requer depósito de {{amount}} QU.", invalidEvent: "ID de evento inválido.", currentTickFailed: "Não foi possível obter o tick atual da rede.", contractInfoFailed: "Não foi possível obter informações do contrato.", signClaim: "Assine a transação de resgate na carteira.", signCancel: "Assine a transação de cancelamento na carteira.", claimFailed: "Falha ao resgatar: {{error}}", cancelFailed: "Falha ao cancelar a ordem: {{error}}", noOpenAmount: "Esta ordem não tem quantidade aberta para cancelar.",
    claimTrack: "Resgatar recompensa de {{event}}", eventFallback: "evento {{id}}", cancelTrack: "Cancelar {{side}} {{amount}} {{option}} @ {{price}}",
  },
  ru: {
    pageTitle: "Портфолио", connectedWallet: "Подключенный кошелек", account: "Аккаунт", myPortfolio: "Мое портфолио", portfolio: "Портфолио",
    refresh: "Обновить портфолио", connectToOpen: "Подключите кошелек, чтобы открыть портфолио", connectHint: "Подключите кошелек, чтобы открыть портфолио, или найдите адрес в лидерборде.", invalidIdentity: "Неверный формат адреса.",
    utilitiesTitle: "Трансферы, получение наград и инструменты кошелька", utilitiesDescription: "В Utilities находятся действия, связанные с этим портфолио.", goToUtilities: "Перейти в Utilities",
    pnl: "PnL", tradedVolume: "Торговый объем", openBidVolume: "Открытый объем бидов", openAskVolume: "Открытый объем асков", trades: "Сделки", transfers: "Трансферы", firstSeenTick: "Первый тик", lastSeenTick: "Последний тик",
    indexed: "Проиндексировано: {{tick}}", live: "Лайв: {{tick}}", lag: "Отставание: {{value}}", lagHint: "Транзакции после {{tick}} появятся, когда индексатор догонит сеть.", notIndexed: "Этот адрес еще не проиндексирован.",
    positions: "Позиции", orders: "Ордера", active: "Активные ({{count}})", closed: "Закрытые ({{count}})", refreshing: "Обновление",
    event: "Событие", status: "Статус", option: "Исход", side: "Сторона", amount: "Количество", price: "Цена", avgPrice: "Средняя цена", possibleProfit: "Возможная прибыль", netPayout: "Чистая выплата", token: "Токен", source: "Отправитель", destination: "Получатель", hash: "Хэш", tick: "Тик", time: "Время",
    yes: "Да", no: "Нет", optionFallback: "Исход {{option}}", bid: "Бид", ask: "Аск", estimated: "расч.", pending: "Ожидается",
    noPositions: "{{state}} позиции не найдены.", noOrders: "{{state}} ордера не найдены.", noTransfers: "Трансферы не найдены.",
    copyAddress: "Копировать адрес", copied: "Скопировано", openExplorer: "Открыть адрес в эксплорере", cancel: "Отменить", cancelOrder: "Отменить ордер", connectToCancel: "Подключите кошелек для отмены", claim: "Получить", claimReward: "Получить награду", connectToClaim: "Подключите кошелек для получения",
    ownPosition: "Подключите кошелек, которому принадлежит эта позиция.", ownOrder: "Подключите кошелек, которому принадлежит этот ордер.", walletKeyMissing: "Публичный ключ кошелька не найден.", walletNotReady: "Кошелек или подключение к сети еще не готовы.",
    claimDeposit: "Для получения нужен депозит {{amount}} QU.", invalidEvent: "Некорректный ID события.", currentTickFailed: "Не удалось получить текущий тик сети.", contractInfoFailed: "Не удалось получить информацию о контракте.", signClaim: "Подпишите транзакцию получения в кошельке.", signCancel: "Подпишите транзакцию отмены в кошельке.", claimFailed: "Ошибка получения: {{error}}", cancelFailed: "Не удалось отменить ордер: {{error}}", noOpenAmount: "У этого ордера нет открытого объема для отмены.",
    claimTrack: "Получение награды за {{event}}", eventFallback: "событие {{id}}", cancelTrack: "Отмена {{side}} {{amount}} {{option}} @ {{price}}",
  },
  zh: {
    pageTitle: "投资组合", connectedWallet: "已连接钱包", account: "账户", myPortfolio: "我的投资组合", portfolio: "投资组合",
    refresh: "刷新投资组合", connectToOpen: "连接钱包以打开投资组合", connectHint: "连接钱包以打开投资组合，或从排行榜搜索地址。", invalidIdentity: "身份格式无效。",
    utilitiesTitle: "转账、奖励领取和钱包工具", utilitiesDescription: "实用工具包含与此投资组合相关的操作。", goToUtilities: "前往实用工具",
    pnl: "盈亏", tradedVolume: "交易量", openBidVolume: "开放买单量", openAskVolume: "开放卖单量", trades: "交易", transfers: "转账", firstSeenTick: "首次出现 Tick", lastSeenTick: "最后出现 Tick",
    indexed: "已索引：{{tick}}", live: "实时：{{tick}}", lag: "延迟：{{value}}", lagHint: "{{tick}} 之后的交易将在索引追上后显示。", notIndexed: "此身份尚未被索引。",
    positions: "仓位", orders: "订单", active: "活跃 ({{count}})", closed: "已关闭 ({{count}})", refreshing: "正在刷新",
    event: "事件", status: "状态", option: "选项", side: "方向", amount: "数量", price: "价格", avgPrice: "平均价格", possibleProfit: "可能利润", netPayout: "净支付", token: "代币", source: "来源", destination: "目标", hash: "哈希", tick: "Tick", time: "时间",
    yes: "是", no: "否", optionFallback: "选项 {{option}}", bid: "买单", ask: "卖单", estimated: "估算", pending: "待处理",
    noPositions: "未找到{{state}}仓位。", noOrders: "未找到{{state}}订单。", noTransfers: "未找到转账。",
    copyAddress: "复制地址", copied: "已复制", openExplorer: "在浏览器中打开地址", cancel: "取消", cancelOrder: "取消订单", connectToCancel: "连接钱包以取消", claim: "领取", claimReward: "领取奖励", connectToClaim: "连接钱包以领取",
    ownPosition: "请连接拥有此仓位的钱包。", ownOrder: "请连接拥有此订单的钱包。", walletKeyMissing: "未找到钱包公钥。", walletNotReady: "钱包或网络连接尚未准备好。",
    claimDeposit: "领取需要 {{amount}} QU 押金。", invalidEvent: "无效事件 ID。", currentTickFailed: "无法获取当前网络 Tick。", contractInfoFailed: "无法获取合约信息。", signClaim: "请在钱包中签署领取交易。", signCancel: "请在钱包中签署取消交易。", claimFailed: "领取失败：{{error}}", cancelFailed: "取消订单失败：{{error}}", noOpenAmount: "此订单没有可取消的开放数量。",
    claimTrack: "领取 {{event}} 的奖励", eventFallback: "事件 {{id}}", cancelTrack: "取消 {{side}} {{amount}} {{option}} @ {{price}}",
  },
};

Object.entries(portfolioTranslations).forEach(([language, translations]) => {
  resources[language].translation.portfolio = translations;
});

const portfolioStateLabels = {
  en: { activeState: "active", closedState: "closed" },
  es: { activeState: "activas", closedState: "cerradas" },
  fr: { activeState: "actives", closedState: "fermées" },
  pt: { activeState: "ativas", closedState: "fechadas" },
  ru: { activeState: "активные", closedState: "закрытые" },
  zh: { activeState: "活跃", closedState: "已关闭" },
};

Object.entries(portfolioStateLabels).forEach(([language, labels]) => {
  Object.assign(resources[language].translation.portfolio, labels);
});

const portfolioProfileTranslations = {
  en: {
    editProfile: "Edit profile", uploadPhoto: "Upload photo", removePhoto: "Remove photo", displayName: "Display name", displayNameHint: "2-32 visible characters. Emoji and punctuation are supported.",
    profilePaymentTo: "Authorization transfer to current Game Operator: {{address}}", profileFee: "Name update fee: {{amount}} QU", profileAuthorization: "Photo-only update: 0 QU authorization transfer.",
    saveProfile: "Save profile", savingProfile: "Saving...", signProfile: "Sign profile update transaction in wallet.", profileFeeLow: "Profile update requires {{amount}} QU.",
    profileNameInvalid: "Enter a valid display name between 2 and 32 characters.", profileNameChecking: "Checking name availability...", profileNameTaken: "This display name is already taken.", ownProfile: "Connect the wallet that owns this profile.", profileBroadcastFailed: "Profile transaction broadcast failed.",
    profileConfirmationTimeout: "The profile transaction was not confirmed in time. Try again after its tick is processed.", profileSaved: "Profile saved.", profileSaveFailed: "Failed to save profile: {{error}}",
  },
  es: {
    editProfile: "Editar perfil", uploadPhoto: "Subir foto", removePhoto: "Eliminar foto", displayName: "Nombre visible", displayNameHint: "2-32 caracteres visibles. Se permiten emoji y puntuacion.",
    profilePaymentTo: "Transferencia de autorizacion al Game Operator actual: {{address}}", profileFee: "Tarifa de cambio de nombre: {{amount}} QU", profileAuthorization: "Solo foto: transferencia de autorizacion de 0 QU.",
    saveProfile: "Guardar perfil", savingProfile: "Guardando...", signProfile: "Firma la transaccion de perfil en la billetera.", profileFeeLow: "La actualizacion del perfil requiere {{amount}} QU.",
    profileNameInvalid: "Introduce un nombre visible valido de 2 a 32 caracteres.", profileNameChecking: "Comprobando disponibilidad del nombre...", profileNameTaken: "Este nombre visible ya esta en uso.", ownProfile: "Conecta la billetera propietaria de este perfil.", profileBroadcastFailed: "No se pudo enviar la transaccion del perfil.",
    profileConfirmationTimeout: "La transaccion del perfil no se confirmo a tiempo. Intentalo despues de procesar su tick.", profileSaved: "Perfil guardado.", profileSaveFailed: "No se pudo guardar el perfil: {{error}}",
  },
  fr: {
    editProfile: "Modifier le profil", uploadPhoto: "Importer une photo", removePhoto: "Supprimer la photo", displayName: "Nom affiche", displayNameHint: "2 a 32 caracteres visibles. Les emoji et la ponctuation sont acceptes.",
    profilePaymentTo: "Transfert d'autorisation vers le Game Operator actuel : {{address}}", profileFee: "Frais de modification du nom : {{amount}} QU", profileAuthorization: "Photo seule : transfert d'autorisation de 0 QU.",
    saveProfile: "Enregistrer le profil", savingProfile: "Enregistrement...", signProfile: "Signez la transaction de profil dans le portefeuille.", profileFeeLow: "La mise a jour du profil requiert {{amount}} QU.",
    profileNameInvalid: "Saisissez un nom affiche valide de 2 a 32 caracteres.", profileNameChecking: "Verification de la disponibilite du nom...", profileNameTaken: "Ce nom affiche est deja utilise.", ownProfile: "Connectez le portefeuille proprietaire de ce profil.", profileBroadcastFailed: "Echec de l'envoi de la transaction de profil.",
    profileConfirmationTimeout: "La transaction de profil n'a pas ete confirmee a temps. Reessayez apres le traitement de son tick.", profileSaved: "Profil enregistre.", profileSaveFailed: "Echec de l'enregistrement du profil : {{error}}",
  },
  pt: {
    editProfile: "Editar perfil", uploadPhoto: "Enviar foto", removePhoto: "Remover foto", displayName: "Nome exibido", displayNameHint: "2-32 caracteres visiveis. Emoji e pontuacao sao aceitos.",
    profilePaymentTo: "Transferencia de autorizacao para o Game Operator atual: {{address}}", profileFee: "Taxa de mudanca de nome: {{amount}} QU", profileAuthorization: "Somente foto: transferencia de autorizacao de 0 QU.",
    saveProfile: "Salvar perfil", savingProfile: "Salvando...", signProfile: "Assine a transacao de perfil na carteira.", profileFeeLow: "A atualizacao do perfil requer {{amount}} QU.",
    profileNameInvalid: "Digite um nome exibido valido entre 2 e 32 caracteres.", profileNameChecking: "Verificando disponibilidade do nome...", profileNameTaken: "Este nome exibido ja esta em uso.", ownProfile: "Conecte a carteira proprietaria deste perfil.", profileBroadcastFailed: "Falha ao enviar a transacao do perfil.",
    profileConfirmationTimeout: "A transacao do perfil nao foi confirmada a tempo. Tente novamente apos o processamento do tick.", profileSaved: "Perfil salvo.", profileSaveFailed: "Falha ao salvar o perfil: {{error}}",
  },
  ru: {
    editProfile: "Редактировать профиль", uploadPhoto: "Загрузить фото", removePhoto: "Удалить фото", displayName: "Отображаемое имя", displayNameHint: "2-32 видимых символа. Можно использовать emoji и пунктуацию.",
    profilePaymentTo: "Авторизующий перевод текущему Game Operator: {{address}}", profileFee: "Комиссия за изменение имени: {{amount}} QU", profileAuthorization: "Только фото: авторизующий перевод 0 QU.",
    saveProfile: "Сохранить профиль", savingProfile: "Сохранение...", signProfile: "Подпишите транзакцию обновления профиля в кошельке.", profileFeeLow: "Для обновления профиля требуется {{amount}} QU.",
    profileNameInvalid: "Введите корректное отображаемое имя от 2 до 32 символов.", profileNameChecking: "Проверяем доступность имени...", profileNameTaken: "Это отображаемое имя уже занято.", ownProfile: "Подключите кошелек, которому принадлежит этот профиль.", profileBroadcastFailed: "Не удалось отправить транзакцию профиля.",
    profileConfirmationTimeout: "Транзакция профиля не подтвердилась вовремя. Попробуйте снова после обработки ее тика.", profileSaved: "Профиль сохранен.", profileSaveFailed: "Не удалось сохранить профиль: {{error}}",
  },
  zh: {
    editProfile: "编辑资料", uploadPhoto: "上传照片", removePhoto: "删除照片", displayName: "显示名称", displayNameHint: "2-32 个可见字符。支持 emoji 和标点符号。",
    profilePaymentTo: "授权转账至当前 Game Operator：{{address}}", profileFee: "名称更新费用：{{amount}} QU", profileAuthorization: "仅照片更新：0 QU 授权转账。",
    saveProfile: "保存资料", savingProfile: "保存中...", signProfile: "请在钱包中签署资料更新交易。", profileFeeLow: "资料更新需要 {{amount}} QU。",
    profileNameInvalid: "请输入 2 到 32 个字符的有效显示名称。", profileNameChecking: "正在检查名称可用性...", profileNameTaken: "此显示名称已被占用。", ownProfile: "请连接拥有此资料的钱包。", profileBroadcastFailed: "资料交易广播失败。",
    profileConfirmationTimeout: "资料交易未能及时确认。请在该 tick 被处理后重试。", profileSaved: "资料已保存。", profileSaveFailed: "保存资料失败：{{error}}",
  },
};

Object.entries(portfolioProfileTranslations).forEach(([language, translations]) => {
  Object.assign(resources[language].translation.portfolio, translations);
});

const profileOptionalNameHints = {
  en: "Optional when adding only a photo. Names must contain 2-32 visible characters.",
  es: "Opcional si solo añades una foto. Los nombres deben tener entre 2 y 32 caracteres visibles.",
  fr: "Facultatif si vous ajoutez uniquement une photo. Le nom doit contenir 2 à 32 caractères visibles.",
  pt: "Opcional ao adicionar apenas uma foto. O nome deve ter de 2 a 32 caracteres visíveis.",
  ru: "Необязательно, если добавляется только фото. Имя должно содержать от 2 до 32 видимых символов.",
  zh: "仅添加照片时可不填写。名称必须包含 2 到 32 个可见字符。",
};

Object.entries(profileOptionalNameHints).forEach(([language, hint]) => {
  resources[language].translation.portfolio.displayNameOptionalHint = hint;
});

/* eslint-disable no-dupe-keys */
const utilitiesBase = {
  pageTitle: "Utilities", eyebrow: "Wallet operations", title: "Utilities", description: "Claim rewards, transfer GARTH or QTRYGOV, and manage GARTH share rights.", connectWallet: "Connect Wallet",
  wallet: "Wallet", connected: "Connected", disconnected: "Disconnected", claimable: "Claimable", loading: "Loading", unavailable: "Unavailable", signing: "Signing...",
  claimTitle: "Claim Reward", claimSubtitle: "Claim your payout from a finalized event.", rewardEvent: "Reward Event", claimButton: "Claim Reward", loadingRewards: "Loading rewards...", noRewards: "No rewards found for your current winning positions.", claimDepositHint: "Claim requires a 1M QU deposit. It is returned automatically if the claim succeeds.", claimTrack: "Claim reward for event {{id}}", shares: "shares", estimated: "est.",
  garthTitle: "Transfer GARTH", garthSubtitle: "Send GARTH (QUSD) tokens to another identity via the Quottery contract.", govTitle: "Transfer QTRYGOV", govSubtitle: "Send QTRYGOV governance shares to another identity.", transferGarth: "Transfer GARTH", transferGov: "Transfer QTRYGOV",
  rightsTitle: "Transfer Share Management Rights", rightsSubtitle: "Move GARTH management rights from the current managing contract to another contract.", transferRights: "Transfer Management Rights", currentContract: "Current Managing Contract", destinationContract: "Destination Contract", numberOfShares: "Number of Shares",
  receiverIdentity: "Receiver Identity", receiverPlaceholder: "60-character Qubic identity", receiverInvalid: "Use exactly 60 uppercase Latin letters.", amount: "Amount", available: "Available: {{value}} {{unit}}", availableUnavailable: "Available: unavailable", unavailable: "Unavailable", max: "Max", maxAmount: "Max {{value}} {{unit}}",
  transfersFeeWarning: "Transfers require {{fee}} QU for the Qubic fee. Current QU balance: {{balance}}.", requiredFeeLoading: "Required fee: {{fee}} QU. Loading QU balance...", rightsFeeLow: "Transfer rights requires {{fee}} QU. Current QU balance: {{balance}}.", requiredFee: "Required fee: {{fee}} QU. Current QU balance: {{balance}}.", refreshQuBalance: "Refresh QU balance", loadingGarthBalances: "Loading GARTH balances...", noManagedGarth: "No GARTH managed by a supported contract was found for this wallet.", contractAvailable: "Available: {{amount}} GARTH | Procedure fee {{fee}} QU", noDestination: "No compatible destination contract found.",
  refreshQuFailed: "Failed to refresh QU balance: {{error}}", scheduledTickFailed: "Failed to get scheduled tick.", contractInfoFailed: "Failed to get contract info.", signTransaction: "Sign your transaction in wallet.", walletKeyMissing: "Wallet public key not found.", validEvent: "Enter a valid event ID.", claimSent: "Claim transaction sent. Reward is hidden until the indexer confirms it.", claimFailed: "Claim failed: {{error}}", validReceiver: "Enter a valid receiver identity: exactly 60 uppercase Latin letters.", validAmount: "Enter a valid amount.", garthExceeded: "Amount exceeds available GARTH balance.", govExceeded: "Amount exceeds available QTRYGOV balance.", transferFeeRequired: "Transfer requires {{fee}} QU for the Qubic fee.", transferFailed: "Transfer failed: {{error}}", selectSource: "Select the current managing contract.", selectDestination: "Select the destination contract.", validShares: "Enter a valid number of shares.", sharesExceeded: "Number of shares exceeds the available balance.", quLoading: "QU balance is still loading. Try again in a moment.", rightsFeeRequired: "Transfer rights requires {{fee}} QU for the selected contract fee.", rewardsLoadFailed: "Failed to load rewards.", contractsLoadFailed: "Failed to load smart contracts metadata.", managementLoadFailed: "Failed to load GARTH management contracts.",
};

const utilitiesTranslations = {
  es: { pageTitle: "Utilidades", eyebrow: "Operaciones de billetera", title: "Utilidades", description: "Reclama recompensas, transfiere GARTH o QTRYGOV y gestiona derechos de participaciones GARTH.", connectWallet: "Conectar billetera", wallet: "Billetera", connected: "Conectada", disconnected: "Desconectada", claimable: "Reclamables", loading: "Cargando", unavailable: "No disponible", signing: "Firmando...", claimTitle: "Reclamar recompensa", claimSubtitle: "Reclama tu pago de un evento finalizado.", rewardEvent: "Evento con recompensa", claimButton: "Reclamar recompensa", loadingRewards: "Cargando recompensas...", noRewards: "No se encontraron recompensas para tus posiciones ganadoras actuales.", claimDepositHint: "Reclamar requiere un depósito de 1M QU. Se devuelve automáticamente si la reclamación tiene éxito.", shares: "participaciones", estimated: "est.", garthTitle: "Transferir GARTH", garthSubtitle: "Envía tokens GARTH (QUSD) a otra identidad mediante el contrato Quottery.", govTitle: "Transferir QTRYGOV", govSubtitle: "Envía participaciones de gobernanza QTRYGOV a otra identidad.", transferGarth: "Transferir GARTH", transferGov: "Transferir QTRYGOV", rightsTitle: "Transferir derechos de gestión de participaciones", rightsSubtitle: "Mueve derechos de gestión de GARTH desde el contrato actual a otro contrato.", transferRights: "Transferir derechos de gestión", currentContract: "Contrato de gestión actual", destinationContract: "Contrato de destino", numberOfShares: "Número de participaciones", receiverIdentity: "Identidad del receptor", receiverPlaceholder: "Identidad Qubic de 60 caracteres", receiverInvalid: "Usa exactamente 60 letras latinas mayúsculas.", amount: "Cantidad", available: "Disponible: {{value}} {{unit}}", availableUnavailable: "Disponible: no disponible", unavailable: "No disponible", max: "Máx.", maxAmount: "Máx. {{value}} {{unit}}", refreshQuBalance: "Actualizar saldo QU", loadingGarthBalances: "Cargando saldos GARTH...", noManagedGarth: "No se encontró GARTH gestionado por un contrato compatible para esta billetera.", noDestination: "No se encontró un contrato de destino compatible." },
  fr: { pageTitle: "Utilitaires", eyebrow: "Opérations du portefeuille", title: "Utilitaires", description: "Réclamez des récompenses, transférez GARTH ou QTRYGOV et gérez les droits de parts GARTH.", connectWallet: "Connecter le portefeuille", wallet: "Portefeuille", connected: "Connecté", disconnected: "Déconnecté", claimable: "Réclamables", loading: "Chargement", unavailable: "Indisponible", signing: "Signature...", claimTitle: "Réclamer la récompense", claimSubtitle: "Réclamez votre paiement d'un événement finalisé.", rewardEvent: "Événement récompensé", claimButton: "Réclamer la récompense", loadingRewards: "Chargement des récompenses...", noRewards: "Aucune récompense trouvée pour vos positions gagnantes actuelles.", claimDepositHint: "La réclamation nécessite un dépôt de 1M QU. Il est retourné automatiquement si elle réussit.", shares: "parts", estimated: "est.", garthTitle: "Transférer GARTH", garthSubtitle: "Envoyez des jetons GARTH (QUSD) à une autre identité via le contrat Quottery.", govTitle: "Transférer QTRYGOV", govSubtitle: "Envoyez des parts de gouvernance QTRYGOV à une autre identité.", transferGarth: "Transférer GARTH", transferGov: "Transférer QTRYGOV", rightsTitle: "Transférer les droits de gestion des parts", rightsSubtitle: "Déplacez les droits de gestion GARTH du contrat actuel vers un autre contrat.", transferRights: "Transférer les droits de gestion", currentContract: "Contrat de gestion actuel", destinationContract: "Contrat de destination", numberOfShares: "Nombre de parts", receiverIdentity: "Identité du destinataire", receiverPlaceholder: "Identité Qubic à 60 caractères", receiverInvalid: "Utilisez exactement 60 lettres latines majuscules.", amount: "Montant", available: "Disponible : {{value}} {{unit}}", availableUnavailable: "Disponible : indisponible", unavailable: "Indisponible", max: "Max.", maxAmount: "Max. {{value}} {{unit}}", refreshQuBalance: "Actualiser le solde QU", loadingGarthBalances: "Chargement des soldes GARTH...", noManagedGarth: "Aucun GARTH géré par un contrat pris en charge trouvé pour ce portefeuille.", noDestination: "Aucun contrat de destination compatible trouvé." },
  pt: { pageTitle: "Utilitários", eyebrow: "Operações da carteira", title: "Utilitários", description: "Resgate recompensas, transfira GARTH ou QTRYGOV e gerencie direitos de participações GARTH.", connectWallet: "Conectar carteira", wallet: "Carteira", connected: "Conectada", disconnected: "Desconectada", claimable: "Resgatáveis", loading: "Carregando", unavailable: "Indisponível", signing: "Assinando...", claimTitle: "Resgatar recompensa", claimSubtitle: "Resgate seu pagamento de um evento finalizado.", rewardEvent: "Evento com recompensa", claimButton: "Resgatar recompensa", loadingRewards: "Carregando recompensas...", noRewards: "Nenhuma recompensa encontrada para suas posições vencedoras atuais.", claimDepositHint: "O resgate exige um depósito de 1M QU. Ele retorna automaticamente se o resgate for bem-sucedido.", shares: "participações", estimated: "est.", garthTitle: "Transferir GARTH", garthSubtitle: "Envie tokens GARTH (QUSD) para outra identidade pelo contrato Quottery.", govTitle: "Transferir QTRYGOV", govSubtitle: "Envie participações de governança QTRYGOV para outra identidade.", transferGarth: "Transferir GARTH", transferGov: "Transferir QTRYGOV", rightsTitle: "Transferir direitos de gestão de participações", rightsSubtitle: "Mova direitos de gestão GARTH do contrato atual para outro contrato.", transferRights: "Transferir direitos de gestão", currentContract: "Contrato de gestão atual", destinationContract: "Contrato de destino", numberOfShares: "Número de participações", receiverIdentity: "Identidade do destinatário", receiverPlaceholder: "Identidade Qubic de 60 caracteres", receiverInvalid: "Use exatamente 60 letras latinas maiúsculas.", amount: "Quantidade", available: "Disponível: {{value}} {{unit}}", availableUnavailable: "Disponível: indisponível", unavailable: "Indisponível", max: "Máx.", maxAmount: "Máx. {{value}} {{unit}}", refreshQuBalance: "Atualizar saldo QU", loadingGarthBalances: "Carregando saldos GARTH...", noManagedGarth: "Nenhum GARTH gerenciado por contrato compatível foi encontrado para esta carteira.", noDestination: "Nenhum contrato de destino compatível encontrado." },
  ru: { pageTitle: "Инструменты", eyebrow: "Операции кошелька", title: "Инструменты", description: "Получайте награды, переводите GARTH или QTRYGOV и управляйте правами на доли GARTH.", connectWallet: "Подключить кошелек", wallet: "Кошелек", connected: "Подключен", disconnected: "Отключен", claimable: "Доступно к получению", loading: "Загрузка", unavailable: "Недоступно", signing: "Подписание...", claimTitle: "Получить награду", claimSubtitle: "Получите выплату за финализированное событие.", rewardEvent: "Событие с наградой", claimButton: "Получить награду", loadingRewards: "Загрузка наград...", noRewards: "Для текущих выигрышных позиций награды не найдены.", claimDepositHint: "Для получения нужен депозит 1M QU. Он вернется автоматически при успешном получении.", shares: "долей", estimated: "расч.", garthTitle: "Перевести GARTH", garthSubtitle: "Отправьте токены GARTH (QUSD) другому адресу через контракт Quottery.", govTitle: "Перевести QTRYGOV", govSubtitle: "Отправьте governance-доли QTRYGOV другому адресу.", transferGarth: "Перевести GARTH", transferGov: "Перевести QTRYGOV", rightsTitle: "Передать права управления долями", rightsSubtitle: "Переместите права управления GARTH из текущего контракта в другой контракт.", transferRights: "Передать права управления", currentContract: "Текущий управляющий контракт", destinationContract: "Контракт назначения", numberOfShares: "Количество долей", receiverIdentity: "Адрес получателя", receiverPlaceholder: "60-символьный адрес Qubic", receiverInvalid: "Используйте ровно 60 заглавных латинских букв.", amount: "Количество", available: "Доступно: {{value}} {{unit}}", availableUnavailable: "Доступно: неизвестно", unavailable: "Недоступно", max: "Макс.", maxAmount: "Макс. {{value}} {{unit}}", refreshQuBalance: "Обновить баланс QU", loadingGarthBalances: "Загрузка балансов GARTH...", noManagedGarth: "Для этого кошелька не найден GARTH под управлением поддерживаемого контракта.", noDestination: "Совместимый контракт назначения не найден." },
  zh: { pageTitle: "实用工具", eyebrow: "钱包操作", title: "实用工具", description: "领取奖励、转移 GARTH 或 QTRYGOV，并管理 GARTH 份额权限。", connectWallet: "连接钱包", wallet: "钱包", connected: "已连接", disconnected: "未连接", claimable: "可领取", loading: "加载中", unavailable: "不可用", signing: "签名中...", claimTitle: "领取奖励", claimSubtitle: "领取已最终结算事件的付款。", rewardEvent: "奖励事件", claimButton: "领取奖励", loadingRewards: "正在加载奖励...", noRewards: "当前获胜仓位没有可领取的奖励。", claimDepositHint: "领取需要 1M QU 押金，成功后会自动退还。", shares: "份额", estimated: "估算", garthTitle: "转移 GARTH", garthSubtitle: "通过 Quottery 合约向其他地址发送 GARTH (QUSD) 代币。", govTitle: "转移 QTRYGOV", govSubtitle: "向其他地址发送 QTRYGOV 治理份额。", transferGarth: "转移 GARTH", transferGov: "转移 QTRYGOV", rightsTitle: "转移份额管理权限", rightsSubtitle: "将 GARTH 管理权限从当前合约转移到另一个合约。", transferRights: "转移管理权限", currentContract: "当前管理合约", destinationContract: "目标合约", numberOfShares: "份额数量", receiverIdentity: "接收方地址", receiverPlaceholder: "60 字符 Qubic 地址", receiverInvalid: "请使用恰好 60 个大写拉丁字母。", amount: "数量", available: "可用：{{value}} {{unit}}", availableUnavailable: "可用：未知", unavailable: "不可用", max: "最大", maxAmount: "最大 {{value}} {{unit}}", refreshQuBalance: "刷新 QU 余额", loadingGarthBalances: "正在加载 GARTH 余额...", noManagedGarth: "此钱包未找到由支持合约管理的 GARTH。", noDestination: "未找到兼容的目标合约。" },
};

Object.keys(resources).forEach((language) => {
  resources[language].translation.utilities = {
    ...utilitiesBase,
    ...(utilitiesTranslations[language] || {}),
  };
});
/* eslint-enable no-dupe-keys */

const governanceBase = {
  pageTitle: "Governance", eyebrow: "Protocol voting", title: "Governance", description: "QTRYGOV holders vote on fees, dispute deposits, event costs, and the Game Operator address.", refresh: "Refresh governance data",
  supply: "QTRYGOV Supply", threshold: "Passing Threshold", uniqueProposals: "Unique Proposals", yourGov: "Your QTRYGOV", loading: "Loading", unavailable: "Unavailable",
  currentParameters: "Current Parameters", currentDescription: "Active protocol values currently returned by the contract.", shareholderFee: "Shareholder Fee", burnFee: "Burn Fee", operationFee: "Operation Fee", feePerDay: "Fee Per Day", disputeDeposit: "Dispute Deposit", antiSpam: "Anti-Spam", gameOperator: "Game Operator", copyGameOperator: "Copy Game Operator",
  noProposals: "No active proposals", noProposalsDescription: "Governance proposals will appear here when enough QTRYGOV holders align on parameters.", topProposals: "Top Proposals", uniqueInEpoch: "Unique proposals in current epoch: {{count}}", votes: "Votes: {{votes}} / {{total}}", moreToPass: "{{count}} more to pass", thresholdReached: "Threshold reached", holdersOnly: "Voting is available only for QTRYGOV holders.", proposal: "Proposal #{{rank}}", proposalDescription: "Full parameter set proposed for the next epoch.", proposedOperator: "Proposed Operator", copyProposedOperator: "Copy Proposed Operator", vote: "Vote", signing: "Signing...", holdersOnlyHint: "Only QTRYGOV holders can vote.",
  walletKeyMissing: "Wallet public key not found.", scheduledTickFailed: "Failed to get scheduled tick.", contractInfoFailed: "Failed to get contract info.", signTransaction: "Sign your transaction in wallet.", voteFailed: "Vote failed: {{error}}", voteTrack: "Vote for governance proposal #{{rank}}", loadFailed: "Failed to load governance data",
};

const governanceTranslations = {
  es: { pageTitle: "Gobernanza", eyebrow: "Votación del protocolo", title: "Gobernanza", description: "Los titulares de QTRYGOV votan sobre comisiones, depósitos de disputa, costes de eventos y la dirección del operador del juego.", refresh: "Actualizar datos de gobernanza", supply: "Suministro de QTRYGOV", threshold: "Umbral de aprobación", uniqueProposals: "Propuestas únicas", yourGov: "Tu QTRYGOV", loading: "Cargando", unavailable: "No disponible", currentParameters: "Parámetros actuales", currentDescription: "Valores activos del protocolo devueltos actualmente por el contrato.", shareholderFee: "Comisión de accionistas", burnFee: "Comisión de quema", operationFee: "Comisión de operación", feePerDay: "Comisión por día", disputeDeposit: "Depósito de disputa", antiSpam: "Anti-spam", gameOperator: "Operador del juego", copyGameOperator: "Copiar operador del juego", noProposals: "No hay propuestas activas", noProposalsDescription: "Las propuestas de gobernanza aparecerán aquí cuando suficientes titulares de QTRYGOV se alineen en los parámetros.", topProposals: "Mejores propuestas", uniqueInEpoch: "Propuestas únicas en la época actual: {{count}}", votes: "Votos: {{votes}} / {{total}}", moreToPass: "Faltan {{count}} para aprobar", thresholdReached: "Umbral alcanzado", holdersOnly: "La votación está disponible solo para titulares de QTRYGOV.", proposal: "Propuesta #{{rank}}", proposalDescription: "Conjunto completo de parámetros propuesto para la próxima época.", proposedOperator: "Operador propuesto", copyProposedOperator: "Copiar operador propuesto", vote: "Votar", signing: "Firmando...", holdersOnlyHint: "Solo los titulares de QTRYGOV pueden votar." },
  fr: { pageTitle: "Gouvernance", eyebrow: "Vote du protocole", title: "Gouvernance", description: "Les détenteurs de QTRYGOV votent sur les frais, les dépôts de litige, les coûts d'événement et l'adresse de l'opérateur du jeu.", refresh: "Actualiser les données de gouvernance", supply: "Offre QTRYGOV", threshold: "Seuil d'adoption", uniqueProposals: "Propositions uniques", yourGov: "Votre QTRYGOV", loading: "Chargement", unavailable: "Indisponible", currentParameters: "Paramètres actuels", currentDescription: "Valeurs actives du protocole actuellement renvoyées par le contrat.", shareholderFee: "Frais des actionnaires", burnFee: "Frais de brûlage", operationFee: "Frais d'opération", feePerDay: "Frais par jour", disputeDeposit: "Dépôt de litige", antiSpam: "Anti-spam", gameOperator: "Opérateur du jeu", copyGameOperator: "Copier l'opérateur du jeu", noProposals: "Aucune proposition active", noProposalsDescription: "Les propositions de gouvernance apparaîtront ici lorsque suffisamment de détenteurs de QTRYGOV s'aligneront sur les paramètres.", topProposals: "Meilleures propositions", uniqueInEpoch: "Propositions uniques dans l'époque actuelle : {{count}}", votes: "Votes : {{votes}} / {{total}}", moreToPass: "Encore {{count}} pour adopter", thresholdReached: "Seuil atteint", holdersOnly: "Le vote est réservé aux détenteurs de QTRYGOV.", proposal: "Proposition #{{rank}}", proposalDescription: "Ensemble complet de paramètres proposé pour la prochaine époque.", proposedOperator: "Opérateur proposé", copyProposedOperator: "Copier l'opérateur proposé", vote: "Voter", signing: "Signature...", holdersOnlyHint: "Seuls les détenteurs de QTRYGOV peuvent voter." },
  pt: { pageTitle: "Governança", eyebrow: "Votação do protocolo", title: "Governança", description: "Detentores de QTRYGOV votam em taxas, depósitos de disputa, custos de eventos e endereço do operador do jogo.", refresh: "Atualizar dados de governança", supply: "Oferta de QTRYGOV", threshold: "Limite de aprovação", uniqueProposals: "Propostas únicas", yourGov: "Seu QTRYGOV", loading: "Carregando", unavailable: "Indisponível", currentParameters: "Parâmetros atuais", currentDescription: "Valores ativos do protocolo retornados atualmente pelo contrato.", shareholderFee: "Taxa de acionistas", burnFee: "Taxa de queima", operationFee: "Taxa de operação", feePerDay: "Taxa por dia", disputeDeposit: "Depósito de disputa", antiSpam: "Anti-spam", gameOperator: "Operador do jogo", copyGameOperator: "Copiar operador do jogo", noProposals: "Nenhuma proposta ativa", noProposalsDescription: "As propostas de governança aparecerão aqui quando titulares suficientes de QTRYGOV concordarem com os parâmetros.", topProposals: "Principais propostas", uniqueInEpoch: "Propostas únicas na época atual: {{count}}", votes: "Votos: {{votes}} / {{total}}", moreToPass: "Faltam {{count}} para aprovar", thresholdReached: "Limite alcançado", holdersOnly: "A votação está disponível apenas para titulares de QTRYGOV.", proposal: "Proposta #{{rank}}", proposalDescription: "Conjunto completo de parâmetros proposto para a próxima época.", proposedOperator: "Operador proposto", copyProposedOperator: "Copiar operador proposto", vote: "Votar", signing: "Assinando...", holdersOnlyHint: "Somente titulares de QTRYGOV podem votar." },
  ru: { pageTitle: "Управление", eyebrow: "Голосование протокола", title: "Управление", description: "Владельцы QTRYGOV голосуют за комиссии, депозиты для споров, стоимость событий и адрес Game Operator.", refresh: "Обновить данные управления", supply: "Supply QTRYGOV", threshold: "Порог принятия", uniqueProposals: "Уникальные предложения", yourGov: "Ваш QTRYGOV", loading: "Загрузка", unavailable: "Недоступно", currentParameters: "Текущие параметры", currentDescription: "Активные значения протокола, которые сейчас возвращает контракт.", shareholderFee: "Комиссия shareholder", burnFee: "Комиссия burn", operationFee: "Операционная комиссия", feePerDay: "Комиссия в день", disputeDeposit: "Депозит для спора", antiSpam: "Антиспам", gameOperator: "Game Operator", copyGameOperator: "Копировать Game Operator", noProposals: "Нет активных предложений", noProposalsDescription: "Предложения governance появятся здесь, когда владельцы QTRYGOV согласуют параметры.", topProposals: "Лучшие предложения", uniqueInEpoch: "Уникальных предложений в текущей эпохе: {{count}}", votes: "Голоса: {{votes}} / {{total}}", moreToPass: "До принятия осталось {{count}}", thresholdReached: "Порог достигнут", holdersOnly: "Голосование доступно только владельцам QTRYGOV.", proposal: "Предложение #{{rank}}", proposalDescription: "Полный набор параметров, предложенный для следующей эпохи.", proposedOperator: "Предложенный оператор", copyProposedOperator: "Копировать предложенного оператора", vote: "Голосовать", signing: "Подписание...", holdersOnlyHint: "Только владельцы QTRYGOV могут голосовать." },
  zh: { pageTitle: "治理", eyebrow: "协议投票", title: "治理", description: "QTRYGOV 持有者对费用、争议押金、事件成本和游戏运营者地址进行投票。", refresh: "刷新治理数据", supply: "QTRYGOV 供应量", threshold: "通过门槛", uniqueProposals: "唯一提案", yourGov: "你的 QTRYGOV", loading: "加载中", unavailable: "不可用", currentParameters: "当前参数", currentDescription: "合约当前返回的活跃协议数值。", shareholderFee: "股东费用", burnFee: "销毁费用", operationFee: "运营费用", feePerDay: "每日费用", disputeDeposit: "争议押金", antiSpam: "反垃圾费用", gameOperator: "游戏运营者", copyGameOperator: "复制游戏运营者", noProposals: "没有活跃提案", noProposalsDescription: "当足够多的 QTRYGOV 持有者就参数达成一致时，治理提案将显示在这里。", topProposals: "热门提案", uniqueInEpoch: "当前 Epoch 的唯一提案：{{count}}", votes: "投票：{{votes}} / {{total}}", moreToPass: "还差 {{count}} 票通过", thresholdReached: "已达到门槛", holdersOnly: "只有 QTRYGOV 持有者可以投票。", proposal: "提案 #{{rank}}", proposalDescription: "为下一个 Epoch 提出的完整参数集。", proposedOperator: "提议运营者", copyProposedOperator: "复制提议运营者", vote: "投票", signing: "签名中...", holdersOnlyHint: "只有 QTRYGOV 持有者可以投票。" },
};

Object.keys(resources).forEach((language) => {
  resources[language].translation.governance = {
    ...governanceBase,
    ...(governanceTranslations[language] || {}),
  };
});

const aboutBase = {
  pageTitle: "About", poweredBy: "Powered by Qubic", heroTitle: "Trade the outcome on Qubic.", heroDescription: "Trade YES or NO outcome shares on real-world events through an on-chain order book. The smart contract handles matching, settlement, and payouts transparently.",
  wholeSharePrice: "Whole share price", wholeShareHint: "tokens per complete Yes + No share pair", peerToPeer: "Peer-to-peer", onChainEscrow: "On-chain escrow", verifiableSettlement: "Verifiable settlement",
  overviewCards: [
    { title: "Peer-to-peer prediction markets", body: "Quottery lets people trade outcome shares directly with one another through a transparent on-chain order book." },
    { title: "Prices as forecasts", body: "When traders put value behind their views, market prices become a live signal of what the crowd believes is most likely." },
    { title: "Built for Qubic speed", body: "Orders are matched by the on-chain contract after every placement, so short-lived markets can run from creation to payout quickly." },
  ],
  startEyebrow: "How to start", startTitle: "From wallet to your first trade", startDescription: "You only need a connected wallet, QUBIC for basic network activity, and GARTH deposited into the Quottery contract. After that, trading is just choosing a market and placing an order.",
  startTradingSteps: [
    { title: "Connect a wallet", body: "Use a Qubic-compatible wallet and connect it to the app. This identity will hold your Qubic, GARTH, orders, and positions." },
    { title: "Get Qubic", body: "Buy QUBIC on an exchange such as Gate, MEXC, Bitget, or another venue you already trust. Keep some QUBIC for network fees and wallet activity." },
    { title: "Buy GARTH", body: "Swap into GARTH through one of the Qubic ecosystem tools listed below. GARTH is the trading currency currently used by Quottery." },
    { title: "Deposit GARTH to Quottery", body: "Transfer GARTH from your wallet balance into the Quottery smart contract so it can be used for bids, asks, escrow, and settlement." },
    { title: "Pick an event and trade", body: "Open a market, choose the Yes or No side, set the price and amount you are comfortable with, then place the order from the trading screen." },
  ],
  garthEntryPoints: "GARTH entry points", garthIntro: "To get GARTH, try", or: ", or", garthAfterLinks: ". Once GARTH is deposited into the contract through", garthThen: ", the", marketsPage: "markets page", garthReady: "are ready to use.", connectWallet: "Connect wallet", buyQubic: "Buy QUBIC", buyGarth: "Buy GARTH", depositContract: "Deposit to contract", tradeMarkets: "Trade markets",
  predictEyebrow: "What can you predict?", predictTitle: "Anything with a clear Yes/No outcome", predictDescription: "Markets can be as short as minutes or as long as months, making Quottery useful for both real-time sentiment and longer-running forecasts.", predictionExamples: ["Crypto prices", "Short-term trading", "Sports", "Elections", "Tech milestones", "DeFi events", "Governance decisions"],
  worksEyebrow: "How it works", worksTitle: "Two sides, one fixed payout", worksDescription: "Every market has Yes and No shares. When the event resolves, the winning side receives the full 100,000 tokens per share while the losing side receives nothing.", tradingCurrency: "Trading currency", tradingCurrencyDescription: "Trading currently uses GARTH as a temporary stablecoin managed by the smart contract. When native QUSD becomes available on Qubic, Quottery is designed to migrate to it.",
  orderBookRows: [
    { title: "Traditional trade", body: "A sell order meets a buy order on the same option." },
    { title: "Mint", body: "Two buyers on opposite sides create new shares when their prices sum to the whole share price." },
    { title: "Merge", body: "Two sellers on opposite sides exit positions and split the pot when their asks sum to the whole share price." },
    { title: "Cross-side", body: "A buyer on one side matches with a seller on the other side." },
  ],
  lifecycleEyebrow: "Lifecycle", lifecycleTitle: "From event creation to reward claiming", lifecycleDescription: "The contract manages open orders, escrowed tokens, disputes, finalization, rewards, and cleanup across the full market lifecycle.", step: "STEP {{number}}",
  lifecycleSteps: [
    { title: "Creation", body: "The Game Operator creates an event with a clear description, two outcomes, and an end date." },
    { title: "Trading", body: "Anyone can place buy or sell orders. Tokens and shares are locked while orders are open and can be released by cancelling." },
    { title: "Result publication", body: "After the deadline, the Game Operator publishes the result and locks a dispute deposit as a guarantee of honesty." },
    { title: "Dispute window", body: "If someone challenges the result, Qubic computors vote on the correct outcome and the dispute deposit is distributed by the rules." },
    { title: "Finalization", body: "Once the event is undisputed or a dispute is resolved, the contract refunds unmatched orders and prepares rewards." },
    { title: "Reward claiming", body: "Winning shares can be claimed for the full whole share price. Losing positions are removed." },
    { title: "Cleanup", body: "Finalized events are cleared to free contract memory for new markets." },
  ],
  feesEyebrow: "Fees and market making", feesTitle: "Fees happen on winning payouts", feesDescription: "Quottery does not charge for placing, cancelling, or replacing orders. Fees are charged only when value is realized through winning rewards.",
  feeRows: [
    { label: "Operation fee", body: "Covers event management costs for the Game Operator." },
    { label: "Shareholder fee", body: "Distributed as revenue for QTRY token holders." },
    { label: "Burn fee", body: "Removed permanently to add deflationary pressure." },
  ],
  marketMakerDiscounts: "Market maker discounts", marketMakerDescription: "The Game Operator can grant fee discounts to specific addresses, up to 100%. This helps active liquidity providers quote tighter spreads and run automated strategies with less fee drag.",
  governanceEyebrow: "Governance", governanceTitle: "QTRYGOV holders shape the protocol", governanceDescription: "There are 676 QTRYGOV tokens. Holders can submit complete parameter proposals covering fees, deposit amounts, event costs, and the Game Operator address.", governanceDetail: "Proposals are weighted by QTRYGOV holdings. If identical proposals reach a quorum of 451 weighted votes within an epoch, the new parameters take effect at the start of the next epoch. Inactive holders can be redistributed after long inactivity so governance does not get blocked by abandoned accounts.",
  rolesEyebrow: "Roles", rolesTitle: "The people and systems behind Quottery", roleRows: [
    { title: "Traders", body: "Browse events, study prices, buy or sell outcome shares, claim rewards, transfer tokens, and dispute incorrect results." },
    { title: "Game Operator", body: "Creates events, publishes verified results, finalizes markets, grants market-maker discounts, and keeps the contract healthy." },
    { title: "Computors", body: "Qubic's 676 validators act as a dispute resolution jury when a result is challenged." },
    { title: "QTRYGOV holders", body: "Vote on fees, costs, dispute deposits, and the operator address through broad-consensus governance." },
  ],
};

const aboutTranslations = {
  ru: {
    pageTitle: "О проекте", poweredBy: "На базе Qubic", heroTitle: "Торгуйте исходом на Qubic.", heroDescription: "Торгуйте долями исходов ДА или НЕТ для реальных событий через ончейн-книгу ордеров. Смарт-контракт прозрачно выполняет матчи, расчеты и выплаты.", wholeSharePrice: "Цена полной доли", wholeShareHint: "токенов за полную пару ДА + НЕТ", peerToPeer: "Peer-to-peer", onChainEscrow: "Ончейн-эскроу", verifiableSettlement: "Проверяемый расчет",
    overviewCards: [
      { title: "Peer-to-peer prediction markets", body: "Quottery позволяет людям напрямую торговать долями исходов друг с другом через прозрачную ончейн-книгу ордеров." },
      { title: "Цены как прогнозы", body: "Когда трейдеры подкрепляют свой взгляд деньгами, рыночные цены становятся живым сигналом того, какой исход толпа считает наиболее вероятным." },
      { title: "Создано для скорости Qubic", body: "Контракт матчится после каждого размещения ордера, поэтому короткие рынки могут быстро пройти путь от создания до выплаты." },
    ],
    startEyebrow: "Как начать", startTitle: "От кошелька до первой сделки", startDescription: "Вам нужен подключенный кошелек, QUBIC для базовой активности сети и GARTH, внесенный в контракт Quottery. Затем остается выбрать маркет и разместить ордер.",
    startTradingSteps: [
      { title: "Подключите кошелек", body: "Используйте совместимый с Qubic кошелек и подключите его к приложению. На этом адресе будут Qubic, GARTH, ордера и позиции." },
      { title: "Получите Qubic", body: "Купите QUBIC на Gate, MEXC, Bitget или другой бирже, которой вы доверяете. Оставьте немного QUBIC для сетевых комиссий и действий кошелька." },
      { title: "Купите GARTH", body: "Обменяйте токены на GARTH через один из инструментов экосистемы Qubic ниже. Сейчас GARTH является торговой валютой Quottery." },
      { title: "Внесите GARTH в Quottery", body: "Переведите GARTH с баланса кошелька в смарт-контракт Quottery, чтобы использовать его для бидов, асков, эскроу и расчетов." },
      { title: "Выберите событие и торгуйте", body: "Откройте маркет, выберите сторону ДА или НЕТ, укажите комфортную цену и количество, затем разместите ордер на торговом экране." },
    ],
    garthEntryPoints: "Где получить GARTH", garthIntro: "Чтобы получить GARTH, попробуйте", or: ", или", garthAfterLinks: ". После внесения GARTH в контракт через", garthThen: ", страница", marketsPage: "маркеты", garthReady: "будет готова к торговле.", connectWallet: "Подключить кошелек", buyQubic: "Купить QUBIC", buyGarth: "Купить GARTH", depositContract: "Внести в контракт", tradeMarkets: "Торговать на маркетах",
    predictEyebrow: "Что можно предсказывать?", predictTitle: "Все с четким исходом ДА/НЕТ", predictDescription: "Маркеты могут длиться от нескольких минут до нескольких месяцев, поэтому Quottery подходит и для оценки настроений в реальном времени, и для долгих прогнозов.", predictionExamples: ["Цены криптовалют", "Краткосрочная торговля", "Спорт", "Выборы", "Технологические достижения", "DeFi-события", "Решения governance"],
    worksEyebrow: "Как это работает", worksTitle: "Две стороны, одна фиксированная выплата", worksDescription: "В каждом маркете есть доли ДА и НЕТ. После разрешения события выигрышная сторона получает полные 100 000 токенов за долю, проигрышная не получает ничего.", tradingCurrency: "Торговая валюта", tradingCurrencyDescription: "Сейчас в торговле используется GARTH как временный стейблкоин под управлением смарт-контракта. Когда на Qubic появится нативный QUSD, Quottery рассчитан на миграцию к нему.",
    orderBookRows: [
      { title: "Обычная сделка", body: "Ордер на продажу встречает ордер на покупку того же исхода." },
      { title: "Mint", body: "Два покупателя на противоположных сторонах создают новые доли, когда сумма их цен равна цене полной доли." },
      { title: "Merge", body: "Два продавца на противоположных сторонах закрывают позиции и делят банк, когда сумма их асков равна цене полной доли." },
      { title: "Cross-side", body: "Покупатель одной стороны матчится с продавцом противоположной стороны." },
    ],
    lifecycleEyebrow: "Жизненный цикл", lifecycleTitle: "От создания события до получения награды", lifecycleDescription: "Контракт управляет открытыми ордерами, токенами в эскроу, спорами, финализацией, наградами и очисткой на всем жизненном цикле маркета.", step: "ШАГ {{number}}",
    lifecycleSteps: [
      { title: "Создание", body: "Game Operator создает событие с ясным описанием, двумя исходами и датой окончания." },
      { title: "Торговля", body: "Любой пользователь может размещать ордера на покупку или продажу. Токены и доли заблокированы, пока ордер открыт, и освобождаются при отмене." },
      { title: "Публикация результата", body: "После дедлайна Game Operator публикует результат и блокирует депозит для спора как гарантию честности." },
      { title: "Окно спора", body: "Если кто-то оспаривает результат, computors Qubic голосуют за правильный исход, а депозит распределяется по правилам." },
      { title: "Финализация", body: "Когда событие не оспорено или спор разрешен, контракт возвращает несматченные ордера и готовит награды." },
      { title: "Получение награды", body: "Выигрышные доли можно получить по полной цене доли. Проигрышные позиции удаляются." },
      { title: "Очистка", body: "Финализированные события очищаются, освобождая память контракта для новых маркетов." },
    ],
    feesEyebrow: "Комиссии и маркет-мейкинг", feesTitle: "Комиссии берутся с выигрышных выплат", feesDescription: "Quottery не берет комиссию за размещение, отмену или замену ордеров. Комиссии взимаются только когда стоимость реализуется через выигрышные награды.",
    feeRows: [
      { label: "Operation fee", body: "Покрывает расходы Game Operator на управление событиями." },
      { label: "Shareholder fee", body: "Распределяется как доход держателям токена QTRY." },
      { label: "Burn fee", body: "Навсегда удаляется из обращения, создавая дефляционное давление." },
    ],
    marketMakerDiscounts: "Скидки маркет-мейкерам", marketMakerDescription: "Game Operator может предоставлять скидки на комиссию конкретным адресам, вплоть до 100%. Это помогает активным поставщикам ликвидности выставлять более узкие спреды и запускать автоматические стратегии с меньшими издержками.",
    governanceEyebrow: "Governance", governanceTitle: "Владельцы QTRYGOV формируют протокол", governanceDescription: "Существует 676 токенов QTRYGOV. Владельцы могут предлагать полный набор параметров: комиссии, депозиты, стоимость событий и адрес Game Operator.", governanceDetail: "Вес предложений определяется балансом QTRYGOV. Если одинаковые предложения достигают кворума в 451 взвешенный голос в течение эпохи, новые параметры вступают в силу в начале следующей эпохи. Неактивные владельцы могут быть перераспределены после длительной неактивности, чтобы governance не блокировался заброшенными адресами.",
    rolesEyebrow: "Роли", rolesTitle: "Люди и системы за Quottery", roleRows: [
      { title: "Трейдеры", body: "Изучают события и цены, покупают или продают доли исходов, получают награды, переводят токены и оспаривают неверные результаты." },
      { title: "Game Operator", body: "Создает события, публикует проверенные результаты, финализирует маркеты, предоставляет скидки маркет-мейкерам и поддерживает контракт в рабочем состоянии." },
      { title: "Computors", body: "676 валидаторов Qubic выступают жюри по разрешению спора, когда результат оспорен." },
      { title: "Владельцы QTRYGOV", body: "Голосуют за комиссии, расходы, депозиты для споров и адрес оператора через governance с широким консенсусом." },
    ],
  },
  es: { pageTitle: "Acerca de", poweredBy: "Impulsado por Qubic", heroTitle: "Opera resultados en Qubic.", startEyebrow: "Cómo empezar", startTitle: "De la billetera a tu primera operación", predictEyebrow: "¿Qué puedes predecir?", predictTitle: "Todo con un resultado claro Sí/No", worksEyebrow: "Cómo funciona", worksTitle: "Dos lados, un pago fijo", lifecycleEyebrow: "Ciclo de vida", lifecycleTitle: "De la creación al cobro", feesEyebrow: "Comisiones y creación de mercado", feesTitle: "Las comisiones se cobran en pagos ganadores", governanceEyebrow: "Gobernanza", rolesEyebrow: "Roles" },
  fr: { pageTitle: "À propos", poweredBy: "Propulsé par Qubic", heroTitle: "Négociez le résultat sur Qubic.", startEyebrow: "Comment commencer", startTitle: "Du portefeuille à votre première transaction", predictEyebrow: "Que pouvez-vous prédire ?", predictTitle: "Tout résultat clair Oui/Non", worksEyebrow: "Fonctionnement", worksTitle: "Deux côtés, un paiement fixe", lifecycleEyebrow: "Cycle de vie", lifecycleTitle: "De la création à la réclamation", feesEyebrow: "Frais et tenue de marché", feesTitle: "Les frais s'appliquent aux paiements gagnants", governanceEyebrow: "Gouvernance", rolesEyebrow: "Rôles" },
  pt: { pageTitle: "Sobre", poweredBy: "Desenvolvido com Qubic", heroTitle: "Negocie o resultado no Qubic.", startEyebrow: "Como começar", startTitle: "Da carteira à sua primeira negociação", predictEyebrow: "O que você pode prever?", predictTitle: "Tudo com resultado claro Sim/Não", worksEyebrow: "Como funciona", worksTitle: "Dois lados, um pagamento fixo", lifecycleEyebrow: "Ciclo de vida", lifecycleTitle: "Da criação ao resgate", feesEyebrow: "Taxas e criação de mercado", feesTitle: "As taxas ocorrem nos pagamentos vencedores", governanceEyebrow: "Governança", rolesEyebrow: "Funções" },
  zh: { pageTitle: "关于", poweredBy: "由 Qubic 驱动", heroTitle: "在 Qubic 上交易结果。", startEyebrow: "如何开始", startTitle: "从钱包到第一笔交易", predictEyebrow: "你可以预测什么？", predictTitle: "任何有明确是/否结果的事", worksEyebrow: "运作方式", worksTitle: "两个方向，一笔固定支付", lifecycleEyebrow: "生命周期", lifecycleTitle: "从创建事件到领取奖励", feesEyebrow: "费用与做市", feesTitle: "费用仅发生在获胜支付中", governanceEyebrow: "治理", rolesEyebrow: "角色" },
};

Object.keys(resources).forEach((language) => {
  resources[language].translation.about = {
    ...aboutBase,
    ...(aboutTranslations[language] || {}),
  };
});

const completeAboutTranslations = {
  es: {
    pageTitle: "Acerca de", poweredBy: "Impulsado por Qubic", heroTitle: "Opera resultados en Qubic.", heroDescription: "Opera participaciones de resultado SI o NO en eventos reales mediante un libro de ordenes en cadena. El contrato inteligente ejecuta coincidencias, liquidaciones y pagos de forma transparente.",
    wholeSharePrice: "Precio de una participacion completa", wholeShareHint: "tokens por un par completo SI + NO", peerToPeer: "Entre pares", onChainEscrow: "Garantia en cadena", verifiableSettlement: "Liquidacion verificable",
    overviewCards: [{ title: "Mercados de prediccion entre pares", body: "Quottery permite operar participaciones de resultado directamente entre usuarios a traves de un libro de ordenes transparente en cadena." }, { title: "Los precios como pronosticos", body: "Cuando los operadores respaldan sus opiniones con valor, los precios se convierten en una senal en vivo de lo que el mercado considera mas probable." }, { title: "Disenado para la velocidad de Qubic", body: "El contrato compara ordenes despues de cada colocacion, por lo que los mercados cortos pueden pasar rapidamente de la creacion al pago." }],
    startEyebrow: "Como empezar", startTitle: "De la billetera a tu primera operacion", startDescription: "Solo necesitas una billetera conectada, QUBIC para la actividad de red y GARTH depositado en el contrato Quottery. Despues, solo elige un mercado y coloca una orden.",
    startTradingSteps: [{ title: "Conecta una billetera", body: "Usa una billetera compatible con Qubic y conectala a la aplicacion. Esta identidad mantendra tu Qubic, GARTH, ordenes y posiciones." }, { title: "Consigue Qubic", body: "Compra QUBIC en Gate, MEXC, Bitget u otra plataforma de confianza. Conserva algo de QUBIC para tarifas de red y actividad de la billetera." }, { title: "Compra GARTH", body: "Cambia a GARTH mediante una de las herramientas del ecosistema Qubic indicadas abajo. GARTH es la moneda de negociacion actual de Quottery." }, { title: "Deposita GARTH en Quottery", body: "Transfiere GARTH desde tu billetera al contrato Quottery para usarlo en ofertas, ventas, garantia y liquidacion." }, { title: "Elige un evento y opera", body: "Abre un mercado, elige SI o NO, define el precio y la cantidad con la que estes comodo y coloca la orden." }],
    garthEntryPoints: "Puntos de entrada para GARTH", garthIntro: "Para obtener GARTH, prueba", or: ", o", garthAfterLinks: ". Cuando GARTH este depositado en el contrato mediante", garthThen: ", la pagina de", marketsPage: "mercados", garthReady: "estara lista para operar.", connectWallet: "Conectar billetera", buyQubic: "Comprar QUBIC", buyGarth: "Comprar GARTH", depositContract: "Depositar en el contrato", tradeMarkets: "Operar mercados",
    predictEyebrow: "Que puedes predecir?", predictTitle: "Cualquier resultado claro de Si/No", predictDescription: "Los mercados pueden durar minutos o meses; Quottery sirve tanto para el sentimiento en tiempo real como para pronosticos a largo plazo.", predictionExamples: ["Precios de criptomonedas", "Trading a corto plazo", "Deportes", "Elecciones", "Hitos tecnologicos", "Eventos DeFi", "Decisiones de gobernanza"],
    worksEyebrow: "Como funciona", worksTitle: "Dos lados, un pago fijo", worksDescription: "Cada mercado tiene participaciones Si y No. Al resolverse el evento, el lado ganador recibe los 100.000 tokens completos por participacion y el perdedor no recibe nada.", tradingCurrency: "Moneda de negociacion", tradingCurrencyDescription: "La negociacion usa actualmente GARTH como stablecoin temporal gestionada por el contrato. Cuando QUSD nativo este disponible en Qubic, Quottery esta disenado para migrar a el.",
    orderBookRows: [{ title: "Operacion tradicional", body: "Una orden de venta coincide con una orden de compra de la misma opcion." }, { title: "Emision", body: "Dos compradores de lados opuestos crean nuevas participaciones cuando sus precios suman el precio completo." }, { title: "Fusion", body: "Dos vendedores de lados opuestos cierran posiciones y dividen el fondo cuando sus ventas suman el precio completo." }, { title: "Lado cruzado", body: "Un comprador de un lado coincide con un vendedor del lado opuesto." }],
    lifecycleEyebrow: "Ciclo de vida", lifecycleTitle: "De la creacion al cobro de recompensa", lifecycleDescription: "El contrato administra ordenes abiertas, tokens en garantia, disputas, finalizacion, recompensas y limpieza durante todo el ciclo del mercado.", step: "PASO {{number}}", lifecycleSteps: [{ title: "Creacion", body: "El Game Operator crea un evento con descripcion clara, dos resultados y fecha de cierre." }, { title: "Negociacion", body: "Cualquiera puede colocar ordenes de compra o venta. Los tokens y participaciones quedan bloqueados mientras la orden esta abierta y se liberan al cancelarla." }, { title: "Publicacion del resultado", body: "Tras la fecha limite, el Game Operator publica el resultado y bloquea un deposito de disputa como garantia de honestidad." }, { title: "Ventana de disputa", body: "Si alguien cuestiona el resultado, los computors de Qubic votan el resultado correcto y el deposito se distribuye segun las reglas." }, { title: "Finalizacion", body: "Cuando no hay disputa o esta se resuelve, el contrato devuelve ordenes sin coincidencia y prepara recompensas." }, { title: "Cobro de recompensa", body: "Las participaciones ganadoras pueden cobrarse por el precio completo. Las posiciones perdedoras se eliminan." }, { title: "Limpieza", body: "Los eventos finalizados se eliminan para liberar memoria del contrato para nuevos mercados." }],
    feesEyebrow: "Comisiones y creacion de mercado", feesTitle: "Las comisiones se cobran en pagos ganadores", feesDescription: "Quottery no cobra por colocar, cancelar o reemplazar ordenes. Las comisiones se aplican solo cuando se realiza valor mediante recompensas ganadoras.", feeRows: [{ label: "Comision operativa", body: "Cubre costes de gestion de eventos para el Game Operator." }, { label: "Comision de accionistas", body: "Se distribuye como ingreso para los titulares del token QTRY." }, { label: "Comision de quema", body: "Se elimina permanentemente para crear presion deflacionaria." }], marketMakerDiscounts: "Descuentos para creadores de mercado", marketMakerDescription: "El Game Operator puede conceder descuentos de comision de hasta el 100% a direcciones especificas. Esto ayuda a proveedores de liquidez a cotizar spreads mas ajustados y automatizar estrategias.",
    governanceEyebrow: "Gobernanza", governanceTitle: "Los titulares de QTRYGOV dan forma al protocolo", governanceDescription: "Existen 676 tokens QTRYGOV. Sus titulares pueden proponer parametros completos para comisiones, depositos, costes de eventos y la direccion del Game Operator.", governanceDetail: "Las propuestas se ponderan por tenencias de QTRYGOV. Si propuestas identicas alcanzan un quorum de 451 votos ponderados dentro de una epoca, los nuevos parametros entran en vigor al inicio de la siguiente. Las cuentas inactivas pueden redistribuirse tras una larga inactividad para evitar que bloqueen la gobernanza.", rolesEyebrow: "Roles", rolesTitle: "Las personas y sistemas detras de Quottery", roleRows: [{ title: "Operadores", body: "Exploran eventos, estudian precios, compran o venden participaciones, cobran recompensas, transfieren tokens y disputan resultados incorrectos." }, { title: "Game Operator", body: "Crea eventos, publica resultados verificados, finaliza mercados, concede descuentos y mantiene el contrato sano." }, { title: "Computors", body: "Los 676 validadores de Qubic actuan como jurado de resolucion cuando se cuestiona un resultado." }, { title: "Titulares de QTRYGOV", body: "Votan comisiones, costes, depositos de disputa y la direccion del operador mediante gobernanza de amplio consenso." }],
  },
  fr: {
    pageTitle: "A propos", poweredBy: "Propulse par Qubic", heroTitle: "Negociez le resultat sur Qubic.", heroDescription: "Negociez des parts de resultat OUI ou NON sur des evenements reels grace a un carnet d'ordres on-chain. Le contrat intelligent gere les appariements, le reglement et les paiements de facon transparente.",
    wholeSharePrice: "Prix d'une part complete", wholeShareHint: "jetons pour une paire complete OUI + NON", peerToPeer: "Pair a pair", onChainEscrow: "Sequestre on-chain", verifiableSettlement: "Reglement verifiable",
    overviewCards: [{ title: "Marches predictifs pair a pair", body: "Quottery permet aux utilisateurs de negocier directement des parts de resultat via un carnet d'ordres transparent sur la chaine." }, { title: "Les prix comme previsions", body: "Lorsque les traders engagent de la valeur derriere leurs opinions, les prix deviennent un signal direct de ce que le marche juge probable." }, { title: "Concu pour la vitesse de Qubic", body: "Le contrat apparie les ordres apres chaque placement, ce qui permet aux marches courts d'aller rapidement de la creation au paiement." }],
    startEyebrow: "Comment commencer", startTitle: "Du portefeuille a votre premiere transaction", startDescription: "Il vous faut un portefeuille connecte, du QUBIC pour l'activite reseau et du GARTH depose dans le contrat Quottery. Ensuite, choisissez un marche et placez un ordre.",
    startTradingSteps: [{ title: "Connectez un portefeuille", body: "Utilisez un portefeuille compatible Qubic et connectez-le a l'application. Cette identite detiendra vos Qubic, GARTH, ordres et positions." }, { title: "Obtenez du Qubic", body: "Achetez du QUBIC sur Gate, MEXC, Bitget ou une autre plateforme de confiance. Gardez du QUBIC pour les frais reseau." }, { title: "Achetez du GARTH", body: "Echangez vers GARTH avec l'un des outils de l'ecosysteme Qubic ci-dessous. GARTH est la monnaie de trading actuelle de Quottery." }, { title: "Deposez GARTH dans Quottery", body: "Transferez votre GARTH vers le contrat Quottery pour l'utiliser pour les offres, les ventes, le sequestre et le reglement." }, { title: "Choisissez un evenement et negociez", body: "Ouvrez un marche, choisissez OUI ou NON, fixez votre prix et votre quantite, puis placez l'ordre." }],
    garthEntryPoints: "Acces a GARTH", garthIntro: "Pour obtenir du GARTH, essayez", or: ", ou", garthAfterLinks: ". Une fois GARTH depose dans le contrat via", garthThen: ", la page des", marketsPage: "marches", garthReady: "est prete a etre utilisee.", connectWallet: "Connecter le portefeuille", buyQubic: "Acheter QUBIC", buyGarth: "Acheter GARTH", depositContract: "Deposer dans le contrat", tradeMarkets: "Negocier les marches",
    predictEyebrow: "Que pouvez-vous predire ?", predictTitle: "Tout resultat clair OUI/NON", predictDescription: "Les marches peuvent durer quelques minutes ou plusieurs mois. Quottery est utile pour le sentiment en temps reel comme pour les previsions longues.", predictionExamples: ["Prix des cryptos", "Trading court terme", "Sports", "Elections", "Etapes technologiques", "Evenements DeFi", "Decisions de gouvernance"],
    worksEyebrow: "Fonctionnement", worksTitle: "Deux cotes, un paiement fixe", worksDescription: "Chaque marche comporte des parts OUI et NON. A la resolution, le cote gagnant recoit 100 000 jetons par part et le perdant ne recoit rien.", tradingCurrency: "Monnaie de trading", tradingCurrencyDescription: "Le trading utilise actuellement GARTH comme stablecoin temporaire gere par le contrat. Lorsque QUSD natif sera disponible sur Qubic, Quottery est concu pour y migrer.",
    orderBookRows: [{ title: "Transaction classique", body: "Un ordre de vente rencontre un ordre d'achat sur la meme option." }, { title: "Creation", body: "Deux acheteurs de cotes opposes creent de nouvelles parts lorsque leurs prix atteignent le prix complet." }, { title: "Fusion", body: "Deux vendeurs de cotes opposes ferment leurs positions et partagent le pot lorsque leurs asks atteignent le prix complet." }, { title: "Cote croise", body: "Un acheteur d'un cote est apparie avec un vendeur du cote oppose." }],
    lifecycleEyebrow: "Cycle de vie", lifecycleTitle: "De la creation a la reclamation", lifecycleDescription: "Le contrat gere les ordres ouverts, les jetons bloques, les litiges, la finalisation, les recompenses et le nettoyage du marche.", step: "ETAPE {{number}}", lifecycleSteps: [{ title: "Creation", body: "Le Game Operator cree un evenement avec une description claire, deux resultats et une date de fin." }, { title: "Trading", body: "Tout le monde peut placer des ordres d'achat ou de vente. Jetons et parts sont bloques tant que l'ordre est ouvert et liberes lors de l'annulation." }, { title: "Publication du resultat", body: "Apres la date limite, le Game Operator publie le resultat et bloque un depot de litige comme garantie." }, { title: "Fenetre de litige", body: "Si le resultat est conteste, les computors Qubic votent et le depot est distribue selon les regles." }, { title: "Finalisation", body: "Quand le marche est inconteste ou le litige resolu, le contrat rembourse les ordres non apparies et prepare les recompenses." }, { title: "Reclamation", body: "Les parts gagnantes peuvent etre reclamees au prix complet. Les positions perdantes sont retirees." }, { title: "Nettoyage", body: "Les evenements finalises sont effaces pour liberer la memoire du contrat." }],
    feesEyebrow: "Frais et tenue de marche", feesTitle: "Les frais concernent les paiements gagnants", feesDescription: "Quottery ne facture pas le placement, l'annulation ou le remplacement d'ordres. Les frais ne s'appliquent qu'aux recompenses gagnantes.", feeRows: [{ label: "Frais operationnels", body: "Couvrent les couts de gestion des evenements du Game Operator." }, { label: "Frais actionnaires", body: "Distribues comme revenu aux detenteurs de QTRY." }, { label: "Frais de burn", body: "Supprimes definitivement pour creer une pression deflationniste." }], marketMakerDiscounts: "Remises pour teneurs de marche", marketMakerDescription: "Le Game Operator peut accorder jusqu'a 100 % de remise a certaines adresses, afin d'aider les fournisseurs de liquidite a proposer des spreads plus serres.",
    governanceEyebrow: "Gouvernance", governanceTitle: "Les detenteurs de QTRYGOV faconnent le protocole", governanceDescription: "Il existe 676 jetons QTRYGOV. Leurs detenteurs peuvent proposer des parametres complets de frais, depots, couts et adresse du Game Operator.", governanceDetail: "Les propositions sont ponderees par les avoirs QTRYGOV. Si des propositions identiques atteignent 451 votes ponderes durant une epoque, elles prennent effet au debut de la suivante. Les comptes inactifs peuvent etre redistribues pour eviter de bloquer la gouvernance.", rolesEyebrow: "Roles", rolesTitle: "Les personnes et systemes derriere Quottery", roleRows: [{ title: "Traders", body: "Ils consultent les evenements, etudient les prix, achetent ou vendent des parts, reclament les recompenses et contestent les resultats incorrects." }, { title: "Game Operator", body: "Il cree les evenements, publie les resultats verifies, finalise les marches et maintient le contrat." }, { title: "Computors", body: "Les 676 validateurs de Qubic servent de jury lorsqu'un resultat est conteste." }, { title: "Detenteurs de QTRYGOV", body: "Ils votent sur les frais, couts, depots de litige et l'adresse de l'operateur." }],
  },
  pt: {
    pageTitle: "Sobre", poweredBy: "Desenvolvido com Qubic", heroTitle: "Negocie resultados no Qubic.", heroDescription: "Negocie participacoes de resultado SIM ou NAO em eventos reais por meio de um livro de ordens on-chain. O contrato inteligente executa correspondencias, liquidacao e pagamentos com transparencia.",
    wholeSharePrice: "Preco da participacao completa", wholeShareHint: "tokens por um par completo SIM + NAO", peerToPeer: "Ponto a ponto", onChainEscrow: "Garantia on-chain", verifiableSettlement: "Liquidacao verificavel",
    overviewCards: [{ title: "Mercados de previsao ponto a ponto", body: "Quottery permite negociar participacoes de resultado diretamente com outras pessoas por um livro de ordens transparente on-chain." }, { title: "Precos como previsoes", body: "Quando traders colocam valor por tras de suas opinioes, os precos se tornam um sinal ao vivo do que o mercado considera mais provavel." }, { title: "Feito para a velocidade do Qubic", body: "O contrato combina ordens apos cada envio, permitindo que mercados curtos avancem rapidamente da criacao ao pagamento." }],
    startEyebrow: "Como comecar", startTitle: "Da carteira a sua primeira negociacao", startDescription: "Voce precisa apenas de uma carteira conectada, QUBIC para atividade de rede e GARTH depositado no contrato Quottery. Depois, escolha um mercado e envie uma ordem.",
    startTradingSteps: [{ title: "Conecte uma carteira", body: "Use uma carteira compativel com Qubic e conecte-a ao aplicativo. Essa identidade guardara seu Qubic, GARTH, ordens e posicoes." }, { title: "Obtenha Qubic", body: "Compre QUBIC na Gate, MEXC, Bitget ou outra plataforma confiavel. Mantenha algum QUBIC para taxas de rede." }, { title: "Compre GARTH", body: "Troque por GARTH usando uma das ferramentas do ecossistema Qubic abaixo. GARTH e a moeda de negociacao atual do Quottery." }, { title: "Deposite GARTH no Quottery", body: "Transfira GARTH da carteira para o contrato Quottery para usa-lo em bids, asks, garantia e liquidacao." }, { title: "Escolha um evento e negocie", body: "Abra um mercado, escolha SIM ou NAO, defina preco e quantidade confortaveis e envie a ordem." }],
    garthEntryPoints: "Onde obter GARTH", garthIntro: "Para obter GARTH, experimente", or: ", ou", garthAfterLinks: ". Depois de depositar GARTH no contrato por", garthThen: ", a pagina de", marketsPage: "mercados", garthReady: "estara pronta para negociar.", connectWallet: "Conectar carteira", buyQubic: "Comprar QUBIC", buyGarth: "Comprar GARTH", depositContract: "Depositar no contrato", tradeMarkets: "Negociar mercados",
    predictEyebrow: "O que voce pode prever?", predictTitle: "Tudo com resultado claro SIM/NAO", predictDescription: "Os mercados podem durar minutos ou meses, tornando Quottery util para sentimento em tempo real e previsoes duradouras.", predictionExamples: ["Precos de cripto", "Trading de curto prazo", "Esportes", "Eleicoes", "Marcos tecnologicos", "Eventos DeFi", "Decisoes de governanca"],
    worksEyebrow: "Como funciona", worksTitle: "Dois lados, um pagamento fixo", worksDescription: "Todo mercado possui participacoes SIM e NAO. Ao resolver, o lado vencedor recebe 100.000 tokens por participacao e o perdedor nao recebe nada.", tradingCurrency: "Moeda de negociacao", tradingCurrencyDescription: "O trading usa atualmente GARTH como stablecoin temporaria gerenciada pelo contrato. Quando QUSD nativo estiver disponivel no Qubic, Quottery foi projetado para migrar para ele.",
    orderBookRows: [{ title: "Negociacao tradicional", body: "Uma ordem de venda encontra uma ordem de compra da mesma opcao." }, { title: "Emissao", body: "Dois compradores em lados opostos criam novas participacoes quando seus precos somam o preco completo." }, { title: "Fusao", body: "Dois vendedores em lados opostos encerram posicoes e dividem o pote quando seus asks somam o preco completo." }, { title: "Lado cruzado", body: "Um comprador de um lado encontra um vendedor do lado oposto." }],
    lifecycleEyebrow: "Ciclo de vida", lifecycleTitle: "Da criacao ao resgate da recompensa", lifecycleDescription: "O contrato gerencia ordens abertas, tokens em garantia, disputas, finalizacao, recompensas e limpeza durante todo o ciclo do mercado.", step: "ETAPA {{number}}", lifecycleSteps: [{ title: "Criacao", body: "O Game Operator cria um evento com descricao clara, dois resultados e uma data final." }, { title: "Negociacao", body: "Qualquer pessoa pode enviar ordens de compra ou venda. Tokens e participacoes ficam bloqueados enquanto a ordem esta aberta e sao liberados ao cancelar." }, { title: "Publicacao do resultado", body: "Apos o prazo, o Game Operator publica o resultado e bloqueia um deposito de disputa." }, { title: "Janela de disputa", body: "Se alguem contestar, os computors do Qubic votam no resultado correto e o deposito e distribuido pelas regras." }, { title: "Finalizacao", body: "Quando nao ha disputa ou ela e resolvida, o contrato devolve ordens sem match e prepara recompensas." }, { title: "Resgate", body: "Participacoes vencedoras podem ser resgatadas pelo preco completo. Posicoes perdedoras sao removidas." }, { title: "Limpeza", body: "Eventos finalizados sao limpos para liberar memoria do contrato." }],
    feesEyebrow: "Taxas e formacao de mercado", feesTitle: "Taxas ocorrem em pagamentos vencedores", feesDescription: "Quottery nao cobra por enviar, cancelar ou substituir ordens. Taxas sao cobradas somente em recompensas vencedoras.", feeRows: [{ label: "Taxa operacional", body: "Cobre os custos de gestao de eventos do Game Operator." }, { label: "Taxa de acionistas", body: "Distribuida como receita aos titulares de QTRY." }, { label: "Taxa de burn", body: "Removida permanentemente para adicionar pressao deflacionaria." }], marketMakerDiscounts: "Descontos para formadores de mercado", marketMakerDescription: "O Game Operator pode conceder descontos de taxa de ate 100% a enderecos especificos, ajudando provedores de liquidez a oferecer spreads menores.",
    governanceEyebrow: "Governanca", governanceTitle: "Titulares de QTRYGOV moldam o protocolo", governanceDescription: "Existem 676 tokens QTRYGOV. Titulares podem propor parametros de taxas, depositos, custos de eventos e endereco do Game Operator.", governanceDetail: "As propostas sao ponderadas pelas participacoes QTRYGOV. Se propostas identicas alcancarem quorum de 451 votos ponderados em uma epoca, os novos parametros passam a valer na proxima. Contas inativas podem ser redistribuidas para evitar bloqueios de governanca.", rolesEyebrow: "Funcoes", rolesTitle: "Pessoas e sistemas por tras do Quottery", roleRows: [{ title: "Traders", body: "Exploram eventos, estudam precos, compram ou vendem participacoes, resgatam recompensas, transferem tokens e contestam resultados incorretos." }, { title: "Game Operator", body: "Cria eventos, publica resultados verificados, finaliza mercados, concede descontos e mantem o contrato saudavel." }, { title: "Computors", body: "Os 676 validadores do Qubic atuam como juri quando um resultado e contestado." }, { title: "Titulares de QTRYGOV", body: "Votam em taxas, custos, depositos de disputa e endereco do operador." }],
  },
  zh: {
    pageTitle: "关于", poweredBy: "由 Qubic 驱动", heroTitle: "在 Qubic 上交易结果。", heroDescription: "通过链上订单簿交易真实事件的“是”或“否”结果份额。智能合约会透明地完成撮合、结算和支付。",
    wholeSharePrice: "完整份额价格", wholeShareHint: "一对完整“是 + 否”份额的代币数", peerToPeer: "点对点", onChainEscrow: "链上托管", verifiableSettlement: "可验证结算",
    overviewCards: [{ title: "点对点预测市场", body: "Quottery 让用户通过透明的链上订单簿直接交易结果份额。" }, { title: "价格即预测", body: "当交易者用价值支持自己的判断时，市场价格会成为市场最可能结果的实时信号。" }, { title: "为 Qubic 速度而建", body: "合约在每次下单后撮合订单，因此短期市场可以快速从创建走向支付。" }],
    startEyebrow: "如何开始", startTitle: "从钱包到第一笔交易", startDescription: "你只需要连接钱包、用于网络操作的 QUBIC，以及已存入 Quottery 合约的 GARTH。之后选择市场并下单即可。",
    startTradingSteps: [{ title: "连接钱包", body: "使用兼容 Qubic 的钱包并连接应用。该身份将持有你的 Qubic、GARTH、订单和持仓。" }, { title: "获取 Qubic", body: "在 Gate、MEXC、Bitget 或其他可信平台购买 QUBIC，并保留一部分用于网络费用。" }, { title: "购买 GARTH", body: "通过下方 Qubic 生态工具兑换 GARTH。GARTH 是 Quottery 当前使用的交易货币。" }, { title: "存入 GARTH 到 Quottery", body: "把钱包中的 GARTH 转入 Quottery 智能合约，用于买单、卖单、托管和结算。" }, { title: "选择事件并交易", body: "打开市场，选择“是”或“否”，设定可接受的价格和数量，然后下单。" }],
    garthEntryPoints: "获取 GARTH", garthIntro: "要获得 GARTH，可尝试", or: "或", garthAfterLinks: "。通过", garthThen: "将 GARTH 存入合约后，", marketsPage: "市场页面", garthReady: "即可开始交易。", connectWallet: "连接钱包", buyQubic: "购买 QUBIC", buyGarth: "购买 GARTH", depositContract: "存入合约", tradeMarkets: "交易市场",
    predictEyebrow: "你可以预测什么？", predictTitle: "任何结果明确的是/否事件", predictDescription: "市场可以持续数分钟或数月，因此 Quottery 适用于实时情绪和长期预测。", predictionExamples: ["加密货币价格", "短期交易", "体育", "选举", "技术里程碑", "DeFi 事件", "治理决策"],
    worksEyebrow: "运作方式", worksTitle: "两个方向，一笔固定支付", worksDescription: "每个市场都有“是”和“否”份额。事件结算时，获胜一方每份获得完整的 100,000 代币，失败一方不获得任何支付。", tradingCurrency: "交易货币", tradingCurrencyDescription: "交易目前使用由智能合约管理的临时稳定币 GARTH。当 Qubic 上的原生 QUSD 可用时，Quottery 将迁移到它。",
    orderBookRows: [{ title: "传统交易", body: "同一选项的卖单与买单成交。" }, { title: "铸造", body: "相反两方的两个买家在价格总和达到完整份额价格时创建新份额。" }, { title: "合并", body: "相反两方的两个卖家在卖价总和达到完整份额价格时退出持仓并分配资金池。" }, { title: "跨边成交", body: "一方的买家与另一方的卖家成交。" }],
    lifecycleEyebrow: "生命周期", lifecycleTitle: "从创建事件到领取奖励", lifecycleDescription: "合约在整个市场生命周期内管理开放订单、托管代币、争议、最终结算、奖励和清理。", step: "步骤 {{number}}", lifecycleSteps: [{ title: "创建", body: "Game Operator 创建具有明确描述、两个结果和结束日期的事件。" }, { title: "交易", body: "任何人都可以提交买卖订单。订单开放时，代币和份额会锁定；取消后会释放。" }, { title: "发布结果", body: "截止日期后，Game Operator 发布结果并锁定争议押金作为诚信保证。" }, { title: "争议窗口", body: "若有人质疑结果，Qubic computors 会投票决定正确结果，押金按规则分配。" }, { title: "最终结算", body: "当事件无争议或争议已解决时，合约退还未成交订单并准备奖励。" }, { title: "领取奖励", body: "获胜份额可以按完整份额价格领取；失败持仓会被移除。" }, { title: "清理", body: "已结算事件会被清除，为新市场释放合约内存。" }],
    feesEyebrow: "费用与做市", feesTitle: "费用仅在获胜支付中收取", feesDescription: "Quottery 不对下单、取消或替换订单收费。费用仅在获胜奖励实现价值时收取。", feeRows: [{ label: "运营费用", body: "用于覆盖 Game Operator 的事件管理成本。" }, { label: "股东费用", body: "作为收入分配给 QTRY 代币持有者。" }, { label: "销毁费用", body: "永久移除以形成通缩压力。" }], marketMakerDiscounts: "做市商折扣", marketMakerDescription: "Game Operator 可向指定地址提供最高 100% 的费用折扣，帮助活跃流动性提供者提供更窄的价差并运行自动化策略。",
    governanceEyebrow: "治理", governanceTitle: "QTRYGOV 持有者塑造协议", governanceDescription: "共有 676 枚 QTRYGOV 代币。持有者可以提交涵盖费用、押金、事件成本和 Game Operator 地址的完整参数提案。", governanceDetail: "提案权重由 QTRYGOV 持仓决定。若相同提案在一个 epoch 内获得 451 个加权投票的法定人数，新参数将在下一个 epoch 开始时生效。长期不活跃账户可被重新分配，避免治理被遗弃账户阻塞。", rolesEyebrow: "角色", rolesTitle: "Quottery 背后的人员与系统", roleRows: [{ title: "交易者", body: "浏览事件、研究价格、买卖结果份额、领取奖励、转移代币并质疑错误结果。" }, { title: "Game Operator", body: "创建事件、发布已验证结果、最终结算市场、提供做市商折扣并维护合约。" }, { title: "Computors", body: "Qubic 的 676 名验证者在结果受到质疑时担任争议裁决团。" }, { title: "QTRYGOV 持有者", body: "通过广泛共识治理对费用、成本、争议押金和运营者地址进行投票。" }],
  },
};

Object.entries(completeAboutTranslations).forEach(([language, translations]) => {
  resources[language].translation.about = {
    ...resources[language].translation.about,
    ...translations,
  };
});

const walletConnectTranslations = {
  en: {
    connectTitle: "Connect Wallet", accountAccess: "Qubic account access", identity: "Identity", copyIdentity: "Copy identity", switchAccount: "Switch account", garthBalance: "Balance (GARTH)", positions: "Positions", positionSummary: "Event {{event}} - Option {{option}}: {{amount}} shares",
    transactionTick: "Transaction tick", transactionTickHelp: "Choose one tick scheduling mode.", approvalTime: "Approval time", fixedTicks: "Fixed ticks", ticksAdded: "Ticks added", approvalWindow: "Approval window", disconnect: "Disconnect wallet", chooseMethod: "Choose your preferred connection method",
    walletAccounts: "Wallet accounts", noAccountSelected: "No account selected", refreshAccounts: "Refresh accounts", availableAccounts: "Available accounts", account: "Account {{number}}", accountCount: "{{count}} accounts", noAccountsAvailable: "No accounts available.", selected: "Selected", selectedIdentity: "Selected identity", copyAccountAddress: "Copy account address", cancel: "Cancel", selectAccount: "Select account",
    metamaskInstruction: "Connect your MetaMask wallet. MetaMask must be installed and unlocked.", scanInstruction: "Scan with Qubic Wallet or open the pairing link on this device.", qrCode: "WalletConnect QR code", openWallet: "Open in Qubic Wallet", copyUrl: "Copy WalletConnect URL", installMetaMask: "Install MetaMask", connect: "Connect", reconnect: "Reconnect", connected: "Connected", confirm: "Confirm", transactionFailed: "The transaction could not be confirmed. Please retry.",
    failedQrCode: "Failed to generate WalletConnect QR code.", failedPairingUri: "Failed to create WalletConnect pairing URI.", accountRequestTimeout: "Qubic Wallet did not respond. Open Qubic Wallet, unlock it, then refresh accounts.", noAccountsReturned: "No accounts returned by Qubic Wallet. Open Qubic Wallet, unlock it, then refresh accounts.", selectAccountFirst: "Select an account first.", signTransaction: "Sign the transaction in your wallet", signTransactionFailed: "Failed to sign transaction", metamaskSnapMissing: "MetaMask Snap is not installed. Install it and try again.",
  },
  es: {
    connectTitle: "Conectar billetera", accountAccess: "Acceso a cuenta Qubic", identity: "Identidad", copyIdentity: "Copiar identidad", switchAccount: "Cambiar cuenta", garthBalance: "Saldo (GARTH)", positions: "Posiciones", positionSummary: "Evento {{event}} - Opcion {{option}}: {{amount}} participaciones",
    transactionTick: "Tick de transaccion", transactionTickHelp: "Elige un modo de programacion de tick.", approvalTime: "Tiempo de aprobacion", fixedTicks: "Ticks fijos", ticksAdded: "Ticks anadidos", approvalWindow: "Ventana de aprobacion", disconnect: "Desconectar billetera", chooseMethod: "Elige tu metodo de conexion preferido",
    walletAccounts: "Cuentas de billetera", noAccountSelected: "No hay cuenta seleccionada", refreshAccounts: "Actualizar cuentas", availableAccounts: "Cuentas disponibles", account: "Cuenta {{number}}", accountCount: "{{count}} cuentas", noAccountsAvailable: "No hay cuentas disponibles.", selected: "Seleccionada", selectedIdentity: "Identidad seleccionada", copyAccountAddress: "Copiar direccion de cuenta", cancel: "Cancelar", selectAccount: "Seleccionar cuenta",
    metamaskInstruction: "Conecta tu billetera MetaMask. MetaMask debe estar instalado y desbloqueado.", scanInstruction: "Escanea con Qubic Wallet o abre el enlace de emparejamiento en este dispositivo.", qrCode: "Codigo QR de WalletConnect", openWallet: "Abrir en Qubic Wallet", copyUrl: "Copiar URL de WalletConnect", installMetaMask: "Instalar MetaMask", connect: "Conectar", reconnect: "Reconectar", connected: "Conectada", confirm: "Confirmar", transactionFailed: "No se pudo confirmar la transaccion. Intentalo de nuevo.",
    failedQrCode: "No se pudo generar el codigo QR de WalletConnect.", failedPairingUri: "No se pudo crear la URI de emparejamiento de WalletConnect.", accountRequestTimeout: "Qubic Wallet no respondio. Abrela, desbloqueala y actualiza las cuentas.", noAccountsReturned: "Qubic Wallet no devolvio cuentas. Abrela, desbloqueala y actualiza las cuentas.", selectAccountFirst: "Selecciona primero una cuenta.", signTransaction: "Firma la transaccion en tu billetera", signTransactionFailed: "No se pudo firmar la transaccion", metamaskSnapMissing: "MetaMask Snap no esta instalado. Instalalo e intentalo de nuevo.",
  },
  fr: {
    connectTitle: "Connecter le portefeuille", accountAccess: "Acces au compte Qubic", identity: "Identite", copyIdentity: "Copier l'identite", switchAccount: "Changer de compte", garthBalance: "Solde (GARTH)", positions: "Positions", positionSummary: "Evenement {{event}} - Option {{option}} : {{amount}} parts",
    transactionTick: "Tick de transaction", transactionTickHelp: "Choisissez un mode de planification du tick.", approvalTime: "Delai d'approbation", fixedTicks: "Ticks fixes", ticksAdded: "Ticks ajoutes", approvalWindow: "Fenetre d'approbation", disconnect: "Deconnecter le portefeuille", chooseMethod: "Choisissez votre methode de connexion",
    walletAccounts: "Comptes du portefeuille", noAccountSelected: "Aucun compte selectionne", refreshAccounts: "Actualiser les comptes", availableAccounts: "Comptes disponibles", account: "Compte {{number}}", accountCount: "{{count}} comptes", noAccountsAvailable: "Aucun compte disponible.", selected: "Selectionne", selectedIdentity: "Identite selectionnee", copyAccountAddress: "Copier l'adresse du compte", cancel: "Annuler", selectAccount: "Selectionner le compte",
    metamaskInstruction: "Connectez votre portefeuille MetaMask. MetaMask doit etre installe et deverrouille.", scanInstruction: "Scannez avec Qubic Wallet ou ouvrez le lien d'appairage sur cet appareil.", qrCode: "Code QR WalletConnect", openWallet: "Ouvrir dans Qubic Wallet", copyUrl: "Copier l'URL WalletConnect", installMetaMask: "Installer MetaMask", connect: "Connecter", reconnect: "Reconnecter", connected: "Connecte", confirm: "Confirmer", transactionFailed: "La transaction n'a pas pu etre confirmee. Reessayez.",
    failedQrCode: "Impossible de generer le code QR WalletConnect.", failedPairingUri: "Impossible de creer l'URI d'appairage WalletConnect.", accountRequestTimeout: "Qubic Wallet ne repond pas. Ouvrez-le, deverrouillez-le, puis actualisez les comptes.", noAccountsReturned: "Qubic Wallet n'a renvoye aucun compte. Ouvrez-le, deverrouillez-le, puis actualisez les comptes.", selectAccountFirst: "Selectionnez d'abord un compte.", signTransaction: "Signez la transaction dans votre portefeuille", signTransactionFailed: "Impossible de signer la transaction", metamaskSnapMissing: "MetaMask Snap n'est pas installe. Installez-le et reessayez.",
  },
  pt: {
    connectTitle: "Conectar carteira", accountAccess: "Acesso a conta Qubic", identity: "Identidade", copyIdentity: "Copiar identidade", switchAccount: "Trocar conta", garthBalance: "Saldo (GARTH)", positions: "Posicoes", positionSummary: "Evento {{event}} - Opcao {{option}}: {{amount}} participacoes",
    transactionTick: "Tick da transacao", transactionTickHelp: "Escolha um modo de agendamento de tick.", approvalTime: "Tempo de aprovacao", fixedTicks: "Ticks fixos", ticksAdded: "Ticks adicionados", approvalWindow: "Janela de aprovacao", disconnect: "Desconectar carteira", chooseMethod: "Escolha seu metodo de conexao preferido",
    walletAccounts: "Contas da carteira", noAccountSelected: "Nenhuma conta selecionada", refreshAccounts: "Atualizar contas", availableAccounts: "Contas disponiveis", account: "Conta {{number}}", accountCount: "{{count}} contas", noAccountsAvailable: "Nenhuma conta disponivel.", selected: "Selecionada", selectedIdentity: "Identidade selecionada", copyAccountAddress: "Copiar endereco da conta", cancel: "Cancelar", selectAccount: "Selecionar conta",
    metamaskInstruction: "Conecte sua carteira MetaMask. MetaMask deve estar instalado e desbloqueado.", scanInstruction: "Escaneie com Qubic Wallet ou abra o link de pareamento neste dispositivo.", qrCode: "Codigo QR do WalletConnect", openWallet: "Abrir no Qubic Wallet", copyUrl: "Copiar URL do WalletConnect", installMetaMask: "Instalar MetaMask", connect: "Conectar", reconnect: "Reconectar", connected: "Conectada", confirm: "Confirmar", transactionFailed: "A transacao nao pode ser confirmada. Tente novamente.",
    failedQrCode: "Nao foi possivel gerar o codigo QR do WalletConnect.", failedPairingUri: "Nao foi possivel criar a URI de pareamento do WalletConnect.", accountRequestTimeout: "Qubic Wallet nao respondeu. Abra, desbloqueie e atualize as contas.", noAccountsReturned: "Qubic Wallet nao retornou contas. Abra, desbloqueie e atualize as contas.", selectAccountFirst: "Selecione uma conta primeiro.", signTransaction: "Assine a transacao na sua carteira", signTransactionFailed: "Nao foi possivel assinar a transacao", metamaskSnapMissing: "MetaMask Snap nao esta instalado. Instale-o e tente novamente.",
  },
  ru: {
    connectTitle: "Подключить кошелек", accountAccess: "Доступ к аккаунту Qubic", identity: "Адрес", copyIdentity: "Копировать адрес", switchAccount: "Сменить аккаунт", garthBalance: "Баланс (GARTH)", positions: "Позиции", positionSummary: "Событие {{event}} - Опция {{option}}: {{amount}} долей",
    transactionTick: "Тик транзакции", transactionTickHelp: "Выберите режим назначения тика.", approvalTime: "Время подтверждения", fixedTicks: "Фиксированные тики", ticksAdded: "Добавлено тиков", approvalWindow: "Окно подтверждения", disconnect: "Отключить кошелек", chooseMethod: "Выберите способ подключения",
    walletAccounts: "Аккаунты кошелька", noAccountSelected: "Аккаунт не выбран", refreshAccounts: "Обновить аккаунты", availableAccounts: "Доступные аккаунты", account: "Аккаунт {{number}}", accountCount: "Аккаунтов: {{count}}", noAccountsAvailable: "Нет доступных аккаунтов.", selected: "Выбран", selectedIdentity: "Выбранный адрес", copyAccountAddress: "Копировать адрес аккаунта", cancel: "Отмена", selectAccount: "Выбрать аккаунт",
    metamaskInstruction: "Подключите кошелек MetaMask. MetaMask должен быть установлен и разблокирован.", scanInstruction: "Отсканируйте код в Qubic Wallet или откройте ссылку сопряжения на этом устройстве.", qrCode: "QR-код WalletConnect", openWallet: "Открыть в Qubic Wallet", copyUrl: "Копировать URL WalletConnect", installMetaMask: "Установить MetaMask", connect: "Подключить", reconnect: "Переподключить", connected: "Подключен", confirm: "Подтвердить", transactionFailed: "Не удалось подтвердить транзакцию. Попробуйте еще раз.",
    failedQrCode: "Не удалось создать QR-код WalletConnect.", failedPairingUri: "Не удалось создать URI для сопряжения WalletConnect.", accountRequestTimeout: "Qubic Wallet не ответил. Откройте и разблокируйте его, затем обновите аккаунты.", noAccountsReturned: "Qubic Wallet не вернул аккаунты. Откройте и разблокируйте его, затем обновите аккаунты.", selectAccountFirst: "Сначала выберите аккаунт.", signTransaction: "Подпишите транзакцию в кошельке", signTransactionFailed: "Не удалось подписать транзакцию", metamaskSnapMissing: "MetaMask Snap не установлен. Установите его и попробуйте снова.",
  },
  zh: {
    connectTitle: "连接钱包", accountAccess: "Qubic 账户访问", identity: "地址", copyIdentity: "复制地址", switchAccount: "切换账户", garthBalance: "余额 (GARTH)", positions: "持仓", positionSummary: "事件 {{event}} - 选项 {{option}}：{{amount}} 份",
    transactionTick: "交易 Tick", transactionTickHelp: "选择一种 Tick 安排方式。", approvalTime: "确认时间", fixedTicks: "固定 Tick", ticksAdded: "增加的 Tick", approvalWindow: "确认窗口", disconnect: "断开钱包", chooseMethod: "选择你偏好的连接方式",
    walletAccounts: "钱包账户", noAccountSelected: "未选择账户", refreshAccounts: "刷新账户", availableAccounts: "可用账户", account: "账户 {{number}}", accountCount: "{{count}} 个账户", noAccountsAvailable: "没有可用账户。", selected: "已选择", selectedIdentity: "已选地址", copyAccountAddress: "复制账户地址", cancel: "取消", selectAccount: "选择账户",
    metamaskInstruction: "连接你的 MetaMask 钱包。必须安装并解锁 MetaMask。", scanInstruction: "使用 Qubic Wallet 扫描，或在此设备上打开配对链接。", qrCode: "WalletConnect 二维码", openWallet: "在 Qubic Wallet 中打开", copyUrl: "复制 WalletConnect URL", installMetaMask: "安装 MetaMask", connect: "连接", reconnect: "重新连接", connected: "已连接", confirm: "确认", transactionFailed: "无法确认交易，请重试。",
    failedQrCode: "无法生成 WalletConnect 二维码。", failedPairingUri: "无法创建 WalletConnect 配对 URI。", accountRequestTimeout: "Qubic Wallet 没有响应。请打开并解锁它，然后刷新账户。", noAccountsReturned: "Qubic Wallet 没有返回账户。请打开并解锁它，然后刷新账户。", selectAccountFirst: "请先选择账户。", signTransaction: "请在钱包中签署交易", signTransactionFailed: "无法签署交易", metamaskSnapMissing: "未安装 MetaMask Snap。请安装后重试。",
  },
};

Object.entries(walletConnectTranslations).forEach(([language, translations]) => {
  resources[language].translation.walletConnect = translations;
});

const quickBuyTranslations = {
  en: {
    shares: "Shares", cost: "Cost", balance: "Balance: {{amount}} GARTH", signing: "Signing...", placeBuyOrder: "Place buy order", mintHint: "Mint: matches if the opposite option has buy price >= {{price}}", connectFirst: "Connect your wallet first.", validOrder: "Enter valid shares and price.", validShares: "Please enter a valid amount.", validPrice: "Price must be between 1 and 99,999.", invalidEvent: "Invalid event.", eventClosed: "This event is closed. New orders cannot be placed.", networkInfoFailed: "Failed to get network info.", signTransaction: "Sign your transaction in wallet.", transactionDescription: "Buy {{amount}} \"{{option}}\" @ {{price}}", broadcasted: "Buy transaction broadcasted for tick {{tick}}. Waiting for execution: {{amount}} shares of \"{{option}}\" @ {{price}}", broadcastFailed: "Broadcast failed: {{error}}", unknownError: "Unknown error", error: "Error: {{error}}", insufficientGarth: "Insufficient GARTH balance. Required {{required}}, available {{available}}.", insufficientQu: "Insufficient QU balance for the anti-spam fee. Required {{required}}, available {{available}}.",
  },
  es: {
    shares: "Participaciones", cost: "Coste", balance: "Saldo: {{amount}} GARTH", signing: "Firmando...", placeBuyOrder: "Colocar orden de compra", mintHint: "Emision: coincide si la opcion opuesta tiene un precio de compra >= {{price}}", connectFirst: "Conecta primero tu billetera.", validOrder: "Introduce participaciones y precio validos.", validShares: "Introduce una cantidad valida.", validPrice: "El precio debe estar entre 1 y 99.999.", invalidEvent: "Evento no valido.", eventClosed: "Este evento esta cerrado. No se pueden colocar nuevas ordenes.", networkInfoFailed: "No se pudo obtener la informacion de red.", signTransaction: "Firma la transaccion en tu billetera.", transactionDescription: "Comprar {{amount}} \"{{option}}\" @ {{price}}", broadcasted: "Transaccion de compra enviada para el tick {{tick}}. Esperando ejecucion: {{amount}} participaciones de \"{{option}}\" @ {{price}}", broadcastFailed: "Error de envio: {{error}}", unknownError: "Error desconocido", error: "Error: {{error}}", insufficientGarth: "Saldo GARTH insuficiente. Requerido {{required}}, disponible {{available}}.", insufficientQu: "Saldo QU insuficiente para la tarifa anti-spam. Requerido {{required}}, disponible {{available}}.",
  },
  fr: {
    shares: "Parts", cost: "Cout", balance: "Solde : {{amount}} GARTH", signing: "Signature...", placeBuyOrder: "Placer un ordre d'achat", mintHint: "Creation : appariement si l'option opposee a un prix d'achat >= {{price}}", connectFirst: "Connectez d'abord votre portefeuille.", validOrder: "Saisissez un nombre de parts et un prix valides.", validShares: "Saisissez un montant valide.", validPrice: "Le prix doit etre compris entre 1 et 99 999.", invalidEvent: "Evenement invalide.", eventClosed: "Cet evenement est ferme. Aucun nouvel ordre ne peut etre place.", networkInfoFailed: "Impossible d'obtenir les informations reseau.", signTransaction: "Signez la transaction dans votre portefeuille.", transactionDescription: "Acheter {{amount}} \"{{option}}\" @ {{price}}", broadcasted: "Transaction d'achat envoyee pour le tick {{tick}}. En attente d'execution : {{amount}} parts de \"{{option}}\" @ {{price}}", broadcastFailed: "Echec de diffusion : {{error}}", unknownError: "Erreur inconnue", error: "Erreur : {{error}}", insufficientGarth: "Solde GARTH insuffisant. Requis {{required}}, disponible {{available}}.", insufficientQu: "Solde QU insuffisant pour les frais anti-spam. Requis {{required}}, disponible {{available}}.",
  },
  pt: {
    shares: "Participacoes", cost: "Custo", balance: "Saldo: {{amount}} GARTH", signing: "Assinando...", placeBuyOrder: "Enviar ordem de compra", mintHint: "Emissao: combina se a opcao oposta tiver preco de compra >= {{price}}", connectFirst: "Conecte sua carteira primeiro.", validOrder: "Informe participacoes e preco validos.", validShares: "Informe uma quantidade valida.", validPrice: "O preco deve estar entre 1 e 99.999.", invalidEvent: "Evento invalido.", eventClosed: "Este evento esta encerrado. Novas ordens nao podem ser enviadas.", networkInfoFailed: "Nao foi possivel obter informacoes de rede.", signTransaction: "Assine a transacao na sua carteira.", transactionDescription: "Comprar {{amount}} \"{{option}}\" @ {{price}}", broadcasted: "Transacao de compra enviada para o tick {{tick}}. Aguardando execucao: {{amount}} participacoes de \"{{option}}\" @ {{price}}", broadcastFailed: "Falha na transmissao: {{error}}", unknownError: "Erro desconhecido", error: "Erro: {{error}}", insufficientGarth: "Saldo GARTH insuficiente. Necessario {{required}}, disponivel {{available}}.", insufficientQu: "Saldo QU insuficiente para a taxa anti-spam. Necessario {{required}}, disponivel {{available}}.",
  },
  ru: {
    shares: "Доли", cost: "Стоимость", balance: "Баланс: {{amount}} GARTH", signing: "Подписание...", placeBuyOrder: "Разместить ордер на покупку", mintHint: "Mint: исполнится, если цена покупки противоположного исхода >= {{price}}", connectFirst: "Сначала подключите кошелек.", validOrder: "Введите корректное количество долей и цену.", validShares: "Введите корректное количество.", validPrice: "Цена должна быть от 1 до 99 999.", invalidEvent: "Некорректное событие.", eventClosed: "Событие закрыто. Новые ордера разместить нельзя.", networkInfoFailed: "Не удалось получить информацию о сети.", signTransaction: "Подпишите транзакцию в кошельке.", transactionDescription: "Купить {{amount}} \"{{option}}\" @ {{price}}", broadcasted: "Транзакция покупки отправлена для тика {{tick}}. Ожидается исполнение: {{amount}} долей \"{{option}}\" @ {{price}}", broadcastFailed: "Не удалось отправить транзакцию: {{error}}", unknownError: "Неизвестная ошибка", error: "Ошибка: {{error}}", insufficientGarth: "Недостаточно GARTH. Требуется {{required}}, доступно {{available}}.", insufficientQu: "Недостаточно QU для anti-spam комиссии. Требуется {{required}}, доступно {{available}}.",
  },
  zh: {
    shares: "份额", cost: "成本", balance: "余额：{{amount}} GARTH", signing: "签名中...", placeBuyOrder: "提交买单", mintHint: "铸造：若相反选项的买价 >= {{price}} 则成交", connectFirst: "请先连接钱包。", validOrder: "请输入有效的份额和价格。", validShares: "请输入有效数量。", validPrice: "价格必须在 1 到 99,999 之间。", invalidEvent: "无效事件。", eventClosed: "该事件已关闭，不能提交新订单。", networkInfoFailed: "无法获取网络信息。", signTransaction: "请在钱包中签署交易。", transactionDescription: "买入 {{amount}} \"{{option}}\" @ {{price}}", broadcasted: "买入交易已发送至 tick {{tick}}。等待执行：{{amount}} 份 \"{{option}}\" @ {{price}}", broadcastFailed: "广播失败：{{error}}", unknownError: "未知错误", error: "错误：{{error}}", insufficientGarth: "GARTH 余额不足。需要 {{required}}，可用 {{available}}。", insufficientQu: "QU 余额不足以支付 anti-spam 费用。需要 {{required}}，可用 {{available}}。",
  },
};

Object.entries(quickBuyTranslations).forEach(([language, translations]) => {
  resources[language].translation.quickBuy = translations;
});

const notificationTranslations = {
  en: {
    title: "Notifications", markAllRead: "Mark all read", loadFailed: "Could not load notifications.", retry: "Retry", empty: "No notifications yet.", newCount: "{{count}} new notifications", optionYes: "YES", optionNo: "NO", eventFallback: "Event #{{id}}",
    positionWin: "Position won", positionLose: "Position lost", positionResultBody: "{{event}} · {{option}} · {{amount}} shares · PnL {{pnl}}",
    orderMatched: "Order matched", orderCanceled: "Order canceled", orderReturned: "Order returned", orderBody: "{{event}} · {{option}} · {{amount}} shares at {{price}}",
    rewardClaimed: "Reward claimed", rewardBody: "{{event}} · {{amount}} {{token}} received", transferReceived: "Transfer received", transferBody: "{{amount}} {{token}} received",
  },
  es: {
    title: "Notificaciones", markAllRead: "Marcar todo como leído", loadFailed: "No se pudieron cargar las notificaciones.", retry: "Reintentar", empty: "Aún no hay notificaciones.", newCount: "{{count}} notificaciones nuevas", optionYes: "SÍ", optionNo: "NO", eventFallback: "Evento #{{id}}",
    positionWin: "Posición ganadora", positionLose: "Posición perdedora", positionResultBody: "{{event}} · {{option}} · {{amount}} participaciones · PnL {{pnl}}",
    orderMatched: "Orden ejecutada", orderCanceled: "Orden cancelada", orderReturned: "Orden devuelta", orderBody: "{{event}} · {{option}} · {{amount}} participaciones a {{price}}",
    rewardClaimed: "Recompensa reclamada", rewardBody: "{{event}} · {{amount}} {{token}} recibidos", transferReceived: "Transferencia recibida", transferBody: "{{amount}} {{token}} recibidos",
  },
  fr: {
    title: "Notifications", markAllRead: "Tout marquer comme lu", loadFailed: "Impossible de charger les notifications.", retry: "Réessayer", empty: "Aucune notification pour le moment.", newCount: "{{count}} nouvelles notifications", optionYes: "OUI", optionNo: "NON", eventFallback: "Événement #{{id}}",
    positionWin: "Position gagnante", positionLose: "Position perdante", positionResultBody: "{{event}} · {{option}} · {{amount}} parts · PnL {{pnl}}",
    orderMatched: "Ordre exécuté", orderCanceled: "Ordre annulé", orderReturned: "Ordre restitué", orderBody: "{{event}} · {{option}} · {{amount}} parts à {{price}}",
    rewardClaimed: "Récompense réclamée", rewardBody: "{{event}} · {{amount}} {{token}} reçus", transferReceived: "Transfert reçu", transferBody: "{{amount}} {{token}} reçus",
  },
  pt: {
    title: "Notificações", markAllRead: "Marcar tudo como lido", loadFailed: "Não foi possível carregar as notificações.", retry: "Tentar novamente", empty: "Ainda não há notificações.", newCount: "{{count}} novas notificações", optionYes: "SIM", optionNo: "NÃO", eventFallback: "Evento #{{id}}",
    positionWin: "Posição vencedora", positionLose: "Posição perdedora", positionResultBody: "{{event}} · {{option}} · {{amount}} participações · PnL {{pnl}}",
    orderMatched: "Ordem executada", orderCanceled: "Ordem cancelada", orderReturned: "Ordem devolvida", orderBody: "{{event}} · {{option}} · {{amount}} participações a {{price}}",
    rewardClaimed: "Recompensa resgatada", rewardBody: "{{event}} · {{amount}} {{token}} recebidos", transferReceived: "Transferência recebida", transferBody: "{{amount}} {{token}} recebidos",
  },
  ru: {
    title: "Уведомления", markAllRead: "Прочитать все", loadFailed: "Не удалось загрузить уведомления.", retry: "Повторить", empty: "Уведомлений пока нет.", newCount: "Новых уведомлений: {{count}}", optionYes: "ДА", optionNo: "НЕТ", eventFallback: "Ивент #{{id}}",
    positionWin: "Позиция выиграла", positionLose: "Позиция проиграла", positionResultBody: "{{event}} · {{option}} · {{amount}} долей · PnL {{pnl}}",
    orderMatched: "Ордер исполнен", orderCanceled: "Ордер отменен", orderReturned: "Ордер возвращен", orderBody: "{{event}} · {{option}} · {{amount}} долей по {{price}}",
    rewardClaimed: "Награда получена", rewardBody: "{{event}} · получено {{amount}} {{token}}", transferReceived: "Получен трансфер", transferBody: "Получено {{amount}} {{token}}",
  },
  zh: {
    title: "通知", markAllRead: "全部标为已读", loadFailed: "无法加载通知。", retry: "重试", empty: "暂无通知。", newCount: "{{count}} 条新通知", optionYes: "是", optionNo: "否", eventFallback: "事件 #{{id}}",
    positionWin: "仓位获胜", positionLose: "仓位失败", positionResultBody: "{{event}} · {{option}} · {{amount}} 份 · 盈亏 {{pnl}}",
    orderMatched: "订单已成交", orderCanceled: "订单已取消", orderReturned: "订单已退回", orderBody: "{{event}} · {{option}} · {{amount}} 份，价格 {{price}}",
    rewardClaimed: "奖励已领取", rewardBody: "{{event}} · 已收到 {{amount}} {{token}}", transferReceived: "收到转账", transferBody: "已收到 {{amount}} {{token}}",
  },
};

Object.entries(notificationTranslations).forEach(([language, translations]) => {
  resources[language].translation.notifications = translations;
});

const eventRuleTranslations = {
  en: {
    sections: { source: "Resolution Source (primary)", data: "Data Specification", time: "Resolution Time", rules: "Rules", finality: "Finality" },
    crypto: {
      summary: "This market resolves to YES if the specified condition is met on the {{venue}} Spot trading data for the relevant {{pair}} pair. Otherwise, it resolves to NO.",
      source: ["{{venue}} Spot market data."],
      data: ["Trading pair: {{pair}}", "Market: Spot only", "Timeframe: 1-minute candles (1m)", "Price field: OHLC High or the metric specified in the market title."],
      time: ["The exact 1-minute candle containing the market expiration timestamp (UTC)."],
      rules: ["Only {{venue}} Spot data is valid.", "No futures, derivatives, index prices, or external exchanges.", "Candle data is taken as published by {{venue}} at resolution time."],
      finality: ["Once resolved, results are final and will not be changed due to later data corrections or disputes."],
    },
    qubicEcosystem: {
      summary: "This market resolves to YES if the specified Qubic ecosystem condition is met by the resolution time. Otherwise, it resolves to NO.",
      source: ["Qubic network data, official Qubic ecosystem sources, or the source explicitly specified in the market title or context."],
      data: ["Metric and asset or project scope are determined by the market title and context.", "On-chain values must be read from the Qubic network or accepted Qubic public data endpoints.", "Off-chain ecosystem announcements must come from the relevant official project source."],
      time: ["The exact expiration timestamp or Qubic tick specified by the market, using UTC when a timestamp is used."],
      rules: ["Unofficial mirrors, screenshots, and third-party summaries are not valid unless no primary source exists.", "If the market title names a specific metric, only that metric is used."],
      finality: ["Once resolved, results are final and will not be changed due to later data corrections or disputes."],
    },
    sports: {
      summary: "This market resolves to YES if the official governing body declares the specified outcome as the final result of the event. Otherwise, it resolves to NO.",
      sources: {
        football: ["Official competition organizer website for football.", "Examples: FIFA or UEFA."], basketball: ["Official competition organizer website for basketball.", "Example: NBA."], tennis: ["Official competition organizer website for tennis.", "Examples: ATP or WTA."], hockey: ["Official competition organizer website for hockey.", "Example: NHL."], mma: ["Official competition organizer website for MMA.", "Example: UFC."], chess: ["Official competition organizer website for chess.", "Example: FIDE."], default: ["Official competition organizer website (league or federation).", "Use the official governing body for the sport named in the market."],
      },
      data: ["Only the official match result is considered.", "Includes overtime, extra time, and shootouts if officially part of the competition rules."],
      time: ["At publication of the official final result by the governing body."],
      rules: ["Only officially published results count.", "Statistics, media reports, or live trackers are not valid.", "Disciplinary changes after match completion are ignored."],
      finality: ["Results are final once published officially by the governing body."],
    },
    finance: {
      summary: "This market resolves to YES if the specified asset or stock meets the condition based on official exchange closing data. Otherwise, it resolves to NO.",
      source: ["Pyth Network market data."], data: ["Official closing price only.", "Trading pair: asset/USD or stock/USD as listed.", "Market session: regular trading hours only."],
      time: ["Official market close of the specified trading day (UTC-adjusted exchange close).", "The exact 1-minute candle containing the market expiration timestamp (UTC)."],
      rules: ["Only the official closing price is valid.", "Pre-market, after-hours, OTC, and alternative venues are excluded.", "Exchange-published data is final."], finality: ["Final once the exchange publishes closing data."],
    },
    economy: {
      summary: "This market resolves to YES if the officially published economic indicator meets the stated condition. Otherwise, it resolves to NO.",
      source: ["Official government statistical agency."], data: ["First official release of the data.", "No revisions are considered."], time: ["Upon publication of the official data release."],
      rules: ["Forecasts, estimates, and private data are ignored.", "Only the first release counts, not revisions."], finality: ["The first official publication is final."],
    },
    science: {
      summary: "This market resolves to YES if the event is officially confirmed as having occurred. Otherwise, it resolves to NO.",
      source: ["Official organization responsible for the event."], data: ["Only official confirmation counts.", "It must be verifiable through a public statement or official record."], time: ["At official confirmation of event completion."],
      rules: ["Rumors, telemetry, or third-party tracking are invalid.", "Only official announcements are valid."], finality: ["Official confirmation is final."],
    },
    politics: {
      summary: "This market resolves to YES if the candidate or option is officially certified as the election winner. Otherwise, it resolves to NO.",
      source: ["Official election authority.", "Or the relevant national or state electoral commission."], data: ["Only certified final results count.", "Official recounts are included if they are part of the certification process."], time: ["Upon official certification of the election results."],
      rules: ["Exit polls, projections, and media calls are invalid.", "Only certified results are valid."], finality: ["Certification is final and binding for resolution purposes."],
    },
    cinema: {
      summary: "This market resolves to YES if the specified revenue or outcome is officially reported as achieved. Otherwise, it resolves to NO.",
      source: ["Official box-office tracking authority."], data: ["Worldwide gross is used if specified.", "Only officially reported figures are considered."], time: ["Upon publication of official revenue data."],
      rules: ["Estimates and projections are invalid.", "Only verified reporting counts."], finality: ["Officially reported data is final."],
    },
    other: {
      summary: "This market resolves to YES if the specified condition is met according to the primary source for the topic. Otherwise, it resolves to NO.",
      source: ["The official source, publication, organizer, or authoritative data provider specified by the market title or context."], data: ["Topic, metric, threshold, and scope are determined by the market title and context.", "If a source is explicitly named, only that source is valid."], time: ["The market expiration timestamp or the official publication or finalization time for the relevant outcome."],
      rules: ["Rumors, unofficial posts, and secondary summaries are not valid primary sources.", "Ambiguous outcomes are resolved according to the clearest literal reading of the market title or context."], finality: ["Once resolved, results are final and will not be changed due to later corrections or disputes."],
    },
  },
  es: {
    sections: { source: "Fuente de resolución (principal)", data: "Especificación de datos", time: "Momento de resolución", rules: "Reglas", finality: "Carácter definitivo" },
    crypto: {
      summary: "Este mercado se resuelve como SÍ si la condición especificada se cumple según los datos Spot de {{venue}} para el par {{pair}}. En caso contrario, se resuelve como NO.", source: ["Datos del mercado Spot de {{venue}}."],
      data: ["Par de negociación: {{pair}}", "Mercado: solo Spot", "Intervalo: velas de 1 minuto (1m)", "Campo de precio: máximo OHLC o la métrica indicada en el título del mercado."], time: ["La vela exacta de 1 minuto que contiene la hora de vencimiento del mercado (UTC)."],
      rules: ["Solo son válidos los datos Spot de {{venue}}.", "No se admiten futuros, derivados, precios de índices ni mercados externos.", "Se utilizan los datos de la vela publicados por {{venue}} en el momento de la resolución."], finality: ["Una vez resuelto, el resultado es definitivo y no cambia por correcciones posteriores de datos o disputas."],
    },
    qubicEcosystem: {
      summary: "Este mercado se resuelve como SÍ si la condición especificada del ecosistema Qubic se cumple antes del momento de resolución. En caso contrario, se resuelve como NO.", source: ["Datos de la red Qubic, fuentes oficiales del ecosistema Qubic o la fuente indicada expresamente en el título o contexto del mercado."],
      data: ["La métrica y el alcance del activo o proyecto se determinan por el título y el contexto del mercado.", "Los valores on-chain deben obtenerse de la red Qubic o de endpoints públicos aceptados de Qubic.", "Los anuncios off-chain deben proceder de la fuente oficial del proyecto correspondiente."], time: ["La hora exacta de vencimiento o el tick de Qubic indicado por el mercado, usando UTC cuando se especifique una fecha."],
      rules: ["Los espejos no oficiales, capturas y resúmenes de terceros no son válidos salvo que no exista una fuente primaria.", "Si el título indica una métrica concreta, solo se utiliza esa métrica."], finality: ["Una vez resuelto, el resultado es definitivo y no cambia por correcciones posteriores de datos o disputas."],
    },
    sports: {
      summary: "Este mercado se resuelve como SÍ si el organismo oficial declara el resultado especificado como resultado final del evento. En caso contrario, se resuelve como NO.",
      sources: { football: ["Sitio oficial del organizador de la competición de fútbol.", "Ejemplos: FIFA o UEFA."], basketball: ["Sitio oficial del organizador de la competición de baloncesto.", "Ejemplo: NBA."], tennis: ["Sitio oficial del organizador de la competición de tenis.", "Ejemplos: ATP o WTA."], hockey: ["Sitio oficial del organizador de la competición de hockey.", "Ejemplo: NHL."], mma: ["Sitio oficial del organizador de la competición de MMA.", "Ejemplo: UFC."], chess: ["Sitio oficial del organizador de la competición de ajedrez.", "Ejemplo: FIDE."], default: ["Sitio oficial del organizador de la competición (liga o federación).", "Se utiliza el organismo rector oficial del deporte indicado en el mercado."] },
      data: ["Solo se considera el resultado oficial del encuentro.", "Incluye prórroga, tiempo extra y desempates si forman parte oficial de las reglas de la competición."], time: ["Cuando el organismo rector publique el resultado final oficial."], rules: ["Solo cuentan los resultados publicados oficialmente.", "Las estadísticas, noticias o marcadores en vivo no son válidos.", "Se ignoran los cambios disciplinarios posteriores al final del encuentro."], finality: ["El resultado es definitivo cuando el organismo rector lo publica oficialmente."],
    },
    finance: { summary: "Este mercado se resuelve como SÍ si el activo o la acción cumple la condición según los datos oficiales de cierre de la bolsa. En caso contrario, se resuelve como NO.", source: ["Datos de mercado de Pyth Network."], data: ["Solo el precio oficial de cierre.", "Par: activo/USD o acción/USD según figure publicado.", "Sesión: solo horario regular de negociación."], time: ["Cierre oficial del mercado del día indicado, ajustado a UTC.", "La vela exacta de 1 minuto que contiene la hora de vencimiento del mercado (UTC)."], rules: ["Solo es válido el precio oficial de cierre.", "Se excluyen premercado, posmercado, OTC y centros alternativos.", "Los datos publicados por la bolsa son definitivos."], finality: ["Es definitivo cuando la bolsa publica los datos de cierre."] },
    economy: { summary: "Este mercado se resuelve como SÍ si el indicador económico publicado oficialmente cumple la condición indicada. En caso contrario, se resuelve como NO.", source: ["Agencia estadística gubernamental oficial."], data: ["Primera publicación oficial de los datos.", "No se consideran revisiones."], time: ["Al publicarse oficialmente los datos."], rules: ["Se ignoran pronósticos, estimaciones y datos privados.", "Solo cuenta la primera publicación, no las revisiones."], finality: ["La primera publicación oficial es definitiva."] },
    science: { summary: "Este mercado se resuelve como SÍ si se confirma oficialmente que el evento ocurrió. En caso contrario, se resuelve como NO.", source: ["Organización oficial responsable del evento."], data: ["Solo cuenta la confirmación oficial.", "Debe poder verificarse mediante un comunicado público o un registro oficial."], time: ["Cuando se confirme oficialmente la finalización del evento."], rules: ["Los rumores, la telemetría o el seguimiento de terceros no son válidos.", "Solo son válidos los anuncios oficiales."], finality: ["La confirmación oficial es definitiva."] },
    politics: { summary: "Este mercado se resuelve como SÍ si el candidato u opción es certificado oficialmente como ganador de las elecciones. En caso contrario, se resuelve como NO.", source: ["Autoridad electoral oficial.", "O la comisión electoral nacional o estatal correspondiente."], data: ["Solo cuentan los resultados finales certificados.", "Se incluyen los recuentos oficiales si forman parte del proceso de certificación."], time: ["Cuando se certifiquen oficialmente los resultados electorales."], rules: ["Las encuestas a pie de urna, proyecciones y anuncios de medios no son válidos.", "Solo son válidos los resultados certificados."], finality: ["La certificación es definitiva y vinculante para la resolución."] },
    cinema: { summary: "Este mercado se resuelve como SÍ si se informa oficialmente que se alcanzó la recaudación o el resultado especificado. En caso contrario, se resuelve como NO.", source: ["Autoridad oficial de seguimiento de taquilla."], data: ["Se usa la recaudación mundial si así se especifica.", "Solo se consideran cifras publicadas oficialmente."], time: ["Cuando se publiquen los datos oficiales de recaudación."], rules: ["Las estimaciones y proyecciones no son válidas.", "Solo cuentan los informes verificados."], finality: ["Los datos publicados oficialmente son definitivos."] },
    other: { summary: "Este mercado se resuelve como SÍ si la condición especificada se cumple según la fuente primaria del tema. En caso contrario, se resuelve como NO.", source: ["La fuente oficial, publicación, organizador o proveedor de datos autorizado indicado por el título o contexto del mercado."], data: ["El tema, la métrica, el umbral y el alcance se determinan por el título y el contexto del mercado.", "Si se nombra expresamente una fuente, solo esa fuente es válida."], time: ["La hora de vencimiento del mercado o la hora oficial de publicación o finalización del resultado correspondiente."], rules: ["Los rumores, publicaciones no oficiales y resúmenes secundarios no son fuentes primarias válidas.", "Los resultados ambiguos se resuelven según la lectura literal más clara del título o contexto del mercado."], finality: ["Una vez resuelto, el resultado es definitivo y no cambia por correcciones posteriores o disputas."] },
  },
  fr: {
    sections: { source: "Source de résolution (principale)", data: "Spécification des données", time: "Moment de la résolution", rules: "Règles", finality: "Caractère définitif" },
    crypto: { summary: "Ce marché est résolu OUI si la condition indiquée est remplie selon les données Spot de {{venue}} pour la paire {{pair}}. Sinon, il est résolu NON.", source: ["Données du marché Spot de {{venue}}."], data: ["Paire de trading : {{pair}}", "Marché : Spot uniquement", "Intervalle : bougies de 1 minute (1m)", "Champ de prix : plus haut OHLC ou métrique indiquée dans le titre du marché."], time: ["La bougie exacte d'une minute contenant l'heure d'expiration du marché (UTC)."], rules: ["Seules les données Spot de {{venue}} sont valides.", "Les contrats à terme, dérivés, indices et plateformes externes sont exclus.", "Les données de bougie publiées par {{venue}} au moment de la résolution sont utilisées."], finality: ["Une fois résolu, le résultat est définitif et ne change pas après une correction ultérieure des données ou un litige."] },
    qubicEcosystem: { summary: "Ce marché est résolu OUI si la condition indiquée concernant l'écosystème Qubic est remplie avant l'heure de résolution. Sinon, il est résolu NON.", source: ["Données du réseau Qubic, sources officielles de l'écosystème Qubic ou source expressément indiquée dans le titre ou le contexte du marché."], data: ["La métrique et le périmètre de l'actif ou du projet sont déterminés par le titre et le contexte du marché.", "Les valeurs on-chain doivent provenir du réseau Qubic ou de points d'accès publics Qubic reconnus.", "Les annonces off-chain doivent provenir de la source officielle du projet concerné."], time: ["L'horodatage exact d'expiration ou le tick Qubic indiqué par le marché, en UTC lorsqu'un horodatage est utilisé."], rules: ["Les miroirs non officiels, captures d'écran et résumés tiers ne sont pas valides sauf en l'absence de source primaire.", "Si le titre nomme une métrique précise, seule cette métrique est utilisée."], finality: ["Une fois résolu, le résultat est définitif et ne change pas après une correction ultérieure des données ou un litige."] },
    sports: { summary: "Ce marché est résolu OUI si l'organisme officiel déclare le résultat indiqué comme résultat final de l'événement. Sinon, il est résolu NON.", sources: { football: ["Site officiel de l'organisateur de la compétition de football.", "Exemples : FIFA ou UEFA."], basketball: ["Site officiel de l'organisateur de la compétition de basketball.", "Exemple : NBA."], tennis: ["Site officiel de l'organisateur de la compétition de tennis.", "Exemples : ATP ou WTA."], hockey: ["Site officiel de l'organisateur de la compétition de hockey.", "Exemple : NHL."], mma: ["Site officiel de l'organisateur de la compétition de MMA.", "Exemple : UFC."], chess: ["Site officiel de l'organisateur de la compétition d'échecs.", "Exemple : FIDE."], default: ["Site officiel de l'organisateur de la compétition (ligue ou fédération).", "L'organisme officiel du sport nommé dans le marché est utilisé."] }, data: ["Seul le résultat officiel du match est pris en compte.", "Les prolongations et tirs au but sont inclus s'ils font officiellement partie des règles de la compétition."], time: ["Lors de la publication du résultat final officiel par l'organisme compétent."], rules: ["Seuls les résultats publiés officiellement comptent.", "Les statistiques, médias et suivis en direct ne sont pas valides.", "Les changements disciplinaires postérieurs à la fin du match sont ignorés."], finality: ["Le résultat est définitif dès sa publication officielle par l'organisme compétent."] },
    finance: { summary: "Ce marché est résolu OUI si l'actif ou l'action remplit la condition selon les données officielles de clôture de la bourse. Sinon, il est résolu NON.", source: ["Données de marché de Pyth Network."], data: ["Prix officiel de clôture uniquement.", "Paire : actif/USD ou action/USD telle que cotée.", "Séance : heures normales de négociation uniquement."], time: ["Clôture officielle du marché du jour indiqué, ajustée en UTC.", "La bougie exacte d'une minute contenant l'heure d'expiration du marché (UTC)."], rules: ["Seul le prix officiel de clôture est valide.", "La préouverture, l'après-bourse, l'OTC et les plateformes alternatives sont exclus.", "Les données publiées par la bourse sont définitives."], finality: ["Le résultat est définitif dès la publication des données de clôture par la bourse."] },
    economy: { summary: "Ce marché est résolu OUI si l'indicateur économique publié officiellement remplit la condition indiquée. Sinon, il est résolu NON.", source: ["Organisme statistique gouvernemental officiel."], data: ["Première publication officielle des données.", "Les révisions ne sont pas prises en compte."], time: ["Lors de la publication officielle des données."], rules: ["Les prévisions, estimations et données privées sont ignorées.", "Seule la première publication compte, pas les révisions."], finality: ["La première publication officielle est définitive."] },
    science: { summary: "Ce marché est résolu OUI si la réalisation de l'événement est officiellement confirmée. Sinon, il est résolu NON.", source: ["Organisation officielle responsable de l'événement."], data: ["Seule une confirmation officielle compte.", "Elle doit être vérifiable par une déclaration publique ou un document officiel."], time: ["Lors de la confirmation officielle de la fin de l'événement."], rules: ["Les rumeurs, la télémétrie et le suivi par des tiers ne sont pas valides.", "Seules les annonces officielles sont valides."], finality: ["La confirmation officielle est définitive."] },
    politics: { summary: "Ce marché est résolu OUI si le candidat ou l'option est officiellement certifié vainqueur de l'élection. Sinon, il est résolu NON.", source: ["Autorité électorale officielle.", "Ou commission électorale nationale ou régionale compétente."], data: ["Seuls les résultats finaux certifiés comptent.", "Les recomptages officiels sont inclus s'ils font partie du processus de certification."], time: ["Lors de la certification officielle des résultats électoraux."], rules: ["Les sondages de sortie, projections et annonces des médias ne sont pas valides.", "Seuls les résultats certifiés sont valides."], finality: ["La certification est définitive et contraignante pour la résolution."] },
    cinema: { summary: "Ce marché est résolu OUI si le revenu ou le résultat indiqué est officiellement déclaré atteint. Sinon, il est résolu NON.", source: ["Autorité officielle de suivi du box-office."], data: ["Les recettes mondiales sont utilisées si cela est précisé.", "Seuls les chiffres publiés officiellement sont pris en compte."], time: ["Lors de la publication des données officielles de recettes."], rules: ["Les estimations et projections ne sont pas valides.", "Seules les publications vérifiées comptent."], finality: ["Les données publiées officiellement sont définitives."] },
    other: { summary: "Ce marché est résolu OUI si la condition indiquée est remplie selon la source primaire du sujet. Sinon, il est résolu NON.", source: ["La source officielle, publication, organisateur ou fournisseur de données faisant autorité indiqué par le titre ou le contexte du marché."], data: ["Le sujet, la métrique, le seuil et le périmètre sont déterminés par le titre et le contexte du marché.", "Si une source est expressément nommée, seule cette source est valide."], time: ["L'heure d'expiration du marché ou l'heure officielle de publication ou de finalisation du résultat concerné."], rules: ["Les rumeurs, publications non officielles et résumés secondaires ne constituent pas des sources primaires valides.", "Les résultats ambigus sont résolus selon la lecture littérale la plus claire du titre ou du contexte du marché."], finality: ["Une fois résolu, le résultat est définitif et ne change pas après une correction ultérieure ou un litige."] },
  },
  pt: {
    sections: { source: "Fonte de resolução (principal)", data: "Especificação dos dados", time: "Momento da resolução", rules: "Regras", finality: "Caráter definitivo" },
    crypto: { summary: "Este mercado será resolvido como SIM se a condição especificada for cumprida nos dados Spot da {{venue}} para o par {{pair}}. Caso contrário, será resolvido como NÃO.", source: ["Dados do mercado Spot da {{venue}}."], data: ["Par de negociação: {{pair}}", "Mercado: somente Spot", "Intervalo: candles de 1 minuto (1m)", "Campo de preço: máxima OHLC ou a métrica indicada no título do mercado."], time: ["O candle exato de 1 minuto que contém o horário de expiração do mercado (UTC)."], rules: ["Somente os dados Spot da {{venue}} são válidos.", "Futuros, derivativos, preços de índices e bolsas externas não são aceitos.", "São usados os dados do candle publicados pela {{venue}} no momento da resolução."], finality: ["Depois da resolução, o resultado é definitivo e não muda por correções posteriores de dados ou disputas."] },
    qubicEcosystem: { summary: "Este mercado será resolvido como SIM se a condição especificada do ecossistema Qubic for cumprida até o momento da resolução. Caso contrário, será resolvido como NÃO.", source: ["Dados da rede Qubic, fontes oficiais do ecossistema Qubic ou a fonte indicada expressamente no título ou contexto do mercado."], data: ["A métrica e o escopo do ativo ou projeto são determinados pelo título e contexto do mercado.", "Valores on-chain devem ser obtidos da rede Qubic ou de endpoints públicos aceitos da Qubic.", "Anúncios off-chain devem vir da fonte oficial do projeto correspondente."], time: ["O horário exato de expiração ou o tick Qubic indicado pelo mercado, usando UTC quando houver um horário."], rules: ["Espelhos não oficiais, capturas de tela e resumos de terceiros não são válidos, salvo se não existir fonte primária.", "Se o título indicar uma métrica específica, somente essa métrica será usada."], finality: ["Depois da resolução, o resultado é definitivo e não muda por correções posteriores de dados ou disputas."] },
    sports: { summary: "Este mercado será resolvido como SIM se a entidade oficial declarar o resultado especificado como resultado final do evento. Caso contrário, será resolvido como NÃO.", sources: { football: ["Site oficial do organizador da competição de futebol.", "Exemplos: FIFA ou UEFA."], basketball: ["Site oficial do organizador da competição de basquete.", "Exemplo: NBA."], tennis: ["Site oficial do organizador da competição de tênis.", "Exemplos: ATP ou WTA."], hockey: ["Site oficial do organizador da competição de hóquei.", "Exemplo: NHL."], mma: ["Site oficial do organizador da competição de MMA.", "Exemplo: UFC."], chess: ["Site oficial do organizador da competição de xadrez.", "Exemplo: FIDE."], default: ["Site oficial do organizador da competição (liga ou federação).", "É usada a entidade oficial do esporte indicado no mercado."] }, data: ["Somente o resultado oficial da partida é considerado.", "Inclui prorrogação, tempo extra e desempates se fizerem parte oficialmente das regras da competição."], time: ["Quando a entidade responsável publicar o resultado final oficial."], rules: ["Somente resultados publicados oficialmente contam.", "Estatísticas, notícias e placares ao vivo não são válidos.", "Mudanças disciplinares após o fim da partida são ignoradas."], finality: ["O resultado é definitivo quando publicado oficialmente pela entidade responsável."] },
    finance: { summary: "Este mercado será resolvido como SIM se o ativo ou ação cumprir a condição com base nos dados oficiais de fechamento da bolsa. Caso contrário, será resolvido como NÃO.", source: ["Dados de mercado da Pyth Network."], data: ["Somente o preço oficial de fechamento.", "Par: ativo/USD ou ação/USD conforme listado.", "Sessão: somente horário regular de negociação."], time: ["Fechamento oficial do mercado no dia indicado, ajustado para UTC.", "O candle exato de 1 minuto que contém o horário de expiração do mercado (UTC)."], rules: ["Somente o preço oficial de fechamento é válido.", "Pré-mercado, pós-mercado, OTC e ambientes alternativos são excluídos.", "Os dados publicados pela bolsa são definitivos."], finality: ["É definitivo quando a bolsa publica os dados de fechamento."] },
    economy: { summary: "Este mercado será resolvido como SIM se o indicador econômico publicado oficialmente cumprir a condição indicada. Caso contrário, será resolvido como NÃO.", source: ["Agência estatística governamental oficial."], data: ["Primeira divulgação oficial dos dados.", "Revisões não são consideradas."], time: ["Na publicação oficial dos dados."], rules: ["Previsões, estimativas e dados privados são ignorados.", "Somente a primeira divulgação conta, não as revisões."], finality: ["A primeira publicação oficial é definitiva."] },
    science: { summary: "Este mercado será resolvido como SIM se a ocorrência do evento for confirmada oficialmente. Caso contrário, será resolvido como NÃO.", source: ["Organização oficial responsável pelo evento."], data: ["Somente a confirmação oficial conta.", "Ela deve ser verificável por declaração pública ou registro oficial."], time: ["Na confirmação oficial da conclusão do evento."], rules: ["Rumores, telemetria ou rastreamento de terceiros não são válidos.", "Somente anúncios oficiais são válidos."], finality: ["A confirmação oficial é definitiva."] },
    politics: { summary: "Este mercado será resolvido como SIM se o candidato ou opção for certificado oficialmente como vencedor da eleição. Caso contrário, será resolvido como NÃO.", source: ["Autoridade eleitoral oficial.", "Ou a comissão eleitoral nacional ou estadual correspondente."], data: ["Somente resultados finais certificados contam.", "Recontagens oficiais são incluídas se fizerem parte do processo de certificação."], time: ["Na certificação oficial dos resultados eleitorais."], rules: ["Pesquisas de boca de urna, projeções e anúncios da mídia não são válidos.", "Somente resultados certificados são válidos."], finality: ["A certificação é definitiva e vinculante para a resolução."] },
    cinema: { summary: "Este mercado será resolvido como SIM se a receita ou resultado indicado for oficialmente informado como alcançado. Caso contrário, será resolvido como NÃO.", source: ["Autoridade oficial de acompanhamento de bilheteria."], data: ["A bilheteria mundial é usada quando especificado.", "Somente números publicados oficialmente são considerados."], time: ["Na publicação dos dados oficiais de receita."], rules: ["Estimativas e projeções não são válidas.", "Somente relatórios verificados contam."], finality: ["Os dados publicados oficialmente são definitivos."] },
    other: { summary: "Este mercado será resolvido como SIM se a condição indicada for cumprida segundo a fonte primária do tema. Caso contrário, será resolvido como NÃO.", source: ["A fonte oficial, publicação, organizador ou provedor de dados autorizado indicado pelo título ou contexto do mercado."], data: ["O tema, métrica, limite e escopo são determinados pelo título e contexto do mercado.", "Se uma fonte for indicada expressamente, somente ela será válida."], time: ["O horário de expiração do mercado ou o horário oficial de publicação ou finalização do resultado correspondente."], rules: ["Rumores, publicações não oficiais e resumos secundários não são fontes primárias válidas.", "Resultados ambíguos são resolvidos pela leitura literal mais clara do título ou contexto do mercado."], finality: ["Depois da resolução, o resultado é definitivo e não muda por correções posteriores ou disputas."] },
  },
  ru: {
    sections: { source: "Основной источник результата", data: "Требования к данным", time: "Момент определения результата", rules: "Правила", finality: "Окончательность" },
    crypto: { summary: "Маркет завершается результатом «ДА», если указанное условие выполнено по данным спотового рынка {{venue}} для пары {{pair}}. В противном случае результат — «НЕТ».", source: ["Данные спотового рынка {{venue}}."], data: ["Торговая пара: {{pair}}", "Рынок: только спотовый", "Интервал: минутные свечи (1m)", "Поле цены: максимум OHLC или показатель, указанный в названии маркета."], time: ["Точная минутная свеча, в которую попадает время окончания маркета по UTC."], rules: ["Учитываются только данные спотового рынка {{venue}}.", "Фьючерсы, деривативы, индексные цены и другие биржи не учитываются.", "Используются данные свечи, опубликованные {{venue}} на момент определения результата."], finality: ["После определения результат окончателен и не меняется из-за последующих исправлений данных или споров."] },
    qubicEcosystem: { summary: "Маркет завершается результатом «ДА», если указанное условие экосистемы Qubic выполнено к моменту определения результата. В противном случае результат — «НЕТ».", source: ["Данные сети Qubic, официальные источники экосистемы Qubic или источник, прямо указанный в названии или контексте маркета."], data: ["Показатель и область актива или проекта определяются названием и контекстом маркета.", "Ончейн-значения должны браться из сети Qubic или принятых публичных API Qubic.", "Офчейн-объявления должны исходить из официального источника соответствующего проекта."], time: ["Точное время окончания или тик Qubic, указанный в маркете; для времени используется UTC."], rules: ["Неофициальные зеркала, скриншоты и сторонние пересказы не учитываются, если существует первичный источник.", "Если в названии указан конкретный показатель, используется только он."], finality: ["После определения результат окончателен и не меняется из-за последующих исправлений данных или споров."] },
    sports: { summary: "Маркет завершается результатом «ДА», если официальный регулирующий орган объявляет указанный исход окончательным результатом события. В противном случае результат — «НЕТ».", sources: { football: ["Официальный сайт организатора футбольного соревнования.", "Например: FIFA или UEFA."], basketball: ["Официальный сайт организатора баскетбольного соревнования.", "Например: NBA."], tennis: ["Официальный сайт организатора теннисного соревнования.", "Например: ATP или WTA."], hockey: ["Официальный сайт организатора хоккейного соревнования.", "Например: NHL."], mma: ["Официальный сайт организатора соревнования по MMA.", "Например: UFC."], chess: ["Официальный сайт организатора шахматного соревнования.", "Например: FIDE."], default: ["Официальный сайт организатора соревнования, лиги или федерации.", "Используется официальный регулирующий орган вида спорта, указанного в маркете."] }, data: ["Учитывается только официальный результат матча.", "Учитываются овертайм, дополнительное время и серии пенальти, если они официально входят в правила соревнования."], time: ["После публикации официального окончательного результата регулирующим органом."], rules: ["Учитываются только официально опубликованные результаты.", "Статистика, сообщения СМИ и лайв-трекеры не считаются источником результата.", "Дисциплинарные изменения после завершения матча игнорируются."], finality: ["Результат окончателен после официальной публикации регулирующим органом."] },
    finance: { summary: "Маркет завершается результатом «ДА», если актив или акция выполняет условие по официальным данным закрытия биржи. В противном случае результат — «НЕТ».", source: ["Рыночные данные Pyth Network."], data: ["Только официальная цена закрытия.", "Пара: актив/USD или акция/USD согласно листингу.", "Сессия: только основные торговые часы."], time: ["Официальное закрытие рынка в указанный торговый день с пересчетом в UTC.", "Точная минутная свеча, в которую попадает время окончания маркета по UTC."], rules: ["Действительна только официальная цена закрытия.", "Премаркет, постмаркет, OTC и альтернативные площадки исключаются.", "Опубликованные биржей данные окончательны."], finality: ["Результат окончателен после публикации биржей данных закрытия."] },
    economy: { summary: "Маркет завершается результатом «ДА», если официально опубликованный экономический показатель выполняет указанное условие. В противном случае результат — «НЕТ».", source: ["Официальное государственное статистическое ведомство."], data: ["Первый официальный выпуск данных.", "Последующие пересмотры не учитываются."], time: ["В момент публикации официального выпуска данных."], rules: ["Прогнозы, оценки и частные данные игнорируются.", "Учитывается только первый выпуск, а не пересмотры."], finality: ["Первая официальная публикация является окончательной."] },
    science: { summary: "Маркет завершается результатом «ДА», если факт события официально подтвержден. В противном случае результат — «НЕТ».", source: ["Официальная организация, ответственная за событие."], data: ["Учитывается только официальное подтверждение.", "Оно должно подтверждаться публичным заявлением или официальной записью."], time: ["В момент официального подтверждения завершения события."], rules: ["Слухи, телеметрия и стороннее отслеживание не учитываются.", "Действительны только официальные объявления."], finality: ["Официальное подтверждение является окончательным."] },
    politics: { summary: "Маркет завершается результатом «ДА», если кандидат или вариант официально сертифицирован победителем выборов. В противном случае результат — «НЕТ».", source: ["Официальный избирательный орган.", "Либо соответствующая государственная или региональная избирательная комиссия."], data: ["Учитываются только сертифицированные окончательные результаты.", "Официальные пересчеты учитываются, если входят в процесс сертификации."], time: ["После официальной сертификации результатов выборов."], rules: ["Экзитполы, прогнозы и объявления СМИ не учитываются.", "Действительны только сертифицированные результаты."], finality: ["Сертификация окончательна и обязательна для определения результата."] },
    cinema: { summary: "Маркет завершается результатом «ДА», если официально сообщается о достижении указанной выручки или результата. В противном случае результат — «НЕТ».", source: ["Официальный сервис учета кассовых сборов."], data: ["Если указано, используются мировые кассовые сборы.", "Учитываются только официально опубликованные значения."], time: ["После публикации официальных данных о выручке."], rules: ["Оценки и прогнозы не учитываются.", "Учитываются только проверенные публикации."], finality: ["Официально опубликованные данные являются окончательными."] },
    other: { summary: "Маркет завершается результатом «ДА», если указанное условие выполнено согласно первичному источнику по теме. В противном случае результат — «НЕТ».", source: ["Официальный источник, публикация, организатор или авторитетный поставщик данных, указанный в названии или контексте маркета."], data: ["Тема, показатель, порог и область определяются названием и контекстом маркета.", "Если источник указан явно, действителен только он."], time: ["Время окончания маркета либо официальное время публикации или финализации соответствующего результата."], rules: ["Слухи, неофициальные публикации и вторичные пересказы не считаются действительными первичными источниками.", "Неоднозначные исходы определяются по наиболее ясному буквальному прочтению названия или контекста маркета."], finality: ["После определения результат окончателен и не меняется из-за последующих исправлений или споров."] },
  },
  zh: {
    sections: { source: "主要结算来源", data: "数据规范", time: "结算时间", rules: "规则", finality: "最终性" },
    crypto: { summary: "如果根据 {{venue}} 现货市场中 {{pair}} 交易对的数据满足指定条件，本市场结算为“是”；否则结算为“否”。", source: ["{{venue}} 现货市场数据。"], data: ["交易对：{{pair}}", "市场：仅限现货", "周期：1 分钟 K 线（1m）", "价格字段：OHLC 最高价或市场标题指定的指标。"], time: ["包含市场到期时间（UTC）的准确 1 分钟 K 线。"], rules: ["仅 {{venue}} 现货数据有效。", "不采用期货、衍生品、指数价格或其他交易所的数据。", "采用结算时 {{venue}} 已发布的 K 线数据。"], finality: ["市场结算后结果即为最终结果，不因后续数据修正或争议而更改。"] },
    qubicEcosystem: { summary: "如果指定的 Qubic 生态条件在结算时间前得到满足，本市场结算为“是”；否则结算为“否”。", source: ["Qubic 网络数据、Qubic 生态官方来源，或市场标题及上下文中明确指定的来源。"], data: ["指标以及资产或项目范围由市场标题和上下文决定。", "链上数值必须来自 Qubic 网络或认可的 Qubic 公共数据接口。", "链下生态公告必须来自相关项目的官方来源。"], time: ["市场指定的准确到期时间或 Qubic tick；使用时间戳时以 UTC 为准。"], rules: ["如存在主要来源，非官方镜像、截图及第三方摘要均无效。", "如果市场标题指定了具体指标，则仅使用该指标。"], finality: ["市场结算后结果即为最终结果，不因后续数据修正或争议而更改。"] },
    sports: { summary: "如果官方管理机构宣布指定结果为赛事最终结果，本市场结算为“是”；否则结算为“否”。", sources: { football: ["足球赛事组织方官方网站。", "例如：FIFA 或 UEFA。"], basketball: ["篮球赛事组织方官方网站。", "例如：NBA。"], tennis: ["网球赛事组织方官方网站。", "例如：ATP 或 WTA。"], hockey: ["冰球赛事组织方官方网站。", "例如：NHL。"], mma: ["综合格斗赛事组织方官方网站。", "例如：UFC。"], chess: ["国际象棋赛事组织方官方网站。", "例如：FIDE。"], default: ["赛事组织方、联赛或协会的官方网站。", "采用市场所述运动项目的官方管理机构。"] }, data: ["仅采用官方比赛结果。", "如果加时赛、延长赛或点球大战属于赛事正式规则，则计入结果。"], time: ["官方管理机构发布正式最终结果时。"], rules: ["仅正式发布的结果有效。", "统计数据、媒体报道或实时追踪均无效。", "比赛结束后的纪律处分变更不予考虑。"], finality: ["官方管理机构发布结果后，该结果即为最终结果。"] },
    finance: { summary: "如果指定资产或股票根据交易所官方收盘数据满足条件，本市场结算为“是”；否则结算为“否”。", source: ["Pyth Network 市场数据。"], data: ["仅采用官方收盘价。", "交易对：挂牌的资产/USD 或股票/USD。", "交易时段：仅正常交易时间。"], time: ["指定交易日的官方收盘时间，并换算为 UTC。", "包含市场到期时间（UTC）的准确 1 分钟 K 线。"], rules: ["仅官方收盘价有效。", "盘前、盘后、场外交易及其他交易场所均不计入。", "交易所发布的数据为最终数据。"], finality: ["交易所发布收盘数据后即为最终结果。"] },
    economy: { summary: "如果官方发布的经济指标满足指定条件，本市场结算为“是”；否则结算为“否”。", source: ["政府官方统计机构。"], data: ["首次官方数据发布。", "不考虑后续修订。"], time: ["官方数据发布时。"], rules: ["预测、估算及私人数据均不采用。", "仅首次发布有效，修订数据无效。"], finality: ["首次官方发布即为最终结果。"] },
    science: { summary: "如果事件已被正式确认发生，本市场结算为“是”；否则结算为“否”。", source: ["负责该事件的官方组织。"], data: ["仅官方确认有效。", "必须可通过公开声明或官方记录验证。"], time: ["事件完成得到正式确认时。"], rules: ["传闻、遥测或第三方追踪均无效。", "仅官方公告有效。"], finality: ["官方确认为最终结果。"] },
    politics: { summary: "如果候选人或选项被正式认证为选举获胜者，本市场结算为“是”；否则结算为“否”。", source: ["官方选举机构。", "或相关国家或地区选举委员会。"], data: ["仅经认证的最终结果有效。", "如果官方重新计票属于认证流程，则予以计入。"], time: ["选举结果得到正式认证时。"], rules: ["出口民调、预测和媒体宣布均无效。", "仅经认证的结果有效。"], finality: ["认证结果对市场结算具有最终约束力。"] },
    cinema: { summary: "如果指定票房或结果被正式报告为已达成，本市场结算为“是”；否则结算为“否”。", source: ["官方票房追踪机构。"], data: ["如有指定，则采用全球总票房。", "仅采用正式发布的数据。"], time: ["官方票房数据发布时。"], rules: ["估算和预测无效。", "仅经核实的报告有效。"], finality: ["正式发布的数据为最终数据。"] },
    other: { summary: "如果根据该主题的主要来源满足指定条件，本市场结算为“是”；否则结算为“否”。", source: ["市场标题或上下文指定的官方来源、出版物、组织方或权威数据提供者。"], data: ["主题、指标、阈值和范围由市场标题及上下文决定。", "如果明确指定来源，则仅该来源有效。"], time: ["市场到期时间，或相关结果的官方发布时间或最终确认时间。"], rules: ["传闻、非官方帖子及二手摘要不能作为有效主要来源。", "存在歧义时，按照市场标题或上下文最清晰的字面含义结算。"], finality: ["市场结算后结果即为最终结果，不因后续修正或争议而更改。"] },
  },
};

Object.entries(eventRuleTranslations).forEach(([language, translations]) => {
  resources[language].translation.eventRules = translations;
});
