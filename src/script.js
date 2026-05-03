    const DEFAULT_LANGUAGE = 'en';
    const SETTINGS_KEY = 'mm_settings_v2';
    const CONTENT_KEY = 'mm_content_v1';
    const LEADERBOARD_KEY = 'mm_leaderboard_v1';
    const LEGACY_WORDS_KEY = 'mm_words_v2';
    const QUICK_GAME_KEY = 'mm_quick_game_v1';
    const USER_ID_KEY = 'mm_user_id_v1';
    const USER_ID_BACKUP_SCHEMA = 'mimimania.user-id.v1';
    const APP_STORAGE_PREFIX = 'mm_';
    const AVAILABLE_THEMES = ['cosmic', 'liquid-glass', 'material3', 'light-mode', 'dark-mode', 'high-contrast'];
    const THEMES_WITH_MUSIC = ['cosmic', 'liquid-glass', 'material3'];
    const THEME_MUSIC_PREFIX = {
      cosmic: 'cosmic',
      'liquid-glass': 'autumn',
      material3: 'spring',
      'light-mode': 'light',
      'dark-mode': 'dark',
      'high-contrast': 'contrast'
    };
    const GAMEPLAY_MUSIC_SCREENS = ['game', 'score', 'final', 'guest'];
    const MUSIC_ASSET_BASE = './assets/songs';
    const SUPPORTED_LANGUAGES = ['pt', 'en', 'es', 'fr', 'de', 'it'];
    const LANGUAGE_HTML_MAP = { pt: 'pt-BR', en: 'en', es: 'es', fr: 'fr', de: 'de', it: 'it' };
    const GAME_TYPES = ['mime', 'drawing'];
    const LEADERBOARD_MODE_KEYS = ['mimeTeams', 'mimeFfa', 'drawingTeams', 'drawingFfa'];
    const LEADERBOARD_PAGE_SIZE = 10;
    const LEADERBOARD_DEFAULT_AVATAR = './assets/player-default.svg';
    const DIFFICULTY_KEYS = ['easy', 'normal', 'hard'];
    const CATEGORY_KEYS = ['objects', 'actions', 'animals', 'movies', 'professions', 'celebrities'];
    const CATEGORY_ICONS = { objects: '🧸', actions: '🏃', animals: '🐾', movies: '🎬', professions: '👔', celebrities: '⭐' };
    const DIFFICULTY_ICONS = { easy: '🌱', normal: '⚡', hard: '🔥' };
    const DEFAULT_CORRECT_POINTS = 10;
    const DEFAULT_WRONG_PENALTY_POINTS = 0;
    const DEFAULT_FFA_GUESSER_POINTS = 5;
    const CORE_PACK_ID = 'core-default';
    const WORD_PACK_SCHEMA = 'mimimania.wordpack.v1';
    const PACK_SIGNATURE_ALGORITHM = 'ECDSA_P256_SHA256';
    const PACK_SIGNATURE_CONTEXT = 'mimimania-word-pack:v1';
    // The app validates purchased packs with a public key only. Keep the
    // matching private key outside this repository and use it only internally.
    const PACK_SIGNING_PUBLIC_KEY = {
      kty: 'EC',
      crv: 'P-256',
      x: 'FJe_7l8WYaFoxOoUr6pQcUkCJtq0yF10kDEqIyLHbqg',
      y: 'u9aaOBq0dS-14a_64f5LDo_NNIL9CwNYzSH9xlKkTX0',
      ext: true
    };
    const KO_FI_WIDGET_SCRIPT_URL = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    const KO_FI_SLUG = 'insightxlabgamestudio';
    const APP_PUBLIC_URL = 'https://insight-x-lab-technologies.github.io/TrustNoOne/';
    const SOCIAL_WEB_FALLBACKS = {
      instagram: 'https://www.instagram.com/',
      tiktok: 'https://www.tiktok.com/'
    };
    const DONATION_LINKS = {
      buyMeCoffee: 'https://buymeacoffee.com/insight.x.lab.game.studio',
      koFi: `https://ko-fi.com/${KO_FI_SLUG}`
    };
    let currentLanguage = DEFAULT_LANGUAGE;

    function clone(value) {
      return JSON.parse(JSON.stringify(value));
    }

    function generateUserId() {
      if (crypto?.randomUUID) return `mmu_${crypto.randomUUID()}`;
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return `mmu_${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
    }

    function getOrCreateUserId() {
      const saved = localStorage.getItem(USER_ID_KEY);
      if (saved) return saved;
      const nextUserId = generateUserId();
      localStorage.setItem(USER_ID_KEY, nextUserId);
      return nextUserId;
    }

    let appUserId = getOrCreateUserId();

    function getNestedValue(obj, path) {
      return path.split('.').reduce((acc, key) => acc && acc[key], obj);
    }

    const TRANSLATIONS = {
      pt: {
        meta: { documentTitle: 'Trust No One' },
        common: {
          back: '← Voltar',
          add: '+ Adicionar',
          copy: 'Copiar',
          continue: '▶️ Continuar',
          restart: '🔄 Reiniciar',
          home: '🏠 Início',
          pointsShort: 'pts',
          playerSingular: 'jogador',
          playerPlural: 'jogadores',
          roundSingular: 'rodada',
          roundPlural: 'rodadas'
        },
        language: {
          pt: 'Português',
          en: 'English',
          es: 'Español',
          fr: 'Français',
          de: 'Deutsch',
          it: 'Italiano'
        },
        dev: {
          mode: 'Modo de desenvolvimento',
          description: 'Teste rapidamente o layout em mobile, tablet e desktop.',
          previewLabel: 'Prévia de layout',
          preview: {
            auto: 'Auto',
            mobile: 'Mobile',
            tablet: 'Tablet',
            desktop: 'Desktop'
          }
        },
        home: {
          title: 'Trust No One',
          subtitle: 'Uma nave à deriva. Um Android hackeado. Ninguém é totalmente confiável.',
          enterFullscreen: 'Tela cheia',
          exitFullscreen: 'Sair da tela cheia',
          newGame: '🎮 Nova Partida',
          multiDeviceGame: '📡 Conectar Dispositivos',
          multiDeviceOnline: 'On-line',
          multiDeviceOffline: 'Off-line',
          multiDeviceSummary: ({ status, count }) => `${status} | ${count} device${count !== 1 ? 's' : ''} conectado${count !== 1 ? 's' : ''}`,
          quickGame: '⚡ Jogo Rápido',
          wordBank: '🧩 Conteúdo e Expansões',
          donate: '❤️ Doar',
          settings: '⚙️ Configurações',
          leaderboard: '🏅 Placar Histórico',
          installOnDevice: '📲 Instalar no dispositivo',
          howToTitle: '🏆 Como jogar',
          howTo: {
            setupTitle: 'Monte a partida',
            setupDesc: 'Escolha entre times ou todos contra todos, defina rodadas, dificuldade e categorias.',
            turnTitle: 'Veja e atue',
            turnDesc: 'Um jogador vê a palavra, memoriza e faz mímica ou desenha enquanto o resto tenta adivinhar.',
            timerTitle: 'Corra contra o tempo',
            timerDesc: 'O cronômetro, as dicas e os sons de alerta ajudam a manter cada turno rápido e divertido.',
            winTitle: 'Marque pontos e vença',
            winDesc: 'Cada acerto vale 10 pontos. No fim das rodadas, o placar decide o vencedor.'
          }
        },
        multiDevice: {
          title: 'Partida Multi Device',
          chooseTitle: 'O que você quer fazer?',
          chooseDesc: 'Abra uma sessão para controlar a partida ou conecte este device como tela auxiliar.',
          chooseHost: '📡 Abrir uma sessão',
          chooseJoin: '🔗 Conectar em uma sessão',
          changeChoice: 'Trocar opção',
          hostTitle: '📡 Abrir sessão',
          hostDesc: 'Este dispositivo controla a partida. Os outros entram para ver timer, dicas e desenho.',
          openSession: 'Abrir sessão',
          hostCreating: 'Criando sessão...',
          hostReady: 'Sessão aberta. Escaneie o QR Code nos outros devices.',
          hostError: 'Não foi possível abrir a sessão.',
          sessionCode: 'Código da sessão:',
          guestsConnected: ({ count }) => `${count} device${count !== 1 ? 's' : ''} conectado${count !== 1 ? 's' : ''}`,
          online: 'On-line',
          offline: 'Off-line',
          continueSetup: 'Continuar configuração',
          joinTitle: '🔗 Conectar',
          joinDesc: 'Entre como tela auxiliar para acompanhar a partida do host.',
          joinCodeLabel: 'Código ou link da sessão',
          joinCodePlaceholder: 'Cole o código ou link',
          joinSession: 'Conectar na sessão',
          joinHelp: 'Você também pode escanear o QR Code exibido no host.',
          waitingTitle: 'Aguardando dados da partida',
          guestLabel: 'Tela auxiliar',
          connecting: 'Conectando...',
          connected: 'Conectado',
          disconnected: 'Desconectado',
          guestWaiting: 'Aguardando o host iniciar a partida.',
          guestPreparing: 'Aguardando a palavra ser revelada.',
          guestMemorizing: 'A rodada vai começar.',
          guestPlaying: 'Adivinhem!',
          guestScore: 'Aguardando o próximo turno.',
          guestFinal: 'Partida finalizada.',
          liveDrawing: '✏️ Desenho ao vivo',
          disconnect: 'Desconectar',
          linkCopied: '🔗 Link da sessão copiado!',
          missingSession: 'Informe o código da sessão.',
          peerUnavailable: 'PeerJS não carregou. Verifique a conexão e tente novamente.',
          qrUnavailable: 'QR Code indisponível. Use o link ou código da sessão.'
        },
        setup: {
          title: 'Nova Partida',
          gameTypeTitle: '1️⃣ Tipo do Jogo',
          gameTypeMimeName: 'Mímica',
          gameTypeMimeDesc: 'Atue sem falar',
          gameTypeDrawingName: 'Desenho',
          gameTypeDrawingDesc: 'Desenhe a palavra',
          modeTitle: '2️⃣ Modo de Jogo',
          modeTeamsName: 'Dois Times',
          modeTeamsDesc: 'Equipes competem',
          modeFfaName: 'Cada um por si',
          modeFfaDesc: 'Todos contra todos',
          teamPlayersTitle: '3️⃣ Jogadores por Time',
          playersTitle: '3️⃣ Jogadores',
          teamAPlaceholder: 'Nome do Time A',
          teamBPlaceholder: 'Nome do Time B',
          playerNamePlaceholder: 'Nome do jogador...',
          teamHelper: '💡 Mínimo 1 por time, máximo 3 por time (até 6 jogadores)',
          ffaHelper: '💡 Mínimo 3, máximo 6 jogadores',
          difficultyTitle: '4️⃣ Dificuldade',
          difficultyEasyDesc: 'Ótimo para crianças e iniciantes',
          difficultyNormalDesc: 'Desafio equilibrado para a família',
          difficultyHardDesc: 'Palavras complexas, para os corajosos!',
          optionsTitle: '5️⃣ Opções de Jogo',
          randomChallengeLabel: 'Desafio Aleatório',
          randomChallengeSub: 'Adiciona modificadores à mímica',
          randomChallengeDisabledSub: 'Indisponível no modo desenho',
          categoriesLabel: 'Categorias Disponíveis',
          coreCategoriesLabel: 'Categorias Core',
          premiumCategoriesLabel: 'Categorias Premium',
          matchTitle: '6️⃣ Configurar Partida',
          roundsLabel: 'Número de Rodadas',
          roundsSub: 'Quantas rodadas por jogador',
          startGame: '🎭 Começar o Jogo!'
        },
        difficulty: {
          easy: 'Fácil',
          normal: 'Normal',
          hard: 'Difícil'
        },
        category: {
          objects: { plural: 'Objetos', singular: 'Objeto', tab: '🧸 Objetos', option: '🧸 Objetos' },
          actions: { plural: 'Ações', singular: 'Ação', tab: '🏃 Ações', option: '🏃 Ações' },
          animals: { plural: 'Animais', singular: 'Animal', tab: '🐾 Animais', option: '🐾 Animais' },
          movies: { plural: 'Filmes', singular: 'Filme', tab: '🎬 Filmes', option: '🎬 Filmes' },
          professions: { plural: 'Profissões', singular: 'Profissão', tab: '👔 Profissões', option: '👔 Profissões' },
          celebrities: { plural: 'Celebridades', singular: 'Celebridade', tab: '⭐ Celebridades', option: '⭐ Celebridades' }
        },
        game: {
          currentPlayerLabel: 'Vez de fazer a mímica:',
          currentPlayerDrawingLabel: 'Vez de desenhar:',
          readyTitle: 'Prontos para ver a palavra?',
          readyDrawingTitle: 'Prontos para ver o que desenhar?',
          readySub: 'Só o mimo deve ver! Os outros fechem os olhos! 👀',
          readyDrawingSub: 'Só quem vai desenhar deve ver! Os outros fechem os olhos! 👀',
          revealWord: '🎲 Revelar Palavra',
          memorizeTitle: '⚡ Memorize a palavra!',
          startsIn: 'O jogo começa em...',
          onlyMimeCanSee: 'Só o mimo pode ver!',
          onlyDrawerCanSee: 'Só quem desenha pode ver!',
          secondsLabel: 'SEGUNDOS',
          hiddenWord: 'Palavra oculta',
          hintTitle: '💡 Dica',
          showWord: '👁️ Mostrar palavra',
          hideWord: '🙈 Ocultar palavra',
          correct: '✅ Acertou!',
          wrong: '❌ Errou / Skip',
          challengePrefix: '🎯 Desafio:'
        },
        drawing: {
          canvasLabel: 'Área de desenho',
          toolbarLabel: 'Ferramentas de desenho',
          penThick: 'Linha grossa',
          penThin: 'Linha fina',
          eraserThick: 'Borracha grossa',
          eraserThin: 'Borracha fina',
          clear: 'Limpar canvas'
        },
        result: {
          correctTitle: 'Acertou!',
          wrongTitle: 'Errou!',
          timeUpTitle: 'Tempo esgotado!',
          guesserLabel: 'Quem acertou?',
          guesserPlaceholder: 'Selecione quem adivinhou',
          nextTurn: '➡️ Próximo turno'
        },
        scoreManager: {
          manageButton: '⚖️ Gerenciar',
          title: 'Gerenciar placar',
          backToGame: '← Voltar ao jogo',
          currentScoreTitle: 'Placar atual',
          resetInputs: '↺ Recarregar',
          saveAndReturn: 'Salvar e voltar'
        },
        score: {
          title: '🏆 Placar',
          nextRoundTitle: '🎊 Próxima Rodada'
        },
        final: {
          winnerLabel: 'VENCEDOR!',
          resultTitle: '📊 Resultado Final',
          playAgain: '🎮 Jogar de Novo',
          tie: 'EMPATE!'
        },
        leaderboard: {
          title: 'Placar Histórico',
          subtitle: 'Ranking dos melhores jogadores em todos os modos e tipos de jogo.',
          sortLabel: 'Ordenar por',
          sortSub: 'Compare pontuação total, partidas ou modos específicos.',
          resetButton: 'Apagar resultados',
          listTitle: 'Jogadores',
          emptyState: 'Nenhum resultado registrado ainda.',
          pointsLabel: 'pontos',
          matchesLabel: 'partidas',
          summaryLabel: 'Resultados salvos',
          playerFallbackTitle: 'Novo desafiante',
          tab: {
            overall: 'Ranking geral',
            mime: 'Mímica',
            drawing: 'Desenho'
          },
          filter: {
            gameType: 'Tipo de jogo',
            gameMode: 'Modo de jogo',
            allTypes: 'Todos os tipos',
            allTypesSub: 'Ranking geral',
            mimeSub: 'Atue sem falar',
            drawingSub: 'Desenhe a palavra',
            allModes: 'Todos os modos',
            allModesSub: 'Todas as partidas',
            teamsSub: 'Equipes competem',
            ffaSub: 'Todos contra todos'
          },
          sort: {
            total: 'Total de pontos',
            matches: 'Partidas',
            mimeTeams: 'Mímica · Times',
            mimeFfa: 'Mímica · Free For All',
            drawingTeams: 'Desenho · Times',
            drawingFfa: 'Desenho · Free For All',
            name: 'Nome'
          },
          mode: {
            mimeTeams: 'Mímica · Times',
            mimeFfa: 'Mímica · Free For All',
            drawingTeams: 'Desenho · Times',
            drawingFfa: 'Desenho · Free For All'
          }
        },
        wordbank: {
          title: 'Conteúdo e Expansões',
          addTitle: '➕ Adicionar Palavra',
          newWordPlaceholder: 'Digite a palavra...',
          addToDifficulty: 'Será adicionada à dificuldade:',
          addButton: '➕ Adicionar Palavra',
          listTitle: '📋 Palavras',
          resetButton: '↺ Restaurar',
          challengesTitle: '🎯 Desafios Core',
          addChallengeTitle: '🎯 Adicionar Desafio',
          newChallengePlaceholder: 'Digite o desafio...',
          addChallengeButton: '➕ Adicionar Desafio',
          installPackTitle: '📦 Instalar pack',
          installPackSub: 'Envie o arquivo .json comprado para liberar novas palavras neste dispositivo.',
          selectPackFile: '📁 Escolher arquivo',
          installedPacksTitle: 'Packs instalados',
          noInstalledPacks: 'Nenhum pack extra instalado ainda.',
          packEnabled: 'Ativo',
          packDisabled: 'Inativo',
          removePack: 'Remover',
          packPreviewTitle: '⭐ Conteúdo do pack',
          packPreviewPrompt: 'Clique em um pack instalado para ver palavras e desafios.',
          packPreviewWordsTitle: 'Palavras do pack',
          packPreviewChallengesTitle: 'Challenges do pack',
          packPreviewNoWords: 'Nenhuma palavra neste idioma e dificuldade.',
          packPreviewNoChallenges: 'Nenhum challenge neste idioma.',
          packPreviewSelected: ({ name }) => `Exibindo: ${name}`
        },
        settings: {
          title: 'Configurações',
          timerTitle: '⏱️ Timer',
          roundTimeLabel: 'Tempo por Rodada',
          roundTimeSub: 'Segundos para adivinhar',
          penaltyLabel: 'Penalidade por Skip',
          penaltySub: '−10 pontos ao pular',
          correctPointsLabel: 'Pontos por acerto',
          correctPointsSub: 'Pontos para quem faz a mímica ou desenho',
          wrongPenaltyPointsLabel: 'Pontos perdidos por erro',
          wrongPenaltyPointsSub: 'Desconta pontos quando o jogador erra ou o tempo acaba',
          ffaGuesserPointsLabel: 'Pontos para quem adivinha (FFA)',
          ffaGuesserPointsSub: 'No Free For All, escolha quem acertou após cada acerto',
          ffaGuesserPointsValueLabel: 'Pontos de quem acertou',
          ffaGuesserPointsValueSub: 'Valor padrão inicial: 5 pontos',
          generalTitle: '⚙️ Configurações Gerais',
          languageLabel: 'Idioma',
          languageSub: 'Altera a interface e o conteúdo disponível no jogo',
          alertSoundLabel: 'Som de Alerta',
          alertSoundSub: 'Beep nos últimos 10 segundos',
          navigationSoundLabel: 'Som de Navegação',
          navigationSoundSub: 'Som ao clicar nos botões da interface',
          gameroomMusicLabel: 'Música dos menus',
          gameroomMusicSub: 'Toca na página inicial, setup e configurações',
          gameplayMusicLabel: 'Música do gameplay',
          gameplayMusicSub: 'Toca durante preparação, timer e placares',
          userIdTitle: '🪪 ID de compra',
          userIdLabel: 'Seu user_id',
          userIdSub: 'Use este código na compra de packs para que o arquivo seja emitido para este dispositivo.',
          copyUserId: 'Copiar',
          userIdBackupSub: 'Exporte um backup para restaurar este user_id depois de trocar de navegador ou restaurar a aplicação.',
          exportUserIdButton: 'Exportar user_id',
          importUserIdButton: 'Importar user_id',
          wordsTitle: '🎲 Palavras',
          shuffleWordsLabel: 'Embaralhar Palavras',
          shuffleWordsSub: 'Ordem aleatória a cada jogo',
          appearanceTitle: '🎨 Aparência',
          themeLabel: 'Tema visual',
          themeSub: 'Troque cores, transparências e tipografia da interface',
          resetAllTitle: '🧹 Restaurar aplicação',
          resetAllSub: 'Remove configurações, jogadores salvos, packs instalados e o user_id deste dispositivo.',
          resetAllButton: 'Restaurar tudo'
        },
        donate: {
          title: 'Apoie o Desafio da Mímica',
          chooseTitle: '❤️ Escolha como doar',
          subtitle: 'Selecione sua plataforma preferida para apoiar o jogo e ajudar a financiar novos packs de palavras, idiomas e melhorias.',
          buyMeCoffee: 'Buy Me a Coffee',
          buyMeCoffeeSub: 'Apoio rápido e direto com uma doação avulsa.',
          koFi: 'Ko-fi',
          koFiSub: 'Doe via Ko-fi e ajude o projeto a continuar crescendo.',
          whyTitle: '🎭 Por que doar?',
          whyLanguages: 'Seu apoio ajuda a financiar novos idiomas, packs de conteúdo e futuras expansões do banco de palavras.',
          whyUpdates: 'Também ajuda a manter o Desafio da Mímica atualizado com polimento, ajustes de balanceamento e novos recursos.'
        },
        share: {
          title: 'Trust No One',
          text: 'Venha jogar Trust No One comigo!',
          footerAriaLabel: 'Compartilhar Trust No One'
        },
        theme: {
          cosmic: 'Cósmico',
          'liquid-glass': 'Outono',
          material3: 'Primavera',
          'light-mode': 'Modo Claro',
          'dark-mode': 'Modo Escuro',
          'high-contrast': 'Alto Contraste'
        },
        footer: {
          copyPrefix: '© 2026 Trust No One · Insight X Lab Technologies'
        },
        teams: {
          defaultA: 'Time A',
          defaultB: 'Time B'
        },
        players: {
          defaultName: 'Jogador {number}'
        },
        dynamic: {
          roundDisplay: ({ current, total }) => `Rodada ${current} de ${total}`,
          diffCount: ({ difficulty, count }) => `${difficulty} · ${count} palavras disponíveis`,
          correctTeamPoints: ({ teamName, points }) => `+${points} pontos para ${teamName}!`,
          correctPlayerPoints: ({ playerName, points }) => `+${points} pontos para ${playerName}!`,
          guesserPoints: ({ playerName, points }) => `+${points} pontos para quem acertou: ${playerName}!`,
          correctWithGuesserPoints: ({ actorName, actorPoints, guesserName, guesserPoints }) => `+${actorPoints} para ${actorName} · +${guesserPoints} para ${guesserName}`,
          chooseGuesserPoints: ({ points }) => `Selecione quem acertou para ganhar +${points} pontos.`,
          penaltySkip: ({ points }) => `-${points} pontos (erro/skip)`,
          penaltyApplied: ({ playerName, points }) => `-${points} pontos para ${playerName}.`,
          timeUpPenalty: ({ playerName, points }) => `Tempo esgotado. -${points} pontos para ${playerName}.`,
          timeUpNoPoints: 'O tempo acabou! Sem pontos.',
          skippedNoPoints: 'Palavra pulada. Sem pontos.',
          scoreManagerContext: ({ round, total, playerName }) => `Rodada ${round} de ${total} · Vez de ${playerName}`,
          leaderboardSummary: ({ players, matches }) => `${players} jogador${players !== 1 ? 'es' : ''} · ${matches} partida${matches !== 1 ? 's' : ''}`,
          leaderboardModeStats: ({ points, matches }) => `${points} pts · ${matches} partida${matches !== 1 ? 's' : ''}`,
          leaderboardFooter: ({ shown, total }) => `Mostrando top ${shown} de ${total} jogador${total !== 1 ? 'es' : ''}`,
          roundSummary: ({ roundDone, remaining }) => `Fim da Rodada ${roundDone} — ${remaining} rodada${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}!`,
          wordAdded: ({ word, difficulty }) => `✅ "${word}" adicionada (${difficulty})!`,
          teamAdded: ({ name, teamName }) => `✅ ${name} em ${teamName}!`,
          playerAdded: ({ name }) => `✅ ${name} entrou!`,
          packInstalled: ({ name }) => `✅ Pack "${name}" instalado!`,
          packWordsSummary: ({ count }) => `${count} palavra${count !== 1 ? 's' : ''}`,
          packVersion: ({ version }) => `v${version}`,
          challengeAdded: ({ challenge }) => `✅ Desafio "${challenge}" adicionado!`
        },
        notifications: {
          duplicateWord: '⚠️ Palavra já existe!',
          duplicateChallenge: '⚠️ Desafio já existe!',
          bankRestored: '✅ Banco restaurado!',
          challengeRemoved: 'Desafio removido.',
          challengesRestored: '✅ Desafios restaurados!',
          leaderboardReset: '✅ Placar histórico apagado!',
          userIdCopied: '🪪 user_id copiado!',
          userIdExported: '🪪 Backup do user_id exportado!',
          userIdImported: '🪪 user_id restaurado!',
          userIdImportCancelled: 'Importação cancelada.',
          packInstallReading: 'Lendo arquivo...',
          packInstallSuccess: '✅ Pack instalado e ativado!',
          packInstallCancelled: 'Instalação cancelada.',
          packRemoved: 'Pack removido.',
          packToggled: 'Status do pack atualizado.',
          maxPlayers: '❌ Máximo 6 jogadores!',
          maxTeamPlayers: '❌ Máximo 3 por time!',
          minTeamPlayers: '❌ Mínimo 1 por time!',
          minFfaPlayers: '❌ Mínimo 3 jogadores!',
          donationLinkUnavailable: '⚠️ Configure o link de doação deste parceiro para ativá-lo.',
          shareCopied: '🔗 Link copiado!',
          shareUnavailable: '🔗 Link copiado para compartilhar.',
          shareCopyFailed: '⚠️ Não foi possível copiar o link.',
          shareInstagramFallback: '🔗 Link copiado. Cole no Instagram.',
          shareTikTokFallback: '🔗 Link copiado. Cole no TikTok.',
          fullscreenUnavailable: '⚠️ Tela cheia indisponível neste navegador.'
        },
        confirmations: {
          resetWords: 'Restaurar o banco de palavras padrão? Palavras customizadas serão perdidas.',
          resetChallenges: 'Restaurar os desafios padrão? Desafios customizados serão perdidos.',
          resetLeaderboard: 'Apagar todos os resultados do placar histórico?',
          resetAppDefaults: 'Restaurar toda a aplicação para o padrão? Configurações, jogadores salvos, packs instalados e user_id serão apagados.',
          replaceUserId: ({ currentUserId, importedUserId }) => `Substituir o user_id atual (${currentUserId}) pelo user_id importado (${importedUserId})? Use isso apenas para restaurar compras já emitidas para esse ID.`,
          restartGame: 'Reiniciar o jogo? Todo o progresso será perdido.',
          replacePack: ({ packName }) => `Já existe um pack instalado com este ID (${packName}). Substituir?`,
          removePack: ({ packName }) => `Remover o pack "${packName}" deste dispositivo?`
        },
        packErrors: {
          fileRequired: 'Selecione um arquivo de pack.',
          invalidJson: 'Arquivo inválido. Envie um JSON de pack.',
          invalidSchema: 'Schema do pack inválido.',
          invalidUser: 'Este pack foi emitido para outro user_id.',
          invalidPackId: 'pack_id ausente ou inválido.',
          invalidAlgorithm: 'Algoritmo de assinatura inválido.',
          invalidSignature: 'Assinatura inválida. O pack não foi instalado.',
          invalidContentHash: 'Hash do conteúdo inválido.',
          emptyPack: 'O pack não possui palavras ou desafios válidos.',
          cryptoUnavailable: 'Este navegador não suporta validação segura de packs.',
          reservedPackId: 'Este pack_id é reservado pelo jogo.'
        },
        userIdErrors: {
          fileRequired: 'Selecione um arquivo de user_id.',
          invalidJson: 'Arquivo inválido. Envie um JSON de user_id.',
          invalidSchema: 'Este arquivo não é um backup de user_id da MimiMania.',
          invalidUserId: 'O user_id do arquivo é inválido.'
        }
      },
      en: {
        meta: { documentTitle: 'Trust No One' },
        common: {
          back: '← Back',
          add: '+ Add',
          copy: 'Copy',
          continue: '▶️ Continue',
          restart: '🔄 Restart',
          home: '🏠 Home',
          pointsShort: 'pts',
          playerSingular: 'player',
          playerPlural: 'players',
          roundSingular: 'round',
          roundPlural: 'rounds'
        },
        language: {
          pt: 'Portuguese',
          en: 'English',
          es: 'Spanish',
          fr: 'French',
          de: 'German',
          it: 'Italian'
        },
        dev: {
          mode: 'Development mode',
          description: 'Quickly preview the layout on mobile, tablet, and desktop.',
          previewLabel: 'Layout preview',
          preview: {
            auto: 'Auto',
            mobile: 'Mobile',
            tablet: 'Tablet',
            desktop: 'Desktop'
          }
        },
        home: {
          title: 'Trust No One',
          subtitle: 'A drifting starship. A hacked Android. Nobody is fully safe.',
          enterFullscreen: 'Full screen',
          exitFullscreen: 'Exit full screen',
          newGame: '🎮 New Game',
          multiDeviceGame: '📡 Connect Devices',
          multiDeviceOnline: 'Online',
          multiDeviceOffline: 'Offline',
          multiDeviceSummary: ({ status, count }) => `${status} | ${count} device${count !== 1 ? 's' : ''} connected`,
          quickGame: '⚡ Quick Game',
          wordBank: '🧩 Content & Expansions',
          donate: '❤️ Donate',
          settings: '⚙️ Settings',
          leaderboard: '🏅 Leaderboard',
          installOnDevice: '📲 Install on Device',
          howToTitle: '🏆 How to play',
          howTo: {
            setupTitle: 'Set up the match',
            setupDesc: 'Choose teams or free for all, then set rounds, difficulty, and categories.',
            turnTitle: 'See it and act it out',
            turnDesc: 'One player sees the word, memorizes it, then acts or draws while everyone else guesses.',
            timerTitle: 'Race against the clock',
            timerDesc: 'The timer, hints, and alert sounds keep every turn fast, clear, and fun.',
            winTitle: 'Score and win',
            winDesc: 'Each correct answer is worth 10 points. At the end of the rounds, the scoreboard decides the winner.'
          }
        },
        multiDevice: {
          title: 'Multi Device Game',
          chooseTitle: 'What do you want to do?',
          chooseDesc: 'Open a session to control the game or connect this device as a companion screen.',
          chooseHost: '📡 Open a session',
          chooseJoin: '🔗 Join a session',
          changeChoice: 'Change option',
          hostTitle: '📡 Open session',
          hostDesc: 'This device controls the game. Other devices join to see the timer, hints, and drawing.',
          openSession: 'Open session',
          hostCreating: 'Creating session...',
          hostReady: 'Session open. Scan the QR Code on the other devices.',
          hostError: 'Could not open the session.',
          sessionCode: 'Session code:',
          guestsConnected: ({ count }) => `${count} device${count !== 1 ? 's' : ''} connected`,
          online: 'Online',
          offline: 'Offline',
          continueSetup: 'Continue setup',
          joinTitle: '🔗 Join',
          joinDesc: 'Join as a companion screen to follow the host game.',
          joinCodeLabel: 'Session code or link',
          joinCodePlaceholder: 'Paste the code or link',
          joinSession: 'Join session',
          joinHelp: 'You can also scan the QR Code shown on the host.',
          waitingTitle: 'Waiting for game data',
          guestLabel: 'Companion screen',
          connecting: 'Connecting...',
          connected: 'Connected',
          disconnected: 'Disconnected',
          guestWaiting: 'Waiting for the host to start the game.',
          guestPreparing: 'Waiting for the word to be revealed.',
          guestMemorizing: 'The round is about to start.',
          guestPlaying: 'Guess!',
          guestScore: 'Waiting for the next turn.',
          guestFinal: 'Game finished.',
          liveDrawing: '✏️ Live drawing',
          disconnect: 'Disconnect',
          linkCopied: '🔗 Session link copied!',
          missingSession: 'Enter the session code.',
          peerUnavailable: 'PeerJS did not load. Check the connection and try again.',
          qrUnavailable: 'QR Code unavailable. Use the session link or code.'
        },
        setup: {
          title: 'New Game',
          gameTypeTitle: '1️⃣ Game Type',
          gameTypeMimeName: 'Mime',
          gameTypeMimeDesc: 'Act without speaking',
          gameTypeDrawingName: 'Drawing',
          gameTypeDrawingDesc: 'Draw the word',
          modeTitle: '2️⃣ Game Mode',
          modeTeamsName: 'Two Teams',
          modeTeamsDesc: 'Teams compete',
          modeFfaName: 'Free for All',
          modeFfaDesc: 'Everyone versus everyone',
          teamPlayersTitle: '3️⃣ Players per Team',
          playersTitle: '3️⃣ Players',
          teamAPlaceholder: 'Team A name',
          teamBPlaceholder: 'Team B name',
          playerNamePlaceholder: 'Player name...',
          teamHelper: '💡 Minimum 1 per team, maximum 3 per team (up to 6 players)',
          ffaHelper: '💡 Minimum 3, maximum 6 players',
          difficultyTitle: '4️⃣ Difficulty',
          difficultyEasyDesc: 'Great for kids and beginners',
          difficultyNormalDesc: 'Balanced fun for the whole family',
          difficultyHardDesc: 'Complex words for the brave!',
          optionsTitle: '5️⃣ Game Options',
          randomChallengeLabel: 'Random Challenge',
          randomChallengeSub: 'Adds modifiers to the mime',
          randomChallengeDisabledSub: 'Unavailable in drawing mode',
          categoriesLabel: 'Available Categories',
          coreCategoriesLabel: 'Core Categories',
          premiumCategoriesLabel: 'Premium Categories',
          matchTitle: '6️⃣ Match Setup',
          roundsLabel: 'Number of Rounds',
          roundsSub: 'How many rounds per player',
          startGame: '🎭 Start Game!'
        },
        difficulty: {
          easy: 'Easy',
          normal: 'Normal',
          hard: 'Hard'
        },
        category: {
          objects: { plural: 'Objects', singular: 'Object', tab: '🧸 Objects', option: '🧸 Objects' },
          actions: { plural: 'Actions', singular: 'Action', tab: '🏃 Actions', option: '🏃 Actions' },
          animals: { plural: 'Animals', singular: 'Animal', tab: '🐾 Animals', option: '🐾 Animals' },
          movies: { plural: 'Movies', singular: 'Movie', tab: '🎬 Movies', option: '🎬 Movies' },
          professions: { plural: 'Professions', singular: 'Profession', tab: '👔 Professions', option: '👔 Professions' },
          celebrities: { plural: 'Celebrities', singular: 'Celebrity', tab: '⭐ Celebrities', option: '⭐ Celebrities' }
        },
        game: {
          currentPlayerLabel: 'Current mime player:',
          currentPlayerDrawingLabel: 'Current drawing player:',
          readyTitle: 'Ready to see the word?',
          readyDrawingTitle: 'Ready to see what to draw?',
          readySub: 'Only the mime should look! Everyone else close your eyes! 👀',
          readyDrawingSub: 'Only the drawing player should look! Everyone else close your eyes! 👀',
          revealWord: '🎲 Reveal Word',
          memorizeTitle: '⚡ Memorize the word!',
          startsIn: 'The game starts in...',
          onlyMimeCanSee: 'Only the mime can see it!',
          onlyDrawerCanSee: 'Only the drawing player can see it!',
          secondsLabel: 'SECONDS',
          hiddenWord: 'Hidden word',
          hintTitle: '💡 Hint',
          showWord: '👁️ Show word',
          hideWord: '🙈 Hide word',
          correct: '✅ Correct!',
          wrong: '❌ Wrong / Skip',
          challengePrefix: '🎯 Challenge:'
        },
        drawing: {
          canvasLabel: 'Drawing area',
          toolbarLabel: 'Drawing tools',
          penThick: 'Thick line',
          penThin: 'Thin line',
          eraserThick: 'Thick eraser',
          eraserThin: 'Thin eraser',
          clear: 'Clear canvas'
        },
        result: {
          correctTitle: 'Correct!',
          wrongTitle: 'Wrong!',
          timeUpTitle: 'Time is up!',
          guesserLabel: 'Who guessed it?',
          guesserPlaceholder: 'Select who guessed it',
          nextTurn: '➡️ Next turn'
        },
        scoreManager: {
          manageButton: '⚖️ Manage',
          title: 'Manage scoreboard',
          backToGame: '← Back to game',
          currentScoreTitle: 'Current score',
          resetInputs: '↺ Reload',
          saveAndReturn: 'Save and return'
        },
        score: {
          title: '🏆 Scoreboard',
          nextRoundTitle: '🎊 Next Round'
        },
        final: {
          winnerLabel: 'WINNER!',
          resultTitle: '📊 Final Result',
          playAgain: '🎮 Play Again',
          tie: 'TIE!'
        },
        leaderboard: {
          title: 'All Time Leaderboard',
          subtitle: 'Ranking of the best players across all game modes and types.',
          sortLabel: 'Sort by',
          sortSub: 'Compare total score, matches, or specific game modes.',
          resetButton: 'Clear results',
          listTitle: 'Players',
          emptyState: 'No results recorded yet.',
          pointsLabel: 'points',
          matchesLabel: 'matches',
          summaryLabel: 'Saved results',
          playerFallbackTitle: 'New challenger',
          tab: {
            overall: 'Overall ranking',
            mime: 'Mime',
            drawing: 'Drawing'
          },
          filter: {
            gameType: 'Game type',
            gameMode: 'Game mode',
            allTypes: 'All types',
            allTypesSub: 'Overall ranking',
            mimeSub: 'Act without speaking',
            drawingSub: 'Draw the word',
            allModes: 'All modes',
            allModesSub: 'All matches',
            teamsSub: 'Teams compete',
            ffaSub: 'Everyone versus everyone'
          },
          sort: {
            total: 'Total points',
            matches: 'Matches',
            mimeTeams: 'Mime · Teams',
            mimeFfa: 'Mime · Free For All',
            drawingTeams: 'Drawing · Teams',
            drawingFfa: 'Drawing · Free For All',
            name: 'Name'
          },
          mode: {
            mimeTeams: 'Mime · Teams',
            mimeFfa: 'Mime · Free For All',
            drawingTeams: 'Drawing · Teams',
            drawingFfa: 'Drawing · Free For All'
          }
        },
        wordbank: {
          title: 'Content & Expansions',
          addTitle: '➕ Add Word',
          newWordPlaceholder: 'Type the word...',
          addToDifficulty: 'It will be added to difficulty:',
          addButton: '➕ Add Word',
          listTitle: '📋 Words',
          resetButton: '↺ Restore',
          challengesTitle: '🎯 Core Challenges',
          addChallengeTitle: '🎯 Add Challenge',
          newChallengePlaceholder: 'Type the challenge...',
          addChallengeButton: '➕ Add Challenge',
          installPackTitle: '📦 Install pack',
          installPackSub: 'Upload the purchased .json file to unlock new words on this device.',
          selectPackFile: '📁 Choose file',
          installedPacksTitle: 'Installed packs',
          noInstalledPacks: 'No extra packs installed yet.',
          packEnabled: 'Enabled',
          packDisabled: 'Disabled',
          removePack: 'Remove',
          packPreviewTitle: '⭐ Pack content',
          packPreviewPrompt: 'Click an installed pack to see words and challenges.',
          packPreviewWordsTitle: 'Pack words',
          packPreviewChallengesTitle: 'Pack challenges',
          packPreviewNoWords: 'No words in this language and difficulty.',
          packPreviewNoChallenges: 'No challenges in this language.',
          packPreviewSelected: ({ name }) => `Showing: ${name}`
        },
        settings: {
          title: 'Settings',
          timerTitle: '⏱️ Timer',
          roundTimeLabel: 'Round Time',
          roundTimeSub: 'Seconds to guess',
          penaltyLabel: 'Skip Penalty',
          penaltySub: '−10 points when skipping',
          correctPointsLabel: 'Points for a correct answer',
          correctPointsSub: 'Points for the player acting or drawing',
          wrongPenaltyPointsLabel: 'Points lost for a mistake',
          wrongPenaltyPointsSub: 'Subtracts points when the player is wrong or time runs out',
          ffaGuesserPointsLabel: 'Points for the guesser (FFA)',
          ffaGuesserPointsSub: 'In Free for All, choose who guessed after each correct answer',
          ffaGuesserPointsValueLabel: 'Guesser points',
          ffaGuesserPointsValueSub: 'Initial default value: 5 points',
          generalTitle: '⚙️ General Settings',
          languageLabel: 'Language',
          languageSub: 'Changes the interface and the content available in the game',
          alertSoundLabel: 'Alert Sound',
          alertSoundSub: 'Beep during the last 10 seconds',
          navigationSoundLabel: 'Navigation Sound',
          navigationSoundSub: 'Sound when clicking interface buttons',
          gameroomMusicLabel: 'Menu Music',
          gameroomMusicSub: 'Plays on the home, setup, and settings screens',
          gameplayMusicLabel: 'Gameplay Music',
          gameplayMusicSub: 'Plays during preparation, timer, and score screens',
          userIdTitle: '🪪 Purchase ID',
          userIdLabel: 'Your user_id',
          userIdSub: 'Use this code when buying packs so the file is issued to this device.',
          copyUserId: 'Copy',
          userIdBackupSub: 'Export a backup to restore this user_id after switching browsers or resetting the application.',
          exportUserIdButton: 'Export user_id',
          importUserIdButton: 'Import user_id',
          wordsTitle: '🎲 Words',
          shuffleWordsLabel: 'Shuffle Words',
          shuffleWordsSub: 'Random order every game',
          appearanceTitle: '🎨 Appearance',
          themeLabel: 'Visual theme',
          themeSub: 'Change colors, transparencies, and interface typography',
          resetAllTitle: '🧹 Reset application',
          resetAllSub: 'Removes settings, saved players, installed packs, and this device user_id.',
          resetAllButton: 'Reset everything'
        },
        donate: {
          title: 'Support Charades Challenge',
          chooseTitle: '❤️ Choose how to donate',
          subtitle: 'Pick your preferred platform to support the game and help fund new word packs, languages, and updates.',
          buyMeCoffee: 'Buy Me a Coffee',
          buyMeCoffeeSub: 'Fast one-time support through Buy Me a Coffee.',
          koFi: 'Ko-fi',
          koFiSub: 'Donate with Ko-fi and keep the project growing.',
          whyTitle: '🎭 Why donate?',
          whyLanguages: 'Your support helps fund new languages, content packs, and future word bank expansions.',
          whyUpdates: 'It also helps keep Charades Challenge maintained with polish, balance tweaks, and new features.'
        },
        share: {
          title: 'Trust No One',
          text: 'Come play Trust No One with me!',
          footerAriaLabel: 'Share Trust No One'
        },
        theme: {
          cosmic: 'Cosmic',
          'liquid-glass': 'Autumn',
          material3: 'Spring',
          'light-mode': 'Light Mode',
          'dark-mode': 'Dark Mode',
          'high-contrast': 'High Contrast'
        },
        footer: {
          copyPrefix: '© 2026 Trust No One · Insight X Lab Technologies'
        },
        teams: {
          defaultA: 'Team A',
          defaultB: 'Team B'
        },
        players: {
          defaultName: 'Player {number}'
        },
        dynamic: {
          roundDisplay: ({ current, total }) => `Round ${current} of ${total}`,
          diffCount: ({ difficulty, count }) => `${difficulty} · ${count} available words`,
          correctTeamPoints: ({ teamName, points }) => `+${points} points for ${teamName}!`,
          correctPlayerPoints: ({ playerName, points }) => `+${points} points for ${playerName}!`,
          guesserPoints: ({ playerName, points }) => `+${points} points for the guesser: ${playerName}!`,
          correctWithGuesserPoints: ({ actorName, actorPoints, guesserName, guesserPoints }) => `+${actorPoints} for ${actorName} · +${guesserPoints} for ${guesserName}`,
          chooseGuesserPoints: ({ points }) => `Select who guessed it to receive +${points} points.`,
          penaltySkip: ({ points }) => `-${points} points (wrong/skip)`,
          penaltyApplied: ({ playerName, points }) => `-${points} points for ${playerName}.`,
          timeUpPenalty: ({ playerName, points }) => `Time is up. -${points} points for ${playerName}.`,
          timeUpNoPoints: 'Time is up! No points.',
          skippedNoPoints: 'Word skipped. No points.',
          scoreManagerContext: ({ round, total, playerName }) => `Round ${round} of ${total} · ${playerName}'s turn`,
          leaderboardSummary: ({ players, matches }) => `${players} player${players !== 1 ? 's' : ''} · ${matches} match${matches !== 1 ? 'es' : ''}`,
          leaderboardModeStats: ({ points, matches }) => `${points} pts · ${matches} match${matches !== 1 ? 'es' : ''}`,
          leaderboardFooter: ({ shown, total }) => `Showing top ${shown} of ${total} player${total !== 1 ? 's' : ''}`,
          roundSummary: ({ roundDone, remaining }) => `End of Round ${roundDone} — ${remaining} round${remaining !== 1 ? 's' : ''} remaining!`,
          wordAdded: ({ word, difficulty }) => `✅ "${word}" added (${difficulty})!`,
          teamAdded: ({ name, teamName }) => `✅ ${name} joined ${teamName}!`,
          playerAdded: ({ name }) => `✅ ${name} joined!`,
          packInstalled: ({ name }) => `✅ Pack "${name}" installed!`,
          packWordsSummary: ({ count }) => `${count} word${count !== 1 ? 's' : ''}`,
          packVersion: ({ version }) => `v${version}`,
          challengeAdded: ({ challenge }) => `✅ Challenge "${challenge}" added!`
        },
        notifications: {
          duplicateWord: '⚠️ Word already exists!',
          duplicateChallenge: '⚠️ Challenge already exists!',
          bankRestored: '✅ Word bank restored!',
          challengeRemoved: 'Challenge removed.',
          challengesRestored: '✅ Challenges restored!',
          leaderboardReset: '✅ Leaderboard cleared!',
          userIdCopied: '🪪 user_id copied!',
          userIdExported: '🪪 user_id backup exported!',
          userIdImported: '🪪 user_id restored!',
          userIdImportCancelled: 'Import cancelled.',
          packInstallReading: 'Reading file...',
          packInstallSuccess: '✅ Pack installed and enabled!',
          packInstallCancelled: 'Installation cancelled.',
          packRemoved: 'Pack removed.',
          packToggled: 'Pack status updated.',
          maxPlayers: '❌ Maximum 6 players!',
          maxTeamPlayers: '❌ Maximum 3 per team!',
          minTeamPlayers: '❌ At least 1 per team!',
          minFfaPlayers: '❌ At least 3 players!',
          donationLinkUnavailable: '⚠️ Configure this partner donation link to enable it.',
          shareCopied: '🔗 Link copied!',
          shareUnavailable: '🔗 Link copied for sharing.',
          shareCopyFailed: '⚠️ Could not copy the link.',
          shareInstagramFallback: '🔗 Link copied. Paste it into Instagram.',
          shareTikTokFallback: '🔗 Link copied. Paste it into TikTok.',
          fullscreenUnavailable: '⚠️ Full screen is unavailable in this browser.'
        },
        confirmations: {
          resetWords: 'Restore the default word bank? Custom words will be lost.',
          resetChallenges: 'Restore the default challenges? Custom challenges will be lost.',
          resetLeaderboard: 'Clear all All Time Leaderboard results?',
          resetAppDefaults: 'Reset the entire application to defaults? Settings, saved players, installed packs, and user_id will be erased.',
          replaceUserId: ({ currentUserId, importedUserId }) => `Replace the current user_id (${currentUserId}) with the imported user_id (${importedUserId})? Use this only to restore purchases already issued for that ID.`,
          restartGame: 'Restart the game? All progress will be lost.',
          replacePack: ({ packName }) => `A pack with this ID is already installed (${packName}). Replace it?`,
          removePack: ({ packName }) => `Remove the pack "${packName}" from this device?`
        },
        packErrors: {
          fileRequired: 'Select a pack file.',
          invalidJson: 'Invalid file. Upload a pack JSON.',
          invalidSchema: 'Invalid pack schema.',
          invalidUser: 'This pack was issued to another user_id.',
          invalidPackId: 'Missing or invalid pack_id.',
          invalidAlgorithm: 'Invalid signature algorithm.',
          invalidSignature: 'Invalid signature. The pack was not installed.',
          invalidContentHash: 'Invalid content hash.',
          emptyPack: 'The pack has no valid words or challenges.',
          cryptoUnavailable: 'This browser does not support secure pack validation.',
          reservedPackId: 'This pack_id is reserved by the game.'
        },
        userIdErrors: {
          fileRequired: 'Select a user_id file.',
          invalidJson: 'Invalid file. Upload a user_id JSON.',
          invalidSchema: 'This file is not a MimiMania user_id backup.',
          invalidUserId: 'The user_id in the file is invalid.'
        }
      },
      es: {
        meta: { documentTitle: 'Trust No One' },
        common: {
          back: '← Volver',
          add: '+ Añadir',
          copy: 'Copiar',
          continue: '▶️ Continuar',
          restart: '🔄 Reiniciar',
          home: '🏠 Inicio',
          pointsShort: 'pts',
          playerSingular: 'jugador',
          playerPlural: 'jugadores',
          roundSingular: 'ronda',
          roundPlural: 'rondas'
        },
        language: {
          pt: 'Portugués',
          en: 'Inglés',
          es: 'Español',
          fr: 'Francés',
          de: 'Alemán',
          it: 'Italiano'
        },
        dev: {
          mode: 'Modo de desarrollo',
          description: 'Prueba rápidamente el diseño en móvil, tableta y escritorio.',
          previewLabel: 'Vista del diseño',
          preview: {
            auto: 'Auto',
            mobile: 'Móvil',
            tablet: 'Tableta',
            desktop: 'Escritorio'
          }
        },
        home: {
          title: 'Desafío de Mímica',
          subtitle: 'Dibuja, Adivina y Diviértete en Familia',
          enterFullscreen: 'Pantalla completa',
          exitFullscreen: 'Salir de pantalla completa',
          newGame: '🎮 Nueva Partida',
          multiDeviceGame: '📡 Conectar dispositivos',
          multiDeviceOnline: 'En línea',
          multiDeviceOffline: 'Sin conexión',
          multiDeviceSummary: ({ status, count }) => `${status} | ${count} dispositivo${count !== 1 ? 's' : ''} conectado${count !== 1 ? 's' : ''}`,
          quickGame: '⚡ Juego Rápido',
          wordBank: '🧩 Contenido y Expansiones',
          donate: '❤️ Donar',
          settings: '⚙️ Configuración',
          leaderboard: '🏅 Clasificación histórica',
          installOnDevice: '📲 Instalar en el dispositivo',
          howToTitle: '🏆 Cómo jugar',
          howTo: {
            setupTitle: 'Prepara la partida',
            setupDesc: 'Elige entre equipos o todos contra todos y define rondas, dificultad y categorías.',
            turnTitle: 'Mira y representa',
            turnDesc: 'Un jugador ve la palabra, la memoriza y hace mímica o dibuja mientras los demás intentan adivinar.',
            timerTitle: 'Corre contra el tiempo',
            timerDesc: 'El temporizador, las pistas y los sonidos de alerta hacen que cada turno sea rápido y divertido.',
            winTitle: 'Suma puntos y gana',
            winDesc: 'Cada acierto vale 10 puntos. Al final de las rondas, el marcador define al ganador.'
          }
        },
        multiDevice: {
          title: 'Partida Multi Device',
          chooseTitle: '¿Qué quieres hacer?',
          chooseDesc: 'Abre una sesión para controlar la partida o conecta este dispositivo como pantalla auxiliar.',
          chooseHost: '📡 Abrir una sesión',
          chooseJoin: '🔗 Conectar a una sesión',
          changeChoice: 'Cambiar opción',
          hostTitle: '📡 Abrir sesión',
          hostDesc: 'Este dispositivo controla la partida. Los demás entran para ver temporizador, pistas y dibujo.',
          openSession: 'Abrir sesión',
          hostCreating: 'Creando sesión...',
          hostReady: 'Sesión abierta. Escanea el QR Code en los otros dispositivos.',
          hostError: 'No se pudo abrir la sesión.',
          sessionCode: 'Código de sesión:',
          guestsConnected: ({ count }) => `${count} dispositivo${count !== 1 ? 's' : ''} conectado${count !== 1 ? 's' : ''}`,
          online: 'En línea',
          offline: 'Sin conexión',
          continueSetup: 'Continuar configuración',
          joinTitle: '🔗 Conectar',
          joinDesc: 'Entra como pantalla auxiliar para seguir la partida del host.',
          joinCodeLabel: 'Código o enlace de sesión',
          joinCodePlaceholder: 'Pega el código o enlace',
          joinSession: 'Conectar a la sesión',
          joinHelp: 'También puedes escanear el QR Code mostrado en el host.',
          waitingTitle: 'Esperando datos de la partida',
          guestLabel: 'Pantalla auxiliar',
          connecting: 'Conectando...',
          connected: 'Conectado',
          disconnected: 'Desconectado',
          guestWaiting: 'Esperando que el host inicie la partida.',
          guestPreparing: 'Esperando que se revele la palabra.',
          guestMemorizing: 'La ronda va a empezar.',
          guestPlaying: '¡Adivinen!',
          guestScore: 'Esperando el próximo turno.',
          guestFinal: 'Partida finalizada.',
          liveDrawing: '✏️ Dibujo en vivo',
          disconnect: 'Desconectar',
          linkCopied: '🔗 ¡Enlace de sesión copiado!',
          missingSession: 'Introduce el código de sesión.',
          peerUnavailable: 'PeerJS no cargó. Revisa la conexión e inténtalo de nuevo.',
          qrUnavailable: 'QR Code no disponible. Usa el enlace o código de sesión.'
        },
        setup: {
          title: 'Nueva Partida',
          gameTypeTitle: '1️⃣ Tipo de Juego',
          gameTypeMimeName: 'Mímica',
          gameTypeMimeDesc: 'Actúa sin hablar',
          gameTypeDrawingName: 'Dibujo',
          gameTypeDrawingDesc: 'Dibuja la palabra',
          modeTitle: '2️⃣ Modo de Juego',
          modeTeamsName: 'Dos Equipos',
          modeTeamsDesc: 'Compiten por equipos',
          modeFfaName: 'Todos contra todos',
          modeFfaDesc: 'Cada quien por su cuenta',
          teamPlayersTitle: '3️⃣ Jugadores por Equipo',
          playersTitle: '3️⃣ Jugadores',
          teamAPlaceholder: 'Nombre del Equipo A',
          teamBPlaceholder: 'Nombre del Equipo B',
          playerNamePlaceholder: 'Nombre del jugador...',
          teamHelper: '💡 Mínimo 1 por equipo, máximo 3 por equipo (hasta 6 jugadores)',
          ffaHelper: '💡 Mínimo 3, máximo 6 jugadores',
          difficultyTitle: '4️⃣ Dificultad',
          difficultyEasyDesc: 'Ideal para niños y principiantes',
          difficultyNormalDesc: 'Desafío equilibrado para la familia',
          difficultyHardDesc: 'Palabras complejas para los valientes',
          optionsTitle: '5️⃣ Opciones de Juego',
          randomChallengeLabel: 'Desafío Aleatorio',
          randomChallengeSub: 'Añade modificadores a la mímica',
          randomChallengeDisabledSub: 'No disponible en modo dibujo',
          categoriesLabel: 'Categorías Disponibles',
          coreCategoriesLabel: 'Categorías Core',
          premiumCategoriesLabel: 'Categorías Premium',
          matchTitle: '6️⃣ Configurar Partida',
          roundsLabel: 'Número de Rondas',
          roundsSub: 'Cuántas rondas por jugador',
          startGame: '🎭 ¡Empezar Juego!'
        },
        difficulty: {
          easy: 'Fácil',
          normal: 'Normal',
          hard: 'Difícil'
        },
        category: {
          objects: { plural: 'Objetos', singular: 'Objeto', tab: '🧸 Objetos', option: '🧸 Objetos' },
          actions: { plural: 'Acciones', singular: 'Acción', tab: '🏃 Acciones', option: '🏃 Acciones' },
          animals: { plural: 'Animales', singular: 'Animal', tab: '🐾 Animales', option: '🐾 Animales' },
          movies: { plural: 'Películas', singular: 'Película', tab: '🎬 Películas', option: '🎬 Películas' },
          professions: { plural: 'Profesiones', singular: 'Profesión', tab: '👔 Profesiones', option: '👔 Profesiones' },
          celebrities: { plural: 'Celebridades', singular: 'Celebridad', tab: '⭐ Celebridades', option: '⭐ Celebridades' }
        },
        game: {
          currentPlayerLabel: 'Turno de hacer la mímica:',
          currentPlayerDrawingLabel: 'Turno de dibujar:',
          readyTitle: '¿Listos para ver la palabra?',
          readyDrawingTitle: '¿Listos para ver qué dibujar?',
          readySub: '¡Solo el mimo debe mirar! ¡Los demás cierren los ojos! 👀',
          readyDrawingSub: '¡Solo quien va a dibujar debe mirar! ¡Los demás cierren los ojos! 👀',
          revealWord: '🎲 Mostrar Palabra',
          memorizeTitle: '⚡ ¡Memoriza la palabra!',
          startsIn: 'El juego empieza en...',
          onlyMimeCanSee: '¡Solo el mimo puede verla!',
          onlyDrawerCanSee: '¡Solo quien dibuja puede verla!',
          secondsLabel: 'SEGUNDOS',
          hiddenWord: 'Palabra oculta',
          hintTitle: '💡 Pista',
          showWord: '👁️ Mostrar palabra',
          hideWord: '🙈 Ocultar palabra',
          correct: '✅ ¡Acertó!',
          wrong: '❌ Error / Skip',
          challengePrefix: '🎯 Desafío:'
        },
        drawing: {
          canvasLabel: 'Área de dibujo',
          toolbarLabel: 'Herramientas de dibujo',
          penThick: 'Línea gruesa',
          penThin: 'Línea fina',
          eraserThick: 'Borrador grueso',
          eraserThin: 'Borrador fino',
          clear: 'Limpiar canvas'
        },
        result: {
          correctTitle: '¡Acertó!',
          wrongTitle: '¡Falló!',
          timeUpTitle: '¡Tiempo agotado!',
          guesserLabel: '¿Quién acertó?',
          guesserPlaceholder: 'Selecciona quién adivinó',
          nextTurn: '➡️ Siguiente turno'
        },
        scoreManager: {
          manageButton: '⚖️ Gestionar',
          title: 'Gestionar marcador',
          backToGame: '← Volver al juego',
          currentScoreTitle: 'Marcador actual',
          resetInputs: '↺ Recargar',
          saveAndReturn: 'Guardar y volver'
        },
        score: {
          title: '🏆 Marcador',
          nextRoundTitle: '🎊 Próxima Ronda'
        },
        final: {
          winnerLabel: '¡GANADOR!',
          resultTitle: '📊 Resultado Final',
          playAgain: '🎮 Jugar de Nuevo',
          tie: '¡EMPATE!'
        },
        leaderboard: {
          title: 'Clasificación histórica',
          sortLabel: 'Ordenar por',
          sortSub: 'Compara puntuación total, partidas o modos específicos.',
          resetButton: 'Borrar resultados',
          listTitle: 'Jugadores',
          emptyState: 'Aún no hay resultados registrados.',
          pointsLabel: 'puntos',
          matchesLabel: 'partidas',
          sort: {
            total: 'Total de puntos',
            matches: 'Partidas',
            mimeTeams: 'Mímica · Equipos',
            mimeFfa: 'Mímica · Todos contra todos',
            drawingTeams: 'Dibujo · Equipos',
            drawingFfa: 'Dibujo · Todos contra todos',
            name: 'Nombre'
          },
          mode: {
            mimeTeams: 'Mímica · Equipos',
            mimeFfa: 'Mímica · Todos contra todos',
            drawingTeams: 'Dibujo · Equipos',
            drawingFfa: 'Dibujo · Todos contra todos'
          }
        },
        wordbank: {
          title: 'Contenido y Expansiones',
          addTitle: '➕ Añadir Palabra',
          newWordPlaceholder: 'Escribe la palabra...',
          addToDifficulty: 'Se añadirá a la dificultad:',
          addButton: '➕ Añadir Palabra',
          listTitle: '📋 Palabras',
          resetButton: '↺ Restaurar',
          challengesTitle: '🎯 Desafíos Core',
          addChallengeTitle: '🎯 Añadir Desafío',
          newChallengePlaceholder: 'Escribe el desafío...',
          addChallengeButton: '➕ Añadir Desafío',
          installPackTitle: '📦 Instalar pack',
          installPackSub: 'Sube el archivo .json comprado para desbloquear nuevas palabras en este dispositivo.',
          selectPackFile: '📁 Elegir archivo',
          installedPacksTitle: 'Packs instalados',
          noInstalledPacks: 'Aún no hay packs extra instalados.',
          packEnabled: 'Activo',
          packDisabled: 'Inactivo',
          removePack: 'Eliminar',
          packPreviewTitle: '⭐ Contenido del pack',
          packPreviewPrompt: 'Haz clic en un pack instalado para ver palabras y desafíos.',
          packPreviewWordsTitle: 'Palabras del pack',
          packPreviewChallengesTitle: 'Challenges del pack',
          packPreviewNoWords: 'No hay palabras en este idioma y dificultad.',
          packPreviewNoChallenges: 'No hay challenges en este idioma.',
          packPreviewSelected: ({ name }) => `Mostrando: ${name}`
        },
        settings: {
          title: 'Configuración',
          timerTitle: '⏱️ Temporizador',
          roundTimeLabel: 'Tiempo por Ronda',
          roundTimeSub: 'Segundos para adivinar',
          penaltyLabel: 'Penalización por Skip',
          penaltySub: '−10 puntos al saltar',
          correctPointsLabel: 'Puntos por acierto',
          correctPointsSub: 'Puntos para quien hace la mímica o dibuja',
          wrongPenaltyPointsLabel: 'Puntos perdidos por error',
          wrongPenaltyPointsSub: 'Descuenta puntos cuando el jugador falla o se acaba el tiempo',
          ffaGuesserPointsLabel: 'Puntos para quien adivina (FFA)',
          ffaGuesserPointsSub: 'En Todos contra todos, elige quién acertó tras cada acierto',
          ffaGuesserPointsValueLabel: 'Puntos de quien acertó',
          ffaGuesserPointsValueSub: 'Valor inicial predeterminado: 5 puntos',
          generalTitle: '⚙️ Configuración General',
          languageLabel: 'Idioma',
          languageSub: 'Cambia la interfaz y el contenido disponible en el juego',
          alertSoundLabel: 'Sonido de Alerta',
          alertSoundSub: 'Beep en los últimos 10 segundos',
          navigationSoundLabel: 'Sonido de Navegación',
          navigationSoundSub: 'Sonido al hacer clic en los botones',
          gameroomMusicLabel: 'Música de menús',
          gameroomMusicSub: 'Suena en inicio, setup y configuración',
          gameplayMusicLabel: 'Música de juego',
          gameplayMusicSub: 'Suena durante preparación, temporizador y marcadores',
          userIdTitle: '🪪 ID de compra',
          userIdLabel: 'Tu user_id',
          userIdSub: 'Usa este código al comprar packs para que el archivo se emita para este dispositivo.',
          copyUserId: 'Copiar',
          userIdBackupSub: 'Exporta una copia de seguridad para restaurar este user_id después de cambiar de navegador o restaurar la aplicación.',
          exportUserIdButton: 'Exportar user_id',
          importUserIdButton: 'Importar user_id',
          wordsTitle: '🎲 Palabras',
          shuffleWordsLabel: 'Mezclar Palabras',
          shuffleWordsSub: 'Orden aleatorio en cada partida',
          appearanceTitle: '🎨 Apariencia',
          themeLabel: 'Tema visual',
          themeSub: 'Cambia colores, transparencias y tipografía de la interfaz',
          resetAllTitle: '🧹 Restaurar aplicación',
          resetAllSub: 'Elimina configuración, jugadores guardados, packs instalados y el user_id de este dispositivo.',
          resetAllButton: 'Restaurar todo'
        },
        donate: {
          title: 'Apoya a Desafío de Mímica',
          chooseTitle: '❤️ Elige cómo donar',
          subtitle: 'Selecciona tu plataforma preferida para apoyar el juego y ayudar a financiar nuevos packs de palabras, idiomas y mejoras.',
          buyMeCoffee: 'Buy Me a Coffee',
          buyMeCoffeeSub: 'Apoyo rápido con una donación puntual a través de Buy Me a Coffee.',
          koFi: 'Ko-fi',
          koFiSub: 'Dona con Ko-fi y ayuda a que el proyecto siga creciendo.',
          whyTitle: '🎭 ¿Por qué donar?',
          whyLanguages: 'Tu apoyo ayuda a financiar nuevos idiomas, packs de contenido y futuras expansiones del banco de palabras.',
          whyUpdates: 'También ayuda a mantener Desafío de Mímica con más pulido, ajustes de balance y nuevas funciones.'
        },
        share: {
          title: 'Trust No One',
          text: '¡Ven a jugar Trust No One conmigo!',
          footerAriaLabel: 'Compartir Trust No One'
        },
        theme: {
          cosmic: 'Cósmico',
          'liquid-glass': 'Otoño',
          material3: 'Primavera',
          'light-mode': 'Modo Claro',
          'dark-mode': 'Modo Oscuro',
          'high-contrast': 'Alto Contraste'
        },
        footer: {
          copyPrefix: '© 2026 Trust No One · Insight X Lab Technologies'
        },
        teams: {
          defaultA: 'Equipo A',
          defaultB: 'Equipo B'
        },
        players: {
          defaultName: 'Jugador {number}'
        },
        dynamic: {
          roundDisplay: ({ current, total }) => `Ronda ${current} de ${total}`,
          diffCount: ({ difficulty, count }) => `${difficulty} · ${count} palabras disponibles`,
          correctTeamPoints: ({ teamName, points }) => `+${points} puntos para ${teamName}!`,
          correctPlayerPoints: ({ playerName, points }) => `+${points} puntos para ${playerName}!`,
          guesserPoints: ({ playerName, points }) => `+${points} puntos para quien acertó: ${playerName}!`,
          correctWithGuesserPoints: ({ actorName, actorPoints, guesserName, guesserPoints }) => `+${actorPoints} para ${actorName} · +${guesserPoints} para ${guesserName}`,
          chooseGuesserPoints: ({ points }) => `Selecciona quién acertó para ganar +${points} puntos.`,
          penaltySkip: ({ points }) => `-${points} puntos (error/skip)`,
          penaltyApplied: ({ playerName, points }) => `-${points} puntos para ${playerName}.`,
          timeUpPenalty: ({ playerName, points }) => `Tiempo agotado. -${points} puntos para ${playerName}.`,
          timeUpNoPoints: '¡Se acabó el tiempo! Sin puntos.',
          skippedNoPoints: 'Palabra saltada. Sin puntos.',
          scoreManagerContext: ({ round, total, playerName }) => `Ronda ${round} de ${total} · Turno de ${playerName}`,
          leaderboardSummary: ({ players, matches }) => `${players} jugador${players !== 1 ? 'es' : ''} · ${matches} partida${matches !== 1 ? 's' : ''}`,
          leaderboardModeStats: ({ points, matches }) => `${points} pts · ${matches} partida${matches !== 1 ? 's' : ''}`,
          roundSummary: ({ roundDone, remaining }) => `Fin de la Ronda ${roundDone} — ${remaining} ronda${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}!`,
          wordAdded: ({ word, difficulty }) => `✅ "${word}" añadida (${difficulty})!`,
          teamAdded: ({ name, teamName }) => `✅ ${name} entró en ${teamName}!`,
          playerAdded: ({ name }) => `✅ ${name} se unió!`,
          packInstalled: ({ name }) => `✅ Pack "${name}" instalado!`,
          packWordsSummary: ({ count }) => `${count} palabra${count !== 1 ? 's' : ''}`,
          packVersion: ({ version }) => `v${version}`,
          challengeAdded: ({ challenge }) => `✅ Desafío "${challenge}" añadido!`
        },
        notifications: {
          duplicateWord: '⚠️ ¡La palabra ya existe!',
          duplicateChallenge: '⚠️ ¡El desafío ya existe!',
          bankRestored: '✅ ¡Banco restaurado!',
          challengeRemoved: 'Desafío eliminado.',
          challengesRestored: '✅ ¡Desafíos restaurados!',
          leaderboardReset: '✅ ¡Clasificación borrada!',
          userIdCopied: '🪪 ¡user_id copiado!',
          userIdExported: '🪪 ¡Copia de user_id exportada!',
          userIdImported: '🪪 ¡user_id restaurado!',
          userIdImportCancelled: 'Importación cancelada.',
          packInstallReading: 'Leyendo archivo...',
          packInstallSuccess: '✅ ¡Pack instalado y activado!',
          packInstallCancelled: 'Instalación cancelada.',
          packRemoved: 'Pack eliminado.',
          packToggled: 'Estado del pack actualizado.',
          maxPlayers: '❌ ¡Máximo 6 jugadores!',
          maxTeamPlayers: '❌ ¡Máximo 3 por equipo!',
          minTeamPlayers: '❌ ¡Mínimo 1 por equipo!',
          minFfaPlayers: '❌ ¡Mínimo 3 jugadores!',
          donationLinkUnavailable: '⚠️ Configura el enlace de donación de este socio para activarlo.',
          shareCopied: '🔗 ¡Enlace copiado!',
          shareUnavailable: '🔗 Enlace copiado para compartir.',
          shareCopyFailed: '⚠️ No se pudo copiar el enlace.',
          shareInstagramFallback: '🔗 Enlace copiado. Pégalo en Instagram.',
          shareTikTokFallback: '🔗 Enlace copiado. Pégalo en TikTok.',
          fullscreenUnavailable: '⚠️ La pantalla completa no está disponible en este navegador.'
        },
        confirmations: {
          resetWords: '¿Restaurar el banco de palabras predeterminado? Las palabras personalizadas se perderán.',
          resetChallenges: '¿Restaurar los desafíos predeterminados? Los desafíos personalizados se perderán.',
          resetLeaderboard: '¿Borrar todos los resultados de la clasificación histórica?',
          resetAppDefaults: '¿Restaurar toda la aplicación a los valores predeterminados? Se eliminarán configuración, jugadores guardados, packs instalados y user_id.',
          replaceUserId: ({ currentUserId, importedUserId }) => `¿Sustituir el user_id actual (${currentUserId}) por el user_id importado (${importedUserId})? Úsalo solo para restaurar compras ya emitidas para ese ID.`,
          restartGame: '¿Reiniciar el juego? Todo el progreso se perderá.',
          replacePack: ({ packName }) => `Ya existe un pack instalado con este ID (${packName}). ¿Reemplazarlo?`,
          removePack: ({ packName }) => `¿Eliminar el pack "${packName}" de este dispositivo?`
        },
        packErrors: {
          fileRequired: 'Selecciona un archivo de pack.',
          invalidJson: 'Archivo inválido. Sube un JSON de pack.',
          invalidSchema: 'Schema del pack inválido.',
          invalidUser: 'Este pack fue emitido para otro user_id.',
          invalidPackId: 'pack_id ausente o inválido.',
          invalidAlgorithm: 'Algoritmo de firma inválido.',
          invalidSignature: 'Firma inválida. El pack no fue instalado.',
          invalidContentHash: 'Hash de contenido inválido.',
          emptyPack: 'El pack no tiene palabras o desafíos válidos.',
          cryptoUnavailable: 'Este navegador no soporta validación segura de packs.',
          reservedPackId: 'Este pack_id está reservado por el juego.'
        },
        userIdErrors: {
          fileRequired: 'Selecciona un archivo de user_id.',
          invalidJson: 'Archivo inválido. Sube un JSON de user_id.',
          invalidSchema: 'Este archivo no es una copia de user_id de MimiMania.',
          invalidUserId: 'El user_id del archivo no es válido.'
        }
      }
    };

    function mergeTranslations(base, overrides) {
      const merged = { ...base };
      Object.entries(overrides).forEach(([key, value]) => {
        const isPlainObject = value && typeof value === 'object' && !Array.isArray(value) && typeof value !== 'function';
        merged[key] = isPlainObject ? mergeTranslations(base?.[key] || {}, value) : value;
      });
      return merged;
    }

    TRANSLATIONS.fr = mergeTranslations(TRANSLATIONS.en, {
      meta: { documentTitle: 'Trust No One' },
      common: {
        back: '← Retour',
        add: '+ Ajouter',
        copy: 'Copier',
        continue: '▶️ Continuer',
        restart: '🔄 Recommencer',
        home: '🏠 Accueil',
        playerSingular: 'joueur',
        playerPlural: 'joueurs',
        roundSingular: 'manche',
        roundPlural: 'manches'
      },
      language: {
        pt: 'Portugais',
        en: 'Anglais',
        es: 'Espagnol',
        fr: 'Français',
        de: 'Allemand',
        it: 'Italien'
      },
      dev: {
        mode: 'Mode développement',
        description: 'Testez rapidement la mise en page sur mobile, tablette et ordinateur.',
        previewLabel: 'Aperçu de la mise en page',
        preview: { auto: 'Auto', mobile: 'Mobile', tablet: 'Tablette', desktop: 'Ordinateur' }
      },
      home: {
        title: 'Défi du Mime',
        subtitle: 'Dessinez, Devinez et Amusez-vous Ensemble',
        enterFullscreen: 'Plein écran',
        exitFullscreen: 'Quitter le plein écran',
        newGame: '🎮 Nouvelle partie',
        multiDeviceGame: '📡 Connecter les appareils',
        multiDeviceOnline: 'En ligne',
        multiDeviceOffline: 'Hors ligne',
        multiDeviceSummary: ({ status, count }) => `${status} | ${count} appareil${count !== 1 ? 's' : ''} connecté${count !== 1 ? 's' : ''}`,
        quickGame: '⚡ Partie rapide',
        wordBank: '🧩 Contenu et extensions',
        donate: '❤️ Faire un don',
        settings: '⚙️ Paramètres',
        leaderboard: '🏅 Classement historique',
        installOnDevice: '📲 Installer sur l’appareil',
        howToTitle: '🏆 Comment jouer',
        howTo: {
          setupTitle: 'Préparez la partie',
          setupDesc: 'Choisissez équipes ou chacun pour soi, puis définissez manches, difficulté et catégories.',
          turnTitle: 'Regardez et mimez',
          turnDesc: 'Un joueur voit le mot, le mémorise, puis le mime ou le dessine pendant que les autres devinent.',
          timerTitle: 'Course contre la montre',
          timerDesc: 'Le minuteur, les indices et les sons d’alerte rendent chaque tour rapide et amusant.',
          winTitle: 'Marquez des points et gagnez',
          winDesc: 'Chaque bonne réponse vaut 10 points. À la fin des manches, le score désigne le gagnant.'
        }
      },
      multiDevice: {
        title: 'Partie multi-device',
        chooseTitle: 'Que voulez-vous faire ?',
        chooseDesc: 'Ouvrez une session pour contrôler la partie ou connectez cet appareil comme écran auxiliaire.',
        chooseHost: '📡 Ouvrir une session',
        chooseJoin: '🔗 Rejoindre une session',
        changeChoice: 'Changer d’option',
        hostTitle: '📡 Ouvrir une session',
        hostDesc: 'Cet appareil contrôle la partie. Les autres rejoignent pour voir le minuteur, les indices et le dessin.',
        openSession: 'Ouvrir la session',
        hostCreating: 'Création de la session...',
        hostReady: 'Session ouverte. Scannez le QR Code sur les autres appareils.',
        hostError: 'Impossible d’ouvrir la session.',
        sessionCode: 'Code de session :',
        guestsConnected: ({ count }) => `${count} appareil${count !== 1 ? 's' : ''} connecté${count !== 1 ? 's' : ''}`,
        online: 'En ligne',
        offline: 'Hors ligne',
        continueSetup: 'Continuer la configuration',
        joinTitle: '🔗 Rejoindre',
        joinDesc: 'Rejoignez comme écran auxiliaire pour suivre la partie de l’hôte.',
        joinCodeLabel: 'Code ou lien de session',
        joinCodePlaceholder: 'Collez le code ou le lien',
        joinSession: 'Rejoindre la session',
        joinHelp: 'Vous pouvez aussi scanner le QR Code affiché sur l’hôte.',
        waitingTitle: 'En attente des données de la partie',
        guestLabel: 'Écran auxiliaire',
        connecting: 'Connexion...',
        connected: 'Connecté',
        disconnected: 'Déconnecté',
        guestWaiting: 'En attente du lancement par l’hôte.',
        guestPreparing: 'En attente de la révélation du mot.',
        guestMemorizing: 'La manche va commencer.',
        guestPlaying: 'Devinez !',
        guestScore: 'En attente du prochain tour.',
        guestFinal: 'Partie terminée.',
        liveDrawing: '✏️ Dessin en direct',
        disconnect: 'Se déconnecter',
        linkCopied: '🔗 Lien de session copié !',
        missingSession: 'Saisissez le code de session.',
        peerUnavailable: 'PeerJS n’a pas chargé. Vérifiez la connexion et réessayez.',
        qrUnavailable: 'QR Code indisponible. Utilisez le lien ou le code de session.'
      },
      setup: {
        title: 'Nouvelle partie',
        gameTypeTitle: '1️⃣ Type de jeu',
        gameTypeMimeName: 'Mime',
        gameTypeMimeDesc: 'Jouez sans parler',
        gameTypeDrawingName: 'Dessin',
        gameTypeDrawingDesc: 'Dessinez le mot',
        modeTitle: '2️⃣ Mode de jeu',
        modeTeamsName: 'Deux équipes',
        modeTeamsDesc: 'Les équipes s’affrontent',
        modeFfaName: 'Chacun pour soi',
        modeFfaDesc: 'Tous contre tous',
        teamPlayersTitle: '3️⃣ Joueurs par équipe',
        playersTitle: '3️⃣ Joueurs',
        teamAPlaceholder: 'Nom de l’équipe A',
        teamBPlaceholder: 'Nom de l’équipe B',
        playerNamePlaceholder: 'Nom du joueur...',
        teamHelper: '💡 Minimum 1 par équipe, maximum 3 par équipe (jusqu’à 6 joueurs)',
        ffaHelper: '💡 Minimum 3, maximum 6 joueurs',
        difficultyTitle: '4️⃣ Difficulté',
        difficultyEasyDesc: 'Idéal pour les enfants et débutants',
        difficultyNormalDesc: 'Défi équilibré pour toute la famille',
        difficultyHardDesc: 'Mots complexes, pour les courageux !',
        optionsTitle: '5️⃣ Options de jeu',
        randomChallengeLabel: 'Défi aléatoire',
        randomChallengeSub: 'Ajoute des modificateurs au mime',
        randomChallengeDisabledSub: 'Indisponible en mode dessin',
        categoriesLabel: 'Catégories disponibles',
        coreCategoriesLabel: 'Catégories core',
        premiumCategoriesLabel: 'Catégories premium',
        matchTitle: '6️⃣ Configurer la partie',
        roundsLabel: 'Nombre de manches',
        roundsSub: 'Nombre de manches par joueur',
        startGame: '🎭 Commencer !'
      },
      difficulty: { easy: 'Facile', normal: 'Normal', hard: 'Difficile' },
      category: {
        objects: { plural: 'Objets', singular: 'Objet', tab: '🧸 Objets', option: '🧸 Objets' },
        actions: { plural: 'Actions', singular: 'Action', tab: '🏃 Actions', option: '🏃 Actions' },
        animals: { plural: 'Animaux', singular: 'Animal', tab: '🐾 Animaux', option: '🐾 Animaux' },
        movies: { plural: 'Films', singular: 'Film', tab: '🎬 Films', option: '🎬 Films' },
        professions: { plural: 'Métiers', singular: 'Métier', tab: '👔 Métiers', option: '👔 Métiers' },
        celebrities: { plural: 'Célébrités', singular: 'Célébrité', tab: '⭐ Célébrités', option: '⭐ Célébrités' }
      },
      game: {
        currentPlayerLabel: 'Au tour du mime :',
        currentPlayerDrawingLabel: 'Au tour de dessiner :',
        readyTitle: 'Prêts à voir le mot ?',
        readyDrawingTitle: 'Prêts à voir quoi dessiner ?',
        readySub: 'Seul le mime doit regarder ! Les autres ferment les yeux ! 👀',
        readyDrawingSub: 'Seul le dessinateur doit regarder ! Les autres ferment les yeux ! 👀',
        revealWord: '🎲 Révéler le mot',
        memorizeTitle: '⚡ Mémorisez le mot !',
        startsIn: 'Le jeu commence dans...',
        onlyMimeCanSee: 'Seul le mime peut voir !',
        onlyDrawerCanSee: 'Seul le dessinateur peut voir !',
        secondsLabel: 'SECONDES',
        hiddenWord: 'Mot masqué',
        hintTitle: '💡 Indice',
        showWord: '👁️ Afficher le mot',
        hideWord: '🙈 Masquer le mot',
        correct: '✅ Correct !',
        wrong: '❌ Raté / Skip',
        challengePrefix: '🎯 Défi :'
      },
      drawing: {
        canvasLabel: 'Zone de dessin',
        toolbarLabel: 'Outils de dessin',
        penThick: 'Trait épais',
        penThin: 'Trait fin',
        eraserThick: 'Grosse gomme',
        eraserThin: 'Petite gomme',
        clear: 'Effacer le canvas'
      },
      result: {
        correctTitle: 'Correct !',
        wrongTitle: 'Raté !',
        timeUpTitle: 'Temps écoulé !',
        guesserLabel: 'Qui a deviné ?',
        guesserPlaceholder: 'Sélectionnez qui a deviné',
        nextTurn: '➡️ Tour suivant'
      },
      scoreManager: {
        manageButton: '⚖️ Gérer',
        title: 'Gérer le score',
        backToGame: '← Retour au jeu',
        currentScoreTitle: 'Score actuel',
        resetInputs: '↺ Recharger',
        saveAndReturn: 'Enregistrer et revenir'
      },
      score: { title: '🏆 Score', nextRoundTitle: '🎊 Prochaine manche' },
      final: { winnerLabel: 'GAGNANT !', resultTitle: '📊 Résultat final', playAgain: '🎮 Rejouer', tie: 'ÉGALITÉ !' },
      leaderboard: {
        title: 'Classement historique',
        sortLabel: 'Trier par',
        sortSub: 'Comparez le score total, les parties ou les modes précis.',
        resetButton: 'Effacer les résultats',
        listTitle: 'Joueurs',
        emptyState: 'Aucun résultat enregistré pour le moment.',
        pointsLabel: 'points',
        matchesLabel: 'parties',
        sort: {
          total: 'Total de points',
          matches: 'Parties',
          mimeTeams: 'Mime · Équipes',
          mimeFfa: 'Mime · Chacun pour soi',
          drawingTeams: 'Dessin · Équipes',
          drawingFfa: 'Dessin · Chacun pour soi',
          name: 'Nom'
        },
        mode: {
          mimeTeams: 'Mime · Équipes',
          mimeFfa: 'Mime · Chacun pour soi',
          drawingTeams: 'Dessin · Équipes',
          drawingFfa: 'Dessin · Chacun pour soi'
        }
      },
      wordbank: {
        title: 'Contenu et extensions',
        addTitle: '➕ Ajouter un mot',
        newWordPlaceholder: 'Saisissez le mot...',
        addToDifficulty: 'Il sera ajouté à la difficulté :',
        addButton: '➕ Ajouter le mot',
        listTitle: '📋 Mots',
        resetButton: '↺ Restaurer',
        challengesTitle: '🎯 Défis core',
        addChallengeTitle: '🎯 Ajouter un défi',
        newChallengePlaceholder: 'Saisissez le défi...',
        addChallengeButton: '➕ Ajouter le défi',
        installPackTitle: '📦 Installer un pack',
        installPackSub: 'Envoyez le fichier .json acheté pour débloquer de nouveaux mots sur cet appareil.',
        selectPackFile: '📁 Choisir un fichier',
        installedPacksTitle: 'Packs installés',
        noInstalledPacks: 'Aucun pack supplémentaire installé pour le moment.',
        packEnabled: 'Actif',
        packDisabled: 'Inactif',
        removePack: 'Supprimer',
        packPreviewTitle: '⭐ Contenu du pack',
        packPreviewPrompt: 'Cliquez sur un pack installé pour voir les mots et défis.',
        packPreviewWordsTitle: 'Mots du pack',
        packPreviewChallengesTitle: 'Défis du pack',
        packPreviewNoWords: 'Aucun mot dans cette langue et difficulté.',
        packPreviewNoChallenges: 'Aucun défi dans cette langue.',
        packPreviewSelected: ({ name }) => `Affichage : ${name}`
      },
      settings: {
        title: 'Paramètres',
        timerTitle: '⏱️ Minuteur',
        roundTimeLabel: 'Temps par manche',
        roundTimeSub: 'Secondes pour deviner',
        penaltyLabel: 'Pénalité de skip',
        penaltySub: '−10 points en passant',
        correctPointsLabel: 'Points par bonne réponse',
        correctPointsSub: 'Points pour celui qui mime ou dessine',
        wrongPenaltyPointsLabel: 'Points perdus en cas d’erreur',
        wrongPenaltyPointsSub: 'Retire des points si le joueur se trompe ou si le temps expire',
        ffaGuesserPointsLabel: 'Points pour celui qui devine (FFA)',
        ffaGuesserPointsSub: 'En chacun pour soi, choisissez qui a deviné après chaque bonne réponse',
        ffaGuesserPointsValueLabel: 'Points de celui qui a deviné',
        ffaGuesserPointsValueSub: 'Valeur initiale par défaut : 5 points',
        generalTitle: '⚙️ Paramètres généraux',
        languageLabel: 'Langue',
        languageSub: 'Change l’interface et le contenu disponible dans le jeu',
        alertSoundLabel: 'Son d’alerte',
        alertSoundSub: 'Bip pendant les 10 dernières secondes',
        navigationSoundLabel: 'Son de navigation',
        navigationSoundSub: 'Son lors des clics sur l’interface',
        gameroomMusicLabel: 'Musique des menus',
        gameroomMusicSub: 'Jouée sur l’accueil, la configuration et les paramètres',
        gameplayMusicLabel: 'Musique de jeu',
        gameplayMusicSub: 'Jouée pendant la préparation, le minuteur et les scores',
        userIdTitle: '🪪 ID d’achat',
        userIdLabel: 'Votre user_id',
        userIdSub: 'Utilisez ce code lors de l’achat de packs pour que le fichier soit émis pour cet appareil.',
        copyUserId: 'Copier',
        userIdBackupSub: 'Exportez une sauvegarde pour restaurer ce user_id après un changement de navigateur ou une réinitialisation de l’application.',
        exportUserIdButton: 'Exporter user_id',
        importUserIdButton: 'Importer user_id',
        wordsTitle: '🎲 Mots',
        shuffleWordsLabel: 'Mélanger les mots',
        shuffleWordsSub: 'Ordre aléatoire à chaque partie',
        appearanceTitle: '🎨 Apparence',
        themeLabel: 'Thème visuel',
        themeSub: 'Change les couleurs, transparences et typographies de l’interface',
        resetAllTitle: '🧹 Restaurer l’application',
        resetAllSub: 'Supprime paramètres, joueurs sauvegardés, packs installés et user_id de cet appareil.',
        resetAllButton: 'Tout restaurer'
      },
      donate: {
        title: 'Soutenez Défi du Mime',
        chooseTitle: '❤️ Choisissez comment donner',
        subtitle: 'Choisissez votre plateforme préférée pour soutenir le jeu et financer de nouveaux packs de mots, langues et améliorations.',
        buyMeCoffeeSub: 'Soutien rapide et direct avec un don ponctuel.',
        koFiSub: 'Faites un don via Ko-fi et aidez le projet à grandir.',
        whyTitle: '🎭 Pourquoi donner ?',
        whyLanguages: 'Votre soutien aide à financer de nouvelles langues, packs de contenu et extensions de la banque de mots.',
        whyUpdates: 'Il aide aussi à maintenir Défi du Mime avec du polish, de l’équilibrage et de nouvelles fonctionnalités.'
      },
      share: {
        title: 'Trust No One',
        text: 'Viens jouer à Trust No One avec moi !',
        footerAriaLabel: 'Partager Trust No One'
      },
      theme: { cosmic: 'Cosmique', 'liquid-glass': 'Automne', material3: 'Printemps', 'light-mode': 'Mode clair', 'dark-mode': 'Mode sombre', 'high-contrast': 'Contraste élevé' },
      footer: { copyPrefix: '© 2026 Trust No One · Insight X Lab Technologies' },
      teams: { defaultA: 'Équipe A', defaultB: 'Équipe B' },
      players: { defaultName: 'Joueur {number}' },
      dynamic: {
        roundDisplay: ({ current, total }) => `Manche ${current} sur ${total}`,
        diffCount: ({ difficulty, count }) => `${difficulty} · ${count} mots disponibles`,
        correctTeamPoints: ({ teamName, points }) => `+${points} points pour ${teamName} !`,
        correctPlayerPoints: ({ playerName, points }) => `+${points} points pour ${playerName} !`,
        guesserPoints: ({ playerName, points }) => `+${points} points pour celui qui a deviné : ${playerName} !`,
        correctWithGuesserPoints: ({ actorName, actorPoints, guesserName, guesserPoints }) => `+${actorPoints} pour ${actorName} · +${guesserPoints} pour ${guesserName}`,
        chooseGuesserPoints: ({ points }) => `Sélectionnez qui a deviné pour gagner +${points} points.`,
        penaltySkip: ({ points }) => `-${points} points (erreur/skip)`,
        penaltyApplied: ({ playerName, points }) => `-${points} points pour ${playerName}.`,
        timeUpPenalty: ({ playerName, points }) => `Temps écoulé. -${points} points pour ${playerName}.`,
        timeUpNoPoints: 'Temps écoulé ! Aucun point.',
        skippedNoPoints: 'Mot passé. Aucun point.',
        scoreManagerContext: ({ round, total, playerName }) => `Manche ${round} sur ${total} · Tour de ${playerName}`,
        leaderboardSummary: ({ players, matches }) => `${players} joueur${players !== 1 ? 's' : ''} · ${matches} partie${matches !== 1 ? 's' : ''}`,
        leaderboardModeStats: ({ points, matches }) => `${points} pts · ${matches} partie${matches !== 1 ? 's' : ''}`,
        roundSummary: ({ roundDone, remaining }) => `Fin de la manche ${roundDone} — ${remaining} manche${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''} !`,
        wordAdded: ({ word, difficulty }) => `✅ "${word}" ajouté (${difficulty}) !`,
        teamAdded: ({ name, teamName }) => `✅ ${name} rejoint ${teamName} !`,
        playerAdded: ({ name }) => `✅ ${name} est entré !`,
        packInstalled: ({ name }) => `✅ Pack "${name}" installé !`,
        packWordsSummary: ({ count }) => `${count} mot${count !== 1 ? 's' : ''}`,
        packVersion: ({ version }) => `v${version}`,
        challengeAdded: ({ challenge }) => `✅ Défi "${challenge}" ajouté !`
      },
      notifications: {
        duplicateWord: '⚠️ Ce mot existe déjà !',
        duplicateChallenge: '⚠️ Ce défi existe déjà !',
        bankRestored: '✅ Banque de mots restaurée !',
        challengeRemoved: 'Défi supprimé.',
        challengesRestored: '✅ Défis restaurés !',
        leaderboardReset: '✅ Classement effacé !',
        userIdCopied: '🪪 user_id copié !',
        userIdExported: '🪪 Sauvegarde du user_id exportée !',
        userIdImported: '🪪 user_id restauré !',
        userIdImportCancelled: 'Importation annulée.',
        packInstallReading: 'Lecture du fichier...',
        packInstallSuccess: '✅ Pack installé et activé !',
        packInstallCancelled: 'Installation annulée.',
        packRemoved: 'Pack supprimé.',
        packToggled: 'Statut du pack mis à jour.',
        maxPlayers: '❌ Maximum 6 joueurs !',
        maxTeamPlayers: '❌ Maximum 3 par équipe !',
        minTeamPlayers: '❌ Minimum 1 par équipe !',
        minFfaPlayers: '❌ Minimum 3 joueurs !',
        donationLinkUnavailable: '⚠️ Configurez le lien de don de ce partenaire pour l’activer.',
        shareCopied: '🔗 Lien copié !',
        shareUnavailable: '🔗 Lien copié pour partager.',
        shareCopyFailed: '⚠️ Impossible de copier le lien.',
        shareInstagramFallback: '🔗 Lien copié. Collez-le dans Instagram.',
        shareTikTokFallback: '🔗 Lien copié. Collez-le dans TikTok.',
        fullscreenUnavailable: '⚠️ Plein écran indisponible dans ce navigateur.'
      },
      confirmations: {
        resetWords: 'Restaurer la banque de mots par défaut ? Les mots personnalisés seront perdus.',
        resetChallenges: 'Restaurer les défis par défaut ? Les défis personnalisés seront perdus.',
        resetLeaderboard: 'Effacer tous les résultats du classement historique ?',
        resetAppDefaults: 'Restaurer toute l’application par défaut ? Les paramètres, joueurs sauvegardés, packs installés et user_id seront effacés.',
        replaceUserId: ({ currentUserId, importedUserId }) => `Remplacer le user_id actuel (${currentUserId}) par le user_id importé (${importedUserId}) ? À utiliser uniquement pour restaurer des achats déjà émis pour cet ID.`,
        restartGame: 'Recommencer la partie ? Toute la progression sera perdue.',
        replacePack: ({ packName }) => `Un pack avec cet ID est déjà installé (${packName}). Le remplacer ?`,
        removePack: ({ packName }) => `Supprimer le pack "${packName}" de cet appareil ?`
      },
      packErrors: {
        fileRequired: 'Sélectionnez un fichier de pack.',
        invalidJson: 'Fichier invalide. Envoyez un JSON de pack.',
        invalidSchema: 'Schéma du pack invalide.',
        invalidUser: 'Ce pack a été émis pour un autre user_id.',
        invalidPackId: 'pack_id manquant ou invalide.',
        invalidAlgorithm: 'Algorithme de signature invalide.',
        invalidSignature: 'Signature invalide. Le pack n’a pas été installé.',
        invalidContentHash: 'Hash du contenu invalide.',
        emptyPack: 'Le pack ne contient aucun mot ou défi valide.',
        cryptoUnavailable: 'Ce navigateur ne prend pas en charge la validation sécurisée des packs.',
        reservedPackId: 'Ce pack_id est réservé par le jeu.'
      },
      userIdErrors: {
        fileRequired: 'Sélectionnez un fichier de user_id.',
        invalidJson: 'Fichier invalide. Envoyez un JSON de user_id.',
        invalidSchema: 'Ce fichier n’est pas une sauvegarde de user_id MimiMania.',
        invalidUserId: 'Le user_id du fichier est invalide.'
      }
    });

    TRANSLATIONS.de = mergeTranslations(TRANSLATIONS.en, {
      meta: { documentTitle: 'Trust No One' },
      common: {
        back: '← Zurück',
        add: '+ Hinzufügen',
        copy: 'Kopieren',
        continue: '▶️ Weiter',
        restart: '🔄 Neustarten',
        home: '🏠 Start',
        playerSingular: 'Spieler',
        playerPlural: 'Spieler',
        roundSingular: 'Runde',
        roundPlural: 'Runden'
      },
      language: { pt: 'Portugiesisch', en: 'Englisch', es: 'Spanisch', fr: 'Französisch', de: 'Deutsch', it: 'Italienisch' },
      dev: {
        mode: 'Entwicklungsmodus',
        description: 'Teste das Layout schnell auf Mobilgerät, Tablet und Desktop.',
        previewLabel: 'Layout-Vorschau',
        preview: { auto: 'Auto', mobile: 'Mobil', tablet: 'Tablet', desktop: 'Desktop' }
      },
      home: {
        title: 'Pantomime Challenge',
        subtitle: 'Zeichnen, Raten und Gemeinsam Spaß Haben',
        enterFullscreen: 'Vollbild',
        exitFullscreen: 'Vollbild verlassen',
        newGame: '🎮 Neues Spiel',
        multiDeviceGame: '📡 Geräte verbinden',
        multiDeviceOnline: 'Online',
        multiDeviceOffline: 'Offline',
        multiDeviceSummary: ({ status, count }) => `${status} | ${count} Gerät${count !== 1 ? 'e' : ''} verbunden`,
        quickGame: '⚡ Schnellspiel',
        wordBank: '🧩 Inhalte und Erweiterungen',
        donate: '❤️ Spenden',
        settings: '⚙️ Einstellungen',
        leaderboard: '🏅 Bestenliste',
        installOnDevice: '📲 Auf Gerät installieren',
        howToTitle: '🏆 Spielanleitung',
        howTo: {
          setupTitle: 'Spiel einrichten',
          setupDesc: 'Wähle Teams oder Jeder gegen jeden und lege Runden, Schwierigkeit und Kategorien fest.',
          turnTitle: 'Ansehen und vorspielen',
          turnDesc: 'Ein Spieler sieht das Wort, merkt es sich und stellt es dar oder zeichnet, während alle anderen raten.',
          timerTitle: 'Gegen die Zeit',
          timerDesc: 'Timer, Hinweise und Warntöne halten jede Runde schnell, klar und unterhaltsam.',
          winTitle: 'Punkte sammeln und gewinnen',
          winDesc: 'Jede richtige Antwort zählt 10 Punkte. Am Ende entscheiden die Punkte über den Sieg.'
        }
      },
      multiDevice: {
        title: 'Multi-Device-Spiel',
        chooseTitle: 'Was möchtest du tun?',
        chooseDesc: 'Öffne eine Sitzung, um das Spiel zu steuern, oder verbinde dieses Gerät als Zusatzbildschirm.',
        chooseHost: '📡 Sitzung öffnen',
        chooseJoin: '🔗 Sitzung beitreten',
        changeChoice: 'Option ändern',
        hostTitle: '📡 Sitzung öffnen',
        hostDesc: 'Dieses Gerät steuert das Spiel. Andere Geräte sehen Timer, Hinweise und Zeichnung.',
        openSession: 'Sitzung öffnen',
        hostCreating: 'Sitzung wird erstellt...',
        hostReady: 'Sitzung geöffnet. Scanne den QR-Code auf den anderen Geräten.',
        hostError: 'Sitzung konnte nicht geöffnet werden.',
        sessionCode: 'Sitzungscode:',
        guestsConnected: ({ count }) => `${count} Gerät${count !== 1 ? 'e' : ''} verbunden`,
        online: 'Online',
        offline: 'Offline',
        continueSetup: 'Einrichtung fortsetzen',
        joinTitle: '🔗 Beitreten',
        joinDesc: 'Als Zusatzbildschirm beitreten, um dem Host-Spiel zu folgen.',
        joinCodeLabel: 'Sitzungscode oder Link',
        joinCodePlaceholder: 'Code oder Link einfügen',
        joinSession: 'Sitzung beitreten',
        joinHelp: 'Du kannst auch den QR-Code auf dem Host scannen.',
        waitingTitle: 'Warte auf Spieldaten',
        guestLabel: 'Zusatzbildschirm',
        connecting: 'Verbinden...',
        connected: 'Verbunden',
        disconnected: 'Getrennt',
        guestWaiting: 'Warte, bis der Host das Spiel startet.',
        guestPreparing: 'Warte, bis das Wort aufgedeckt wird.',
        guestMemorizing: 'Die Runde beginnt gleich.',
        guestPlaying: 'Rat mal!',
        guestScore: 'Warte auf den nächsten Zug.',
        guestFinal: 'Spiel beendet.',
        liveDrawing: '✏️ Live-Zeichnung',
        disconnect: 'Trennen',
        linkCopied: '🔗 Sitzungslink kopiert!',
        missingSession: 'Gib den Sitzungscode ein.',
        peerUnavailable: 'PeerJS wurde nicht geladen. Prüfe die Verbindung und versuche es erneut.',
        qrUnavailable: 'QR-Code nicht verfügbar. Nutze den Link oder Sitzungscode.'
      },
      setup: {
        title: 'Neues Spiel',
        gameTypeTitle: '1️⃣ Spieltyp',
        gameTypeMimeName: 'Pantomime',
        gameTypeMimeDesc: 'Ohne Sprechen darstellen',
        gameTypeDrawingName: 'Zeichnen',
        gameTypeDrawingDesc: 'Zeichne das Wort',
        modeTitle: '2️⃣ Spielmodus',
        modeTeamsName: 'Zwei Teams',
        modeTeamsDesc: 'Teams treten an',
        modeFfaName: 'Jeder gegen jeden',
        modeFfaDesc: 'Alle gegen alle',
        teamPlayersTitle: '3️⃣ Spieler pro Team',
        playersTitle: '3️⃣ Spieler',
        teamAPlaceholder: 'Name von Team A',
        teamBPlaceholder: 'Name von Team B',
        playerNamePlaceholder: 'Spielername...',
        teamHelper: '💡 Mindestens 1 pro Team, höchstens 3 pro Team (bis zu 6 Spieler)',
        ffaHelper: '💡 Mindestens 3, höchstens 6 Spieler',
        difficultyTitle: '4️⃣ Schwierigkeit',
        difficultyEasyDesc: 'Ideal für Kinder und Anfänger',
        difficultyNormalDesc: 'Ausgewogene Herausforderung für die Familie',
        difficultyHardDesc: 'Komplexe Wörter für Mutige!',
        optionsTitle: '5️⃣ Spieloptionen',
        randomChallengeLabel: 'Zufällige Herausforderung',
        randomChallengeSub: 'Fügt der Pantomime Modifikatoren hinzu',
        randomChallengeDisabledSub: 'Im Zeichenmodus nicht verfügbar',
        categoriesLabel: 'Verfügbare Kategorien',
        coreCategoriesLabel: 'Core-Kategorien',
        premiumCategoriesLabel: 'Premium-Kategorien',
        matchTitle: '6️⃣ Spiel einrichten',
        roundsLabel: 'Anzahl der Runden',
        roundsSub: 'Runden pro Spieler',
        startGame: '🎭 Spiel starten!'
      },
      difficulty: { easy: 'Einfach', normal: 'Normal', hard: 'Schwer' },
      category: {
        objects: { plural: 'Objekte', singular: 'Objekt', tab: '🧸 Objekte', option: '🧸 Objekte' },
        actions: { plural: 'Aktionen', singular: 'Aktion', tab: '🏃 Aktionen', option: '🏃 Aktionen' },
        animals: { plural: 'Tiere', singular: 'Tier', tab: '🐾 Tiere', option: '🐾 Tiere' },
        movies: { plural: 'Filme', singular: 'Film', tab: '🎬 Filme', option: '🎬 Filme' },
        professions: { plural: 'Berufe', singular: 'Beruf', tab: '👔 Berufe', option: '👔 Berufe' },
        celebrities: { plural: 'Prominente', singular: 'Prominenter', tab: '⭐ Prominente', option: '⭐ Prominente' }
      },
      game: {
        currentPlayerLabel: 'Pantomime-Spieler ist dran:',
        currentPlayerDrawingLabel: 'Zeichner ist dran:',
        readyTitle: 'Bereit, das Wort zu sehen?',
        readyDrawingTitle: 'Bereit zu sehen, was gezeichnet wird?',
        readySub: 'Nur der Mime darf schauen! Alle anderen Augen zu! 👀',
        readyDrawingSub: 'Nur der Zeichner darf schauen! Alle anderen Augen zu! 👀',
        revealWord: '🎲 Wort anzeigen',
        memorizeTitle: '⚡ Merke dir das Wort!',
        startsIn: 'Das Spiel beginnt in...',
        onlyMimeCanSee: 'Nur der Mime darf es sehen!',
        onlyDrawerCanSee: 'Nur der Zeichner darf es sehen!',
        secondsLabel: 'SEKUNDEN',
        hiddenWord: 'Verstecktes Wort',
        hintTitle: '💡 Hinweis',
        showWord: '👁️ Wort zeigen',
        hideWord: '🙈 Wort verbergen',
        correct: '✅ Richtig!',
        wrong: '❌ Falsch / Skip',
        challengePrefix: '🎯 Herausforderung:'
      },
      drawing: {
        canvasLabel: 'Zeichenfläche',
        toolbarLabel: 'Zeichenwerkzeuge',
        penThick: 'Dicke Linie',
        penThin: 'Dünne Linie',
        eraserThick: 'Dicker Radierer',
        eraserThin: 'Dünner Radierer',
        clear: 'Canvas leeren'
      },
      result: {
        correctTitle: 'Richtig!',
        wrongTitle: 'Falsch!',
        timeUpTitle: 'Zeit abgelaufen!',
        guesserLabel: 'Wer hat geraten?',
        guesserPlaceholder: 'Wähle aus, wer geraten hat',
        nextTurn: '➡️ Nächster Zug'
      },
      scoreManager: {
        manageButton: '⚖️ Verwalten',
        title: 'Punktestand verwalten',
        backToGame: '← Zurück zum Spiel',
        currentScoreTitle: 'Aktueller Punktestand',
        resetInputs: '↺ Neu laden',
        saveAndReturn: 'Speichern und zurück'
      },
      score: { title: '🏆 Punktestand', nextRoundTitle: '🎊 Nächste Runde' },
      final: { winnerLabel: 'GEWINNER!', resultTitle: '📊 Endergebnis', playAgain: '🎮 Nochmals spielen', tie: 'UNENTSCHIEDEN!' },
      leaderboard: {
        title: 'Ewige Bestenliste',
        sortLabel: 'Sortieren nach',
        sortSub: 'Vergleiche Gesamtpunkte, Partien oder bestimmte Modi.',
        resetButton: 'Ergebnisse löschen',
        listTitle: 'Spieler',
        emptyState: 'Noch keine gespeicherten Ergebnisse.',
        pointsLabel: 'Punkte',
        matchesLabel: 'Partien',
        sort: {
          total: 'Gesamtpunkte',
          matches: 'Partien',
          mimeTeams: 'Pantomime · Teams',
          mimeFfa: 'Pantomime · Jeder gegen jeden',
          drawingTeams: 'Zeichnen · Teams',
          drawingFfa: 'Zeichnen · Jeder gegen jeden',
          name: 'Name'
        },
        mode: {
          mimeTeams: 'Pantomime · Teams',
          mimeFfa: 'Pantomime · Jeder gegen jeden',
          drawingTeams: 'Zeichnen · Teams',
          drawingFfa: 'Zeichnen · Jeder gegen jeden'
        }
      },
      wordbank: {
        title: 'Inhalte und Erweiterungen',
        addTitle: '➕ Wort hinzufügen',
        newWordPlaceholder: 'Wort eingeben...',
        addToDifficulty: 'Wird zu folgender Schwierigkeit hinzugefügt:',
        addButton: '➕ Wort hinzufügen',
        listTitle: '📋 Wörter',
        resetButton: '↺ Wiederherstellen',
        challengesTitle: '🎯 Core-Herausforderungen',
        addChallengeTitle: '🎯 Herausforderung hinzufügen',
        newChallengePlaceholder: 'Herausforderung eingeben...',
        addChallengeButton: '➕ Herausforderung hinzufügen',
        installPackTitle: '📦 Pack installieren',
        installPackSub: 'Lade die gekaufte .json-Datei hoch, um neue Wörter auf diesem Gerät freizuschalten.',
        selectPackFile: '📁 Datei wählen',
        installedPacksTitle: 'Installierte Packs',
        noInstalledPacks: 'Noch keine zusätzlichen Packs installiert.',
        packEnabled: 'Aktiv',
        packDisabled: 'Inaktiv',
        removePack: 'Entfernen',
        packPreviewTitle: '⭐ Pack-Inhalt',
        packPreviewPrompt: 'Klicke auf ein installiertes Pack, um Wörter und Herausforderungen zu sehen.',
        packPreviewWordsTitle: 'Wörter des Packs',
        packPreviewChallengesTitle: 'Herausforderungen des Packs',
        packPreviewNoWords: 'Keine Wörter in dieser Sprache und Schwierigkeit.',
        packPreviewNoChallenges: 'Keine Herausforderungen in dieser Sprache.',
        packPreviewSelected: ({ name }) => `Anzeige: ${name}`
      },
      settings: {
        title: 'Einstellungen',
        timerTitle: '⏱️ Timer',
        roundTimeLabel: 'Zeit pro Runde',
        roundTimeSub: 'Sekunden zum Raten',
        penaltyLabel: 'Skip-Strafe',
        penaltySub: '−10 Punkte beim Überspringen',
        correctPointsLabel: 'Punkte für richtig',
        correctPointsSub: 'Punkte für den Spieler, der darstellt oder zeichnet',
        wrongPenaltyPointsLabel: 'Punktverlust bei Fehler',
        wrongPenaltyPointsSub: 'Zieht Punkte ab, wenn der Spieler falsch liegt oder die Zeit abläuft',
        ffaGuesserPointsLabel: 'Punkte für den Ratenden (FFA)',
        ffaGuesserPointsSub: 'In Jeder gegen jeden nach jedem Treffer auswählen, wer geraten hat',
        ffaGuesserPointsValueLabel: 'Punkte für den Ratenden',
        ffaGuesserPointsValueSub: 'Anfangsstandard: 5 Punkte',
        generalTitle: '⚙️ Allgemeine Einstellungen',
        languageLabel: 'Sprache',
        languageSub: 'Ändert die Oberfläche und die im Spiel verfügbaren Inhalte',
        alertSoundLabel: 'Warnton',
        alertSoundSub: 'Piepton in den letzten 10 Sekunden',
        navigationSoundLabel: 'Navigationssound',
        navigationSoundSub: 'Sound beim Klicken auf Interface-Buttons',
        gameroomMusicLabel: 'Menümusik',
        gameroomMusicSub: 'Läuft auf Startseite, Setup und Einstellungen',
        gameplayMusicLabel: 'Gameplay-Musik',
        gameplayMusicSub: 'Läuft während Vorbereitung, Timer und Punkteständen',
        userIdTitle: '🪪 Kauf-ID',
        userIdLabel: 'Deine user_id',
        userIdSub: 'Nutze diesen Code beim Kauf von Packs, damit die Datei für dieses Gerät ausgestellt wird.',
        copyUserId: 'Kopieren',
        userIdBackupSub: 'Exportiere ein Backup, um diese user_id nach einem Browserwechsel oder Zurücksetzen der App wiederherzustellen.',
        exportUserIdButton: 'user_id exportieren',
        importUserIdButton: 'user_id importieren',
        wordsTitle: '🎲 Wörter',
        shuffleWordsLabel: 'Wörter mischen',
        shuffleWordsSub: 'Zufällige Reihenfolge in jedem Spiel',
        appearanceTitle: '🎨 Erscheinungsbild',
        themeLabel: 'Visuelles Theme',
        themeSub: 'Ändere Farben, Transparenzen und Typografie der Oberfläche',
        resetAllTitle: '🧹 Anwendung zurücksetzen',
        resetAllSub: 'Entfernt Einstellungen, gespeicherte Spieler, installierte Packs und die user_id dieses Geräts.',
        resetAllButton: 'Alles zurücksetzen'
      },
      donate: {
        title: 'Pantomime Challenge unterstützen',
        chooseTitle: '❤️ Wähle deine Spendenart',
        subtitle: 'Wähle deine bevorzugte Plattform, um das Spiel zu unterstützen und neue Wortpacks, Sprachen und Verbesserungen zu finanzieren.',
        buyMeCoffeeSub: 'Schnelle direkte Unterstützung mit einer einmaligen Spende.',
        koFiSub: 'Spende über Ko-fi und hilf dem Projekt zu wachsen.',
        whyTitle: '🎭 Warum spenden?',
        whyLanguages: 'Deine Unterstützung finanziert neue Sprachen, Inhaltspacks und künftige Erweiterungen der Wortbank.',
        whyUpdates: 'Sie hilft auch, Pantomime Challenge mit Feinschliff, Balancing und neuen Funktionen aktuell zu halten.'
      },
      share: {
        title: 'Trust No One',
        text: 'Komm und spiel Trust No One mit mir!',
        footerAriaLabel: 'Trust No One teilen'
      },
      theme: { cosmic: 'Kosmisch', 'liquid-glass': 'Herbst', material3: 'Frühling', 'light-mode': 'Heller Modus', 'dark-mode': 'Dunkler Modus', 'high-contrast': 'Hoher Kontrast' },
      footer: { copyPrefix: '© 2026 Trust No One · Insight X Lab Technologies' },
      teams: { defaultA: 'Team A', defaultB: 'Team B' },
      players: { defaultName: 'Spieler {number}' },
      dynamic: {
        roundDisplay: ({ current, total }) => `Runde ${current} von ${total}`,
        diffCount: ({ difficulty, count }) => `${difficulty} · ${count} Wörter verfügbar`,
        correctTeamPoints: ({ teamName, points }) => `+${points} Punkte für ${teamName}!`,
        correctPlayerPoints: ({ playerName, points }) => `+${points} Punkte für ${playerName}!`,
        guesserPoints: ({ playerName, points }) => `+${points} Punkte für den Ratenden: ${playerName}!`,
        correctWithGuesserPoints: ({ actorName, actorPoints, guesserName, guesserPoints }) => `+${actorPoints} für ${actorName} · +${guesserPoints} für ${guesserName}`,
        chooseGuesserPoints: ({ points }) => `Wähle aus, wer geraten hat, um +${points} Punkte zu erhalten.`,
        penaltySkip: ({ points }) => `-${points} Punkte (falsch/skip)`,
        penaltyApplied: ({ playerName, points }) => `-${points} Punkte für ${playerName}.`,
        timeUpPenalty: ({ playerName, points }) => `Zeit abgelaufen. -${points} Punkte für ${playerName}.`,
        timeUpNoPoints: 'Zeit abgelaufen! Keine Punkte.',
        skippedNoPoints: 'Wort übersprungen. Keine Punkte.',
        scoreManagerContext: ({ round, total, playerName }) => `Runde ${round} von ${total} · ${playerName} ist dran`,
        leaderboardSummary: ({ players, matches }) => `${players} Spieler · ${matches} Partie${matches !== 1 ? 'n' : ''}`,
        leaderboardModeStats: ({ points, matches }) => `${points} Pkt. · ${matches} Partie${matches !== 1 ? 'n' : ''}`,
        roundSummary: ({ roundDone, remaining }) => `Ende von Runde ${roundDone} — ${remaining} Runde${remaining !== 1 ? 'n' : ''} übrig!`,
        wordAdded: ({ word, difficulty }) => `✅ "${word}" hinzugefügt (${difficulty})!`,
        teamAdded: ({ name, teamName }) => `✅ ${name} ist in ${teamName}!`,
        playerAdded: ({ name }) => `✅ ${name} ist dabei!`,
        packInstalled: ({ name }) => `✅ Pack "${name}" installiert!`,
        packWordsSummary: ({ count }) => `${count} Wort${count !== 1 ? 'er' : ''}`,
        packVersion: ({ version }) => `v${version}`,
        challengeAdded: ({ challenge }) => `✅ Herausforderung "${challenge}" hinzugefügt!`
      },
      notifications: {
        duplicateWord: '⚠️ Wort existiert bereits!',
        duplicateChallenge: '⚠️ Herausforderung existiert bereits!',
        bankRestored: '✅ Wortbank wiederhergestellt!',
        challengeRemoved: 'Herausforderung entfernt.',
        challengesRestored: '✅ Herausforderungen wiederhergestellt!',
        leaderboardReset: '✅ Bestenliste gelöscht!',
        userIdCopied: '🪪 user_id kopiert!',
        userIdExported: '🪪 user_id-Backup exportiert!',
        userIdImported: '🪪 user_id wiederhergestellt!',
        userIdImportCancelled: 'Import abgebrochen.',
        packInstallReading: 'Datei wird gelesen...',
        packInstallSuccess: '✅ Pack installiert und aktiviert!',
        packInstallCancelled: 'Installation abgebrochen.',
        packRemoved: 'Pack entfernt.',
        packToggled: 'Pack-Status aktualisiert.',
        maxPlayers: '❌ Maximal 6 Spieler!',
        maxTeamPlayers: '❌ Maximal 3 pro Team!',
        minTeamPlayers: '❌ Mindestens 1 pro Team!',
        minFfaPlayers: '❌ Mindestens 3 Spieler!',
        donationLinkUnavailable: '⚠️ Konfiguriere den Spendenlink dieses Partners, um ihn zu aktivieren.',
        shareCopied: '🔗 Link kopiert!',
        shareUnavailable: '🔗 Link zum Teilen kopiert.',
        shareCopyFailed: '⚠️ Link konnte nicht kopiert werden.',
        shareInstagramFallback: '🔗 Link kopiert. In Instagram einfügen.',
        shareTikTokFallback: '🔗 Link kopiert. In TikTok einfügen.',
        fullscreenUnavailable: '⚠️ Vollbild ist in diesem Browser nicht verfügbar.'
      },
      confirmations: {
        resetWords: 'Standard-Wortbank wiederherstellen? Eigene Wörter gehen verloren.',
        resetChallenges: 'Standard-Herausforderungen wiederherstellen? Eigene Herausforderungen gehen verloren.',
        resetLeaderboard: 'Alle Ergebnisse aus der ewigen Bestenliste löschen?',
        resetAppDefaults: 'Die gesamte Anwendung auf Standard zurücksetzen? Einstellungen, gespeicherte Spieler, installierte Packs und user_id werden gelöscht.',
        replaceUserId: ({ currentUserId, importedUserId }) => `Aktuelle user_id (${currentUserId}) durch die importierte user_id (${importedUserId}) ersetzen? Nutze dies nur, um Käufe wiederherzustellen, die bereits für diese ID ausgestellt wurden.`,
        restartGame: 'Spiel neu starten? Der gesamte Fortschritt geht verloren.',
        replacePack: ({ packName }) => `Ein Pack mit dieser ID ist bereits installiert (${packName}). Ersetzen?`,
        removePack: ({ packName }) => `Pack "${packName}" von diesem Gerät entfernen?`
      },
      packErrors: {
        fileRequired: 'Wähle eine Pack-Datei aus.',
        invalidJson: 'Ungültige Datei. Lade ein Pack-JSON hoch.',
        invalidSchema: 'Ungültiges Pack-Schema.',
        invalidUser: 'Dieses Pack wurde für eine andere user_id ausgestellt.',
        invalidPackId: 'pack_id fehlt oder ist ungültig.',
        invalidAlgorithm: 'Ungültiger Signaturalgorithmus.',
        invalidSignature: 'Ungültige Signatur. Das Pack wurde nicht installiert.',
        invalidContentHash: 'Ungültiger Content-Hash.',
        emptyPack: 'Das Pack enthält keine gültigen Wörter oder Herausforderungen.',
        cryptoUnavailable: 'Dieser Browser unterstützt keine sichere Pack-Validierung.',
        reservedPackId: 'Diese pack_id ist für das Spiel reserviert.'
      },
      userIdErrors: {
        fileRequired: 'Wähle eine user_id-Datei aus.',
        invalidJson: 'Ungültige Datei. Lade ein user_id-JSON hoch.',
        invalidSchema: 'Diese Datei ist kein MimiMania-user_id-Backup.',
        invalidUserId: 'Die user_id in der Datei ist ungültig.'
      }
    });

    TRANSLATIONS.it = mergeTranslations(TRANSLATIONS.en, {
      meta: { documentTitle: 'Trust No One' },
      common: {
        back: '← Indietro',
        add: '+ Aggiungi',
        copy: 'Copia',
        continue: '▶️ Continua',
        restart: '🔄 Riavvia',
        home: '🏠 Home',
        playerSingular: 'giocatore',
        playerPlural: 'giocatori',
        roundSingular: 'turno',
        roundPlural: 'turni'
      },
      language: { pt: 'Portoghese', en: 'Inglese', es: 'Spagnolo', fr: 'Francese', de: 'Tedesco', it: 'Italiano' },
      dev: {
        mode: 'Modalità sviluppo',
        description: 'Prova rapidamente il layout su mobile, tablet e desktop.',
        previewLabel: 'Anteprima layout',
        preview: { auto: 'Auto', mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }
      },
      home: {
        title: 'Sfida di Mimica',
        subtitle: 'Disegna, Indovina e Divertiti in Famiglia',
        enterFullscreen: 'Schermo intero',
        exitFullscreen: 'Esci da schermo intero',
        newGame: '🎮 Nuova partita',
        multiDeviceGame: '📡 Connetti dispositivi',
        multiDeviceOnline: 'Online',
        multiDeviceOffline: 'Offline',
        multiDeviceSummary: ({ status, count }) => `${status} | ${count} dispositiv${count === 1 ? 'o' : 'i'} conness${count === 1 ? 'o' : 'i'}`,
        quickGame: '⚡ Partita rapida',
        wordBank: '🧩 Contenuti ed espansioni',
        donate: '❤️ Dona',
        settings: '⚙️ Impostazioni',
        leaderboard: '🏅 Classifica storica',
        installOnDevice: '📲 Installa sul dispositivo',
        howToTitle: '🏆 Come giocare',
        howTo: {
          setupTitle: 'Prepara la partita',
          setupDesc: 'Scegli squadre o tutti contro tutti, poi imposta turni, difficoltà e categorie.',
          turnTitle: 'Guarda e interpreta',
          turnDesc: 'Un giocatore vede la parola, la memorizza e la mima o la disegna mentre gli altri indovinano.',
          timerTitle: 'Corri contro il tempo',
          timerDesc: 'Timer, suggerimenti e suoni di avviso rendono ogni turno rapido e divertente.',
          winTitle: 'Fai punti e vinci',
          winDesc: 'Ogni risposta corretta vale 10 punti. Alla fine dei turni, il punteggio decide il vincitore.'
        }
      },
      multiDevice: {
        title: 'Partita multi-device',
        chooseTitle: 'Cosa vuoi fare?',
        chooseDesc: 'Apri una sessione per controllare la partita o collega questo dispositivo come schermo ausiliario.',
        chooseHost: '📡 Apri una sessione',
        chooseJoin: '🔗 Entra in una sessione',
        changeChoice: 'Cambia opzione',
        hostTitle: '📡 Apri sessione',
        hostDesc: 'Questo dispositivo controlla la partita. Gli altri entrano per vedere timer, suggerimenti e disegno.',
        openSession: 'Apri sessione',
        hostCreating: 'Creazione sessione...',
        hostReady: 'Sessione aperta. Scansiona il QR Code sugli altri dispositivi.',
        hostError: 'Impossibile aprire la sessione.',
        sessionCode: 'Codice sessione:',
        guestsConnected: ({ count }) => `${count} dispositiv${count !== 1 ? 'i' : 'o'} conness${count !== 1 ? 'i' : 'o'}`,
        online: 'Online',
        offline: 'Offline',
        continueSetup: 'Continua configurazione',
        joinTitle: '🔗 Connetti',
        joinDesc: 'Entra come schermo ausiliario per seguire la partita dell’host.',
        joinCodeLabel: 'Codice o link della sessione',
        joinCodePlaceholder: 'Incolla codice o link',
        joinSession: 'Connetti alla sessione',
        joinHelp: 'Puoi anche scansionare il QR Code mostrato sull’host.',
        waitingTitle: 'In attesa dei dati della partita',
        guestLabel: 'Schermo ausiliario',
        connecting: 'Connessione...',
        connected: 'Connesso',
        disconnected: 'Disconnesso',
        guestWaiting: 'In attesa che l’host inizi la partita.',
        guestPreparing: 'In attesa che la parola venga rivelata.',
        guestMemorizing: 'Il turno sta per iniziare.',
        guestPlaying: 'Indovinate!',
        guestScore: 'In attesa del prossimo turno.',
        guestFinal: 'Partita terminata.',
        liveDrawing: '✏️ Disegno live',
        disconnect: 'Disconnetti',
        linkCopied: '🔗 Link della sessione copiato!',
        missingSession: 'Inserisci il codice della sessione.',
        peerUnavailable: 'PeerJS non è stato caricato. Controlla la connessione e riprova.',
        qrUnavailable: 'QR Code non disponibile. Usa il link o il codice della sessione.'
      },
      setup: {
        title: 'Nuova partita',
        gameTypeTitle: '1️⃣ Tipo di gioco',
        gameTypeMimeName: 'Mimica',
        gameTypeMimeDesc: 'Recita senza parlare',
        gameTypeDrawingName: 'Disegno',
        gameTypeDrawingDesc: 'Disegna la parola',
        modeTitle: '2️⃣ Modalità di gioco',
        modeTeamsName: 'Due squadre',
        modeTeamsDesc: 'Le squadre competono',
        modeFfaName: 'Tutti contro tutti',
        modeFfaDesc: 'Ognuno per sé',
        teamPlayersTitle: '3️⃣ Giocatori per squadra',
        playersTitle: '3️⃣ Giocatori',
        teamAPlaceholder: 'Nome squadra A',
        teamBPlaceholder: 'Nome squadra B',
        playerNamePlaceholder: 'Nome giocatore...',
        teamHelper: '💡 Minimo 1 per squadra, massimo 3 per squadra (fino a 6 giocatori)',
        ffaHelper: '💡 Minimo 3, massimo 6 giocatori',
        difficultyTitle: '4️⃣ Difficoltà',
        difficultyEasyDesc: 'Ottimo per bambini e principianti',
        difficultyNormalDesc: 'Sfida equilibrata per tutta la famiglia',
        difficultyHardDesc: 'Parole complesse, per i coraggiosi!',
        optionsTitle: '5️⃣ Opzioni di gioco',
        randomChallengeLabel: 'Sfida casuale',
        randomChallengeSub: 'Aggiunge modificatori alla mimica',
        randomChallengeDisabledSub: 'Non disponibile in modalità disegno',
        categoriesLabel: 'Categorie disponibili',
        coreCategoriesLabel: 'Categorie core',
        premiumCategoriesLabel: 'Categorie premium',
        matchTitle: '6️⃣ Configura partita',
        roundsLabel: 'Numero di turni',
        roundsSub: 'Quanti turni per giocatore',
        startGame: '🎭 Inizia il gioco!'
      },
      difficulty: { easy: 'Facile', normal: 'Normale', hard: 'Difficile' },
      category: {
        objects: { plural: 'Oggetti', singular: 'Oggetto', tab: '🧸 Oggetti', option: '🧸 Oggetti' },
        actions: { plural: 'Azioni', singular: 'Azione', tab: '🏃 Azioni', option: '🏃 Azioni' },
        animals: { plural: 'Animali', singular: 'Animale', tab: '🐾 Animali', option: '🐾 Animali' },
        movies: { plural: 'Film', singular: 'Film', tab: '🎬 Film', option: '🎬 Film' },
        professions: { plural: 'Professioni', singular: 'Professione', tab: '👔 Professioni', option: '👔 Professioni' },
        celebrities: { plural: 'Celebrità', singular: 'Celebrità', tab: '⭐ Celebrità', option: '⭐ Celebrità' }
      },
      game: {
        currentPlayerLabel: 'Turno di fare la mimica:',
        currentPlayerDrawingLabel: 'Turno di disegnare:',
        readyTitle: 'Pronti a vedere la parola?',
        readyDrawingTitle: 'Pronti a vedere cosa disegnare?',
        readySub: 'Solo chi mima deve guardare! Gli altri chiudano gli occhi! 👀',
        readyDrawingSub: 'Solo chi disegna deve guardare! Gli altri chiudano gli occhi! 👀',
        revealWord: '🎲 Rivela parola',
        memorizeTitle: '⚡ Memorizza la parola!',
        startsIn: 'Il gioco inizia tra...',
        onlyMimeCanSee: 'Solo chi mima può vedere!',
        onlyDrawerCanSee: 'Solo chi disegna può vedere!',
        secondsLabel: 'SECONDI',
        hiddenWord: 'Parola nascosta',
        hintTitle: '💡 Suggerimento',
        showWord: '👁️ Mostra parola',
        hideWord: '🙈 Nascondi parola',
        correct: '✅ Corretto!',
        wrong: '❌ Sbagliato / Skip',
        challengePrefix: '🎯 Sfida:'
      },
      drawing: {
        canvasLabel: 'Area di disegno',
        toolbarLabel: 'Strumenti di disegno',
        penThick: 'Linea spessa',
        penThin: 'Linea sottile',
        eraserThick: 'Gomma grande',
        eraserThin: 'Gomma piccola',
        clear: 'Pulisci canvas'
      },
      result: {
        correctTitle: 'Corretto!',
        wrongTitle: 'Sbagliato!',
        timeUpTitle: 'Tempo scaduto!',
        guesserLabel: 'Chi ha indovinato?',
        guesserPlaceholder: 'Seleziona chi ha indovinato',
        nextTurn: '➡️ Prossimo turno'
      },
      scoreManager: {
        manageButton: '⚖️ Gestisci',
        title: 'Gestisci punteggio',
        backToGame: '← Torna al gioco',
        currentScoreTitle: 'Punteggio attuale',
        resetInputs: '↺ Ricarica',
        saveAndReturn: 'Salva e torna'
      },
      score: { title: '🏆 Punteggio', nextRoundTitle: '🎊 Prossimo turno' },
      final: { winnerLabel: 'VINCITORE!', resultTitle: '📊 Risultato finale', playAgain: '🎮 Gioca ancora', tie: 'PAREGGIO!' },
      leaderboard: {
        title: 'Classifica storica',
        sortLabel: 'Ordina per',
        sortSub: 'Confronta punti totali, partite o modalità specifiche.',
        resetButton: 'Cancella risultati',
        listTitle: 'Giocatori',
        emptyState: 'Nessun risultato salvato per ora.',
        pointsLabel: 'punti',
        matchesLabel: 'partite',
        sort: {
          total: 'Punti totali',
          matches: 'Partite',
          mimeTeams: 'Mimica · Squadre',
          mimeFfa: 'Mimica · Tutti contro tutti',
          drawingTeams: 'Disegno · Squadre',
          drawingFfa: 'Disegno · Tutti contro tutti',
          name: 'Nome'
        },
        mode: {
          mimeTeams: 'Mimica · Squadre',
          mimeFfa: 'Mimica · Tutti contro tutti',
          drawingTeams: 'Disegno · Squadre',
          drawingFfa: 'Disegno · Tutti contro tutti'
        }
      },
      wordbank: {
        title: 'Contenuti ed espansioni',
        addTitle: '➕ Aggiungi parola',
        newWordPlaceholder: 'Digita la parola...',
        addToDifficulty: 'Sarà aggiunta alla difficoltà:',
        addButton: '➕ Aggiungi parola',
        listTitle: '📋 Parole',
        resetButton: '↺ Ripristina',
        challengesTitle: '🎯 Sfide core',
        addChallengeTitle: '🎯 Aggiungi sfida',
        newChallengePlaceholder: 'Digita la sfida...',
        addChallengeButton: '➕ Aggiungi sfida',
        installPackTitle: '📦 Installa pack',
        installPackSub: 'Carica il file .json acquistato per sbloccare nuove parole su questo dispositivo.',
        selectPackFile: '📁 Scegli file',
        installedPacksTitle: 'Pack installati',
        noInstalledPacks: 'Nessun pack extra installato.',
        packEnabled: 'Attivo',
        packDisabled: 'Inattivo',
        removePack: 'Rimuovi',
        packPreviewTitle: '⭐ Contenuto del pack',
        packPreviewPrompt: 'Clicca su un pack installato per vedere parole e sfide.',
        packPreviewWordsTitle: 'Parole del pack',
        packPreviewChallengesTitle: 'Sfide del pack',
        packPreviewNoWords: 'Nessuna parola in questa lingua e difficoltà.',
        packPreviewNoChallenges: 'Nessuna sfida in questa lingua.',
        packPreviewSelected: ({ name }) => `Mostrando: ${name}`
      },
      settings: {
        title: 'Impostazioni',
        timerTitle: '⏱️ Timer',
        roundTimeLabel: 'Tempo per turno',
        roundTimeSub: 'Secondi per indovinare',
        penaltyLabel: 'Penalità per skip',
        penaltySub: '−10 punti quando si passa',
        correctPointsLabel: 'Punti per risposta corretta',
        correctPointsSub: 'Punti per chi fa la mimica o disegna',
        wrongPenaltyPointsLabel: 'Punti persi per errore',
        wrongPenaltyPointsSub: 'Sottrae punti quando il giocatore sbaglia o finisce il tempo',
        ffaGuesserPointsLabel: 'Punti per chi indovina (FFA)',
        ffaGuesserPointsSub: 'In Tutti contro tutti, scegli chi ha indovinato dopo ogni risposta corretta',
        ffaGuesserPointsValueLabel: 'Punti di chi ha indovinato',
        ffaGuesserPointsValueSub: 'Valore iniziale predefinito: 5 punti',
        generalTitle: '⚙️ Impostazioni generali',
        languageLabel: 'Lingua',
        languageSub: 'Cambia l’interfaccia e i contenuti disponibili nel gioco',
        alertSoundLabel: 'Suono di avviso',
        alertSoundSub: 'Bip negli ultimi 10 secondi',
        navigationSoundLabel: 'Suono di navigazione',
        navigationSoundSub: 'Suono al clic sui pulsanti dell’interfaccia',
        gameroomMusicLabel: 'Musica dei menu',
        gameroomMusicSub: 'Riprodotta su home, configurazione e impostazioni',
        gameplayMusicLabel: 'Musica di gioco',
        gameplayMusicSub: 'Riprodotta durante preparazione, timer e punteggi',
        userIdTitle: '🪪 ID di acquisto',
        userIdLabel: 'Il tuo user_id',
        userIdSub: 'Usa questo codice quando acquisti pack, così il file viene emesso per questo dispositivo.',
        copyUserId: 'Copia',
        userIdBackupSub: 'Esporta un backup per ripristinare questo user_id dopo aver cambiato browser o ripristinato l’applicazione.',
        exportUserIdButton: 'Esporta user_id',
        importUserIdButton: 'Importa user_id',
        wordsTitle: '🎲 Parole',
        shuffleWordsLabel: 'Mescola parole',
        shuffleWordsSub: 'Ordine casuale a ogni partita',
        appearanceTitle: '🎨 Aspetto',
        themeLabel: 'Tema visivo',
        themeSub: 'Cambia colori, trasparenze e tipografia dell’interfaccia',
        resetAllTitle: '🧹 Ripristina applicazione',
        resetAllSub: 'Rimuove impostazioni, giocatori salvati, pack installati e user_id di questo dispositivo.',
        resetAllButton: 'Ripristina tutto'
      },
      donate: {
        title: 'Sostieni Sfida di Mimica',
        chooseTitle: '❤️ Scegli come donare',
        subtitle: 'Scegli la piattaforma preferita per sostenere il gioco e finanziare nuovi pack di parole, lingue e miglioramenti.',
        buyMeCoffeeSub: 'Supporto rapido e diretto con una donazione singola.',
        koFiSub: 'Dona via Ko-fi e aiuta il progetto a crescere.',
        whyTitle: '🎭 Perché donare?',
        whyLanguages: 'Il tuo supporto aiuta a finanziare nuove lingue, pack di contenuti e future espansioni della banca delle parole.',
        whyUpdates: 'Aiuta anche a mantenere Sfida di Mimica aggiornata con rifiniture, bilanciamento e nuove funzionalità.'
      },
      share: {
        title: 'Trust No One',
        text: 'Vieni a giocare a Trust No One con me!',
        footerAriaLabel: 'Condividi Trust No One'
      },
      theme: { cosmic: 'Cosmico', 'liquid-glass': 'Autunno', material3: 'Primavera', 'light-mode': 'Modalità chiara', 'dark-mode': 'Modalità scura', 'high-contrast': 'Alto contrasto' },
      footer: { copyPrefix: '© 2026 Trust No One · Insight X Lab Technologies' },
      teams: { defaultA: 'Squadra A', defaultB: 'Squadra B' },
      players: { defaultName: 'Giocatore {number}' },
      dynamic: {
        roundDisplay: ({ current, total }) => `Turno ${current} di ${total}`,
        diffCount: ({ difficulty, count }) => `${difficulty} · ${count} parole disponibili`,
        correctTeamPoints: ({ teamName, points }) => `+${points} punti per ${teamName}!`,
        correctPlayerPoints: ({ playerName, points }) => `+${points} punti per ${playerName}!`,
        guesserPoints: ({ playerName, points }) => `+${points} punti per chi ha indovinato: ${playerName}!`,
        correctWithGuesserPoints: ({ actorName, actorPoints, guesserName, guesserPoints }) => `+${actorPoints} per ${actorName} · +${guesserPoints} per ${guesserName}`,
        chooseGuesserPoints: ({ points }) => `Seleziona chi ha indovinato per ricevere +${points} punti.`,
        penaltySkip: ({ points }) => `-${points} punti (errore/skip)`,
        penaltyApplied: ({ playerName, points }) => `-${points} punti per ${playerName}.`,
        timeUpPenalty: ({ playerName, points }) => `Tempo scaduto. -${points} punti per ${playerName}.`,
        timeUpNoPoints: 'Tempo scaduto! Nessun punto.',
        skippedNoPoints: 'Parola saltata. Nessun punto.',
        scoreManagerContext: ({ round, total, playerName }) => `Turno ${round} di ${total} · Tocca a ${playerName}`,
        leaderboardSummary: ({ players, matches }) => `${players} giocator${players !== 1 ? 'i' : 'e'} · ${matches} partit${matches !== 1 ? 'e' : 'a'}`,
        leaderboardModeStats: ({ points, matches }) => `${points} pt · ${matches} partit${matches !== 1 ? 'e' : 'a'}`,
        roundSummary: ({ roundDone, remaining }) => `Fine del turno ${roundDone} — ${remaining} turn${remaining !== 1 ? 'i' : 'o'} restant${remaining !== 1 ? 'i' : 'e'}!`,
        wordAdded: ({ word, difficulty }) => `✅ "${word}" aggiunta (${difficulty})!`,
        teamAdded: ({ name, teamName }) => `✅ ${name} in ${teamName}!`,
        playerAdded: ({ name }) => `✅ ${name} è entrato!`,
        packInstalled: ({ name }) => `✅ Pack "${name}" installato!`,
        packWordsSummary: ({ count }) => `${count} parol${count !== 1 ? 'e' : 'a'}`,
        packVersion: ({ version }) => `v${version}`,
        challengeAdded: ({ challenge }) => `✅ Sfida "${challenge}" aggiunta!`
      },
      notifications: {
        duplicateWord: '⚠️ La parola esiste già!',
        duplicateChallenge: '⚠️ La sfida esiste già!',
        bankRestored: '✅ Banca delle parole ripristinata!',
        challengeRemoved: 'Sfida rimossa.',
        challengesRestored: '✅ Sfide ripristinate!',
        leaderboardReset: '✅ Classifica cancellata!',
        userIdCopied: '🪪 user_id copiato!',
        userIdExported: '🪪 Backup dello user_id esportato!',
        userIdImported: '🪪 user_id ripristinato!',
        userIdImportCancelled: 'Importazione annullata.',
        packInstallReading: 'Lettura file...',
        packInstallSuccess: '✅ Pack installato e attivato!',
        packInstallCancelled: 'Installazione annullata.',
        packRemoved: 'Pack rimosso.',
        packToggled: 'Stato del pack aggiornato.',
        maxPlayers: '❌ Massimo 6 giocatori!',
        maxTeamPlayers: '❌ Massimo 3 per squadra!',
        minTeamPlayers: '❌ Minimo 1 per squadra!',
        minFfaPlayers: '❌ Minimo 3 giocatori!',
        donationLinkUnavailable: '⚠️ Configura il link di donazione di questo partner per attivarlo.',
        shareCopied: '🔗 Link copiato!',
        shareUnavailable: '🔗 Link copiato per la condivisione.',
        shareCopyFailed: '⚠️ Impossibile copiare il link.',
        shareInstagramFallback: '🔗 Link copiato. Incollalo su Instagram.',
        shareTikTokFallback: '🔗 Link copiato. Incollalo su TikTok.',
        fullscreenUnavailable: '⚠️ Schermo intero non disponibile in questo browser.'
      },
      confirmations: {
        resetWords: 'Ripristinare il banco parole predefinito? Le parole personalizzate andranno perse.',
        resetChallenges: 'Ripristinare le sfide predefinite? Le sfide personalizzate andranno perse.',
        resetLeaderboard: 'Cancellare tutti i risultati della classifica storica?',
        resetAppDefaults: 'Ripristinare tutta l’applicazione ai valori predefiniti? Impostazioni, giocatori salvati, pack installati e user_id saranno cancellati.',
        replaceUserId: ({ currentUserId, importedUserId }) => `Sostituire lo user_id attuale (${currentUserId}) con lo user_id importato (${importedUserId})? Usalo solo per ripristinare acquisti già emessi per questo ID.`,
        restartGame: 'Riavviare il gioco? Tutti i progressi andranno persi.',
        replacePack: ({ packName }) => `Esiste già un pack installato con questo ID (${packName}). Sostituirlo?`,
        removePack: ({ packName }) => `Rimuovere il pack "${packName}" da questo dispositivo?`
      },
      packErrors: {
        fileRequired: 'Seleziona un file pack.',
        invalidJson: 'File non valido. Carica un JSON di pack.',
        invalidSchema: 'Schema del pack non valido.',
        invalidUser: 'Questo pack è stato emesso per un altro user_id.',
        invalidPackId: 'pack_id mancante o non valido.',
        invalidAlgorithm: 'Algoritmo di firma non valido.',
        invalidSignature: 'Firma non valida. Il pack non è stato installato.',
        invalidContentHash: 'Hash del contenuto non valido.',
        emptyPack: 'Il pack non contiene parole o sfide valide.',
        cryptoUnavailable: 'Questo browser non supporta la validazione sicura dei pack.',
        reservedPackId: 'Questo pack_id è riservato dal gioco.'
      },
      userIdErrors: {
        fileRequired: 'Seleziona un file user_id.',
        invalidJson: 'File non valido. Carica un JSON di user_id.',
        invalidSchema: 'Questo file non è un backup user_id di MimiMania.',
        invalidUserId: 'Lo user_id nel file non è valido.'
      }
    });

    function t(key, params = {}, language = currentLanguage) {
      const value =
        getNestedValue(TRANSLATIONS[language], key)
        ?? getNestedValue(TRANSLATIONS[DEFAULT_LANGUAGE], key)
        ?? key;
      if (typeof value === 'function') return value(params);
      return String(value).replace(/\{(\w+)\}/g, (_, token) => params[token] ?? `{${token}}`);
    }

    function createEmptyWordBank() {
      return DIFFICULTY_KEYS.reduce((acc, diff) => {
        acc[diff] = CATEGORY_KEYS.reduce((catAcc, cat) => {
          catAcc[cat] = [];
          return catAcc;
        }, {});
        return acc;
      }, {});
    }

    function normalizeWordBank(bank) {
      const normalized = createEmptyWordBank();
      DIFFICULTY_KEYS.forEach(diff => {
        CATEGORY_KEYS.forEach(cat => {
          const words = bank?.[diff]?.[cat];
          normalized[diff][cat] = Array.isArray(words)
            ? words.map(word => String(word).trim()).filter(Boolean)
            : [];
        });
      });
      return normalized;
    }

    function normalizeChallenges(list) {
      return Array.isArray(list)
        ? list.map(item => String(item).trim()).filter(Boolean)
        : [];
    }

    // ============================================================
    // DEFAULT WORD BANK — core content pack (Portuguese full list)
    // ============================================================
    const DEFAULT_WORDS_PT = {
      easy: {
        objects: [
          'Bola', 'Copo', 'Chapéu', 'Sapato', 'Livro', 'Cadeira', 'Mesa', 'Cama', 'Porta', 'Janela',
          'Lápis', 'Borracha', 'Mochila', 'Óculos', 'Guarda-chuva', 'Telefone', 'Espelho', 'Escova', 'Pente', 'Tesoura',
          'Chave', 'Garfo', 'Colher', 'Prato', 'Garrafa', 'Almofada', 'Cobertor', 'Toalha', 'Sabão', 'Balão',
          'Boneca', 'Carrinho', 'Pipoca', 'Sorvete', 'Bolo', 'Maçã', 'Banana', 'Uva', 'Flor', 'Árvore',
          'Sol', 'Lua', 'Estrela', 'Nuvem', 'Chuva', 'Guarda-roupa', 'Armário', 'Geladeira', 'Fogão', 'Televisão'
        ],
        actions: [
          'Correr', 'Pular', 'Dormir', 'Comer', 'Beber', 'Rir', 'Chorar', 'Dançar', 'Cantar', 'Nadar',
          'Voar', 'Andar', 'Sentar', 'Levantar', 'Abraçar', 'Brincar', 'Desenhar', 'Pintar', 'Ler', 'Escrever',
          'Ouvir', 'Gritar', 'Soprar', 'Respirar', 'Tossir', 'Espirrar', 'Bocejar', 'Aplaudir', 'Acenar', 'Apontar',
          'Pegar', 'Jogar', 'Chutar', 'Empurrar', 'Puxar', 'Abrir', 'Fechar', 'Lavar mãos', 'Escovar dentes', 'Pentear',
          'Calçar sapato', 'Tirar sapato', 'Ligar TV', 'Apagar luz', 'Bater palma', 'Girar', 'Rolar', 'Beijar', 'Sorrir', 'Pensar'
        ],
        animals: [
          'Cachorro', 'Gato', 'Peixe', 'Passarinho', 'Coelho', 'Galinha', 'Vaca', 'Cavalo', 'Porco', 'Ovelha',
          'Pato', 'Sapo', 'Borboleta', 'Formiga', 'Abelha', 'Aranha', 'Minhoca', 'Lesma', 'Caracol', 'Lagarta',
          'Elefante', 'Leão', 'Girafa', 'Macaco', 'Zebra', 'Hipopótamo', 'Crocodilo', 'Tartaruga', 'Pinguim', 'Urso',
          'Lobo', 'Raposa', 'Veado', 'Esquilo', 'Rato', 'Hamster', 'Iguana', 'Papagaio', 'Tucano', 'Flamingo',
          'Pelicano', 'Canguru', 'Koala', 'Panda', 'Golfinho', 'Baleia', 'Polvo', 'Caranguejo', 'Camarão', 'Estrela-do-mar'
        ],
        movies: [
          'Titanic', 'Avatar', 'O Rei Leão', 'Toy Story', 'Frozen', 'Shrek', 'Harry Potter', 'Homem-Aranha', 'Batman', 'Superman',
          'Jurassic Park', 'Vingadores', 'Star Wars', 'Minions', 'Carros', 'Procurando Nemo', 'Divertida Mente', 'Aladdin',
          'Cinderela', 'Branca de Neve', 'Matrix', 'Gladiador', 'E.T.', 'King Kong', 'Godzilla', 'Pantera Negra', 'Homem de Ferro',
          'Capitão América', 'Thor', 'Hulk', 'Deadpool', 'Venom', 'Transformers', 'Piratas do Caribe', 'Jumanji',
          'Missão Impossível', '007', 'Rocky', 'Rambo', 'Karate Kid', 'Gremlins', 'Ghostbusters', 'Scooby-Doo', 'Madagascar',
          'Kung Fu Panda', 'Monstros S.A.', 'Up', 'Encanto', 'Moana', 'Zootopia'
        ],
        professions: [
          'Médico', 'Dentista', 'Professor', 'Policial', 'Bombeiro', 'Motorista', 'Cozinheiro', 'Garçom', 'Padeiro', 'Carteiro',
          'Mecânico', 'Engenheiro', 'Advogado', 'Enfermeiro', 'Veterinário', 'Piloto', 'Cabeleireiro', 'Barbeiro', 'Ator', 'Cantor',
          'Dançarino', 'Faxineiro', 'Segurança', 'Agricultor', 'Pescador', 'Eletricista', 'Pedreiro', 'Pintor', 'Jardineiro',
          'Taxista', 'Entregador', 'Vendedor', 'Caixa', 'Secretária', 'Recepcionista', 'Treinador', 'Personal Trainer', 'Babá',
          'Cuidador', 'Zelador', 'Lixeiro', 'Frentista', 'Motorista de ônibus', 'Motorista de caminhão', 'Guia turístico', 'Fotógrafo',
          'Repórter', 'Radialista', 'Operador de caixa', 'Instrutor'
        ],
        celebrities: [
          'Neymar', 'Messi', 'Cristiano Ronaldo', 'Pelé', 'Anitta', 'Taylor Swift', 'Beyoncé', 'Lady Gaga', 'Justin Bieber', 'Rihanna',
          'Shakira', 'Madonna', 'Elvis Presley', 'Michael Jackson', 'The Rock', 'Vin Diesel', 'Will Smith', 'Tom Cruise',
          'Leonardo DiCaprio', 'Brad Pitt', 'Angelina Jolie', 'Scarlett Johansson', 'Jennifer Lopez', 'Selena Gomez', 'Zendaya',
          'Miley Cyrus', 'Ariana Grande', 'Ed Sheeran', 'Drake', 'Kanye West', 'Billie Eilish', 'Harry Styles', 'Daniel Radcliffe',
          'Emma Watson', 'Robert Downey Jr', 'Chris Hemsworth', 'Chris Evans', 'Gal Gadot', 'Margot Robbie', 'Ryan Reynolds',
          'Keanu Reeves', 'Jackie Chan', 'Bruce Lee', 'Sylvester Stallone', 'Arnold Schwarzenegger', 'Oprah Winfrey', 'Kim Kardashian',
          'MrBeast', 'Mark Zuckerberg', 'Elon Musk'
        ]
      },
      normal: {
        objects: [
          'Computador', 'Teclado', 'Rádio', 'Máquina de lavar', 'Aspirador', 'Liquidificador', 'Batedeira', 'Cafeteira', 'Sofá', 'Estante',
          'Ventilador', 'Ar-condicionado', 'Micro-ondas', 'Forno', 'Pia', 'Banheira', 'Chuveiro', 'Mala', 'Lanterna', 'Binóculo',
          'Câmera', 'Relógio', 'Calculadora', 'Termômetro', 'Balança', 'Bússola', 'Violão', 'Piano', 'Tambor', 'Flauta',
          'Sanfona', 'Trompete', 'Violino', 'Gaita', 'Xilofone', 'Raquete', 'Skate', 'Patins', 'Luva de boxe', 'Capacete',
          'Colete', 'Cinto', 'Gravata', 'Bolsa', 'Guarda-chuva', 'Bengala', 'Muleta', 'Cadeira de rodas', 'Óculos de sol', 'Boné'
        ],
        actions: [
          'Cozinhar', 'Dirigir', 'Pedalar', 'Pescar', 'Mergulhar', 'Escalar', 'Acampar', 'Fazer ioga', 'Meditar', 'Fotografar',
          'Filmar', 'Pintar quadro', 'Esculpir', 'Tricotar', 'Costurar', 'Bordar', 'Jardinagem', 'Regar planta', 'Podar árvore', 'Varrer',
          'Limpar janela', 'Passar roupa', 'Dobrar roupa', 'Fazer cama', 'Lavar louça', 'Secar louça', 'Descascar fruta', 'Ralar queijo',
          'Amassar pão', 'Remar', 'Surfar', 'Esquiar', 'Patinar', 'Driblar', 'Arremessar', 'Defender gol', 'Servir tênis',
          'Fazer ginástica', 'Aplaudir', 'Discursar', 'Entrevistar', 'Escalar parede', 'Fazer mágica', 'Equilibrar', 'Malabarismo',
          'Digitar', 'Telefonar', 'Tirar selfie', 'Pagar conta', 'Fazer fila'
        ],
        animals: [
          'Águia', 'Falcão', 'Coruja', 'Morcego', 'Camelo', 'Lhama', 'Alpaca', 'Bisão', 'Alce', 'Coyote',
          'Guepardo', 'Leopardo', 'Jaguar', 'Puma', 'Rinoceronte', 'Anaconda', 'Ornitorrinco', 'Dingo', 'Cacatua', 'Emu',
          'Orca', 'Tubarão', 'Arraia', 'Lula', 'Cavalo-marinho', 'Ouriço-do-mar', 'Arara', 'Pavão', 'Avestruz', 'Casuar',
          'Albatroz', 'Cegonha', 'Pelicano', 'Íbis', 'Garça', 'Lontra', 'Foca', 'Morsa', 'Leão-marinho', 'Dugongo',
          'Cabra-da-montanha', 'Íbex', 'Antílope', 'Gnu', 'Búfalo', 'Javali', 'Texugo', 'Guaxinim', 'Furão', 'Musaranho'
        ],
        movies: [
          'Interestelar', 'A Origem', 'Duna', 'Clube da Luta', 'Pulp Fiction', 'O Lobo de Wall Street', 'Coringa', 'Parasita',
          'O Grande Gatsby', 'Django Livre', 'Bastardos Inglórios', 'Whiplash', 'La La Land', 'Cisne Negro', 'O Iluminado',
          'Doutor Estranho', 'Guardiões da Galáxia', 'Capitã Marvel', 'Logan', 'John Wick', 'Matrix Reloaded', 'Matrix Revolutions',
          'O Regresso', 'Gravidade', 'Mad Max Estrada da Fúria', 'Blade Runner 2049', 'O Exterminador do Futuro', 'De Volta para o Futuro',
          'O Sexto Sentido', 'O Show de Truman', 'A Múmia', 'O Código Da Vinci', 'Anjos e Demônios', 'Os Jogos Vorazes', 'Crepúsculo',
          'It A Coisa', 'Invocação do Mal', 'Annabelle', 'A Freira', 'Jogos Mortais', 'Corra', 'Nós', 'Fragmentado', 'Glass',
          'Velozes e Furiosos', 'Top Gun', 'Missão Impossível Fallout', 'Kingsman', 'Sherlock Holmes', 'O Homem de Aço'
        ],
        professions: [
          'Programador', 'Designer', 'Arquiteto', 'Nutricionista', 'Psicólogo', 'Psiquiatra', 'Fisioterapeuta', 'Farmacêutico',
          'Biólogo', 'Químico', 'Físico', 'Geólogo', 'Astrônomo', 'Tradutor', 'Intérprete', 'Editor de vídeo', 'Diretor de cinema',
          'Produtor musical', 'DJ', 'Youtuber', 'Influenciador', 'Streamer', 'Publicitário', 'Redator', 'Analista de sistemas',
          'Administrador', 'Contador', 'Economista', 'Corretor de imóveis', 'Corretor de seguros', 'Investigador', 'Detetive',
          'Perito criminal', 'Auditor', 'Consultor', 'Coach', 'Treinador esportivo', 'Atleta profissional', 'Surfista',
          'Jogador de futebol', 'Lutador', 'Coreógrafo', 'Maquiador', 'Esteticista', 'Tatuador', 'Ilustrador', 'Animador',
          'Game designer', 'Roteirista', 'Dublador'
        ],
        celebrities: [
          'Timothée Chalamet', 'Florence Pugh', 'Pedro Pascal', 'Jenna Ortega', 'Tom Holland', 'Andrew Garfield', 'Tobey Maguire',
          'Benedict Cumberbatch', 'Martin Scorsese', 'Quentin Tarantino', 'Christopher Nolan', 'Denis Villeneuve', 'Greta Gerwig',
          'Jordan Peele', 'Dwayne Johnson', 'Jason Statham', 'Idris Elba', 'Henry Cavill', 'Millie Bobby Brown', 'Noah Schnapp',
          'Finn Wolfhard', 'Sadie Sink', 'Travis Scott', 'Post Malone', 'The Weeknd', 'Dua Lipa', 'Olivia Rodrigo', 'Doja Cat',
          'Bad Bunny', 'Karol G', 'Peso Pluma', 'Lizzo', 'Snoop Dogg', 'Eminem', '50 Cent', 'Jay-Z', 'Kendrick Lamar',
          'J Balvin', 'Maluma', 'Gisele Bündchen', 'Adriana Lima', 'Lewis Hamilton', 'Usain Bolt', 'Michael Jordan',
          'Serena Williams', 'Roger Federer', 'Novak Djokovic', 'Simone Biles', 'Tony Hawk'
        ]
      },
      hard: {
        objects: [
          'Estetoscópio', 'Bisturi', 'Microscópio', 'Telescópio', 'Sextante', 'Astrolábio', 'Cronômetro', 'Metrônomo', 'Afinador', 'Desfibrilador',
          'Catapulta', 'Periscópio', 'Destilador', 'Centrífuga', 'Incubadora', 'Autoclave', 'Espectrômetro', 'Cromatógrafo', 'Calorômetro', 'Potenciômetro',
          'Fisga', 'Arpão', 'Bumerangue', 'Arco e flecha', 'Besta', 'Lança', 'Maça', 'Machado', 'Foice', 'Tridente',
          'Sanduicheira', 'Desidratador', 'Fermentador', 'Slow cooker', 'Wok', 'Tagine', 'Fondue', 'Churrasqueira', 'Defumador', 'Alambique',
          'Teodolito', 'Altímetro', 'Barômetro', 'Higrômetro', 'Anemômetro', 'Pluviômetro', 'Sismógrafo', 'Gerador', 'Transformador', 'Osciloscópio'
        ],
        actions: [
          'Equilibrar na corda bamba', 'Engolir fogo', 'Escapar de camisa de força', 'Quebrar tijolos com a mão',
          'Andar sobre brasas', 'Ler braille', 'Fazer sinalização de mergulho', 'Comunicar em libras', 'Código morse', 'Tocar instrumento com os pés',
          'Extrair dente', 'Fazer cirurgia', 'Ressuscitar', 'Imobilizar fratura', 'Aplicar torniquete',
          'Fazer esgrima', 'Praticar tai chi', 'Golpe de caratê', 'Arremesso de martelo', 'Lançamento de dardo olímpico',
          'Arar terra', 'Ordenhar vaca', 'Tosquiar ovelha', 'Ferrar cavalo', 'Domar boi',
          'Tecer no tear', 'Soprar vidro', 'Forjar metal', 'Moldar cerâmica no torno', 'Restaurar quadro',
          'Decolar avião', 'Pousar helicóptero', 'Navegar barco a vela', 'Operar guindaste', 'Conduzir trem',
          'Fazer rapel', 'Alpinismo em rocha', 'Tirolesa', 'Escalada livre', 'Slackline',
          'Desativar bomba', 'Negociar reféns', 'Paraquedismo', 'Corrida de obstáculos', 'Levantamento de peso olímpico'
        ],
        animals: [
          'Axolote', 'Tarsídeo', 'Fossa', 'Quokka', 'Numbat', 'Kakapo', 'Tuátara', 'Okapi', 'Takin', 'Saiga',
          'Dugongo', 'Manatim', 'Narval', 'Beluga', 'Cachalote', 'Rorcual', 'Jubarte', 'Boto', 'Toninha', 'Franciscana',
          'Escorpião', 'Tarântula', 'Mamba-negra', 'Taipan', 'Cobra-de-coral', 'Viperão', 'Cascavel', 'Boomslang', 'Lula-gigante', 'Polvo-de-anéis-azuis',
          'Baiacu', 'Peixe-pedra', 'Peixe-leão', 'Cone-do-mar', 'Medusa-da-caixa', 'Vespa-asiática', 'Besouro-bombardeiro', 'Mosquito-tigre', 'Formiga-bala', 'Lagarta-de-fogo',
          'Pangolim', 'Aye-aye', 'Loris-lento', 'Tatu-bola', 'Tatu-gigante', 'Tamanduá-bandeira', 'Preguiça-de-três-dedos', 'Ouriço-pigmeu', 'Musaranho-elefante', 'Marta-pinheira'
        ],
        movies: [
          'O Farol', 'Hereditário', 'Midsommar', 'A Bruxa', 'O Sacrifício do Cervo Sagrado', 'O Lagosta', 'Dogville', 'Anticristo',
          'Melancolia', 'A Árvore da Vida', 'Sinédoque Nova York', 'Donnie Darko', 'O Homem Duplicado', 'Enemy', 'Ex Machina', 'Aniquilação',
          'Coerência', 'Primer', 'A Chegada', 'Moon', 'Solaris', 'Stalker', 'O Espelho', 'Persona', 'O Sétimo Selo', 'Amnésia',
          'Cidade dos Sonhos', 'Veludo Azul', 'Eraserhead', 'A Fonte da Vida', 'O Poço', 'A Plataforma', 'Climax', 'Irreversível',
          'Enter the Void', 'O Hospedeiro', 'Oldboy', 'Memórias de um Assassino', 'A Criada', 'Drive', 'Only God Forgives', 'O Mestre',
          'Magnólia', 'There Will Be Blood', 'A Caça', 'O Som ao Redor', 'Bacurau', 'O Lobo Atrás da Porta', 'Que Horas Ela Volta'
        ],
        professions: [
          'Neurocirurgião', 'Oncologista', 'Anestesista', 'Cardiologista', 'Ortopedista', 'Endocrinologista', 'Ginecologista', 'Urologista',
          'Radiologista', 'Patologista', 'Epidemiologista', 'Bioinformata', 'Engenheiro de dados', 'Cientista de dados', 'Engenheiro aeroespacial',
          'Engenheiro nuclear', 'Engenheiro de petróleo', 'Especialista em cibersegurança', 'Arquiteto de software', 'DevOps', 'Product Manager',
          'Scrum Master', 'UX Researcher', 'UX Designer', 'UI Designer', 'Especialista em SEO', 'Trader', 'Analista financeiro',
          'Gestor de investimentos', 'Atuário', 'Diplomata', 'Cônsul', 'Embaixador', 'Curador de museu', 'Restaurador de arte', 'Arqueólogo',
          'Paleontólogo', 'Oceanógrafo', 'Meteorologista', 'Piloto de caça', 'Controlador de voo', 'Capitão de navio', 'Sommelier',
          'Mestre cervejeiro', 'Chef executivo', 'Perfumista', 'Designer automotivo', 'Engenheiro robótico', 'Especialista em IA'
        ],
        celebrities: [
          'Saoirse Ronan', 'Paul Mescal', 'Barry Keoghan', 'Cillian Murphy', 'Rami Malek', 'Mahershala Ali', 'Dev Patel', 'Riz Ahmed',
          'Lakeith Stanfield', 'Oscar Isaac', 'Pedro Almodóvar', 'Wong Kar-wai', 'Bong Joon-ho', 'Park Chan-wook', 'Gaspar Noé', 'Lars von Trier',
          'Yorgos Lanthimos', 'Ari Aster', 'Robert Eggers', 'Noah Baumbach', 'Charlie Kaufman', 'Tilda Swinton', 'Anya Taylor-Joy', 'Tim Burton',
          'Guillermo del Toro', 'Alejandro Iñárritu', 'Alfonso Cuarón', 'Spike Lee', 'Wes Anderson', 'Taika Waititi', 'Hideo Kojima',
          'Shigeru Miyamoto', 'Gabe Newell', 'Satya Nadella', 'Sundar Pichai', 'Tim Cook', 'Sam Altman', 'Demis Hassabis', 'Naval Ravikant',
          'Gary Vaynerchuk', 'Ray Dalio', 'Warren Buffett', 'Charlie Munger', 'Howard Schultz', 'Reed Hastings', 'Susan Wojcicki',
          'Kevin Feige', 'Kathleen Kennedy', 'Fei-Fei Li', 'Andrew Ng'
        ]
      }
    };

    const CHALLENGES_PT = [
      'Faça a mímica sentado', 'Faça a mímica agachado', 'Faça a mímica pulando', 'Faça a mímica andando no lugar',
      'Faça a mímica com uma mão nas costas', 'Faça a mímica usando só uma mão', 'Faça a mímica com braços esticados',
      'Faça a mímica girando lentamente', 'Faça a mímica como se estivesse em câmera lenta', 'Faça a mímica como se estivesse acelerado (super rápido)',
      'Faça a mímica exagerando MUITO', 'Faça a mímica quase sem se mexer', 'Faça a mímica como se estivesse com medo',
      'Faça a mímica como se estivesse muito feliz', 'Faça a mímica como se estivesse bravo', 'Faça a mímica como se estivesse cansado',
      'Faça a mímica como se estivesse confuso', 'Faça a mímica como se estivesse em pânico', 'Faça a mímica como um robô',
      'Faça a mímica como um personagem de desenho animado', 'Faça a mímica como um idoso', 'Faça a mímica como uma criança',
      'Faça a mímica como um super-herói', 'Faça a mímica como um vilão', 'Faça a mímica como um animal',
      'Faça a mímica como se estivesse na lua (gravidade baixa)', 'Faça a mímica como se estivesse na água', 'Faça a mímica como se estivesse invisível',
      'Faça a mímica como se estivesse gigante', 'Faça a mímica como se estivesse muito pequeno', 'Não pode usar as mãos',
      'Não pode usar os braços', 'Não pode sair do lugar', 'Não pode repetir o mesmo gesto', 'Não pode apontar para nada',
      'Não pode usar o rosto (sem expressão facial)', 'Só pode usar o rosto (sem corpo)', 'Tem que começar pelo final da ação',
      'Tem que fazer tudo ao contrário (de trás pra frente)', 'Tem que parar completamente a cada 3 segundos',
      'Faça a mímica como se estivesse em um filme de ação', 'Faça a mímica como se fosse uma comédia',
      'Faça a mímica como se estivesse em câmera lenta dramática', 'Faça a mímica como se estivesse em um sonho',
      'Faça a mímica como se estivesse com muito frio', 'Faça a mímica como se estivesse com muito calor',
      'Faça a mímica como se estivesse no escuro', 'Faça a mímica como se estivesse em um palco',
      'Faça a mímica como se estivesse sendo observado por uma plateia gigante', 'Faça a mímica como se fosse a última chance de ganhar o jogo'
    ];

    const DEFAULT_WORDS_EN = {
      easy: {
        objects: [
          'Ball', 'Cup', 'Hat', 'Shoe', 'Book', 'Chair', 'Table', 'Bed', 'Door', 'Window',
          'Pencil', 'Eraser', 'Backpack', 'Glasses', 'Umbrella', 'Phone', 'Mirror', 'Brush', 'Comb', 'Scissors',
          'Key', 'Fork', 'Spoon', 'Plate', 'Bottle', 'Pillow', 'Blanket', 'Towel', 'Soap', 'Balloon',
          'Doll', 'Toy car', 'Popcorn', 'Ice cream', 'Cake', 'Apple', 'Banana', 'Grapes', 'Flower', 'Tree',
          'Sun', 'Moon', 'Star', 'Cloud', 'Rain', 'Wardrobe', 'Cabinet', 'Refrigerator', 'Stove', 'Television'
        ],
        actions: [
          'Run', 'Jump', 'Sleep', 'Eat', 'Drink', 'Laugh', 'Cry', 'Dance', 'Sing', 'Swim',
          'Fly', 'Walk', 'Sit', 'Stand up', 'Hug', 'Play', 'Draw', 'Paint', 'Read', 'Write',
          'Listen', 'Shout', 'Blow', 'Breathe', 'Cough', 'Sneeze', 'Yawn', 'Clap', 'Wave', 'Point',
          'Grab', 'Throw', 'Kick', 'Push', 'Pull', 'Open', 'Close', 'Wash hands', 'Brush teeth', 'Comb hair',
          'Put on shoes', 'Take off shoes', 'Turn on TV', 'Turn off the light', 'Clap hands', 'Spin', 'Roll', 'Kiss', 'Smile', 'Think'
        ],
        animals: [
          'Dog', 'Cat', 'Fish', 'Bird', 'Rabbit', 'Chicken', 'Cow', 'Horse', 'Pig', 'Sheep',
          'Duck', 'Frog', 'Butterfly', 'Ant', 'Bee', 'Spider', 'Earthworm', 'Slug', 'Snail', 'Caterpillar',
          'Elephant', 'Lion', 'Giraffe', 'Monkey', 'Zebra', 'Hippopotamus', 'Crocodile', 'Turtle', 'Penguin', 'Bear',
          'Wolf', 'Fox', 'Deer', 'Squirrel', 'Mouse', 'Hamster', 'Iguana', 'Parrot', 'Toucan', 'Flamingo',
          'Pelican', 'Kangaroo', 'Koala', 'Panda', 'Dolphin', 'Whale', 'Octopus', 'Crab', 'Shrimp', 'Starfish'
        ],
        movies: [
          'Titanic', 'Avatar', 'The Lion King', 'Toy Story', 'Frozen', 'Shrek', 'Harry Potter', 'Spider-Man', 'Batman', 'Superman',
          'Jurassic Park', 'The Avengers', 'Star Wars', 'Minions', 'Cars', 'Finding Nemo', 'Inside Out', 'Aladdin',
          'Cinderella', 'Snow White', 'The Matrix', 'Gladiator', 'E.T.', 'King Kong', 'Godzilla', 'Black Panther', 'Iron Man',
          'Captain America', 'Thor', 'Hulk', 'Deadpool', 'Venom', 'Transformers', 'Pirates of the Caribbean', 'Jumanji',
          'Mission: Impossible', '007', 'Rocky', 'Rambo', 'The Karate Kid', 'Gremlins', 'Ghostbusters', 'Scooby-Doo', 'Madagascar',
          'Kung Fu Panda', 'Monsters, Inc.', 'Up', 'Encanto', 'Moana', 'Zootopia'
        ],
        professions: [
          'Doctor', 'Dentist', 'Teacher', 'Police officer', 'Firefighter', 'Driver', 'Cook', 'Waiter', 'Baker', 'Mail carrier',
          'Mechanic', 'Engineer', 'Lawyer', 'Nurse', 'Veterinarian', 'Pilot', 'Hairdresser', 'Barber', 'Actor', 'Singer',
          'Dancer', 'Cleaner', 'Security guard', 'Farmer', 'Fisherman', 'Electrician', 'Bricklayer', 'Painter', 'Gardener',
          'Taxi driver', 'Delivery driver', 'Salesperson', 'Cashier', 'Secretary', 'Receptionist', 'Coach', 'Personal trainer', 'Babysitter',
          'Caregiver', 'Janitor', 'Garbage collector', 'Gas station attendant', 'Bus driver', 'Truck driver', 'Tour guide', 'Photographer',
          'Reporter', 'Radio host', 'Checkout operator', 'Instructor'
        ],
        celebrities: [...DEFAULT_WORDS_PT.easy.celebrities]
      },
      normal: {
        objects: [
          'Computer', 'Keyboard', 'Radio', 'Washing machine', 'Vacuum cleaner', 'Blender', 'Mixer', 'Coffee maker', 'Sofa', 'Shelf',
          'Fan', 'Air conditioner', 'Microwave', 'Oven', 'Sink', 'Bathtub', 'Shower', 'Suitcase', 'Flashlight', 'Binoculars',
          'Camera', 'Clock', 'Calculator', 'Thermometer', 'Scale', 'Compass', 'Acoustic guitar', 'Piano', 'Drum', 'Flute',
          'Accordion', 'Trumpet', 'Violin', 'Harmonica', 'Xylophone', 'Racket', 'Skateboard', 'Roller skates', 'Boxing glove', 'Helmet',
          'Vest', 'Belt', 'Tie', 'Bag', 'Umbrella', 'Cane', 'Crutch', 'Wheelchair', 'Sunglasses', 'Cap'
        ],
        actions: [
          'Cook', 'Drive', 'Ride a bike', 'Fish', 'Dive', 'Climb', 'Camp', 'Do yoga', 'Meditate', 'Take photos',
          'Film', 'Paint a picture', 'Sculpt', 'Knit', 'Sew', 'Embroider', 'Garden', 'Water plants', 'Prune a tree', 'Sweep',
          'Clean a window', 'Iron clothes', 'Fold clothes', 'Make the bed', 'Wash dishes', 'Dry dishes', 'Peel fruit', 'Grate cheese',
          'Knead bread', 'Row', 'Surf', 'Ski', 'Skate', 'Dribble', 'Throw', 'Block a goal', 'Serve in tennis',
          'Exercise', 'Applaud', 'Give a speech', 'Interview', 'Climb a wall', 'Do magic', 'Balance', 'Juggle',
          'Type', 'Make a phone call', 'Take a selfie', 'Pay a bill', 'Wait in line'
        ],
        animals: [
          'Eagle', 'Falcon', 'Owl', 'Bat', 'Camel', 'Llama', 'Alpaca', 'Bison', 'Moose', 'Coyote',
          'Cheetah', 'Leopard', 'Jaguar', 'Puma', 'Rhinoceros', 'Anaconda', 'Platypus', 'Dingo', 'Cockatoo', 'Emu',
          'Orca', 'Shark', 'Stingray', 'Squid', 'Seahorse', 'Sea urchin', 'Macaw', 'Peacock', 'Ostrich', 'Cassowary',
          'Albatross', 'Stork', 'Pelican', 'Ibis', 'Heron', 'Otter', 'Seal', 'Walrus', 'Sea lion', 'Dugong',
          'Mountain goat', 'Ibex', 'Antelope', 'Wildebeest', 'Buffalo', 'Boar', 'Badger', 'Raccoon', 'Ferret', 'Shrew'
        ],
        movies: [
          'Interstellar', 'Inception', 'Dune', 'Fight Club', 'Pulp Fiction', 'The Wolf of Wall Street', 'Joker', 'Parasite',
          'The Great Gatsby', 'Django Unchained', 'Inglourious Basterds', 'Whiplash', 'La La Land', 'Black Swan', 'The Shining',
          'Doctor Strange', 'Guardians of the Galaxy', 'Captain Marvel', 'Logan', 'John Wick', 'The Matrix Reloaded', 'The Matrix Revolutions',
          'The Revenant', 'Gravity', 'Mad Max: Fury Road', 'Blade Runner 2049', 'The Terminator', 'Back to the Future',
          'The Sixth Sense', 'The Truman Show', 'The Mummy', 'The Da Vinci Code', 'Angels & Demons', 'The Hunger Games', 'Twilight',
          'It', 'The Conjuring', 'Annabelle', 'The Nun', 'Saw', 'Get Out', 'Us', 'Split', 'Glass',
          'Fast & Furious', 'Top Gun', 'Mission: Impossible - Fallout', 'Kingsman', 'Sherlock Holmes', 'Man of Steel'
        ],
        professions: [
          'Programmer', 'Designer', 'Architect', 'Nutritionist', 'Psychologist', 'Psychiatrist', 'Physical therapist', 'Pharmacist',
          'Biologist', 'Chemist', 'Physicist', 'Geologist', 'Astronomer', 'Translator', 'Interpreter', 'Video editor', 'Film director',
          'Music producer', 'DJ', 'YouTuber', 'Influencer', 'Streamer', 'Advertiser', 'Copywriter', 'Systems analyst',
          'Administrator', 'Accountant', 'Economist', 'Real estate agent', 'Insurance broker', 'Investigator', 'Detective',
          'Forensic expert', 'Auditor', 'Consultant', 'Coach', 'Sports coach', 'Professional athlete', 'Surfer',
          'Football player', 'Fighter', 'Choreographer', 'Makeup artist', 'Esthetician', 'Tattoo artist', 'Illustrator', 'Animator',
          'Game designer', 'Screenwriter', 'Voice actor'
        ],
        celebrities: [...DEFAULT_WORDS_PT.normal.celebrities]
      },
      hard: {
        objects: [
          'Stethoscope', 'Scalpel', 'Microscope', 'Telescope', 'Sextant', 'Astrolabe', 'Stopwatch', 'Metronome', 'Tuner', 'Defibrillator',
          'Catapult', 'Periscope', 'Distiller', 'Centrifuge', 'Incubator', 'Autoclave', 'Spectrometer', 'Chromatograph', 'Calorimeter', 'Potentiometer',
          'Slingshot', 'Harpoon', 'Boomerang', 'Bow and arrow', 'Crossbow', 'Spear', 'Mace', 'Axe', 'Sickle', 'Trident',
          'Sandwich maker', 'Food dehydrator', 'Fermenter', 'Slow cooker', 'Wok', 'Tagine', 'Fondue set', 'Barbecue grill', 'Smoker', 'Still',
          'Theodolite', 'Altimeter', 'Barometer', 'Hygrometer', 'Anemometer', 'Rain gauge', 'Seismograph', 'Generator', 'Transformer', 'Oscilloscope'
        ],
        actions: [
          'Balance on a tightrope', 'Swallow fire', 'Escape from a straitjacket', 'Break bricks with your hand',
          'Walk on hot coals', 'Read braille', 'Use diving hand signals', 'Communicate in sign language', 'Use Morse code', 'Play an instrument with your feet',
          'Pull a tooth', 'Perform surgery', 'Resuscitate', 'Immobilize a fracture', 'Apply a tourniquet',
          'Fence', 'Practice tai chi', 'Do a karate strike', 'Throw a hammer', 'Olympic javelin throw',
          'Plow the land', 'Milk a cow', 'Shear a sheep', 'Shoe a horse', 'Tame an ox',
          'Weave on a loom', 'Blow glass', 'Forge metal', 'Shape pottery on a wheel', 'Restore a painting',
          'Take off in an airplane', 'Land a helicopter', 'Sail a sailboat', 'Operate a crane', 'Drive a train',
          'Rappel', 'Rock climb', 'Zipline', 'Free climb', 'Slackline',
          'Defuse a bomb', 'Negotiate with hostages', 'Skydive', 'Obstacle race', 'Olympic weightlifting'
        ],
        animals: [
          'Axolotl', 'Tarsier', 'Fossa', 'Quokka', 'Numbat', 'Kakapo', 'Tuatara', 'Okapi', 'Takin', 'Saiga',
          'Dugong', 'Manatee', 'Narwhal', 'Beluga', 'Sperm whale', 'Fin whale', 'Humpback whale', 'River dolphin', 'Porpoise', 'Franciscana',
          'Scorpion', 'Tarantula', 'Black mamba', 'Taipan', 'Coral snake', 'Viper', 'Rattlesnake', 'Boomslang', 'Giant squid', 'Blue-ringed octopus',
          'Pufferfish', 'Stonefish', 'Lionfish', 'Cone snail', 'Box jellyfish', 'Asian giant hornet', 'Bombardier beetle', 'Tiger mosquito', 'Bullet ant', 'Fire caterpillar',
          'Pangolin', 'Aye-aye', 'Slow loris', 'Three-banded armadillo', 'Giant armadillo', 'Giant anteater', 'Three-toed sloth', 'Pygmy hedgehog', 'Elephant shrew', 'Pine marten'
        ],
        movies: [
          'The Lighthouse', 'Hereditary', 'Midsommar', 'The Witch', 'The Killing of a Sacred Deer', 'The Lobster', 'Dogville', 'Antichrist',
          'Melancholia', 'The Tree of Life', 'Synecdoche, New York', 'Donnie Darko', 'The Double', 'Enemy', 'Ex Machina', 'Annihilation',
          'Coherence', 'Primer', 'Arrival', 'Moon', 'Solaris', 'Stalker', 'Mirror', 'Persona', 'The Seventh Seal', 'Memento',
          'Mulholland Drive', 'Blue Velvet', 'Eraserhead', 'The Fountain', 'The Well', 'The Platform', 'Climax', 'Irreversible',
          'Enter the Void', 'The Host', 'Oldboy', 'Memories of Murder', 'The Handmaiden', 'Drive', 'Only God Forgives', 'The Master',
          'Magnolia', 'There Will Be Blood', 'The Hunt', 'Neighbouring Sounds', 'Bacurau', 'The Wolf Behind the Door', 'The Second Mother'
        ],
        professions: [
          'Neurosurgeon', 'Oncologist', 'Anesthesiologist', 'Cardiologist', 'Orthopedist', 'Endocrinologist', 'Gynecologist', 'Urologist',
          'Radiologist', 'Pathologist', 'Epidemiologist', 'Bioinformatician', 'Data engineer', 'Data scientist', 'Aerospace engineer',
          'Nuclear engineer', 'Petroleum engineer', 'Cybersecurity specialist', 'Software architect', 'DevOps engineer', 'Product manager',
          'Scrum master', 'UX researcher', 'UX designer', 'UI designer', 'SEO specialist', 'Trader', 'Financial analyst',
          'Investment manager', 'Actuary', 'Diplomat', 'Consul', 'Ambassador', 'Museum curator', 'Art conservator', 'Archaeologist',
          'Paleontologist', 'Oceanographer', 'Meteorologist', 'Fighter pilot', 'Air traffic controller', 'Ship captain', 'Sommelier',
          'Master brewer', 'Executive chef', 'Perfumer', 'Automotive designer', 'Robotics engineer', 'AI specialist'
        ],
        celebrities: [...DEFAULT_WORDS_PT.hard.celebrities]
      }
    };

    const DEFAULT_WORDS_ES = {
      easy: {
        objects: [
          'Pelota', 'Vaso', 'Sombrero', 'Zapato', 'Libro', 'Silla', 'Mesa', 'Cama', 'Puerta', 'Ventana',
          'Lápiz', 'Borrador', 'Mochila', 'Gafas', 'Paraguas', 'Teléfono', 'Espejo', 'Cepillo', 'Peine', 'Tijeras',
          'Llave', 'Tenedor', 'Cuchara', 'Plato', 'Botella', 'Almohada', 'Manta', 'Toalla', 'Jabón', 'Globo',
          'Muñeca', 'Carrito', 'Palomitas', 'Helado', 'Pastel', 'Manzana', 'Banana', 'Uvas', 'Flor', 'Árbol',
          'Sol', 'Luna', 'Estrella', 'Nube', 'Lluvia', 'Armario', 'Gabinete', 'Refrigerador', 'Estufa', 'Televisión'
        ],
        actions: [
          'Correr', 'Saltar', 'Dormir', 'Comer', 'Beber', 'Reír', 'Llorar', 'Bailar', 'Cantar', 'Nadar',
          'Volar', 'Caminar', 'Sentarse', 'Levantarse', 'Abrazar', 'Jugar', 'Dibujar', 'Pintar', 'Leer', 'Escribir',
          'Escuchar', 'Gritar', 'Soplar', 'Respirar', 'Toser', 'Estornudar', 'Bostezar', 'Aplaudir', 'Saludar', 'Señalar',
          'Agarrar', 'Lanzar', 'Patear', 'Empujar', 'Jalar', 'Abrir', 'Cerrar', 'Lavar las manos', 'Cepillarse los dientes', 'Peinarse',
          'Ponerse los zapatos', 'Quitarse los zapatos', 'Encender la TV', 'Apagar la luz', 'Dar palmadas', 'Girar', 'Rodar', 'Besar', 'Sonreír', 'Pensar'
        ],
        animals: [
          'Perro', 'Gato', 'Pez', 'Pájaro', 'Conejo', 'Gallina', 'Vaca', 'Caballo', 'Cerdo', 'Oveja',
          'Pato', 'Rana', 'Mariposa', 'Hormiga', 'Abeja', 'Araña', 'Lombriz', 'Babosa', 'Caracol', 'Oruga',
          'Elefante', 'León', 'Jirafa', 'Mono', 'Cebra', 'Hipopótamo', 'Cocodrilo', 'Tortuga', 'Pingüino', 'Oso',
          'Lobo', 'Zorro', 'Ciervo', 'Ardilla', 'Ratón', 'Hámster', 'Iguana', 'Loro', 'Tucán', 'Flamenco',
          'Pelícano', 'Canguro', 'Koala', 'Panda', 'Delfín', 'Ballena', 'Pulpo', 'Cangrejo', 'Camarón', 'Estrella de mar'
        ],
        movies: [
          'Titanic', 'Avatar', 'El Rey León', 'Toy Story', 'Frozen', 'Shrek', 'Harry Potter', 'Spider-Man', 'Batman', 'Superman',
          'Jurassic Park', 'Los Vengadores', 'Star Wars', 'Minions', 'Cars', 'Buscando a Nemo', 'Intensamente', 'Aladdín',
          'Cenicienta', 'Blancanieves', 'Matrix', 'Gladiador', 'E.T.', 'King Kong', 'Godzilla', 'Pantera Negra', 'Iron Man',
          'Capitán América', 'Thor', 'Hulk', 'Deadpool', 'Venom', 'Transformers', 'Piratas del Caribe', 'Jumanji',
          'Misión: Imposible', '007', 'Rocky', 'Rambo', 'Karate Kid', 'Gremlins', 'Ghostbusters', 'Scooby-Doo', 'Madagascar',
          'Kung Fu Panda', 'Monsters, Inc.', 'Up', 'Encanto', 'Moana', 'Zootopia'
        ],
        professions: [
          'Médico', 'Dentista', 'Profesor', 'Policía', 'Bombero', 'Conductor', 'Cocinero', 'Mesero', 'Panadero', 'Cartero',
          'Mecánico', 'Ingeniero', 'Abogado', 'Enfermero', 'Veterinario', 'Piloto', 'Peluquero', 'Barbero', 'Actor', 'Cantante',
          'Bailarín', 'Personal de limpieza', 'Guardia de seguridad', 'Agricultor', 'Pescador', 'Electricista', 'Albañil', 'Pintor', 'Jardinero',
          'Taxista', 'Repartidor', 'Vendedor', 'Cajero', 'Secretaria', 'Recepcionista', 'Entrenador', 'Entrenador personal', 'Niñera',
          'Cuidador', 'Conserje', 'Basurero', 'Gasolinero', 'Conductor de autobús', 'Conductor de camión', 'Guía turístico', 'Fotógrafo',
          'Reportero', 'Locutor', 'Operador de caja', 'Instructor'
        ],
        celebrities: [...DEFAULT_WORDS_PT.easy.celebrities]
      },
      normal: {
        objects: [
          'Computadora', 'Teclado', 'Radio', 'Lavadora', 'Aspiradora', 'Licuadora', 'Batidora', 'Cafetera', 'Sofá', 'Estantería',
          'Ventilador', 'Aire acondicionado', 'Microondas', 'Horno', 'Fregadero', 'Bañera', 'Ducha', 'Maleta', 'Linterna', 'Binoculares',
          'Cámara', 'Reloj', 'Calculadora', 'Termómetro', 'Báscula', 'Brújula', 'Guitarra', 'Piano', 'Tambor', 'Flauta',
          'Acordeón', 'Trompeta', 'Violín', 'Armónica', 'Xilófono', 'Raqueta', 'Patineta', 'Patines', 'Guante de boxeo', 'Casco',
          'Chaleco', 'Cinturón', 'Corbata', 'Bolsa', 'Paraguas', 'Bastón', 'Muleta', 'Silla de ruedas', 'Gafas de sol', 'Gorra'
        ],
        actions: [
          'Cocinar', 'Conducir', 'Andar en bicicleta', 'Pescar', 'Bucear', 'Escalar', 'Acampar', 'Hacer yoga', 'Meditar', 'Fotografiar',
          'Filmar', 'Pintar un cuadro', 'Esculpir', 'Tejer', 'Coser', 'Bordar', 'Hacer jardinería', 'Regar plantas', 'Podar un árbol', 'Barrer',
          'Limpiar una ventana', 'Planchar ropa', 'Doblar ropa', 'Hacer la cama', 'Lavar los platos', 'Secar los platos', 'Pelar fruta', 'Rallar queso',
          'Amasar pan', 'Remar', 'Surfear', 'Esquiar', 'Patinar', 'Driblar', 'Lanzar', 'Atajar un gol', 'Sacar en tenis',
          'Hacer ejercicio', 'Aplaudir', 'Dar un discurso', 'Entrevistar', 'Escalar un muro', 'Hacer magia', 'Equilibrarse', 'Hacer malabares',
          'Teclear', 'Llamar por teléfono', 'Tomarse una selfie', 'Pagar una cuenta', 'Hacer fila'
        ],
        animals: [
          'Águila', 'Halcón', 'Búho', 'Murciélago', 'Camello', 'Llama', 'Alpaca', 'Bisonte', 'Alce', 'Coyote',
          'Guepardo', 'Leopardo', 'Jaguar', 'Puma', 'Rinoceronte', 'Anaconda', 'Ornitorrinco', 'Dingo', 'Cacatúa', 'Emú',
          'Orca', 'Tiburón', 'Raya', 'Calamar', 'Caballito de mar', 'Erizo de mar', 'Guacamayo', 'Pavo real', 'Avestruz', 'Casuario',
          'Albatros', 'Cigüeña', 'Pelícano', 'Ibis', 'Garza', 'Nutria', 'Foca', 'Morsa', 'León marino', 'Dugongo',
          'Cabra montés', 'Íbice', 'Antílope', 'Ñu', 'Búfalo', 'Jabalí', 'Tejón', 'Mapache', 'Hurón', 'Musaraña'
        ],
        movies: [
          'Interestelar', 'Origen', 'Duna', 'El club de la pelea', 'Pulp Fiction', 'El lobo de Wall Street', 'Joker', 'Parásitos',
          'El gran Gatsby', 'Django sin cadenas', 'Bastardos sin gloria', 'Whiplash', 'La La Land', 'El cisne negro', 'El resplandor',
          'Doctor Strange', 'Guardianes de la Galaxia', 'Capitana Marvel', 'Logan', 'John Wick', 'Matrix recargado', 'Matrix revoluciones',
          'El renacido', 'Gravedad', 'Mad Max: Furia en el camino', 'Blade Runner 2049', 'Terminator', 'Volver al futuro',
          'El sexto sentido', 'El show de Truman', 'La momia', 'El código Da Vinci', 'Ángeles y demonios', 'Los juegos del hambre', 'Crepúsculo',
          'It', 'El conjuro', 'Annabelle', 'La monja', 'Saw', '¡Huye!', 'Nosotros', 'Fragmentado', 'Glass',
          'Rápidos y furiosos', 'Top Gun', 'Misión: Imposible - Repercusión', 'Kingsman', 'Sherlock Holmes', 'El hombre de acero'
        ],
        professions: [
          'Programador', 'Diseñador', 'Arquitecto', 'Nutricionista', 'Psicólogo', 'Psiquiatra', 'Fisioterapeuta', 'Farmacéutico',
          'Biólogo', 'Químico', 'Físico', 'Geólogo', 'Astrónomo', 'Traductor', 'Intérprete', 'Editor de video', 'Director de cine',
          'Productor musical', 'DJ', 'Youtuber', 'Influencer', 'Streamer', 'Publicista', 'Redactor', 'Analista de sistemas',
          'Administrador', 'Contador', 'Economista', 'Agente inmobiliario', 'Corredor de seguros', 'Investigador', 'Detective',
          'Perito criminal', 'Auditor', 'Consultor', 'Coach', 'Entrenador deportivo', 'Atleta profesional', 'Surfista',
          'Futbolista', 'Luchador', 'Coreógrafo', 'Maquillador', 'Esteticista', 'Tatuador', 'Ilustrador', 'Animador',
          'Diseñador de videojuegos', 'Guionista', 'Actor de doblaje'
        ],
        celebrities: [...DEFAULT_WORDS_PT.normal.celebrities]
      },
      hard: {
        objects: [
          'Estetoscopio', 'Bisturí', 'Microscopio', 'Telescopio', 'Sextante', 'Astrolabio', 'Cronómetro', 'Metrónomo', 'Afinador', 'Desfibrilador',
          'Catapulta', 'Periscopio', 'Destilador', 'Centrífuga', 'Incubadora', 'Autoclave', 'Espectrómetro', 'Cromatógrafo', 'Calorímetro', 'Potenciómetro',
          'Tirachinas', 'Arpón', 'Bumerán', 'Arco y flecha', 'Ballesta', 'Lanza', 'Maza', 'Hacha', 'Hoz', 'Tridente',
          'Sandwichera', 'Deshidratador', 'Fermentador', 'Olla de cocción lenta', 'Wok', 'Tajín', 'Fondue', 'Parrilla', 'Ahumador', 'Alambique',
          'Teodolito', 'Altímetro', 'Barómetro', 'Higrómetro', 'Anemómetro', 'Pluviómetro', 'Sismógrafo', 'Generador', 'Transformador', 'Osciloscopio'
        ],
        actions: [
          'Equilibrarse en la cuerda floja', 'Tragar fuego', 'Escapar de una camisa de fuerza', 'Romper ladrillos con la mano',
          'Caminar sobre brasas', 'Leer braille', 'Hacer señales de buceo', 'Comunicarse en lengua de señas', 'Usar código morse', 'Tocar un instrumento con los pies',
          'Sacar un diente', 'Hacer cirugía', 'Reanimar', 'Inmovilizar una fractura', 'Aplicar un torniquete',
          'Hacer esgrima', 'Practicar tai chi', 'Dar un golpe de karate', 'Lanzamiento de martillo', 'Lanzamiento olímpico de jabalina',
          'Arar la tierra', 'Ordeñar una vaca', 'Esquilar una oveja', 'Herrar un caballo', 'Domar un buey',
          'Tejer en telar', 'Soplar vidrio', 'Forjar metal', 'Moldear cerámica en torno', 'Restaurar una pintura',
          'Despegar un avión', 'Aterrizar un helicóptero', 'Navegar un velero', 'Operar una grúa', 'Conducir un tren',
          'Hacer rápel', 'Escalar roca', 'Tirolesa', 'Escalada libre', 'Hacer slackline',
          'Desactivar una bomba', 'Negociar rehenes', 'Hacer paracaidismo', 'Carrera de obstáculos', 'Levantamiento de pesas olímpico'
        ],
        animals: [
          'Ajolote', 'Tarsero', 'Fosa', 'Quokka', 'Numbat', 'Kakapo', 'Tuátara', 'Okapi', 'Takin', 'Saiga',
          'Dugongo', 'Manatí', 'Narval', 'Beluga', 'Cachalote', 'Rorcual', 'Ballena jorobada', 'Delfín de río', 'Marsopa', 'Franciscana',
          'Escorpión', 'Tarántula', 'Mamba negra', 'Taipán', 'Serpiente coral', 'Víbora', 'Cascabel', 'Boomslang', 'Calamar gigante', 'Pulpo de anillos azules',
          'Pez globo', 'Pez piedra', 'Pez león', 'Caracol cono', 'Medusa de caja', 'Avispón asiático', 'Escarabajo bombardero', 'Mosquito tigre', 'Hormiga bala', 'Oruga de fuego',
          'Pangolín', 'Aye-aye', 'Loris lento', 'Armadillo de tres bandas', 'Armadillo gigante', 'Oso hormiguero gigante', 'Perezoso de tres dedos', 'Erizo pigmeo', 'Musaraña elefante', 'Marta'
        ],
        movies: [
          'El faro', 'Hereditary', 'Midsommar', 'La bruja', 'El sacrificio del ciervo sagrado', 'La langosta', 'Dogville', 'Anticristo',
          'Melancolía', 'El árbol de la vida', 'Sinécdoque, Nueva York', 'Donnie Darko', 'El doble', 'Enemy', 'Ex Machina', 'Aniquilación',
          'Coherence', 'Primer', 'La llegada', 'Moon', 'Solaris', 'Stalker', 'El espejo', 'Persona', 'El séptimo sello', 'Memento',
          'Mulholland Drive', 'Terciopelo azul', 'Eraserhead', 'La fuente de la vida', 'El pozo', 'La plataforma', 'Climax', 'Irreversible',
          'Enter the Void', 'El huésped', 'Oldboy', 'Memorias de un asesino', 'La doncella', 'Drive', 'Only God Forgives', 'The Master',
          'Magnolia', 'Pozos de ambición', 'La cacería', 'Sonidos de barrio', 'Bacurau', 'El lobo detrás de la puerta', 'Una segunda madre'
        ],
        professions: [
          'Neurocirujano', 'Oncólogo', 'Anestesista', 'Cardiólogo', 'Ortopedista', 'Endocrinólogo', 'Ginecólogo', 'Urólogo',
          'Radiólogo', 'Patólogo', 'Epidemiólogo', 'Bioinformático', 'Ingeniero de datos', 'Científico de datos', 'Ingeniero aeroespacial',
          'Ingeniero nuclear', 'Ingeniero petrolero', 'Especialista en ciberseguridad', 'Arquitecto de software', 'Ingeniero DevOps', 'Gerente de producto',
          'Scrum Master', 'Investigador UX', 'Diseñador UX', 'Diseñador UI', 'Especialista en SEO', 'Trader', 'Analista financiero',
          'Gestor de inversiones', 'Actuario', 'Diplomático', 'Cónsul', 'Embajador', 'Curador de museo', 'Restaurador de arte', 'Arqueólogo',
          'Paleontólogo', 'Oceanógrafo', 'Meteorólogo', 'Piloto de combate', 'Controlador aéreo', 'Capitán de barco', 'Sommelier',
          'Maestro cervecero', 'Chef ejecutivo', 'Perfumista', 'Diseñador automotriz', 'Ingeniero robótico', 'Especialista en IA'
        ],
        celebrities: [...DEFAULT_WORDS_PT.hard.celebrities]
      }
    };

    const CHALLENGES_EN = [
      'Act it out while sitting down', 'Act it out while crouching', 'Act it out while jumping', 'Act it out while walking in place',
      'Act it out with one hand behind your back', 'Act it out using only one hand', 'Act it out with your arms stretched out',
      'Act it out while spinning slowly', 'Act it out as if you were in slow motion', 'Act it out as if you were sped up (super fast)',
      'Act it out exaggerating A LOT', 'Act it out barely moving', 'Act it out as if you were scared',
      'Act it out as if you were very happy', 'Act it out as if you were angry', 'Act it out as if you were tired',
      'Act it out as if you were confused', 'Act it out as if you were panicking', 'Act it out like a robot',
      'Act it out like a cartoon character', 'Act it out like an elderly person', 'Act it out like a child',
      'Act it out like a superhero', 'Act it out like a villain', 'Act it out like an animal',
      'Act it out as if you were on the moon (low gravity)', 'Act it out as if you were underwater', 'Act it out as if you were invisible',
      'Act it out as if you were giant', 'Act it out as if you were very tiny', 'You cannot use your hands',
      'You cannot use your arms', 'You cannot move from your spot', 'You cannot repeat the same gesture', 'You cannot point at anything',
      'You cannot use your face (no facial expressions)', 'You can only use your face (no body)', 'You must start from the end of the action',
      'You must do everything backwards (from end to beginning)', 'You must freeze completely every 3 seconds',
      'Act it out as if you were in an action movie', 'Act it out as if it were a comedy',
      'Act it out as if you were in dramatic slow motion', 'Act it out as if you were in a dream',
      'Act it out as if you were very cold', 'Act it out as if you were very hot',
      'Act it out as if you were in the dark', 'Act it out as if you were on a stage',
      'Act it out as if a huge audience were watching you', 'Act it out as if it were your last chance to win the game'
    ];

    const CHALLENGES_ES = [
      'Haz la mímica sentado', 'Haz la mímica agachado', 'Haz la mímica saltando', 'Haz la mímica caminando en el lugar',
      'Haz la mímica con una mano detrás de la espalda', 'Haz la mímica usando solo una mano', 'Haz la mímica con los brazos estirados',
      'Haz la mímica girando lentamente', 'Haz la mímica como si estuvieras en cámara lenta', 'Haz la mímica como si estuvieras acelerado (super rápido)',
      'Haz la mímica exagerando MUCHO', 'Haz la mímica casi sin moverte', 'Haz la mímica como si tuvieras miedo',
      'Haz la mímica como si estuvieras muy feliz', 'Haz la mímica como si estuvieras enojado', 'Haz la mímica como si estuvieras cansado',
      'Haz la mímica como si estuvieras confundido', 'Haz la mímica como si estuvieras en pánico', 'Haz la mímica como un robot',
      'Haz la mímica como un personaje de caricatura', 'Haz la mímica como una persona mayor', 'Haz la mímica como un niño',
      'Haz la mímica como un superhéroe', 'Haz la mímica como un villano', 'Haz la mímica como un animal',
      'Haz la mímica como si estuvieras en la luna (baja gravedad)', 'Haz la mímica como si estuvieras bajo el agua', 'Haz la mímica como si fueras invisible',
      'Haz la mímica como si fueras gigante', 'Haz la mímica como si fueras muy pequeño', 'No puedes usar las manos',
      'No puedes usar los brazos', 'No puedes moverte del lugar', 'No puedes repetir el mismo gesto', 'No puedes señalar nada',
      'No puedes usar la cara (sin expresiones faciales)', 'Solo puedes usar la cara (sin cuerpo)', 'Tienes que empezar por el final de la acción',
      'Tienes que hacer todo al revés (de atrás hacia adelante)', 'Tienes que detenerte por completo cada 3 segundos',
      'Haz la mímica como si estuvieras en una película de acción', 'Haz la mímica como si fuera una comedia',
      'Haz la mímica como si estuvieras en cámara lenta dramática', 'Haz la mímica como si estuvieras en un sueño',
      'Haz la mímica como si tuvieras mucho frío', 'Haz la mímica como si tuvieras mucho calor',
      'Haz la mímica como si estuvieras en la oscuridad', 'Haz la mímica como si estuvieras en un escenario',
      'Haz la mímica como si te estuviera mirando un público enorme', 'Haz la mímica como si fuera la última oportunidad de ganar el juego'
    ];

    const DEFAULT_WORDS_FR = {
      easy: {
        objects: [
          'Ballon', 'Verre', 'Chapeau', 'Chaussure', 'Livre', 'Chaise', 'Table', 'Lit', 'Porte', 'Fenêtre',
          'Crayon', 'Gomme', 'Sac à dos', 'Lunettes', 'Parapluie', 'Téléphone', 'Miroir', 'Brosse', 'Peigne', 'Ciseaux',
          'Clé', 'Fourchette', 'Cuillère', 'Assiette', 'Bouteille', 'Oreiller', 'Couverture', 'Serviette', 'Savon', 'Ballon de baudruche',
          'Poupée', 'Petite voiture', 'Pop-corn', 'Glace', 'Gâteau', 'Pomme', 'Banane', 'Raisin', 'Fleur', 'Arbre',
          'Soleil', 'Lune', 'Étoile', 'Nuage', 'Pluie', 'Armoire', 'Placard', 'Réfrigérateur', 'Cuisinière', 'Télévision'
        ],
        actions: [
          'Courir', 'Sauter', 'Dormir', 'Manger', 'Boire', 'Rire', 'Pleurer', 'Danser', 'Chanter', 'Nager',
          'Voler', 'Marcher', "S'asseoir", 'Se lever', 'Faire un câlin', 'Jouer', 'Dessiner', 'Peindre', 'Lire', 'Écrire',
          'Écouter', 'Crier', 'Souffler', 'Respirer', 'Tousser', 'Éternuer', 'Bâiller', 'Applaudir', 'Faire signe', 'Montrer du doigt',
          'Attraper', 'Lancer', 'Donner un coup de pied', 'Pousser', 'Tirer', 'Ouvrir', 'Fermer', 'Se laver les mains', 'Se brosser les dents', 'Se peigner',
          'Mettre ses chaussures', 'Enlever ses chaussures', 'Allumer la télé', 'Éteindre la lumière', 'Taper dans les mains', 'Tourner', 'Rouler', 'Embrasser', 'Sourire', 'Penser'
        ],
        animals: [
          'Chien', 'Chat', 'Poisson', 'Oiseau', 'Lapin', 'Poule', 'Vache', 'Cheval', 'Cochon', 'Mouton',
          'Canard', 'Grenouille', 'Papillon', 'Fourmi', 'Abeille', 'Araignée', 'Ver de terre', 'Limace', 'Escargot', 'Chenille',
          'Éléphant', 'Lion', 'Girafe', 'Singe', 'Zèbre', 'Hippopotame', 'Crocodile', 'Tortue', 'Pingouin', 'Ours',
          'Loup', 'Renard', 'Cerf', 'Écureuil', 'Souris', 'Hamster', 'Iguane', 'Perroquet', 'Toucan', 'Flamant rose',
          'Pélican', 'Kangourou', 'Koala', 'Panda', 'Dauphin', 'Baleine', 'Poulpe', 'Crabe', 'Crevette', 'Étoile de mer'
        ],
        movies: [
          'Titanic', 'Avatar', 'Le Roi lion', 'Toy Story', 'La Reine des neiges', 'Shrek', 'Harry Potter', 'Spider-Man', 'Batman', 'Superman',
          'Jurassic Park', 'Avengers', 'Star Wars', 'Les Minions', 'Cars', 'Le Monde de Nemo', 'Vice-versa', 'Aladdin',
          'Cendrillon', 'Blanche-Neige', 'Matrix', 'Gladiator', 'E.T.', 'King Kong', 'Godzilla', 'Black Panther', 'Iron Man',
          'Captain America', 'Thor', 'Hulk', 'Deadpool', 'Venom', 'Transformers', 'Pirates des Caraïbes', 'Jumanji',
          'Mission impossible', '007', 'Rocky', 'Rambo', 'Karaté Kid', 'Gremlins', 'Ghostbusters', 'Scooby-Doo', 'Madagascar',
          'Kung Fu Panda', 'Monstres et Cie', 'Là-haut', 'Encanto', 'Vaiana', 'Zootopie'
        ],
        professions: [
          'Médecin', 'Dentiste', 'Professeur', 'Policier', 'Pompier', 'Chauffeur', 'Cuisinier', 'Serveur', 'Boulanger', 'Facteur',
          'Mécanicien', 'Ingénieur', 'Avocat', 'Infirmier', 'Vétérinaire', 'Pilote', 'Coiffeur', 'Barbier', 'Acteur', 'Chanteur',
          'Danseur', 'Agent de nettoyage', 'Agent de sécurité', 'Agriculteur', 'Pêcheur', 'Électricien', 'Maçon', 'Peintre', 'Jardinier',
          'Chauffeur de taxi', 'Livreur', 'Vendeur', 'Caissier', 'Secrétaire', 'Réceptionniste', 'Entraîneur', 'Coach sportif', 'Baby-sitter',
          'Aide-soignant', 'Concierge', 'Éboueur', 'Pompiste', 'Chauffeur de bus', 'Chauffeur de camion', 'Guide touristique', 'Photographe',
          'Reporter', 'Animateur radio', 'Opérateur de caisse', 'Instructeur'
        ],
        celebrities: [...DEFAULT_WORDS_PT.easy.celebrities]
      },
      normal: {
        objects: [
          'Ordinateur', 'Clavier', 'Radio', 'Machine à laver', 'Aspirateur', 'Mixeur', 'Batteur', 'Cafetière', 'Canapé', 'Étagère',
          'Ventilateur', 'Climatiseur', 'Micro-ondes', 'Four', 'Évier', 'Baignoire', 'Douche', 'Valise', 'Lampe de poche', 'Jumelles',
          'Appareil photo', 'Horloge', 'Calculatrice', 'Thermomètre', 'Balance', 'Boussole', 'Guitare acoustique', 'Piano', 'Tambour', 'Flûte',
          'Accordéon', 'Trompette', 'Violon', 'Harmonica', 'Xylophone', 'Raquette', 'Skateboard', 'Patins à roulettes', 'Gant de boxe', 'Casque',
          'Gilet', 'Ceinture', 'Cravate', 'Sac', 'Parapluie', 'Canne', 'Béquille', 'Fauteuil roulant', 'Lunettes de soleil', 'Casquette'
        ],
        actions: [
          'Cuisiner', 'Conduire', 'Faire du vélo', 'Pêcher', 'Plonger', 'Grimper', 'Camper', 'Faire du yoga', 'Méditer', 'Photographier',
          'Filmer', 'Peindre un tableau', 'Sculpter', 'Tricoter', 'Coudre', 'Broder', 'Jardiner', 'Arroser une plante', 'Tailler un arbre', 'Balayer',
          'Nettoyer une fenêtre', 'Repasser', 'Plier le linge', 'Faire le lit', 'Faire la vaisselle', 'Essuyer la vaisselle', 'Éplucher un fruit', 'Râper du fromage',
          'Pétrir du pain', 'Ramer', 'Surfer', 'Skier', 'Patiner', 'Dribbler', 'Lancer', 'Arrêter un but', 'Servir au tennis',
          'Faire de la gymnastique', 'Applaudir', 'Faire un discours', 'Interviewer', 'Escalader un mur', 'Faire de la magie', 'Garder l’équilibre', 'Jongler',
          'Taper au clavier', 'Téléphoner', 'Prendre un selfie', 'Payer une facture', 'Faire la queue'
        ],
        animals: [
          'Aigle', 'Faucon', 'Hibou', 'Chauve-souris', 'Chameau', 'Lama', 'Alpaga', 'Bison', 'Élan', 'Coyote',
          'Guépard', 'Léopard', 'Jaguar', 'Puma', 'Rhinocéros', 'Anaconda', 'Ornithorynque', 'Dingo', 'Cacatoès', 'Émeu',
          'Orque', 'Requin', 'Raie', 'Calmar', 'Hippocampe', 'Oursin', 'Ara', 'Paon', 'Autruche', 'Casoar',
          'Albatros', 'Cigogne', 'Pélican', 'Ibis', 'Héron', 'Loutre', 'Phoque', 'Morse', 'Lion de mer', 'Dugong',
          'Chèvre de montagne', 'Bouquetin', 'Antilope', 'Gnou', 'Buffle', 'Sanglier', 'Blaireau', 'Raton laveur', 'Furet', 'Musaraigne'
        ],
        movies: [
          'Interstellar', 'Inception', 'Dune', 'Fight Club', 'Pulp Fiction', 'Le Loup de Wall Street', 'Joker', 'Parasite',
          'Gatsby le Magnifique', 'Django Unchained', 'Inglourious Basterds', 'Whiplash', 'La La Land', 'Black Swan', 'Shining',
          'Doctor Strange', 'Les Gardiens de la Galaxie', 'Captain Marvel', 'Logan', 'John Wick', 'Matrix Reloaded', 'Matrix Revolutions',
          'The Revenant', 'Gravity', 'Mad Max: Fury Road', 'Blade Runner 2049', 'Terminator', 'Retour vers le futur',
          'Sixième Sens', 'The Truman Show', 'La Momie', 'Da Vinci Code', 'Anges et Démons', 'Hunger Games', 'Twilight',
          'Ça', 'Conjuring', 'Annabelle', 'La Nonne', 'Saw', 'Get Out', 'Us', 'Split', 'Glass',
          'Fast and Furious', 'Top Gun', 'Mission: Impossible - Fallout', 'Kingsman', 'Sherlock Holmes', 'Man of Steel'
        ],
        professions: [
          'Programmeur', 'Designer', 'Architecte', 'Nutritionniste', 'Psychologue', 'Psychiatre', 'Kinésithérapeute', 'Pharmacien',
          'Biologiste', 'Chimiste', 'Physicien', 'Géologue', 'Astronome', 'Traducteur', 'Interprète', 'Monteur vidéo', 'Réalisateur',
          'Producteur musical', 'DJ', 'YouTubeur', 'Influenceur', 'Streamer', 'Publicitaire', 'Rédacteur', 'Analyste système',
          'Administrateur', 'Comptable', 'Économiste', 'Agent immobilier', 'Courtier en assurances', 'Enquêteur', 'Détective',
          'Expert criminalistique', 'Auditeur', 'Consultant', 'Coach', 'Entraîneur sportif', 'Athlète professionnel', 'Surfeur',
          'Footballeur', 'Combattant', 'Chorégraphe', 'Maquilleur', 'Esthéticien', 'Tatoueur', 'Illustrateur', 'Animateur',
          'Game designer', 'Scénariste', 'Doubleur'
        ],
        celebrities: [...DEFAULT_WORDS_PT.normal.celebrities]
      },
      hard: {
        objects: [
          'Stéthoscope', 'Scalpel', 'Microscope', 'Télescope', 'Sextant', 'Astrolabe', 'Chronomètre', 'Métronome', 'Accordeur', 'Défibrillateur',
          'Catapulte', 'Périscope', 'Distillateur', 'Centrifugeuse', 'Incubateur', 'Autoclave', 'Spectromètre', 'Chromatographe', 'Calorimètre', 'Potentiomètre',
          'Lance-pierre', 'Harpon', 'Boomerang', 'Arc et flèche', 'Arbalète', 'Lance', 'Masse', 'Hache', 'Faucille', 'Trident',
          'Appareil à sandwich', 'Déshydrateur', 'Fermenteur', 'Mijoteuse', 'Wok', 'Tajine', 'Fondue', 'Barbecue', 'Fumoir', 'Alambic',
          'Théodolite', 'Altimètre', 'Baromètre', 'Hygromètre', 'Anémomètre', 'Pluviomètre', 'Sismographe', 'Générateur', 'Transformateur', 'Oscilloscope'
        ],
        actions: [
          'Tenir en équilibre sur une corde raide', 'Avaler du feu', 'S’échapper d’une camisole de force', 'Casser des briques avec la main',
          'Marcher sur des braises', 'Lire le braille', 'Faire des signes de plongée', 'Communiquer en langue des signes', 'Utiliser le code morse', 'Jouer d’un instrument avec les pieds',
          'Extraire une dent', 'Faire une chirurgie', 'Réanimer', 'Immobiliser une fracture', 'Appliquer un garrot',
          'Faire de l’escrime', 'Pratiquer le tai chi', 'Faire un coup de karaté', 'Lancer le marteau', 'Lancer le javelot olympique',
          'Labourer la terre', 'Traire une vache', 'Tondre un mouton', 'Ferrer un cheval', 'Dompter un boeuf',
          'Tisser sur un métier', 'Souffler du verre', 'Forger du métal', 'Façonner de la céramique au tour', 'Restaurer un tableau',
          'Faire décoller un avion', 'Faire atterrir un hélicoptère', 'Naviguer sur un voilier', 'Conduire une grue', 'Conduire un train',
          'Faire du rappel', 'Faire de l’escalade', 'Faire de la tyrolienne', 'Faire de l’escalade libre', 'Faire du slackline',
          'Désamorcer une bombe', 'Négocier avec des otages', 'Faire du parachutisme', 'Faire une course d’obstacles', 'Faire de l’haltérophilie olympique'
        ],
        animals: [
          'Axolotl', 'Tarsier', 'Fossa', 'Quokka', 'Numbat', 'Kakapo', 'Tuatara', 'Okapi', 'Takin', 'Saïga',
          'Dugong', 'Lamantin', 'Narval', 'Béluga', 'Cachalot', 'Rorqual', 'Baleine à bosse', 'Dauphin de rivière', 'Marsouin', 'Franciscana',
          'Scorpion', 'Mygale', 'Mamba noir', 'Taïpan', 'Serpent corail', 'Vipère', 'Crotale', 'Boomslang', 'Calmar géant', 'Pieuvre à anneaux bleus',
          'Poisson-globe', 'Poisson-pierre', 'Poisson-lion', 'Cône marin', 'Méduse-boîte', 'Frelon asiatique', 'Scarabée bombardier', 'Moustique tigre', 'Fourmi balle de fusil', 'Chenille de feu',
          'Pangolin', 'Aye-aye', 'Loris lent', 'Tatou à trois bandes', 'Tatou géant', 'Fourmilier géant', 'Paresseux à trois doigts', 'Hérisson pygmée', 'Musaraigne éléphant', 'Martre des pins'
        ],
        movies: [
          'The Lighthouse', 'Hérédité', 'Midsommar', 'The Witch', 'Mise à mort du cerf sacré', 'The Lobster', 'Dogville', 'Antichrist',
          'Melancholia', 'The Tree of Life', 'Synecdoche, New York', 'Donnie Darko', 'The Double', 'Enemy', 'Ex Machina', 'Annihilation',
          'Coherence', 'Primer', 'Premier Contact', 'Moon', 'Solaris', 'Stalker', 'Le Miroir', 'Persona', 'Le Septième Sceau', 'Memento',
          'Mulholland Drive', 'Blue Velvet', 'Eraserhead', 'The Fountain', 'Le Puits', 'La Plateforme', 'Climax', 'Irréversible',
          'Enter the Void', 'The Host', 'Oldboy', 'Memories of Murder', 'Mademoiselle', 'Drive', 'Only God Forgives', 'The Master',
          'Magnolia', 'There Will Be Blood', 'La Chasse', 'Les Bruits de Recife', 'Bacurau', 'Le Loup derrière la porte', 'Une seconde mère'
        ],
        professions: [
          'Neurochirurgien', 'Oncologue', 'Anesthésiste', 'Cardiologue', 'Orthopédiste', 'Endocrinologue', 'Gynécologue', 'Urologue',
          'Radiologue', 'Pathologiste', 'Épidémiologiste', 'Bioinformaticien', 'Ingénieur de données', 'Data scientist', 'Ingénieur aérospatial',
          'Ingénieur nucléaire', 'Ingénieur pétrolier', 'Spécialiste en cybersécurité', 'Architecte logiciel', 'Ingénieur DevOps', 'Product manager',
          'Scrum Master', 'UX researcher', 'UX designer', 'UI designer', 'Spécialiste SEO', 'Trader', 'Analyste financier',
          'Gestionnaire d’investissements', 'Actuaire', 'Diplomate', 'Consul', 'Ambassadeur', 'Conservateur de musée', 'Restaurateur d’art', 'Archéologue',
          'Paléontologue', 'Océanographe', 'Météorologue', 'Pilote de chasse', 'Contrôleur aérien', 'Capitaine de navire', 'Sommelier',
          'Maître brasseur', 'Chef exécutif', 'Parfumeur', 'Designer automobile', 'Ingénieur robotique', 'Spécialiste en IA'
        ],
        celebrities: [...DEFAULT_WORDS_PT.hard.celebrities]
      }
    };

    const DEFAULT_WORDS_DE = {
      easy: {
        objects: [
          'Ball', 'Becher', 'Hut', 'Schuh', 'Buch', 'Stuhl', 'Tisch', 'Bett', 'Tür', 'Fenster',
          'Bleistift', 'Radiergummi', 'Rucksack', 'Brille', 'Regenschirm', 'Telefon', 'Spiegel', 'Bürste', 'Kamm', 'Schere',
          'Schlüssel', 'Gabel', 'Löffel', 'Teller', 'Flasche', 'Kissen', 'Decke', 'Handtuch', 'Seife', 'Luftballon',
          'Puppe', 'Spielzeugauto', 'Popcorn', 'Eis', 'Kuchen', 'Apfel', 'Banane', 'Trauben', 'Blume', 'Baum',
          'Sonne', 'Mond', 'Stern', 'Wolke', 'Regen', 'Kleiderschrank', 'Schrank', 'Kühlschrank', 'Herd', 'Fernseher'
        ],
        actions: [
          'Rennen', 'Springen', 'Schlafen', 'Essen', 'Trinken', 'Lachen', 'Weinen', 'Tanzen', 'Singen', 'Schwimmen',
          'Fliegen', 'Gehen', 'Sitzen', 'Aufstehen', 'Umarmen', 'Spielen', 'Zeichnen', 'Malen', 'Lesen', 'Schreiben',
          'Zuhören', 'Schreien', 'Pusten', 'Atmen', 'Husten', 'Niesen', 'Gähnen', 'Klatschen', 'Winken', 'Zeigen',
          'Greifen', 'Werfen', 'Treten', 'Schieben', 'Ziehen', 'Öffnen', 'Schließen', 'Hände waschen', 'Zähne putzen', 'Kämmen',
          'Schuhe anziehen', 'Schuhe ausziehen', 'Fernseher einschalten', 'Licht ausschalten', 'In die Hände klatschen', 'Sich drehen', 'Rollen', 'Küssen', 'Lächeln', 'Denken'
        ],
        animals: [
          'Hund', 'Katze', 'Fisch', 'Vogel', 'Kaninchen', 'Huhn', 'Kuh', 'Pferd', 'Schwein', 'Schaf',
          'Ente', 'Frosch', 'Schmetterling', 'Ameise', 'Biene', 'Spinne', 'Regenwurm', 'Nacktschnecke', 'Schnecke', 'Raupe',
          'Elefant', 'Löwe', 'Giraffe', 'Affe', 'Zebra', 'Nilpferd', 'Krokodil', 'Schildkröte', 'Pinguin', 'Bär',
          'Wolf', 'Fuchs', 'Hirsch', 'Eichhörnchen', 'Maus', 'Hamster', 'Leguan', 'Papagei', 'Tukan', 'Flamingo',
          'Pelikan', 'Känguru', 'Koala', 'Panda', 'Delfin', 'Wal', 'Oktopus', 'Krabbe', 'Garnele', 'Seestern'
        ],
        movies: [
          'Titanic', 'Avatar', 'Der König der Löwen', 'Toy Story', 'Die Eiskönigin', 'Shrek', 'Harry Potter', 'Spider-Man', 'Batman', 'Superman',
          'Jurassic Park', 'Die Avengers', 'Star Wars', 'Minions', 'Cars', 'Findet Nemo', 'Alles steht Kopf', 'Aladdin',
          'Cinderella', 'Schneewittchen', 'Matrix', 'Gladiator', 'E.T.', 'King Kong', 'Godzilla', 'Black Panther', 'Iron Man',
          'Captain America', 'Thor', 'Hulk', 'Deadpool', 'Venom', 'Transformers', 'Fluch der Karibik', 'Jumanji',
          'Mission: Impossible', '007', 'Rocky', 'Rambo', 'Karate Kid', 'Gremlins', 'Ghostbusters', 'Scooby-Doo', 'Madagascar',
          'Kung Fu Panda', 'Die Monster AG', 'Oben', 'Encanto', 'Vaiana', 'Zoomania'
        ],
        professions: [
          'Arzt', 'Zahnarzt', 'Lehrer', 'Polizist', 'Feuerwehrmann', 'Fahrer', 'Koch', 'Kellner', 'Bäcker', 'Postbote',
          'Mechaniker', 'Ingenieur', 'Anwalt', 'Krankenpfleger', 'Tierarzt', 'Pilot', 'Friseur', 'Barbier', 'Schauspieler', 'Sänger',
          'Tänzer', 'Reinigungskraft', 'Sicherheitskraft', 'Landwirt', 'Fischer', 'Elektriker', 'Maurer', 'Maler', 'Gärtner',
          'Taxifahrer', 'Lieferfahrer', 'Verkäufer', 'Kassierer', 'Sekretärin', 'Empfangsmitarbeiter', 'Trainer', 'Personal Trainer', 'Babysitter',
          'Betreuer', 'Hausmeister', 'Müllwerker', 'Tankwart', 'Busfahrer', 'Lkw-Fahrer', 'Reiseführer', 'Fotograf',
          'Reporter', 'Radiomoderator', 'Kassenbediener', 'Ausbilder'
        ],
        celebrities: [...DEFAULT_WORDS_PT.easy.celebrities]
      },
      normal: {
        objects: [
          'Computer', 'Tastatur', 'Radio', 'Waschmaschine', 'Staubsauger', 'Mixer', 'Handrührgerät', 'Kaffeemaschine', 'Sofa', 'Regal',
          'Ventilator', 'Klimaanlage', 'Mikrowelle', 'Backofen', 'Spüle', 'Badewanne', 'Dusche', 'Koffer', 'Taschenlampe', 'Fernglas',
          'Kamera', 'Uhr', 'Taschenrechner', 'Thermometer', 'Waage', 'Kompass', 'Akustikgitarre', 'Klavier', 'Trommel', 'Flöte',
          'Akkordeon', 'Trompete', 'Geige', 'Mundharmonika', 'Xylophon', 'Schläger', 'Skateboard', 'Rollschuhe', 'Boxhandschuh', 'Helm',
          'Weste', 'Gürtel', 'Krawatte', 'Tasche', 'Regenschirm', 'Gehstock', 'Krücke', 'Rollstuhl', 'Sonnenbrille', 'Kappe'
        ],
        actions: [
          'Kochen', 'Fahren', 'Radfahren', 'Angeln', 'Tauchen', 'Klettern', 'Zelten', 'Yoga machen', 'Meditieren', 'Fotografieren',
          'Filmen', 'Ein Bild malen', 'Bildhauern', 'Stricken', 'Nähen', 'Sticken', 'Gärtnern', 'Pflanze gießen', 'Baum beschneiden', 'Fegen',
          'Fenster putzen', 'Kleidung bügeln', 'Kleidung falten', 'Bett machen', 'Geschirr spülen', 'Geschirr abtrocknen', 'Obst schälen', 'Käse reiben',
          'Brot kneten', 'Rudern', 'Surfen', 'Skifahren', 'Schlittschuhlaufen', 'Dribbeln', 'Werfen', 'Ein Tor verteidigen', 'Beim Tennis aufschlagen',
          'Gymnastik machen', 'Applaudieren', 'Eine Rede halten', 'Interviewen', 'Eine Wand erklimmen', 'Zaubern', 'Balancieren', 'Jonglieren',
          'Tippen', 'Telefonieren', 'Ein Selfie machen', 'Eine Rechnung bezahlen', 'Schlange stehen'
        ],
        animals: [
          'Adler', 'Falke', 'Eule', 'Fledermaus', 'Kamel', 'Lama', 'Alpaka', 'Bison', 'Elch', 'Kojote',
          'Gepard', 'Leopard', 'Jaguar', 'Puma', 'Nashorn', 'Anakonda', 'Schnabeltier', 'Dingo', 'Kakadu', 'Emu',
          'Orca', 'Hai', 'Rochen', 'Tintenfisch', 'Seepferdchen', 'Seeigel', 'Ara', 'Pfau', 'Strauß', 'Kasuar',
          'Albatros', 'Storch', 'Pelikan', 'Ibis', 'Reiher', 'Otter', 'Seehund', 'Walross', 'Seelöwe', 'Dugong',
          'Bergziege', 'Steinbock', 'Antilope', 'Gnu', 'Büffel', 'Wildschwein', 'Dachs', 'Waschbär', 'Frettchen', 'Spitzmaus'
        ],
        movies: [
          'Interstellar', 'Inception', 'Dune', 'Fight Club', 'Pulp Fiction', 'The Wolf of Wall Street', 'Joker', 'Parasite',
          'Der große Gatsby', 'Django Unchained', 'Inglourious Basterds', 'Whiplash', 'La La Land', 'Black Swan', 'Shining',
          'Doctor Strange', 'Guardians of the Galaxy', 'Captain Marvel', 'Logan', 'John Wick', 'Matrix Reloaded', 'Matrix Revolutions',
          'The Revenant', 'Gravity', 'Mad Max: Fury Road', 'Blade Runner 2049', 'Terminator', 'Zurück in die Zukunft',
          'The Sixth Sense', 'Die Truman Show', 'Die Mumie', 'The Da Vinci Code', 'Illuminati', 'Die Tribute von Panem', 'Twilight',
          'Es', 'Conjuring', 'Annabelle', 'The Nun', 'Saw', 'Get Out', 'Wir', 'Split', 'Glass',
          'Fast & Furious', 'Top Gun', 'Mission: Impossible - Fallout', 'Kingsman', 'Sherlock Holmes', 'Man of Steel'
        ],
        professions: [
          'Programmierer', 'Designer', 'Architekt', 'Ernährungsberater', 'Psychologe', 'Psychiater', 'Physiotherapeut', 'Apotheker',
          'Biologe', 'Chemiker', 'Physiker', 'Geologe', 'Astronom', 'Übersetzer', 'Dolmetscher', 'Videoeditor', 'Filmregisseur',
          'Musikproduzent', 'DJ', 'YouTuber', 'Influencer', 'Streamer', 'Werbefachmann', 'Texter', 'Systemanalyst',
          'Administrator', 'Buchhalter', 'Ökonom', 'Immobilienmakler', 'Versicherungsmakler', 'Ermittler', 'Detektiv',
          'Forensiker', 'Prüfer', 'Berater', 'Coach', 'Sporttrainer', 'Profisportler', 'Surfer',
          'Fußballspieler', 'Kämpfer', 'Choreograf', 'Visagist', 'Kosmetiker', 'Tätowierer', 'Illustrator', 'Animator',
          'Game Designer', 'Drehbuchautor', 'Synchronsprecher'
        ],
        celebrities: [...DEFAULT_WORDS_PT.normal.celebrities]
      },
      hard: {
        objects: [
          'Stethoskop', 'Skalpell', 'Mikroskop', 'Teleskop', 'Sextant', 'Astrolabium', 'Stoppuhr', 'Metronom', 'Stimmgerät', 'Defibrillator',
          'Katapult', 'Periskop', 'Destilliergerät', 'Zentrifuge', 'Inkubator', 'Autoklav', 'Spektrometer', 'Chromatograph', 'Kalorimeter', 'Potentiometer',
          'Schleuder', 'Harpune', 'Bumerang', 'Pfeil und Bogen', 'Armbrust', 'Speer', 'Streitkolben', 'Axt', 'Sichel', 'Dreizack',
          'Sandwichtoaster', 'Dörrautomat', 'Fermenter', 'Schongarer', 'Wok', 'Tajine', 'Fondue', 'Grill', 'Räucherofen', 'Destille',
          'Theodolit', 'Höhenmesser', 'Barometer', 'Hygrometer', 'Anemometer', 'Regenmesser', 'Seismograph', 'Generator', 'Transformator', 'Oszilloskop'
        ],
        actions: [
          'Auf dem Drahtseil balancieren', 'Feuer schlucken', 'Aus einer Zwangsjacke entkommen', 'Ziegel mit der Hand zerbrechen',
          'Über glühende Kohlen laufen', 'Brailleschrift lesen', 'Tauchzeichen geben', 'In Gebärdensprache kommunizieren', 'Morsecode benutzen', 'Ein Instrument mit den Füßen spielen',
          'Einen Zahn ziehen', 'Eine Operation durchführen', 'Wiederbeleben', 'Einen Bruch ruhigstellen', 'Eine Aderpresse anlegen',
          'Fechten', 'Tai Chi üben', 'Einen Karateschlag machen', 'Hammerwerfen', 'Olympischen Speerwurf machen',
          'Erde pflügen', 'Eine Kuh melken', 'Ein Schaf scheren', 'Ein Pferd beschlagen', 'Einen Ochsen zähmen',
          'Am Webstuhl weben', 'Glas blasen', 'Metall schmieden', 'Keramik auf der Drehscheibe formen', 'Ein Gemälde restaurieren',
          'Ein Flugzeug starten', 'Einen Hubschrauber landen', 'Ein Segelboot steuern', 'Einen Kran bedienen', 'Einen Zug fahren',
          'Abseilen', 'Felsklettern', 'Seilrutsche fahren', 'Freiklettern', 'Slackline gehen',
          'Eine Bombe entschärfen', 'Mit Geiseln verhandeln', 'Fallschirmspringen', 'Hindernislauf machen', 'Olympisches Gewichtheben'
        ],
        animals: [
          'Axolotl', 'Koboldmaki', 'Fossa', 'Quokka', 'Numbat', 'Kakapo', 'Tuatara', 'Okapi', 'Takin', 'Saiga',
          'Dugong', 'Manati', 'Narwal', 'Beluga', 'Pottwal', 'Finnwal', 'Buckelwal', 'Flussdelfin', 'Schweinswal', 'Franciscana',
          'Skorpion', 'Vogelspinne', 'Schwarze Mamba', 'Taipan', 'Korallenschlange', 'Viper', 'Klapperschlange', 'Boomslang', 'Riesenkalmar', 'Blauringkrake',
          'Kugelfisch', 'Steinfisch', 'Feuerfisch', 'Kegelschnecke', 'Würfelqualle', 'Asiatische Hornisse', 'Bombardierkäfer', 'Tigermücke', '24-Stunden-Ameise', 'Feuerraupe',
          'Pangolin', 'Aye-aye', 'Plumplori', 'Dreibinden-Gürteltier', 'Riesengürteltier', 'Großer Ameisenbär', 'Dreifingerfaultier', 'Zwergigel', 'Elefantenspitzmaus', 'Baummarder'
        ],
        movies: [
          'Der Leuchtturm', 'Hereditary', 'Midsommar', 'The Witch', 'The Killing of a Sacred Deer', 'The Lobster', 'Dogville', 'Antichrist',
          'Melancholia', 'The Tree of Life', 'Synecdoche, New York', 'Donnie Darko', 'The Double', 'Enemy', 'Ex Machina', 'Auslöschung',
          'Coherence', 'Primer', 'Arrival', 'Moon', 'Solaris', 'Stalker', 'Der Spiegel', 'Persona', 'Das siebente Siegel', 'Memento',
          'Mulholland Drive', 'Blue Velvet', 'Eraserhead', 'The Fountain', 'Der Schacht', 'Die Plattform', 'Climax', 'Irreversibel',
          'Enter the Void', 'The Host', 'Oldboy', 'Memories of Murder', 'Die Taschendiebin', 'Drive', 'Only God Forgives', 'The Master',
          'Magnolia', 'There Will Be Blood', 'Die Jagd', 'Neighbouring Sounds', 'Bacurau', 'Der Wolf hinter der Tür', 'Eine zweite Mutter'
        ],
        professions: [
          'Neurochirurg', 'Onkologe', 'Anästhesist', 'Kardiologe', 'Orthopäde', 'Endokrinologe', 'Gynäkologe', 'Urologe',
          'Radiologe', 'Pathologe', 'Epidemiologe', 'Bioinformatiker', 'Dateningenieur', 'Datenwissenschaftler', 'Luft- und Raumfahrtingenieur',
          'Nuklearingenieur', 'Erdölingenieur', 'Cybersicherheitsspezialist', 'Softwarearchitekt', 'DevOps-Ingenieur', 'Produktmanager',
          'Scrum Master', 'UX-Forscher', 'UX-Designer', 'UI-Designer', 'SEO-Spezialist', 'Trader', 'Finanzanalyst',
          'Investmentmanager', 'Aktuar', 'Diplomat', 'Konsul', 'Botschafter', 'Museumskurator', 'Kunstrestaurator', 'Archäologe',
          'Paläontologe', 'Ozeanograf', 'Meteorologe', 'Kampfpilot', 'Fluglotse', 'Schiffskapitän', 'Sommelier',
          'Braumeister', 'Küchenchef', 'Parfümeur', 'Automobildesigner', 'Robotikingenieur', 'KI-Spezialist'
        ],
        celebrities: [...DEFAULT_WORDS_PT.hard.celebrities]
      }
    };

    const DEFAULT_WORDS_IT = {
      easy: {
        objects: [
          'Palla', 'Bicchiere', 'Cappello', 'Scarpa', 'Libro', 'Sedia', 'Tavolo', 'Letto', 'Porta', 'Finestra',
          'Matita', 'Gomma', 'Zaino', 'Occhiali', 'Ombrello', 'Telefono', 'Specchio', 'Spazzola', 'Pettine', 'Forbici',
          'Chiave', 'Forchetta', 'Cucchiaio', 'Piatto', 'Bottiglia', 'Cuscino', 'Coperta', 'Asciugamano', 'Sapone', 'Palloncino',
          'Bambola', 'Macchinina', 'Popcorn', 'Gelato', 'Torta', 'Mela', 'Banana', 'Uva', 'Fiore', 'Albero',
          'Sole', 'Luna', 'Stella', 'Nuvola', 'Pioggia', 'Guardaroba', 'Armadio', 'Frigorifero', 'Fornello', 'Televisione'
        ],
        actions: [
          'Correre', 'Saltare', 'Dormire', 'Mangiare', 'Bere', 'Ridere', 'Piangere', 'Ballare', 'Cantare', 'Nuotare',
          'Volare', 'Camminare', 'Sedersi', 'Alzarsi', 'Abbracciare', 'Giocare', 'Disegnare', 'Dipingere', 'Leggere', 'Scrivere',
          'Ascoltare', 'Gridare', 'Soffiare', 'Respirare', 'Tossire', 'Starnutire', 'Sbadigliare', 'Applaudire', 'Salutare con la mano', 'Indicare',
          'Prendere', 'Lanciare', 'Calciare', 'Spingere', 'Tirare', 'Aprire', 'Chiudere', 'Lavarsi le mani', 'Lavarsi i denti', 'Pettinarsi',
          'Mettersi le scarpe', 'Togliersi le scarpe', 'Accendere la TV', 'Spegnere la luce', 'Battere le mani', 'Girare', 'Rotolare', 'Baciare', 'Sorridere', 'Pensare'
        ],
        animals: [
          'Cane', 'Gatto', 'Pesce', 'Uccellino', 'Coniglio', 'Gallina', 'Mucca', 'Cavallo', 'Maiale', 'Pecora',
          'Anatra', 'Rana', 'Farfalla', 'Formica', 'Ape', 'Ragno', 'Lombrico', 'Lumaca senza guscio', 'Chiocciola', 'Bruco',
          'Elefante', 'Leone', 'Giraffa', 'Scimmia', 'Zebra', 'Ippopotamo', 'Coccodrillo', 'Tartaruga', 'Pinguino', 'Orso',
          'Lupo', 'Volpe', 'Cervo', 'Scoiattolo', 'Topo', 'Criceto', 'Iguana', 'Pappagallo', 'Tucano', 'Fenicottero',
          'Pellicano', 'Canguro', 'Koala', 'Panda', 'Delfino', 'Balena', 'Polpo', 'Granchio', 'Gambero', 'Stella marina'
        ],
        movies: [
          'Titanic', 'Avatar', 'Il Re Leone', 'Toy Story', 'Frozen', 'Shrek', 'Harry Potter', 'Spider-Man', 'Batman', 'Superman',
          'Jurassic Park', 'Avengers', 'Star Wars', 'Minions', 'Cars', 'Alla ricerca di Nemo', 'Inside Out', 'Aladdin',
          'Cenerentola', 'Biancaneve', 'Matrix', 'Il Gladiatore', 'E.T.', 'King Kong', 'Godzilla', 'Black Panther', 'Iron Man',
          'Captain America', 'Thor', 'Hulk', 'Deadpool', 'Venom', 'Transformers', 'Pirati dei Caraibi', 'Jumanji',
          'Mission: Impossible', '007', 'Rocky', 'Rambo', 'Karate Kid', 'Gremlins', 'Ghostbusters', 'Scooby-Doo', 'Madagascar',
          'Kung Fu Panda', 'Monsters & Co.', 'Up', 'Encanto', 'Oceania', 'Zootropolis'
        ],
        professions: [
          'Medico', 'Dentista', 'Insegnante', 'Poliziotto', 'Vigile del fuoco', 'Autista', 'Cuoco', 'Cameriere', 'Fornaio', 'Postino',
          'Meccanico', 'Ingegnere', 'Avvocato', 'Infermiere', 'Veterinario', 'Pilota', 'Parrucchiere', 'Barbiere', 'Attore', 'Cantante',
          'Ballerino', 'Addetto alle pulizie', 'Guardia di sicurezza', 'Agricoltore', 'Pescatore', 'Elettricista', 'Muratore', 'Pittore', 'Giardiniere',
          'Tassista', 'Corriere', 'Venditore', 'Cassiere', 'Segretaria', 'Receptionist', 'Allenatore', 'Personal trainer', 'Baby-sitter',
          'Assistente', 'Custode', 'Operatore ecologico', 'Benzinaio', 'Autista di autobus', 'Camionista', 'Guida turistica', 'Fotografo',
          'Reporter', 'Conduttore radiofonico', 'Operatore di cassa', 'Istruttore'
        ],
        celebrities: [...DEFAULT_WORDS_PT.easy.celebrities]
      },
      normal: {
        objects: [
          'Computer', 'Tastiera', 'Radio', 'Lavatrice', 'Aspirapolvere', 'Frullatore', 'Sbattitore', 'Caffettiera', 'Divano', 'Scaffale',
          'Ventilatore', 'Condizionatore', 'Microonde', 'Forno', 'Lavandino', 'Vasca da bagno', 'Doccia', 'Valigia', 'Torcia', 'Binocolo',
          'Fotocamera', 'Orologio', 'Calcolatrice', 'Termometro', 'Bilancia', 'Bussola', 'Chitarra acustica', 'Pianoforte', 'Tamburo', 'Flauto',
          'Fisarmonica', 'Tromba', 'Violino', 'Armonica', 'Xilofono', 'Racchetta', 'Skateboard', 'Pattini', 'Guantone da boxe', 'Casco',
          'Gilet', 'Cintura', 'Cravatta', 'Borsa', 'Ombrello', 'Bastone', 'Stampella', 'Sedia a rotelle', 'Occhiali da sole', 'Berretto'
        ],
        actions: [
          'Cucinare', 'Guidare', 'Andare in bicicletta', 'Pescare', 'Immergersi', 'Scalare', 'Campeggiare', 'Fare yoga', 'Meditare', 'Fotografare',
          'Filmare', 'Dipingere un quadro', 'Scolpire', 'Lavorare a maglia', 'Cucire', 'Ricamare', 'Fare giardinaggio', 'Annaffiare una pianta', 'Potare un albero', 'Spazzare',
          'Pulire una finestra', 'Stirare', 'Piegare i vestiti', 'Rifare il letto', 'Lavare i piatti', 'Asciugare i piatti', 'Sbucciare la frutta', 'Grattugiare il formaggio',
          'Impastare il pane', 'Remare', 'Fare surf', 'Sciare', 'Pattinare', 'Dribblare', 'Lanciare', 'Parare un gol', 'Servire a tennis',
          'Fare ginnastica', 'Applaudire', 'Fare un discorso', 'Intervistare', 'Scalare una parete', 'Fare magia', 'Stare in equilibrio', 'Fare giocoleria',
          'Digitare', 'Telefonare', 'Fare un selfie', 'Pagare una bolletta', 'Fare la fila'
        ],
        animals: [
          'Aquila', 'Falco', 'Gufo', 'Pipistrello', 'Cammello', 'Lama', 'Alpaca', 'Bisonte', 'Alce', 'Coyote',
          'Ghepardo', 'Leopardo', 'Giaguaro', 'Puma', 'Rinoceronte', 'Anaconda', 'Ornitorinco', 'Dingo', 'Cacatua', 'Emù',
          'Orca', 'Squalo', 'Razza', 'Calamaro', 'Cavalluccio marino', 'Riccio di mare', 'Ara', 'Pavone', 'Struzzo', 'Casuario',
          'Albatro', 'Cicogna', 'Pellicano', 'Ibis', 'Airone', 'Lontra', 'Foca', 'Tricheco', 'Leone marino', 'Dugongo',
          'Capra di montagna', 'Stambecco', 'Antilope', 'Gnu', 'Bufalo', 'Cinghiale', 'Tasso', 'Procione', 'Furetto', 'Toporagno'
        ],
        movies: [
          'Interstellar', 'Inception', 'Dune', 'Fight Club', 'Pulp Fiction', 'The Wolf of Wall Street', 'Joker', 'Parasite',
          'Il grande Gatsby', 'Django Unchained', 'Bastardi senza gloria', 'Whiplash', 'La La Land', 'Il cigno nero', 'Shining',
          'Doctor Strange', 'Guardiani della Galassia', 'Captain Marvel', 'Logan', 'John Wick', 'Matrix Reloaded', 'Matrix Revolutions',
          'Revenant', 'Gravity', 'Mad Max: Fury Road', 'Blade Runner 2049', 'Terminator', 'Ritorno al futuro',
          'Il sesto senso', 'The Truman Show', 'La mummia', 'Il codice da Vinci', 'Angeli e demoni', 'Hunger Games', 'Twilight',
          'It', 'The Conjuring', 'Annabelle', 'The Nun', 'Saw', 'Scappa - Get Out', 'Noi', 'Split', 'Glass',
          'Fast & Furious', 'Top Gun', 'Mission: Impossible - Fallout', 'Kingsman', 'Sherlock Holmes', 'L’uomo d’acciaio'
        ],
        professions: [
          'Programmatore', 'Designer', 'Architetto', 'Nutrizionista', 'Psicologo', 'Psichiatra', 'Fisioterapista', 'Farmacista',
          'Biologo', 'Chimico', 'Fisico', 'Geologo', 'Astronomo', 'Traduttore', 'Interprete', 'Montatore video', 'Regista',
          'Produttore musicale', 'DJ', 'YouTuber', 'Influencer', 'Streamer', 'Pubblicitario', 'Copywriter', 'Analista di sistemi',
          'Amministratore', 'Contabile', 'Economista', 'Agente immobiliare', 'Broker assicurativo', 'Investigatore', 'Detective',
          'Perito forense', 'Revisore', 'Consulente', 'Coach', 'Allenatore sportivo', 'Atleta professionista', 'Surfista',
          'Calciatore', 'Lottatore', 'Coreografo', 'Truccatore', 'Estetista', 'Tatuatore', 'Illustratore', 'Animatore',
          'Game designer', 'Sceneggiatore', 'Doppiatore'
        ],
        celebrities: [...DEFAULT_WORDS_PT.normal.celebrities]
      },
      hard: {
        objects: [
          'Stetoscopio', 'Bisturi', 'Microscopio', 'Telescopio', 'Sestante', 'Astrolabio', 'Cronometro', 'Metronomo', 'Accordatore', 'Defibrillatore',
          'Catapulta', 'Periscopio', 'Distillatore', 'Centrifuga', 'Incubatrice', 'Autoclave', 'Spettrometro', 'Cromatografo', 'Calorimetro', 'Potenziometro',
          'Fionda', 'Arpione', 'Boomerang', 'Arco e freccia', 'Balestra', 'Lancia', 'Mazza', 'Ascia', 'Falce', 'Tridente',
          'Tostiera', 'Essiccatore', 'Fermentatore', 'Slow cooker', 'Wok', 'Tajine', 'Fonduta', 'Barbecue', 'Affumicatore', 'Alambicco',
          'Teodolite', 'Altimetro', 'Barometro', 'Igrometro', 'Anemometro', 'Pluviometro', 'Sismografo', 'Generatore', 'Trasformatore', 'Oscilloscopio'
        ],
        actions: [
          'Stare in equilibrio sulla corda', 'Ingoiare fuoco', 'Scappare da una camicia di forza', 'Rompere mattoni con la mano',
          'Camminare sui carboni ardenti', 'Leggere il braille', 'Fare segnali da sub', 'Comunicare in lingua dei segni', 'Usare il codice morse', 'Suonare uno strumento con i piedi',
          'Estrarre un dente', 'Fare un intervento chirurgico', 'Rianimare', 'Immobilizzare una frattura', 'Applicare un laccio emostatico',
          'Fare scherma', 'Praticare tai chi', 'Dare un colpo di karate', 'Lanciare il martello', 'Lancio olimpico del giavellotto',
          'Arare la terra', 'Mungere una mucca', 'Tosare una pecora', 'Ferrare un cavallo', 'Domare un bue',
          'Tessere al telaio', 'Soffiare il vetro', 'Forgiare il metallo', 'Modellare la ceramica al tornio', 'Restaurare un quadro',
          'Decollare con un aereo', 'Atterrare con un elicottero', 'Navigare su una barca a vela', 'Manovrare una gru', 'Guidare un treno',
          'Fare rappel', 'Arrampicata su roccia', 'Fare una zipline', 'Arrampicata libera', 'Fare slackline',
          'Disinnescare una bomba', 'Negoziare con ostaggi', 'Fare paracadutismo', 'Corsa a ostacoli', 'Sollevamento pesi olimpico'
        ],
        animals: [
          'Axolotl', 'Tarsio', 'Fossa', 'Quokka', 'Numbat', 'Kakapo', 'Tuatara', 'Okapi', 'Takin', 'Saiga',
          'Dugongo', 'Lamantino', 'Narvalo', 'Beluga', 'Capodoglio', 'Balenottera comune', 'Megattera', 'Delfino di fiume', 'Focena', 'Franciscana',
          'Scorpione', 'Tarantola', 'Mamba nero', 'Taipan', 'Serpente corallo', 'Vipera', 'Serpente a sonagli', 'Boomslang', 'Calamaro gigante', 'Polpo dagli anelli blu',
          'Pesce palla', 'Pesce pietra', 'Pesce leone', 'Cono marino', 'Vespa di mare', 'Calabrone asiatico', 'Coleottero bombardiere', 'Zanzara tigre', 'Formica proiettile', 'Bruco di fuoco',
          'Pangolino', 'Aye-aye', 'Lori lento', 'Armadillo a tre fasce', 'Armadillo gigante', 'Formichiere gigante', 'Bradipo tridattilo', 'Riccio pigmeo', 'Toporagno elefante', 'Martora'
        ],
        movies: [
          'The Lighthouse', 'Hereditary', 'Midsommar', 'The Witch', 'Il sacrificio del cervo sacro', 'The Lobster', 'Dogville', 'Antichrist',
          'Melancholia', 'The Tree of Life', 'Synecdoche, New York', 'Donnie Darko', 'The Double', 'Enemy', 'Ex Machina', 'Annientamento',
          'Coherence', 'Primer', 'Arrival', 'Moon', 'Solaris', 'Stalker', 'Lo specchio', 'Persona', 'Il settimo sigillo', 'Memento',
          'Mulholland Drive', 'Velluto blu', 'Eraserhead', 'The Fountain', 'Il pozzo', 'The Platform', 'Climax', 'Irreversible',
          'Enter the Void', 'The Host', 'Oldboy', 'Memorie di un assassino', 'Mademoiselle', 'Drive', 'Only God Forgives', 'The Master',
          'Magnolia', 'Il petroliere', 'Il sospetto', 'O Som ao Redor', 'Bacurau', 'Il lupo dietro la porta', 'Una seconda madre'
        ],
        professions: [
          'Neurochirurgo', 'Oncologo', 'Anestesista', 'Cardiologo', 'Ortopedico', 'Endocrinologo', 'Ginecologo', 'Urologo',
          'Radiologo', 'Patologo', 'Epidemiologo', 'Bioinformatico', 'Ingegnere dei dati', 'Data scientist', 'Ingegnere aerospaziale',
          'Ingegnere nucleare', 'Ingegnere petrolifero', 'Specialista in cybersicurezza', 'Architetto software', 'Ingegnere DevOps', 'Product manager',
          'Scrum Master', 'UX researcher', 'UX designer', 'UI designer', 'Specialista SEO', 'Trader', 'Analista finanziario',
          'Gestore di investimenti', 'Attuario', 'Diplomatico', 'Console', 'Ambasciatore', 'Curatore museale', 'Restauratore d’arte', 'Archeologo',
          'Paleontologo', 'Oceanografo', 'Meteorologo', 'Pilota da caccia', 'Controllore di volo', 'Capitano di nave', 'Sommelier',
          'Mastro birraio', 'Executive chef', 'Profumiere', 'Designer automobilistico', 'Ingegnere robotico', 'Specialista in IA'
        ],
        celebrities: [...DEFAULT_WORDS_PT.hard.celebrities]
      }
    };

    const CHALLENGES_FR = [
      'Fais la mime assis', 'Fais la mime accroupi', 'Fais la mime en sautant', 'Fais la mime en marchant sur place',
      'Fais la mime avec une main dans le dos', 'Fais la mime avec une seule main', 'Fais la mime avec les bras tendus',
      'Fais la mime en tournant lentement', 'Fais la mime comme si tu étais au ralenti', 'Fais la mime comme si tu étais accéléré (super vite)',
      'Fais la mime en exagérant BEAUCOUP', 'Fais la mime presque sans bouger', 'Fais la mime comme si tu avais peur',
      'Fais la mime comme si tu étais très heureux', 'Fais la mime comme si tu étais en colère', 'Fais la mime comme si tu étais fatigué',
      'Fais la mime comme si tu étais confus', 'Fais la mime comme si tu paniquais', 'Fais la mime comme un robot',
      'Fais la mime comme un personnage de dessin animé', 'Fais la mime comme une personne âgée', 'Fais la mime comme un enfant',
      'Fais la mime comme un super-héros', 'Fais la mime comme un méchant', 'Fais la mime comme un animal',
      'Fais la mime comme si tu étais sur la lune (faible gravité)', 'Fais la mime comme si tu étais sous l’eau', 'Fais la mime comme si tu étais invisible',
      'Fais la mime comme si tu étais géant', 'Fais la mime comme si tu étais minuscule', 'Tu ne peux pas utiliser les mains',
      'Tu ne peux pas utiliser les bras', 'Tu ne peux pas bouger de ta place', 'Tu ne peux pas répéter le même geste', 'Tu ne peux rien montrer du doigt',
      'Tu ne peux pas utiliser le visage (aucune expression)', 'Tu ne peux utiliser que le visage (pas le corps)', 'Tu dois commencer par la fin de l’action',
      'Tu dois tout faire à l’envers (de la fin au début)', 'Tu dois t’immobiliser complètement toutes les 3 secondes',
      'Fais la mime comme si tu étais dans un film d’action', 'Fais la mime comme si c’était une comédie',
      'Fais la mime comme si tu étais au ralenti dramatique', 'Fais la mime comme si tu étais dans un rêve',
      'Fais la mime comme si tu avais très froid', 'Fais la mime comme si tu avais très chaud',
      'Fais la mime comme si tu étais dans le noir', 'Fais la mime comme si tu étais sur scène',
      'Fais la mime comme si un immense public te regardait', 'Fais la mime comme si c’était ta dernière chance de gagner'
    ];

    const CHALLENGES_DE = [
      'Spiele es im Sitzen vor', 'Spiele es in der Hocke vor', 'Spiele es springend vor', 'Spiele es gehend auf der Stelle vor',
      'Spiele es mit einer Hand hinter dem Rücken vor', 'Spiele es nur mit einer Hand vor', 'Spiele es mit ausgestreckten Armen vor',
      'Spiele es vor, während du dich langsam drehst', 'Spiele es wie in Zeitlupe vor', 'Spiele es wie im Schnelllauf vor (super schnell)',
      'Spiele es SEHR übertrieben vor', 'Spiele es fast ohne Bewegung vor', 'Spiele es vor, als hättest du Angst',
      'Spiele es vor, als wärst du sehr glücklich', 'Spiele es vor, als wärst du wütend', 'Spiele es vor, als wärst du müde',
      'Spiele es vor, als wärst du verwirrt', 'Spiele es vor, als wärst du in Panik', 'Spiele es wie ein Roboter vor',
      'Spiele es wie eine Zeichentrickfigur vor', 'Spiele es wie eine ältere Person vor', 'Spiele es wie ein Kind vor',
      'Spiele es wie ein Superheld vor', 'Spiele es wie ein Bösewicht vor', 'Spiele es wie ein Tier vor',
      'Spiele es vor, als wärst du auf dem Mond (geringe Schwerkraft)', 'Spiele es vor, als wärst du unter Wasser', 'Spiele es vor, als wärst du unsichtbar',
      'Spiele es vor, als wärst du riesig', 'Spiele es vor, als wärst du winzig klein', 'Du darfst deine Hände nicht benutzen',
      'Du darfst deine Arme nicht benutzen', 'Du darfst dich nicht vom Platz bewegen', 'Du darfst dieselbe Geste nicht wiederholen', 'Du darfst auf nichts zeigen',
      'Du darfst dein Gesicht nicht benutzen (keine Mimik)', 'Du darfst nur dein Gesicht benutzen (kein Körper)', 'Du musst am Ende der Aktion beginnen',
      'Du musst alles rückwärts machen (vom Ende zum Anfang)', 'Du musst alle 3 Sekunden komplett einfrieren',
      'Spiele es vor, als wärst du in einem Actionfilm', 'Spiele es vor, als wäre es eine Komödie',
      'Spiele es in dramatischer Zeitlupe vor', 'Spiele es vor, als wärst du in einem Traum',
      'Spiele es vor, als wäre dir sehr kalt', 'Spiele es vor, als wäre dir sehr heiß',
      'Spiele es vor, als wärst du im Dunkeln', 'Spiele es vor, als wärst du auf einer Bühne',
      'Spiele es vor, als würde dich ein riesiges Publikum beobachten', 'Spiele es vor, als wäre es deine letzte Chance zu gewinnen'
    ];

    const CHALLENGES_IT = [
      'Fai la mimica da seduto', 'Fai la mimica accovacciato', 'Fai la mimica saltando', 'Fai la mimica camminando sul posto',
      'Fai la mimica con una mano dietro la schiena', 'Fai la mimica usando solo una mano', 'Fai la mimica con le braccia tese',
      'Fai la mimica girando lentamente', 'Fai la mimica come se fossi al rallentatore', 'Fai la mimica come se fossi accelerato (super veloce)',
      'Fai la mimica esagerando MOLTO', 'Fai la mimica quasi senza muoverti', 'Fai la mimica come se avessi paura',
      'Fai la mimica come se fossi molto felice', 'Fai la mimica come se fossi arrabbiato', 'Fai la mimica come se fossi stanco',
      'Fai la mimica come se fossi confuso', 'Fai la mimica come se fossi nel panico', 'Fai la mimica come un robot',
      'Fai la mimica come un personaggio dei cartoni animati', 'Fai la mimica come una persona anziana', 'Fai la mimica come un bambino',
      'Fai la mimica come un supereroe', 'Fai la mimica come un cattivo', 'Fai la mimica come un animale',
      'Fai la mimica come se fossi sulla luna (bassa gravità)', 'Fai la mimica come se fossi sott’acqua', 'Fai la mimica come se fossi invisibile',
      'Fai la mimica come se fossi gigante', 'Fai la mimica come se fossi minuscolo', 'Non puoi usare le mani',
      'Non puoi usare le braccia', 'Non puoi muoverti dal posto', 'Non puoi ripetere lo stesso gesto', 'Non puoi indicare nulla',
      'Non puoi usare il viso (niente espressioni facciali)', 'Puoi usare solo il viso (niente corpo)', 'Devi iniziare dalla fine dell’azione',
      'Devi fare tutto al contrario (dalla fine all’inizio)', 'Devi fermarti completamente ogni 3 secondi',
      'Fai la mimica come se fossi in un film d’azione', 'Fai la mimica come se fosse una commedia',
      'Fai la mimica come se fossi al rallentatore drammatico', 'Fai la mimica come se fossi in un sogno',
      'Fai la mimica come se avessi molto freddo', 'Fai la mimica come se avessi molto caldo',
      'Fai la mimica come se fossi al buio', 'Fai la mimica come se fossi su un palco',
      'Fai la mimica come se ti guardasse un pubblico enorme', 'Fai la mimica come se fosse l’ultima occasione per vincere'
    ];

    // Content pack schema used by the app and by future downloadable packs:
    // {
    //   id,
    //   name,
    //   source: 'builtin' | 'custom' | 'downloaded',
    //   editable: boolean,
    //   enabled: boolean,
    //   words: { [locale]: { [difficulty]: { [category]: string[] } } },
    //   challenges: { [locale]: string[] }
    // }
    function createCorePack() {
      return {
        id: CORE_PACK_ID,
        name: 'Core Default Pack',
        source: 'builtin',
        editable: true,
        enabled: true,
        words: {
          pt: clone(DEFAULT_WORDS_PT),
          en: clone(DEFAULT_WORDS_EN),
          es: clone(DEFAULT_WORDS_ES),
          fr: clone(DEFAULT_WORDS_FR),
          de: clone(DEFAULT_WORDS_DE),
          it: clone(DEFAULT_WORDS_IT)
        },
        challenges: {
          pt: clone(CHALLENGES_PT),
          en: clone(CHALLENGES_EN),
          es: clone(CHALLENGES_ES),
          fr: clone(CHALLENGES_FR),
          de: clone(CHALLENGES_DE),
          it: clone(CHALLENGES_IT)
        }
      };
    }

    function normalizePack(pack) {
      const normalizedWords = {};
      const normalizedChallenges = {};
      Object.keys(pack?.words || {}).forEach(locale => {
        normalizedWords[locale] = normalizeWordBank(pack.words[locale]);
      });
      Object.keys(pack?.challenges || {}).forEach(locale => {
        normalizedChallenges[locale] = normalizeChallenges(pack.challenges[locale]);
      });
      return {
        id: pack?.id || `pack-${Date.now()}`,
        name: pack?.name || 'Pack',
        description: pack?.description || '',
        version: pack?.version || '',
        author: pack?.author || '',
        source: pack?.source || 'local',
        editable: pack?.editable !== false,
        enabled: pack?.enabled !== false,
        installedAt: pack?.installedAt || '',
        license: pack?.license || null,
        challengeOverrides: (pack?.challengeOverrides && typeof pack.challengeOverrides === 'object') ? pack.challengeOverrides : {},
        words: normalizedWords,
        challenges: normalizedChallenges
      };
    }

    function getLocalizedText(value, fallback = '') {
      if (!value) return fallback;
      if (typeof value === 'string') return value;
      return value[currentLanguage] || value[DEFAULT_LANGUAGE] || value.pt || Object.values(value)[0] || fallback;
    }

    function getPackDisplayName(pack) {
      return getLocalizedText(pack?.name, 'Pack');
    }

    function getPackWordCount(pack, locale = currentLanguage) {
      const bank = normalizeWordBank(pack?.words?.[locale] || {});
      let count = 0;
      DIFFICULTY_KEYS.forEach(diff => {
        CATEGORY_KEYS.forEach(cat => {
          count += bank[diff][cat].length;
        });
      });
      return count;
    }

    function getPackTotalContentCount(pack) {
      const locales = new Set([
        ...Object.keys(pack?.words || {}),
        ...Object.keys(pack?.challenges || {})
      ]);
      let count = 0;
      locales.forEach(locale => {
        count += getPackWordCount(pack, locale);
        count += normalizeChallenges(pack?.challenges?.[locale] || []).length;
      });
      return count;
    }

    function canonicalize(value) {
      if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
      if (value && typeof value === 'object') {
        return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
      }
      return JSON.stringify(value);
    }

    function bytesToBase64Url(bytes) {
      const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    function base64UrlToBytes(value) {
      const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const binary = atob(padded);
      return Uint8Array.from(binary, char => char.charCodeAt(0));
    }

    async function sha256Base64Url(value) {
      if (!crypto?.subtle) throw new Error(t('packErrors.cryptoUnavailable'));
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
      return bytesToBase64Url(new Uint8Array(digest));
    }

    function buildPackSignedPayload(userId, packId, contentHash) {
      return `${PACK_SIGNATURE_CONTEXT}\nuser_id=${userId}\npack_id=${packId}\ncontent_sha256=${contentHash}`;
    }

    async function verifyPackSignature(userId, packId, contentHash, signature) {
      if (!crypto?.subtle) throw new Error(t('packErrors.cryptoUnavailable'));
      const publicKey = await crypto.subtle.importKey(
        'jwk',
        PACK_SIGNING_PUBLIC_KEY,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
      );
      return crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        base64UrlToBytes(signature),
        new TextEncoder().encode(buildPackSignedPayload(userId, packId, contentHash))
      );
    }

    function mergeUniqueStrings(primary = [], secondary = []) {
      return [...new Set([...(primary || []), ...(secondary || [])].map(item => String(item).trim()).filter(Boolean))];
    }

    function mergeWordBanks(baseBank = {}, savedBank = {}) {
      const normalizedBase = normalizeWordBank(baseBank);
      const normalizedSaved = normalizeWordBank(savedBank);
      const merged = createEmptyWordBank();

      DIFFICULTY_KEYS.forEach(diff => {
        CATEGORY_KEYS.forEach(cat => {
          merged[diff][cat] = mergeUniqueStrings(normalizedBase[diff][cat], normalizedSaved[diff][cat]);
        });
      });

      return merged;
    }

    function mergeCorePack(savedPack = {}) {
      const defaultCore = normalizePack(createCorePack());
      const merged = {
        ...defaultCore,
        ...savedPack,
        id: CORE_PACK_ID,
        source: 'builtin',
        editable: savedPack?.editable !== false,
        enabled: savedPack?.enabled !== false,
        words: {},
        challenges: {}
      };

      const locales = new Set([
        ...Object.keys(defaultCore.words || {}),
        ...Object.keys(savedPack.words || {}),
        ...Object.keys(defaultCore.challenges || {}),
        ...Object.keys(savedPack.challenges || {})
      ]);

      locales.forEach(locale => {
        merged.words[locale] = mergeWordBanks(defaultCore.words?.[locale], savedPack.words?.[locale]);
        merged.challenges[locale] = savedPack.challengeOverrides?.[locale]
          ? normalizeChallenges(savedPack.challenges?.[locale] || [])
          : mergeUniqueStrings(defaultCore.challenges?.[locale], savedPack.challenges?.[locale]);
      });

      return normalizePack(merged);
    }

    function createDefaultContentModel() {
      return {
        version: 1,
        packs: [normalizePack(createCorePack())]
      };
    }

    function loadContentModel() {
      try {
        const saved = JSON.parse(localStorage.getItem(CONTENT_KEY) || 'null');
        if (saved?.packs?.length) {
          const normalizedPacks = saved.packs.map(pack => (
            pack?.id === CORE_PACK_ID ? mergeCorePack(pack) : normalizePack(pack)
          ));
          if (!normalizedPacks.some(pack => pack.id === CORE_PACK_ID)) {
            normalizedPacks.unshift(normalizePack(createCorePack()));
          }
          return {
            version: 1,
            packs: normalizedPacks
          };
        }
      } catch (e) { }

      const model = createDefaultContentModel();
      try {
        const legacyWords = JSON.parse(localStorage.getItem(LEGACY_WORDS_KEY) || 'null');
        if (legacyWords) {
          model.packs[0].words.pt = normalizeWordBank(legacyWords);
        }
      } catch (e) { }
      return model;
    }

    let contentModel = loadContentModel();

    function saveContentModel() {
      localStorage.setItem(CONTENT_KEY, JSON.stringify(contentModel));
    }

    function getEnabledPacks() {
      return (contentModel.packs || []).filter(pack => pack.enabled !== false);
    }

    function getCorePack() {
      return contentModel.packs.find(pack => pack.id === CORE_PACK_ID) || normalizePack(createCorePack());
    }

    function getPremiumPacks(options = {}) {
      const { enabledOnly = true } = options;
      return (contentModel.packs || []).filter(pack => (
        pack.source === 'downloaded' && (!enabledOnly || pack.enabled !== false)
      ));
    }

    function getPremiumCategoryToken(packId) {
      return `pack:${packId}`;
    }

    function getPackIdFromCategoryToken(token) {
      return String(token || '').startsWith('pack:') ? String(token).slice(5) : '';
    }

    function getPremiumPackByToken(token) {
      const packId = getPackIdFromCategoryToken(token);
      if (!packId) return null;
      return getPremiumPacks().find(pack => pack.id === packId) || null;
    }

    function isPremiumCategoryToken(token) {
      return Boolean(getPremiumPackByToken(token));
    }

    function isValidCategoryToken(token) {
      return CATEGORY_KEYS.includes(token) || isPremiumCategoryToken(token);
    }

    function ensureUniqueWords(words) {
      return [...new Set(words)];
    }

    function getLocalizedWordBank(locale = currentLanguage) {
      const bank = createEmptyWordBank();
      getEnabledPacks().forEach(pack => {
        const localizedBank = normalizeWordBank(pack.words?.[locale] || {});
        DIFFICULTY_KEYS.forEach(diff => {
          CATEGORY_KEYS.forEach(cat => {
            bank[diff][cat] = ensureUniqueWords([...bank[diff][cat], ...localizedBank[diff][cat]]);
          });
        });
      });
      return bank;
    }

    function getLocalizedChallenges(locale = currentLanguage) {
      const corePack = getCorePack();
      let list = normalizeChallenges(corePack.challenges?.[locale] || []);
      if (!list.length && !corePack.challengeOverrides?.[locale]) {
        list = normalizeChallenges(createCorePack().challenges?.[locale] || []);
      }
      getPremiumPacks().forEach(pack => {
        list = ensureUniqueWords([...list, ...normalizeChallenges(pack.challenges?.[locale] || [])]);
      });
      return list;
    }

    function getEditablePack() {
      let pack = contentModel.packs.find(item => item.editable !== false);
      if (!pack) {
        pack = normalizePack({
          id: `custom-${Date.now()}`,
          name: 'Custom Local Pack',
          source: 'custom',
          editable: true,
          enabled: true,
          words: {},
          challenges: {}
        });
        contentModel.packs.push(pack);
      }
      return pack;
    }

    function ensurePackLocale(pack, locale = currentLanguage) {
      if (!pack.words[locale]) {
        pack.words[locale] = createEmptyWordBank();
      } else {
        pack.words[locale] = normalizeWordBank(pack.words[locale]);
      }
      if (!pack.challenges[locale]) {
        pack.challenges[locale] = [];
      } else {
        pack.challenges[locale] = normalizeChallenges(pack.challenges[locale]);
      }
    }

    async function buildInstalledPackFromEnvelope(envelope) {
      if (!envelope || typeof envelope !== 'object') throw new Error(t('packErrors.invalidJson'));
      if (envelope.schema !== WORD_PACK_SCHEMA) throw new Error(t('packErrors.invalidSchema'));
      if (envelope.user_id !== appUserId) throw new Error(t('packErrors.invalidUser'));
      if (!envelope.pack_id || typeof envelope.pack_id !== 'string') throw new Error(t('packErrors.invalidPackId'));
      if (envelope.pack_id === CORE_PACK_ID) throw new Error(t('packErrors.reservedPackId'));
      if (envelope.signature_algorithm !== PACK_SIGNATURE_ALGORITHM) throw new Error(t('packErrors.invalidAlgorithm'));
      if (!envelope.signature || typeof envelope.signature !== 'string') throw new Error(t('packErrors.invalidSignature'));

      const content = envelope.content || {};
      const contentHash = await sha256Base64Url(canonicalize(content));
      if (envelope.content_sha256 && envelope.content_sha256 !== contentHash) {
        throw new Error(t('packErrors.invalidContentHash'));
      }

      const isSignatureValid = await verifyPackSignature(envelope.user_id, envelope.pack_id, contentHash, envelope.signature);
      if (!isSignatureValid) throw new Error(t('packErrors.invalidSignature'));

      const pack = normalizePack({
        id: envelope.pack_id,
        name: content.name || envelope.pack_id,
        description: content.description || '',
        version: content.version || '',
        author: content.author || '',
        source: 'downloaded',
        editable: false,
        enabled: true,
        installedAt: new Date().toISOString(),
        license: {
          userId: envelope.user_id,
          signature: envelope.signature,
          algorithm: envelope.signature_algorithm,
          contentSha256: contentHash
        },
        words: content.words || {},
        challenges: content.challenges || {}
      });

      if (getPackTotalContentCount(pack) === 0) throw new Error(t('packErrors.emptyPack'));
      return pack;
    }

    async function parsePackFile(file) {
      if (!file) throw new Error(t('packErrors.fileRequired'));
      try {
        return JSON.parse(await file.text());
      } catch (e) {
        throw new Error(t('packErrors.invalidJson'));
      }
    }

    function getCategoryLabel(category, options = {}) {
      const { singular = false, withIcon = false } = options;
      const premiumPack = getPremiumPackByToken(category);
      if (premiumPack) {
        const premiumLabel = getPackDisplayName(premiumPack);
        return withIcon ? `⭐ ${premiumLabel}` : premiumLabel;
      }
      const label = t(`category.${category}.${singular ? 'singular' : 'plural'}`);
      return withIcon ? `${CATEGORY_ICONS[category] || ''} ${label}`.trim() : label;
    }

    function getDifficultyLabel(diff, withIcon = false) {
      const label = t(`difficulty.${diff}`);
      return withIcon ? `${DIFFICULTY_ICONS[diff] || ''} ${label}`.trim() : label;
    }

    function getDefaultCoreChallenges(locale = currentLanguage) {
      return normalizeChallenges(createCorePack().challenges?.[locale] || []);
    }

    function getCoreWordsForCategory(category, diff = 'easy', locale = currentLanguage) {
      const bank = normalizeWordBank(getCorePack().words?.[locale] || {});
      return bank[diff]?.[category] || [];
    }

    function getPremiumWordsForPack(pack, diff = 'easy', locale = currentLanguage) {
      const bank = normalizeWordBank(pack?.words?.[locale] || {});
      let words = [];
      CATEGORY_KEYS.forEach(category => {
        words = ensureUniqueWords([...words, ...(bank[diff]?.[category] || [])]);
      });
      return words;
    }

    function countWordsForCategoryToken(category, diff = 'easy') {
      const premiumPack = getPremiumPackByToken(category);
      if (premiumPack) return getPremiumWordsForPack(premiumPack, diff).length;
      if (CATEGORY_KEYS.includes(category)) return getCoreWordsForCategory(category, diff).length;
      return 0;
    }

    function countWordsForSelectedCategories(categories, diff = 'easy') {
      return (categories || []).reduce((total, category) => total + countWordsForCategoryToken(category, diff), 0);
    }

    function normalizeSelectedCategories(categories = []) {
      const selected = ensureUniqueWords(categories.map(category => String(category))).filter(isValidCategoryToken);
      return selected.length ? selected : getDefaultSelectedCategories();
    }

    function getDefaultTeamName(team, language = currentLanguage) {
      return t(`teams.default${team}`, {}, language);
    }

    function getDefaultPlayerName(number, language = currentLanguage) {
      return t('players.defaultName', { number }, language);
    }

    function isDefaultTeamName(name, team) {
      return SUPPORTED_LANGUAGES.some(language => name === getDefaultTeamName(team, language));
    }

    function getDefaultSelectedCategories() {
      return ['objects', 'actions', 'animals'];
    }

    function formatCount(count, singularKey, pluralKey) {
      return `${count} ${t(count === 1 ? singularKey : pluralKey)}`;
    }

    function parsePointValue(value, fallback = 0) {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? Math.max(0, Math.min(999, parsed)) : fallback;
    }

    function getConfiguredCorrectPoints() {
      return parsePointValue(document.getElementById('correct-points-input')?.value, DEFAULT_CORRECT_POINTS);
    }

    function getConfiguredWrongPenaltyPoints() {
      return parsePointValue(document.getElementById('wrong-points-input')?.value, DEFAULT_WRONG_PENALTY_POINTS);
    }

    function isFfaGuesserPointsEnabled() {
      return document.getElementById('toggle-ffa-guesser-points')?.checked !== false;
    }

    function getConfiguredFfaGuesserPoints() {
      return parsePointValue(document.getElementById('ffa-guesser-points-input')?.value, DEFAULT_FFA_GUESSER_POINTS);
    }

    function addScore(scoreKey, delta) {
      if (!scoreKey || !Number.isFinite(delta) || delta === 0) return;
      gameState.scores[scoreKey] = (gameState.scores[scoreKey] || 0) + delta;
    }

    function getQuickGamePlayerCount(config) {
      return config.mode === 'teams'
        ? (config.teams.A?.length || 0) + (config.teams.B?.length || 0)
        : (config.players?.length || 0);
    }

    function getQuickGameSummary(config) {
      const normalized = normalizeQuickGameConfig(config);
      const gameTypeLabel = t(`setup.${normalized.gameType === 'drawing' ? 'gameTypeDrawingName' : 'gameTypeMimeName'}`);
      const modeLabel = normalized.mode === 'teams' ? t('setup.modeTeamsName') : t('setup.modeFfaName');
      const playerCountLabel = formatCount(getQuickGamePlayerCount(normalized), 'common.playerSingular', 'common.playerPlural');
      const categoriesLabel = normalized.selectedCategories.map(category => getCategoryLabel(category)).join(', ');
      const roundsLabel = formatCount(normalized.rounds, 'common.roundSingular', 'common.roundPlural');
      return [gameTypeLabel, modeLabel, playerCountLabel, categoriesLabel, roundsLabel].join(' | ');
    }

    function getQuickGameCategoryIcon(category) {
      if (getPremiumPackByToken(category)) return '⭐';
      return CATEGORY_ICONS[category] || '🏷️';
    }

    function getQuickGameCompactSummary(config) {
      const normalized = normalizeQuickGameConfig(config);
      const gameTypeIcon = normalized.gameType === 'drawing' ? '✏️' : '🎭';
      const modeIcon = normalized.mode === 'teams' ? '🤝' : '🏆';
      const playerIcon = `👥${getQuickGamePlayerCount(normalized)}`;
      const difficultyIcon = DIFFICULTY_ICONS[normalized.difficulty] || '';
      const categoryIcons = normalized.selectedCategories.map(getQuickGameCategoryIcon).join(' ');
      const roundsIcon = `🔁${normalized.rounds}`;
      return [gameTypeIcon, modeIcon, playerIcon, difficultyIcon, categoryIcons, roundsIcon].filter(Boolean).join(' | ');
    }

    function renderQuickGameSummary() {
      const summary = document.getElementById('quick-game-summary');
      if (!summary) return;
      const config = loadQuickGameConfig();
      const fullSummary = getQuickGameSummary(config);
      summary.textContent = getQuickGameCompactSummary(config);
      summary.title = fullSummary;
      summary.setAttribute('aria-label', fullSummary);
      const button = summary.closest('button');
      if (button) button.title = fullSummary;
    }

    function getMultiDeviceHomeConnectionCount() {
      if (isHostSessionOpen()) return multiDeviceState.connections.filter(conn => conn.open).length;
      if (isGuestSessionOpen()) return 1;
      return 0;
    }

    function renderMultiDeviceHomeSummary() {
      const summary = document.getElementById('multi-device-summary');
      if (!summary) return;
      const isOnline = isHostSessionOpen() || isGuestSessionOpen();
      const count = getMultiDeviceHomeConnectionCount();
      const status = t(isOnline ? 'home.multiDeviceOnline' : 'home.multiDeviceOffline');
      const text = t('home.multiDeviceSummary', { status, count });
      const dot = document.createElement('span');
      dot.className = `connection-status-dot ${isOnline ? 'is-online' : 'is-offline'}`;
      dot.setAttribute('aria-hidden', 'true');
      summary.replaceChildren(dot, document.createTextNode(text));
      summary.title = text;
      summary.setAttribute('aria-label', text);
      const button = summary.closest('button');
      if (button) button.title = `${t('home.multiDeviceGame')} | ${text}`;
    }

    function syncTeamNamesForLanguage(previousLanguage, nextLanguage) {
      ['A', 'B'].forEach(team => {
        const previousDefault = getDefaultTeamName(team, previousLanguage);
        const nextDefault = getDefaultTeamName(team, nextLanguage);
        if (!gameState.teamNames[team] || gameState.teamNames[team] === previousDefault || isDefaultTeamName(gameState.teamNames[team], team)) {
          gameState.teamNames[team] = nextDefault;
        }
      });
    }

    let gameState = {
      gameType: 'mime',
      mode: 'teams',
      difficulty: 'easy',
      teams: { A: [], B: [] },
      players: [],
      teamNames: { A: getDefaultTeamName('A'), B: getDefaultTeamName('B') },
      scores: {},
      currentPlayerIdx: 0,
      currentRound: 1,
      totalRounds: 3,
      currentWord: null,
      currentChallenge: null,
      usedWords: [],
      timerDur: 60,
      timerInterval: null,
      memInterval: null,
      timerLeft: 60,
      hintShown: false,
      wordVisible: false,
      phase: 'preparing',
      totalTurns: 0,
      turnsDone: 0,
      leaderboardRecorded: false,
      randomChallenge: false,
      selectedCategories: getDefaultSelectedCategories()
    };

    const DRAWING_TOOL_CONFIG = {
      'pen-thick': { color: '#111827', width: 12 },
      'pen-thin': { color: '#111827', width: 4 },
      'eraser-thick': { color: '#ffffff', width: 32 },
      'eraser-thin': { color: '#ffffff', width: 12 }
    };

    const drawingState = {
      canvas: null,
      ctx: null,
      activeTool: 'pen-thick',
      isDrawing: false,
      lastX: 0,
      lastY: 0
    };

    const guestDrawingState = {
      canvas: null,
      ctx: null
    };

    const multiDeviceState = {
      role: 'single',
      peer: null,
      peerId: '',
      hostPeerId: '',
      hostConnection: null,
      guestConnectionStatus: 'disconnected',
      lastGuestDrawingTurnKey: '',
      connections: [],
      sessionUrl: '',
      lastPayload: null
    };
    const musicState = {
      audio: null,
      currentSrc: '',
      currentKind: '',
      unlocked: false
    };

    let deferredPWAInstallPrompt = null;
    let wbDiff = 'easy';
    let wbCat = 'objects';
    let wbPreviewPackId = '';
    let resultAwardState = null;
    let leaderboardFilters = {
      type: 'all',
      mode: 'all'
    };

    // ============================================================
    // STARS
    // ============================================================
    (function () {
      const c = document.getElementById('stars');
      for (let i = 0; i < 60; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        const sz = Math.random() * 2.5 + 0.5;
        s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${(Math.random() * 4 + 2).toFixed(1)}s;--del:${(Math.random() * 4).toFixed(1)}s;--op:${(Math.random() * 0.5 + 0.3).toFixed(2)}`;
        c.appendChild(s);
      }
    })();

    // ============================================================
    // I18N
    // ============================================================
    function applyTranslations() {
      document.documentElement.lang = LANGUAGE_HTML_MAP[currentLanguage] || LANGUAGE_HTML_MAP[DEFAULT_LANGUAGE];
      document.title = t('meta.documentTitle');

      document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
      });

      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
      });

      document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
      });

      const languageSelect = document.getElementById('language-select');
      if (languageSelect) languageSelect.value = currentLanguage;
    }

    function refreshLocalizedUI() {
      applyTranslations();
      refreshGameTypeUI();
      renderQuickGameSummary();
      renderMultiDeviceHomeSummary();
      updateTeamLabels();
      renderCategorySelection();
      renderSetupPlayers();
      updateDiffWordCount();
      syncWBDiffUI();
      syncWBCatUI();
      renderWordBank();
      renderChallengeBank();
      renderInstalledPacks();
      renderPackPreview();
      renderUserId();
      refreshCurrentTurnCopy();
      refreshScoreScreenCopy();
      refreshFinalScreenCopy();
      renderScoreMini();
      if (document.getElementById('screen-leaderboard')?.classList.contains('active')) renderLeaderboard();
      if (document.getElementById('screen-score-manager')?.classList.contains('active')) renderScoreManager();
      if (document.getElementById('screen-guest')?.classList.contains('active') && multiDeviceState.lastPayload) {
        renderGuestSessionState(multiDeviceState.lastPayload);
      }
      renderGuestConnectionStatus();
      updateScoreManagerButton();
      updateTimerLabel(document.getElementById('timer-slider').value);
      updateFullscreenButton();
    }

    function setLanguage(language, options = {}) {
      const { save = false } = options;
      const nextLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
      const previousLanguage = currentLanguage;
      currentLanguage = nextLanguage;
      syncTeamNamesForLanguage(previousLanguage, nextLanguage);
      refreshLocalizedUI();
      setUserIdImportStatus();
      if (save) saveSettings();
    }

    // ============================================================
    // NAVIGATION
    // ============================================================
    function resetViewportToTop(screenEl) {
      if (screenEl) screenEl.scrollTop = 0;
      const scrollingElement = document.scrollingElement || document.documentElement;
      if (scrollingElement) {
        scrollingElement.scrollTop = 0;
        scrollingElement.scrollLeft = 0;
      }
      window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        if (screenEl) screenEl.scrollTop = 0;
        if (scrollingElement) {
          scrollingElement.scrollTop = 0;
          scrollingElement.scrollLeft = 0;
        }
        window.scrollTo(0, 0);
      });
    }

    function goTo(screen) {
      const nextScreen = document.getElementById('screen-' + screen);
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      nextScreen.classList.add('active');
      document.body.dataset.activeScreen = screen;
      if (screen === 'wordbank') {
        wbDiff = 'easy';
        wbCat = 'objects';
        syncWBDiffUI();
        syncWBCatUI();
        renderWordBank();
        renderChallengeBank();
        renderInstalledPacks();
        renderPackPreview();
      }
      if (screen === 'setup') {
        refreshGameTypeUI();
        renderSetupPlayers();
        updateDiffWordCount();
        renderCategorySelection();
      }
      if (screen === 'multidevice') {
        restoreMultiDeviceScreenState();
      }
      if (screen === 'leaderboard') {
        renderLeaderboard();
      }
      updateBackgroundMusic();
      resetViewportToTop(nextScreen);
    }

    function getFullscreenElement() {
      return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    function isFullscreenSupported() {
      const root = document.documentElement;
      const canRequest = Boolean(root.requestFullscreen || root.webkitRequestFullscreen);
      const canExit = Boolean(document.exitFullscreen || document.webkitExitFullscreen);
      const isEnabled = document.fullscreenEnabled !== false && document.webkitFullscreenEnabled !== false;
      return Boolean(canRequest && canExit && isEnabled);
    }

    function updateFullscreenButton() {
      const button = document.getElementById('fullscreen-toggle');
      if (!button) return;
      button.hidden = !isFullscreenSupported();
      const labelKey = getFullscreenElement() ? 'home.exitFullscreen' : 'home.enterFullscreen';
      const label = t(labelKey);
      button.title = label;
      button.setAttribute('aria-label', label);
    }

    async function toggleFullscreen() {
      if (!isFullscreenSupported()) {
        showNotif(t('notifications.fullscreenUnavailable'), 'var(--accent2)', 'var(--text)');
        return;
      }

      try {
        if (getFullscreenElement()) {
          const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
          await exitFullscreen.call(document);
        } else {
          const root = document.documentElement;
          const requestFullscreen = root.requestFullscreen || root.webkitRequestFullscreen;
          await requestFullscreen.call(root);
        }
      } catch (error) {
        showNotif(t('notifications.fullscreenUnavailable'), 'var(--accent2)', 'var(--text)');
      } finally {
        updateFullscreenButton();
      }
    }

    function isPWAStandalone() {
      return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    function updatePWAInstallButton() {
      const button = document.getElementById('pwa-install-button');
      if (!button) return;
      button.classList.toggle('hidden', !deferredPWAInstallPrompt || isPWAStandalone());
    }

    async function installPWA() {
      if (!deferredPWAInstallPrompt || isPWAStandalone()) {
        updatePWAInstallButton();
        return;
      }
      const promptEvent = deferredPWAInstallPrompt;
      deferredPWAInstallPrompt = null;
      updatePWAInstallButton();
      try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
      } catch (e) { }
    }

    // ============================================================
    // MULTI DEVICE
    // ============================================================
    function isPeerAvailable() {
      return typeof window.Peer === 'function';
    }

    function setJoinStatus(keyOrText) {
      const el = document.getElementById('multidevice-join-status');
      if (!el) return;
      el.textContent = keyOrText.includes('.') ? t(keyOrText) : keyOrText;
    }

    function setHostStatus(keyOrText) {
      const el = document.getElementById('multidevice-host-status');
      if (!el) return;
      el.textContent = keyOrText.includes('.') ? t(keyOrText) : keyOrText;
    }

    function renderGuestConnectionStatus() {
      const el = document.getElementById('guest-connection-status');
      if (!el) return;
      const statusKey = multiDeviceState.guestConnectionStatus === 'connected'
        ? 'multiDevice.online'
        : multiDeviceState.guestConnectionStatus === 'disconnected'
          ? 'multiDevice.offline'
          : 'multiDevice.connecting';
      el.textContent = t(statusKey);
      el.dataset.connectionStatus = multiDeviceState.guestConnectionStatus;
    }

    function setGuestConnectionStatus(status) {
      multiDeviceState.guestConnectionStatus = status;
      renderGuestConnectionStatus();
    }

    function getSessionUrl(peerId) {
      const url = new URL(window.location.href);
      url.search = '';
      url.hash = '';
      url.searchParams.set('join', peerId);
      return url.toString();
    }

    function extractSessionCode(value = '') {
      const raw = String(value).trim();
      if (!raw) return '';
      try {
        const url = new URL(raw, window.location.href);
        const join = url.searchParams.get('join');
        if (join) return join.trim();
      } catch (e) { }
      return raw.replace(/^#?join=/i, '').trim();
    }

    function renderSessionQRCode(url) {
      const host = document.getElementById('multidevice-qr');
      if (!host) return;
      host.innerHTML = '';
      if (typeof window.QRCode !== 'function') {
        host.textContent = t('multiDevice.qrUnavailable');
        return;
      }
      new window.QRCode(host, {
        text: url,
        width: 168,
        height: 168,
        colorDark: '#111827',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel?.M
      });
    }

    function updateHostGuestCount() {
      const count = multiDeviceState.connections.filter(conn => conn.open).length;
      const el = document.getElementById('multidevice-guest-count');
      if (el) el.textContent = t('multiDevice.guestsConnected', { count });
      renderMultiDeviceHomeSummary();
    }

    function closeCurrentPeer() {
      try {
        multiDeviceState.connections.forEach(conn => conn.close?.());
        multiDeviceState.hostConnection?.close?.();
        multiDeviceState.peer?.destroy?.();
      } catch (e) { }
      multiDeviceState.peer = null;
      multiDeviceState.hostConnection = null;
      multiDeviceState.guestConnectionStatus = 'disconnected';
      multiDeviceState.lastGuestDrawingTurnKey = '';
      multiDeviceState.connections = [];
      multiDeviceState.peerId = '';
      multiDeviceState.hostPeerId = '';
      multiDeviceState.sessionUrl = '';
      multiDeviceState.lastPayload = null;
      renderMultiDeviceHomeSummary();
    }

    function isCurrentPeerOpen() {
      const peer = multiDeviceState.peer;
      return Boolean(peer && !peer.destroyed && peer.disconnected !== true);
    }

    function isHostSessionOpen() {
      return multiDeviceState.role === 'host' && isCurrentPeerOpen() && Boolean(multiDeviceState.peerId && multiDeviceState.sessionUrl);
    }

    function isGuestSessionOpen() {
      return multiDeviceState.role === 'guest' && isCurrentPeerOpen() && Boolean(multiDeviceState.hostConnection?.open);
    }

    function resetMultiDeviceChoice() {
      document.getElementById('multidevice-choice-card')?.classList.remove('hidden');
      document.getElementById('multidevice-host-card')?.classList.add('hidden');
      document.getElementById('multidevice-host-panel')?.classList.add('hidden');
      document.getElementById('multidevice-join-card')?.classList.add('hidden');
    }

    function selectMultiDeviceMode(mode) {
      document.getElementById('multidevice-choice-card')?.classList.add('hidden');
      document.getElementById('multidevice-host-card')?.classList.toggle('hidden', mode !== 'host');
      document.getElementById('multidevice-host-panel')?.classList.add('hidden');
      document.getElementById('multidevice-join-card')?.classList.toggle('hidden', mode !== 'join');
      if (mode === 'join') {
        requestAnimationFrame(() => document.getElementById('multidevice-join-code')?.focus());
      }
    }

    function showExistingHostSession() {
      selectMultiDeviceMode('host');
      document.getElementById('multidevice-host-panel')?.classList.remove('hidden');
      document.getElementById('multidevice-session-code').textContent = multiDeviceState.peerId;
      document.getElementById('multidevice-link').value = multiDeviceState.sessionUrl;
      renderSessionQRCode(multiDeviceState.sessionUrl);
      setHostStatus('multiDevice.hostReady');
      updateHostGuestCount();
    }

    function showExistingGuestSession() {
      selectMultiDeviceMode('join');
      const input = document.getElementById('multidevice-join-code');
      const hostCode = multiDeviceState.hostPeerId || multiDeviceState.hostConnection?.peer || '';
      if (input) input.value = hostCode;
      setJoinStatus('multiDevice.connected');
    }

    function restoreMultiDeviceScreenState() {
      if (isHostSessionOpen()) {
        showExistingHostSession();
        return;
      }
      if (isGuestSessionOpen()) {
        showExistingGuestSession();
        return;
      }
      resetMultiDeviceChoice();
    }

    function disconnectGuestSession() {
      closeCurrentPeer();
      multiDeviceState.role = 'single';
      setGuestConnectionStatus('disconnected');
      document.getElementById('guest-round-title').textContent = t('multiDevice.waitingTitle');
      document.getElementById('guest-current-player-label').textContent = t('multiDevice.guestWaiting');
      document.getElementById('guest-current-player-name').textContent = '--';
      document.getElementById('guest-hint-banner')?.classList.add('hidden');
      document.getElementById('guest-drawing-card')?.classList.add('hidden');
      document.body.dataset.guestGameType = 'mime';
      updateGuestTimerDisplay(NaN, 1);
      goTo('home');
    }

    function sendToGuest(conn, message) {
      if (!conn?.open) return;
      try {
        conn.send(message);
      } catch (e) { }
    }

    function broadcastMultiDeviceMessage(message) {
      if (multiDeviceState.role !== 'host') return;
      multiDeviceState.connections = multiDeviceState.connections.filter(conn => conn.open);
      multiDeviceState.connections.forEach(conn => sendToGuest(conn, message));
      updateHostGuestCount();
    }

    function getCurrentPlayerForGuest() {
      const player = gameState.players[gameState.currentPlayerIdx];
      if (!player) return { name: '--', teamLabel: '' };
      return {
        name: player.name || player,
        teamLabel: player.team ? (gameState.teamNames[player.team] || getDefaultTeamName(player.team)) : ''
      };
    }

    function getDrawingSnapshot() {
      const canvas = drawingState.canvas;
      if (!canvas || !canvas.width || !canvas.height) return '';
      try {
        return canvas.toDataURL('image/png');
      } catch (e) {
        return '';
      }
    }

    function getGuestStatusKey(phase = 'waiting') {
      if (phase === 'preparing') return 'guestPreparing';
      if (phase === 'memorizing') return 'guestMemorizing';
      if (phase === 'playing') return 'guestPlaying';
      if (phase === 'score') return 'guestScore';
      if (phase === 'final') return 'guestFinal';
      return 'guestWaiting';
    }

    function buildHostGamePayload(options = {}) {
      const { includeDrawingSnapshot = false } = options;
      const hasStarted = Boolean(gameState.players.length && gameState.totalTurns);
      const phase = hasStarted ? gameState.phase : 'waiting';
      const currentPlayer = getCurrentPlayerForGuest();
      const isPlaying = phase === 'playing';
      const isMime = gameState.gameType === 'mime';
      const hintText = gameState.currentWord
        ? getCategoryLabel(gameState.currentWord.cat, { singular: true, withIcon: true })
        : '';
      const payload = {
        phase,
        gameType: gameState.gameType,
        timerLeft: isPlaying ? gameState.timerLeft : gameState.timerDur,
        timerDur: gameState.timerDur,
        currentRound: hasStarted ? gameState.currentRound : 0,
        totalRounds: hasStarted ? gameState.totalRounds : 0,
        drawingTurnKey: `${gameState.turnsDone}:${gameState.currentRound}:${gameState.currentPlayerIdx}`,
        statusKey: getGuestStatusKey(phase),
        currentPlayerName: currentPlayer.name,
        teamLabel: currentPlayer.teamLabel,
        hintVisible: Boolean(isMime && isPlaying && gameState.hintShown && hintText),
        hintCategory: gameState.currentWord?.cat || '',
        hintText
      };
      if (includeDrawingSnapshot && gameState.gameType === 'drawing' && phase === 'playing') {
        payload.drawingSnapshot = getDrawingSnapshot();
      }
      return payload;
    }

    function broadcastHostGameState(options = {}) {
      if (multiDeviceState.role !== 'host') return;
      const payload = buildHostGamePayload(options);
      multiDeviceState.lastPayload = payload;
      broadcastMultiDeviceMessage({ type: 'session-state', payload });
    }

    function attachHostConnection(conn) {
      multiDeviceState.connections.push(conn);
      const syncGuest = () => {
        updateHostGuestCount();
        sendToGuest(conn, { type: 'session-state', payload: buildHostGamePayload({ includeDrawingSnapshot: true }) });
      };
      conn.on('open', syncGuest);
      conn.on('close', updateHostGuestCount);
      conn.on('error', updateHostGuestCount);
      conn.on('data', data => {
        if (data?.type === 'guest-ready') syncGuest();
      });
      setTimeout(syncGuest, 200);
    }

    function createMultiDeviceHost() {
      if (!isPeerAvailable()) {
        showNotif(t('multiDevice.peerUnavailable'), 'var(--accent1)', 'var(--btn-danger-text)');
        return;
      }

      closeCurrentPeer();
      multiDeviceState.role = 'host';
      document.getElementById('multidevice-host-panel')?.classList.remove('hidden');
      setHostStatus('multiDevice.hostCreating');
      updateHostGuestCount();

      const peer = new window.Peer();
      multiDeviceState.peer = peer;
      peer.on('open', id => {
        multiDeviceState.peerId = id;
        multiDeviceState.sessionUrl = getSessionUrl(id);
        document.getElementById('multidevice-session-code').textContent = id;
        document.getElementById('multidevice-link').value = multiDeviceState.sessionUrl;
        renderSessionQRCode(multiDeviceState.sessionUrl);
        setHostStatus('multiDevice.hostReady');
        renderMultiDeviceHomeSummary();
        broadcastHostGameState();
      });
      peer.on('connection', attachHostConnection);
      peer.on('error', () => {
        setHostStatus('multiDevice.hostError');
        renderMultiDeviceHomeSummary();
        showNotif(t('multiDevice.hostError'), 'var(--accent1)', 'var(--btn-danger-text)');
      });
    }

    function connectToMultiDeviceHost(rawCode) {
      const hostId = extractSessionCode(rawCode);
      if (!hostId) {
        setJoinStatus('multiDevice.missingSession');
        return;
      }
      if (!isPeerAvailable()) {
        setJoinStatus('multiDevice.peerUnavailable');
        showNotif(t('multiDevice.peerUnavailable'), 'var(--accent1)', 'var(--btn-danger-text)');
        return;
      }

      closeCurrentPeer();
      multiDeviceState.role = 'guest';
      multiDeviceState.hostPeerId = hostId;
      setJoinStatus('multiDevice.connecting');
      setGuestConnectionStatus('connecting');
      goTo('guest');

      const peer = new window.Peer();
      multiDeviceState.peer = peer;
      peer.on('open', () => {
        const conn = peer.connect(hostId, { reliable: true });
        multiDeviceState.hostConnection = conn;
        attachGuestConnection(conn);
      });
      peer.on('error', () => {
        setGuestConnectionStatus('disconnected');
        setJoinStatus('multiDevice.hostError');
        renderMultiDeviceHomeSummary();
      });
    }

    function attachGuestConnection(conn) {
      conn.on('open', () => {
        setGuestConnectionStatus('connected');
        setJoinStatus('multiDevice.connected');
        renderMultiDeviceHomeSummary();
        sendToGuest(conn, { type: 'guest-ready' });
      });
      conn.on('data', handleGuestMessage);
      conn.on('close', () => {
        setGuestConnectionStatus('disconnected');
        renderMultiDeviceHomeSummary();
      });
      conn.on('error', () => {
        setGuestConnectionStatus('disconnected');
        renderMultiDeviceHomeSummary();
      });
    }

    function handleGuestMessage(message) {
      if (message?.type === 'session-state') {
        renderGuestSessionState(message.payload || {});
      }
      if (message?.type === 'drawing-clear') {
        clearGuestDrawingCanvas();
      }
      if (message?.type === 'drawing-stroke') {
        drawGuestStroke(message.stroke);
      }
    }

    function updateGuestTimerDisplay(left, total) {
      const num = document.getElementById('guest-timer-num');
      const circle = document.getElementById('guest-timer-circle');
      if (!num || !circle) return;
      const safeTotal = Math.max(1, Number(total) || 1);
      const safeLeft = Math.max(0, Number(left) || 0);
      num.textContent = Number.isFinite(Number(left)) ? safeLeft : '--';
      circle.style.strokeDashoffset = 427.3 - (safeLeft / safeTotal) * 427.3;
      circle.style.stroke = safeLeft > safeTotal * 0.5
        ? getThemeVar('--timer-color-safe')
        : safeLeft > safeTotal * 0.25
          ? getThemeVar('--timer-color-warning')
          : getThemeVar('--timer-color-danger');
    }

    function getGuestRoundText(payload = {}) {
      const current = Number.parseInt(payload.currentRound, 10);
      const total = Number.parseInt(payload.totalRounds, 10);
      if (payload.phase !== 'waiting' && current > 0 && total > 0) {
        return t('dynamic.roundDisplay', { current, total });
      }
      return t('multiDevice.waitingTitle');
    }

    function getGuestStatusText(payload = {}) {
      const statusKey = payload.statusKey || getGuestStatusKey(payload.phase);
      return t(`multiDevice.${statusKey}`);
    }

    function getGuestHintText(payload = {}) {
      if (CATEGORY_KEYS.includes(payload.hintCategory)) {
        return getCategoryLabel(payload.hintCategory, { singular: true, withIcon: true });
      }
      return payload.hintText || '';
    }

    function renderGuestSessionState(payload) {
      multiDeviceState.lastPayload = payload;
      if (!document.getElementById('screen-guest').classList.contains('active')) goTo('guest');
      document.body.dataset.guestGameType = payload.gameType === 'drawing' ? 'drawing' : 'mime';
      document.getElementById('guest-round-title').textContent = getGuestRoundText(payload);
      document.getElementById('guest-current-player-label').textContent = getGuestStatusText(payload);
      document.getElementById('guest-current-player-name').textContent = payload.phase === 'waiting' ? '--' : (payload.currentPlayerName || '--');
      updateGuestTimerDisplay(payload.timerLeft, payload.timerDur);

      const hint = document.getElementById('guest-hint-banner');
      const hintText = document.getElementById('guest-hint-text');
      const localizedHintText = getGuestHintText(payload);
      if (payload.hintVisible && localizedHintText) {
        hintText.textContent = localizedHintText;
        hint.classList.remove('hidden');
      } else {
        hint.classList.add('hidden');
      }

      const drawingCard = document.getElementById('guest-drawing-card');
      const shouldShowDrawing = payload.gameType === 'drawing' && payload.phase === 'playing';
      drawingCard.classList.toggle('hidden', !shouldShowDrawing);
      if (shouldShowDrawing) {
        const drawingTurnKey = payload.drawingTurnKey || `${payload.currentRound || 0}:${payload.currentPlayerName || ''}`;
        if (drawingTurnKey !== multiDeviceState.lastGuestDrawingTurnKey) {
          multiDeviceState.lastGuestDrawingTurnKey = drawingTurnKey;
          clearGuestDrawingCanvas();
        }
        requestAnimationFrame(() => resizeGuestDrawingCanvas({ preserve: true }));
        if (payload.drawingSnapshot) applyGuestDrawingSnapshot(payload.drawingSnapshot);
      } else {
        multiDeviceState.lastGuestDrawingTurnKey = '';
      }
    }

    function resizeGuestDrawingCanvas(options = {}) {
      const { preserve = true } = options;
      const canvas = guestDrawingState.canvas || document.getElementById('guest-drawing-canvas');
      if (!canvas) return;
      guestDrawingState.canvas = canvas;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const previous = preserve && canvas.width && canvas.height ? document.createElement('canvas') : null;
      if (previous) {
        previous.width = canvas.width;
        previous.height = canvas.height;
        previous.getContext('2d').drawImage(canvas, 0, 0);
      }
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = canvas.getContext('2d');
      guestDrawingState.ctx = ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (previous) {
        ctx.drawImage(previous, 0, 0, previous.width, previous.height, 0, 0, rect.width, rect.height);
      }
    }

    function clearGuestDrawingCanvas() {
      resizeGuestDrawingCanvas({ preserve: false });
    }

    function drawGuestStroke(stroke) {
      if (!stroke) return;
      const canvas = guestDrawingState.canvas || document.getElementById('guest-drawing-canvas');
      if (!canvas) return;
      if (!guestDrawingState.ctx) resizeGuestDrawingCanvas();
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const tool = DRAWING_TOOL_CONFIG[stroke.tool] || DRAWING_TOOL_CONFIG['pen-thick'];
      const ctx = guestDrawingState.ctx;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = tool.color;
      ctx.lineWidth = tool.width;
      ctx.beginPath();
      ctx.moveTo(stroke.from.x * rect.width, stroke.from.y * rect.height);
      ctx.lineTo(stroke.to.x * rect.width, stroke.to.y * rect.height);
      ctx.stroke();
      ctx.restore();
    }

    function applyGuestDrawingSnapshot(dataUrl) {
      const canvas = guestDrawingState.canvas || document.getElementById('guest-drawing-canvas');
      if (!canvas || !dataUrl) return;
      resizeGuestDrawingCanvas({ preserve: false });
      const rect = canvas.getBoundingClientRect();
      const img = new Image();
      img.onload = () => {
        guestDrawingState.ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = dataUrl;
    }

    function broadcastDrawingClear() {
      broadcastMultiDeviceMessage({ type: 'drawing-clear' });
    }

    function broadcastDrawingStroke(from, to, tool) {
      if (multiDeviceState.role !== 'host' || gameState.gameType !== 'drawing') return;
      const rect = drawingState.canvas?.getBoundingClientRect();
      if (!rect?.width || !rect?.height) return;
      broadcastMultiDeviceMessage({
        type: 'drawing-stroke',
        stroke: {
          from: { x: from.x / rect.width, y: from.y / rect.height },
          to: { x: to.x / rect.width, y: to.y / rect.height },
          tool
        }
      });
    }

    async function copyMultiDeviceLink() {
      if (!multiDeviceState.sessionUrl) return;
      try {
        await copyTextToClipboard(multiDeviceState.sessionUrl);
        showNotif(t('multiDevice.linkCopied'));
      } catch (e) {
        showNotif(t('notifications.shareCopyFailed'), 'var(--accent2)', 'var(--text)');
      }
    }

    function initializeMultiDeviceJoinFromUrl() {
      const code = new URL(window.location.href).searchParams.get('join');
      if (!code) return;
      const input = document.getElementById('multidevice-join-code');
      if (input) input.value = code;
      selectMultiDeviceMode('join');
      connectToMultiDeviceHost(code);
    }

    function getThemeVar(name) {
      return getComputedStyle(document.body).getPropertyValue(name).trim();
    }

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    function showNotif(msg, color = 'var(--accent3)', textColor = 'var(--notif-text)') {
      const el = document.getElementById('notif');
      el.textContent = msg;
      el.style.background = color;
      el.style.color = textColor;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 2400);
    }

    function renderUserId() {
      const input = document.getElementById('user-id-display');
      if (input) input.value = appUserId;
    }

    function setUserIdImportStatus(message = '', type = '') {
      const el = document.getElementById('user-id-import-status');
      if (!el) return;
      el.textContent = message;
      el.classList.remove('success', 'error');
      if (type) el.classList.add(type);
    }

    function isValidImportedUserId(userId) {
      return typeof userId === 'string'
        && userId.length >= 8
        && userId.length <= 160
        && /^[A-Za-z0-9._:-]+$/.test(userId);
    }

    function createUserIdBackupEnvelope(userId = appUserId) {
      return {
        schema: USER_ID_BACKUP_SCHEMA,
        app: 'TrustNoOne',
        version: 1,
        exported_at: new Date().toISOString(),
        user_id: userId
      };
    }

    function downloadJsonFile(filename, payload) {
      const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function exportUserId() {
      const dateToken = new Date().toISOString().slice(0, 10);
      downloadJsonFile(`mimimania-user-id-${dateToken}.json`, createUserIdBackupEnvelope());
      setUserIdImportStatus(t('notifications.userIdExported'), 'success');
      showNotif(t('notifications.userIdExported'));
    }

    function selectUserIdFile() {
      const input = document.getElementById('user-id-file-input');
      if (!input) return;
      input.value = '';
      input.click();
    }

    async function parseUserIdFile(file) {
      if (!file) throw new Error(t('userIdErrors.fileRequired'));
      let envelope;
      try {
        envelope = JSON.parse(await file.text());
      } catch (error) {
        throw new Error(t('userIdErrors.invalidJson'));
      }

      if (!envelope || typeof envelope !== 'object' || envelope.schema !== USER_ID_BACKUP_SCHEMA) {
        throw new Error(t('userIdErrors.invalidSchema'));
      }
      if (!isValidImportedUserId(envelope.user_id)) {
        throw new Error(t('userIdErrors.invalidUserId'));
      }
      return envelope;
    }

    async function importUserIdFile(file) {
      setUserIdImportStatus(t('notifications.packInstallReading'));
      const envelope = await parseUserIdFile(file);
      const importedUserId = envelope.user_id;

      if (importedUserId !== appUserId) {
        const shouldReplace = confirm(t('confirmations.replaceUserId', {
          currentUserId: appUserId,
          importedUserId
        }));
        if (!shouldReplace) {
          setUserIdImportStatus(t('notifications.userIdImportCancelled'));
          return null;
        }
      }

      appUserId = importedUserId;
      localStorage.setItem(USER_ID_KEY, appUserId);
      renderUserId();
      setUserIdImportStatus(t('notifications.userIdImported'), 'success');
      showNotif(t('notifications.userIdImported'));
      return appUserId;
    }

    async function handleUserIdFileSelection(file) {
      try {
        await importUserIdFile(file);
      } catch (error) {
        const message = error?.message || t('userIdErrors.invalidJson');
        setUserIdImportStatus(message, 'error');
        showNotif(message, 'var(--accent2)', 'var(--text)');
      }
    }

    async function copyUserId() {
      try {
        await navigator.clipboard.writeText(appUserId);
        showNotif(t('notifications.userIdCopied'));
      } catch (e) {
        const input = document.getElementById('user-id-display');
        input?.select();
        document.execCommand?.('copy');
        showNotif(t('notifications.userIdCopied'));
      }
    }

    function setPackInstallStatus(message = '', type = '') {
      const el = document.getElementById('pack-install-status');
      if (!el) return;
      el.textContent = message;
      el.classList.remove('success', 'error');
      if (type) el.classList.add(type);
    }

    function renderInstalledPacks() {
      const container = document.getElementById('installed-packs-list');
      if (!container) return;
      const installedPacks = (contentModel.packs || []).filter(pack => pack.source === 'downloaded');
      container.innerHTML = '';

      if (!installedPacks.length) {
        const empty = document.createElement('div');
        empty.className = 'installed-pack-empty';
        empty.textContent = t('wordbank.noInstalledPacks');
        container.appendChild(empty);
        return;
      }

      installedPacks.forEach(pack => {
        const row = document.createElement('div');
        row.className = 'installed-pack-row';
        if (pack.id === wbPreviewPackId) row.classList.add('selected');
        row.dataset.packPreviewId = pack.id;
        const name = getPackDisplayName(pack);
        const wordsCount = getPackWordCount(pack);
        const version = pack.version ? ` · ${t('dynamic.packVersion', { version: pack.version })}` : '';
        const info = document.createElement('div');
        const nameEl = document.createElement('div');
        nameEl.className = 'installed-pack-name';
        nameEl.textContent = name;
        const metaEl = document.createElement('div');
        metaEl.className = 'installed-pack-meta';
        metaEl.textContent = `${t('dynamic.packWordsSummary', { count: wordsCount })}${version}`;
        info.append(nameEl, metaEl);

        const actions = document.createElement('div');
        actions.className = 'installed-pack-actions';
        const toggleButton = document.createElement('button');
        toggleButton.className = 'btn btn-ghost btn-sm';
        toggleButton.dataset.action = 'toggle-installed-pack';
        toggleButton.dataset.packId = pack.id;
        toggleButton.textContent = pack.enabled === false ? t('wordbank.packDisabled') : t('wordbank.packEnabled');
        const removeButton = document.createElement('button');
        removeButton.className = 'btn btn-ghost btn-sm';
        removeButton.dataset.action = 'remove-installed-pack';
        removeButton.dataset.packId = pack.id;
        removeButton.textContent = t('wordbank.removePack');
        actions.append(toggleButton, removeButton);
        row.append(info, actions);
        container.appendChild(row);
      });
    }

    function getInstalledPackById(packId) {
      return (contentModel.packs || []).find(pack => pack.id === packId && pack.source === 'downloaded') || null;
    }

    function getPackPreviewWordEntries(pack, diff = wbDiff, locale = currentLanguage) {
      const bank = normalizeWordBank(pack?.words?.[locale] || {});
      const entries = [];
      CATEGORY_KEYS.forEach(category => {
        (bank[diff]?.[category] || []).forEach(word => {
          entries.push({ word, category });
        });
      });
      return entries;
    }

    function renderPreviewItems(container, entries, emptyMessage, formatter) {
      if (!container) return;
      container.innerHTML = '';
      if (!entries.length) {
        const empty = document.createElement('div');
        empty.className = 'pack-preview-empty';
        empty.textContent = emptyMessage;
        container.appendChild(empty);
        return;
      }

      entries.forEach(entry => {
        const item = document.createElement('span');
        item.className = 'pack-preview-item';
        item.textContent = formatter(entry);
        container.appendChild(item);
      });
    }

    function renderPackPreview() {
      const subtitle = document.getElementById('pack-preview-subtitle');
      const diffLabel = document.getElementById('pack-preview-diff-label');
      const wordsContainer = document.getElementById('pack-preview-words');
      const challengesContainer = document.getElementById('pack-preview-challenges');
      if (!subtitle || !wordsContainer || !challengesContainer) return;

      if (diffLabel) diffLabel.textContent = getDifficultyLabel(wbDiff, true);
      const pack = getInstalledPackById(wbPreviewPackId);
      if (!pack) {
        subtitle.textContent = t('wordbank.packPreviewPrompt');
        renderPreviewItems(wordsContainer, [], t('wordbank.packPreviewNoWords'), item => item);
        renderPreviewItems(challengesContainer, [], t('wordbank.packPreviewNoChallenges'), item => item);
        return;
      }

      subtitle.textContent = t('wordbank.packPreviewSelected', { name: getPackDisplayName(pack) });
      const wordEntries = getPackPreviewWordEntries(pack);
      const challenges = normalizeChallenges(pack.challenges?.[currentLanguage] || []);
      renderPreviewItems(
        wordsContainer,
        wordEntries,
        t('wordbank.packPreviewNoWords'),
        entry => `${CATEGORY_ICONS[entry.category] || ''} ${entry.word}`.trim()
      );
      renderPreviewItems(
        challengesContainer,
        challenges,
        t('wordbank.packPreviewNoChallenges'),
        challenge => `🎯 ${challenge}`
      );
    }

    function selectPreviewPack(packId) {
      wbPreviewPackId = packId;
      renderInstalledPacks();
      renderPackPreview();
    }

    function getDonationUrl(platform) {
      return DONATION_LINKS[platform] || '';
    }

    function isDonationUrlConfigured(url) {
      return Boolean(url) && !/your-page/i.test(url);
    }

    function openExternalUrl(url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    function getShareUrl() {
      try {
        const url = new URL(window.location.href);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          if (['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname)) return APP_PUBLIC_URL;
          url.hash = '';
          return url.href;
        }
      } catch (error) {
        console.warn('Could not read current URL for sharing.', error);
      }

      return APP_PUBLIC_URL;
    }

    function getShareData() {
      return {
        title: t('share.title'),
        text: t('share.text'),
        url: getShareUrl()
      };
    }

    function canUseNativeShare(shareData) {
      if (!navigator.share) return false;
      if (!navigator.canShare) return true;

      try {
        return navigator.canShare(shareData);
      } catch (error) {
        console.warn('Native share capability check failed.', error);
        return false;
      }
    }

    function createPlatformShareUrl(platform, shareData) {
      const encodedUrl = encodeURIComponent(shareData.url);
      const encodedText = encodeURIComponent(shareData.text);
      const encodedMessage = encodeURIComponent(`${shareData.text} ${shareData.url}`);

      if (platform === 'whatsapp') return `https://wa.me/?text=${encodedMessage}`;
      if (platform === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      if (platform === 'x') return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;

      return '';
    }

    async function copyTextToClipboard(text) {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);

      const activeElement = document.activeElement;
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (activeElement?.focus) activeElement.focus();
      if (!copied) throw new Error('Clipboard fallback failed');
    }

    async function copyShareLink(notificationKey = 'notifications.shareCopied') {
      try {
        await copyTextToClipboard(getShareData().url);
        showNotif(t(notificationKey));
        return true;
      } catch (error) {
        console.warn('Share link could not be copied.', error);
        showNotif(t('notifications.shareCopyFailed'), 'var(--accent2)', 'var(--text)');
        return false;
      }
    }

    async function nativeShareApp(options = {}) {
      const { fallbackNotification = 'notifications.shareUnavailable' } = options;
      const shareData = getShareData();

      if (canUseNativeShare(shareData)) {
        try {
          await navigator.share(shareData);
          return true;
        } catch (error) {
          if (error?.name === 'AbortError') return false;
          console.warn('Native sharing failed; falling back to clipboard.', error);
        }
      }

      return copyShareLink(fallbackNotification);
    }

    async function shareToPlatform(platform) {
      const shareData = getShareData();
      const target = platform || '';

      if (target === 'copy') return copyShareLink();

      // Instagram and TikTok do not expose reliable public web share-intent URLs
      // for arbitrary app links. Use the native share sheet when supported;
      // otherwise copy the URL and open the platform so users can paste it.
      if (target === 'instagram' || target === 'tiktok') {
        const fallbackNotification = target === 'instagram'
          ? 'notifications.shareInstagramFallback'
          : 'notifications.shareTikTokFallback';
        const shared = await nativeShareApp({ fallbackNotification });
        if (!canUseNativeShare(shareData)) openExternalUrl(SOCIAL_WEB_FALLBACKS[target]);
        return shared;
      }

      const platformUrl = createPlatformShareUrl(target, shareData);
      if (platformUrl) {
        openExternalUrl(platformUrl);
        return true;
      }

      return nativeShareApp();
    }

    function loadExternalScript(src, scriptId) {
      return new Promise((resolve, reject) => {
        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
          if (existingScript.dataset.loaded === 'true') {
            resolve();
            return;
          }
          existingScript.addEventListener('load', () => resolve(), { once: true });
          existingScript.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = src;
        script.async = true;
        script.onload = () => {
          script.dataset.loaded = 'true';
          resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
    }

    function openBuyMeACoffeeDonation() {
      const donationUrl = getDonationUrl('buyMeCoffee');
      if (isDonationUrlConfigured(donationUrl)) {
        openExternalUrl(donationUrl);
        return;
      }

      showNotif(t('notifications.donationLinkUnavailable'), 'var(--accent2)', 'var(--text)');
    }

    function wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getKoFiWidgetTrigger() {
      const selectors = [
        'div[class*="kofi"] button',
        'div[class*="kofi"] a',
        'button[aria-label*="Support me"]',
        'button[title*="Support me"]',
        'a[aria-label*="Ko-fi"]',
        'a[href*="ko-fi.com"]'
      ];

      for (const selector of selectors) {
        const candidate = document.querySelector(selector);
        if (candidate) return candidate;
      }

      return Array.from(document.querySelectorAll('button, a')).find(el => {
        const text = (el.textContent || '').trim();
        const href = (el.getAttribute('href') || '').trim();
        const className = typeof el.className === 'string' ? el.className : '';
        return /support me/i.test(text) || /ko-?fi/i.test(text) || /ko-?fi/i.test(href) || /kofi/i.test(className);
      }) || null;
    }

    async function ensureKoFiWidgetReady() {
      await loadExternalScript(KO_FI_WIDGET_SCRIPT_URL, 'kofi-widget-script');
      if (!window.kofiWidgetOverlay?.draw) throw new Error('Ko-fi widget API unavailable');

      if (!window.__mmKoFiWidgetInitialized) {
        window.kofiWidgetOverlay.draw(KO_FI_SLUG, {
          type: 'floating-chat',
          'floating-chat.donateButton.text': 'Support me',
          'floating-chat.donateButton.background-color': '#323842',
          'floating-chat.donateButton.text-color': '#fff'
        });
        window.__mmKoFiWidgetInitialized = true;
      }
    }

    async function triggerKoFiWidget() {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const trigger = getKoFiWidgetTrigger();
        if (trigger) {
          trigger.click();
          return true;
        }
        await wait(120);
      }
      return false;
    }

    async function openKoFiDonation() {
      try {
        await ensureKoFiWidgetReady();
        if (await triggerKoFiWidget()) return;
      } catch (error) {
        console.warn('Ko-fi widget could not be initialized.', error);
      }

      const fallbackUrl = getDonationUrl('koFi');
      if (isDonationUrlConfigured(fallbackUrl)) {
        openExternalUrl(fallbackUrl);
        return;
      }

      showNotif(t('notifications.donationLinkUnavailable'), 'var(--accent2)', 'var(--text)');
    }

    function openDonationLink(platform) {
      if (platform === 'buyMeCoffee') {
        openBuyMeACoffeeDonation();
        return;
      }
      if (platform === 'koFi') {
        openKoFiDonation();
        return;
      }

      const url = getDonationUrl(platform);
      if (!isDonationUrlConfigured(url)) {
        showNotif(t('notifications.donationLinkUnavailable'), 'var(--accent2)', 'var(--text)');
        return;
      }

      openExternalUrl(url);
    }

    function applyTheme(theme = 'cosmic') {
      const nextTheme = AVAILABLE_THEMES.includes(theme) ? theme : 'cosmic';
      document.body.classList.remove(...AVAILABLE_THEMES.map(item => `theme-${item}`));
      document.body.classList.add(`theme-${nextTheme}`);
      const select = document.getElementById('theme-select');
      if (select && select.value !== nextTheme) select.value = nextTheme;
      updateBackgroundMusic();
      return nextTheme;
    }

    function getCurrentTheme() {
      return AVAILABLE_THEMES.find(theme => document.body.classList.contains(`theme-${theme}`)) || 'cosmic';
    }

    function getMusicKindForScreen(screen = document.body.dataset.activeScreen || 'home') {
      return GAMEPLAY_MUSIC_SCREENS.includes(screen) ? 'gameplay' : 'gameroom';
    }

    function isGameroomMusicEnabled() {
      const toggle = document.getElementById('toggle-gameroom-music');
      return toggle ? toggle.checked : true;
    }

    function isGameplayMusicEnabled() {
      const toggle = document.getElementById('toggle-gameplay-music');
      return toggle ? toggle.checked : true;
    }

    function isMusicKindEnabled(kind) {
      return kind === 'gameplay' ? isGameplayMusicEnabled() : isGameroomMusicEnabled();
    }

    function getMusicSourceForCurrentTheme(kind) {
      const theme = getCurrentTheme();
      if (!THEMES_WITH_MUSIC.includes(theme)) return '';
      const prefix = THEME_MUSIC_PREFIX[theme];
      return prefix ? `${MUSIC_ASSET_BASE}/${prefix}_${kind}.mp3` : '';
    }

    function ensureBackgroundMusicAudio() {
      if (musicState.audio) return musicState.audio;
      const audio = new Audio();
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.36;
      audio.addEventListener('ended', () => {
        if (!musicState.currentSrc || !musicState.unlocked || !isMusicKindEnabled(musicState.currentKind)) return;
        audio.currentTime = 0;
        audio.play().catch(() => { });
      });
      audio.addEventListener('error', () => {
        musicState.currentSrc = '';
        musicState.currentKind = '';
      });
      musicState.audio = audio;
      return audio;
    }

    function pauseBackgroundMusic({ clearTrack = false } = {}) {
      if (!musicState.audio) return;
      musicState.audio.pause();
      if (clearTrack) {
        musicState.audio.removeAttribute('src');
        musicState.audio.load();
        musicState.currentSrc = '';
        musicState.currentKind = '';
      }
    }

    function updateBackgroundMusic(options = {}) {
      const { unlock = false } = options;
      if (unlock) musicState.unlocked = true;

      const kind = getMusicKindForScreen();
      const src = getMusicSourceForCurrentTheme(kind);
      if (!src || !isMusicKindEnabled(kind)) {
        pauseBackgroundMusic({ clearTrack: !src });
        return;
      }

      const audio = ensureBackgroundMusicAudio();
      if (musicState.currentSrc !== src) {
        audio.pause();
        audio.src = src;
        audio.currentTime = 0;
        musicState.currentSrc = src;
        musicState.currentKind = kind;
      } else {
        musicState.currentKind = kind;
      }

      if (!musicState.unlocked || !audio.paused) return;
      audio.play().catch(() => { });
    }

    function unlockBackgroundMusic() {
      updateBackgroundMusic({ unlock: true });
    }

    function handleMusicSettingChange() {
      musicState.unlocked = true;
      saveSettings();
      updateBackgroundMusic();
    }

    function collectSettings() {
      return {
        timerDur: parseInt(document.getElementById('timer-slider').value, 10) || 60,
        soundEnabled: document.getElementById('toggle-sound').checked,
        navigationSoundEnabled: document.getElementById('toggle-navigation-sound').checked,
        gameroomMusicEnabled: document.getElementById('toggle-gameroom-music').checked,
        gameplayMusicEnabled: document.getElementById('toggle-gameplay-music').checked,
        correctPoints: getConfiguredCorrectPoints(),
        wrongPenaltyPoints: getConfiguredWrongPenaltyPoints(),
        ffaGuesserPointsEnabled: isFfaGuesserPointsEnabled(),
        ffaGuesserPoints: getConfiguredFfaGuesserPoints(),
        shuffleEnabled: document.getElementById('toggle-shuffle').checked,
        theme: document.getElementById('theme-select').value || 'cosmic',
        language: document.getElementById('language-select').value || DEFAULT_LANGUAGE
      };
    }

    function saveSettings() {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(collectSettings()));
    }

    function detectBrowserLanguage() {
      const browserLanguages = Array.isArray(navigator?.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator?.language].filter(Boolean);
      for (const language of browserLanguages) {
        const normalized = String(language).toLowerCase().split('-')[0];
        if (SUPPORTED_LANGUAGES.includes(normalized)) return normalized;
      }
      return DEFAULT_LANGUAGE;
    }

    function initializeSettings() {
      const defaults = {
        timerDur: 60,
        soundEnabled: true,
        navigationSoundEnabled: true,
        gameroomMusicEnabled: true,
        gameplayMusicEnabled: true,
        correctPoints: DEFAULT_CORRECT_POINTS,
        wrongPenaltyPoints: DEFAULT_WRONG_PENALTY_POINTS,
        ffaGuesserPointsEnabled: true,
        ffaGuesserPoints: DEFAULT_FFA_GUESSER_POINTS,
        shuffleEnabled: true,
        theme: 'cosmic',
        language: DEFAULT_LANGUAGE
      };

      let rawSaved = null;
      try {
        rawSaved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      } catch (e) { }
      const shouldAutoDetectLanguage = !rawSaved || !SUPPORTED_LANGUAGES.includes(rawSaved.language);
      const resolvedLanguage = shouldAutoDetectLanguage ? detectBrowserLanguage() : rawSaved.language;
      const saved = { ...defaults, ...(rawSaved || {}), language: resolvedLanguage };

      document.getElementById('timer-slider').value = saved.timerDur;
      document.getElementById('toggle-sound').checked = Boolean(saved.soundEnabled);
      document.getElementById('toggle-navigation-sound').checked = Boolean(saved.navigationSoundEnabled);
      document.getElementById('toggle-gameroom-music').checked = Boolean(saved.gameroomMusicEnabled);
      document.getElementById('toggle-gameplay-music').checked = Boolean(saved.gameplayMusicEnabled);
      document.getElementById('correct-points-input').value = parsePointValue(saved.correctPoints, DEFAULT_CORRECT_POINTS);
      document.getElementById('wrong-points-input').value = parsePointValue(saved.wrongPenaltyPoints, DEFAULT_WRONG_PENALTY_POINTS);
      document.getElementById('toggle-ffa-guesser-points').checked = saved.ffaGuesserPointsEnabled !== false;
      document.getElementById('ffa-guesser-points-input').value = parsePointValue(saved.ffaGuesserPoints, DEFAULT_FFA_GUESSER_POINTS);
      document.getElementById('toggle-shuffle').checked = Boolean(saved.shuffleEnabled);
      document.getElementById('theme-select').value = applyTheme(saved.theme);
      document.getElementById('language-select').value = SUPPORTED_LANGUAGES.includes(saved.language) ? saved.language : DEFAULT_LANGUAGE;
      updateTimerLabel(saved.timerDur);
      setLanguage(saved.language || DEFAULT_LANGUAGE);
      if (shouldAutoDetectLanguage) saveSettings();
    }

    // ============================================================
    // LOAD LAST PLAYERS
    // ============================================================
    function loadPlayersForMode(mode) {
      const key = mode === 'teams' ? 'mm_last_teams' : 'mm_last_ffa';
      const saved = localStorage.getItem(key);
      if (!saved) return;
      try {
        const data = JSON.parse(saved);
        if (mode === 'teams' && data.teams) {
          gameState.teams = clone(data.teams);
          if (data.teamNames) gameState.teamNames = { ...data.teamNames };
        } else if (mode === 'ffa' && data.players) {
          gameState.players = [...data.players];
        }
      } catch (e) { }
    }

    function updateTeamName(team, name) {
      gameState.teamNames[team] = name.trim() || getDefaultTeamName(team);
      updateTeamLabels();
    }

    function updateTeamLabels() {
      try {
        ['A', 'B'].forEach(team => {
          if (!gameState.teamNames[team] || isDefaultTeamName(gameState.teamNames[team], team)) {
            gameState.teamNames[team] = getDefaultTeamName(team);
          }
        });
        document.getElementById('team-label-a').innerHTML = `🔴 ${gameState.teamNames.A}`;
        document.getElementById('team-label-b').innerHTML = `🔵 ${gameState.teamNames.B}`;
        document.getElementById('team-name-a').value = gameState.teamNames.A;
        document.getElementById('team-name-b').value = gameState.teamNames.B;
      } catch (e) { }
    }

    // ============================================================
    // SETUP
    // ============================================================
    function syncDrawingBoardVisibility(options = {}) {
      const { reset = false } = options;
      const board = document.getElementById('drawing-board');
      if (!board) return;
      const shouldShow = gameState.gameType === 'drawing' && gameState.phase === 'playing';
      board.classList.toggle('hidden', !shouldShow);
      if (shouldShow) {
        if (reset) {
          resizeDrawingCanvas({ preserve: false });
          broadcastDrawingClear();
        } else {
          requestAnimationFrame(() => resizeDrawingCanvas({ preserve: true }));
        }
      }
    }

    function refreshGameTypeUI() {
      const isDrawing = gameState.gameType === 'drawing';
      document.body.dataset.gameType = gameState.gameType;
      GAME_TYPES.forEach(type => {
        const card = document.getElementById(`game-type-${type}`);
        if (card) card.classList.toggle('selected', gameState.gameType === type);
      });

      const challengeToggle = document.getElementById('random-challenge-toggle');
      const challengeWrap = document.getElementById('random-challenge-wrap');
      const challengeSub = document.getElementById('random-challenge-sub');
      if (isDrawing) {
        gameState.randomChallenge = false;
        if (challengeToggle) challengeToggle.checked = false;
      }
      if (challengeToggle) challengeToggle.disabled = isDrawing;
      if (challengeWrap) challengeWrap.classList.toggle('is-disabled', isDrawing);
      if (challengeSub) challengeSub.textContent = t(isDrawing ? 'setup.randomChallengeDisabledSub' : 'setup.randomChallengeSub');

      const currentLabel = document.querySelector('#screen-game .current-player .cp-label');
      if (currentLabel) currentLabel.textContent = t(isDrawing ? 'game.currentPlayerDrawingLabel' : 'game.currentPlayerLabel');
      const readyEmoji = document.getElementById('game-ready-emoji');
      if (readyEmoji) readyEmoji.textContent = isDrawing ? '✏️' : '🎭';
      const readyTitle = document.getElementById('game-ready-title');
      if (readyTitle) readyTitle.textContent = t(isDrawing ? 'game.readyDrawingTitle' : 'game.readyTitle');
      const readySub = document.getElementById('game-ready-sub');
      if (readySub) readySub.textContent = t(isDrawing ? 'game.readyDrawingSub' : 'game.readySub');
      const actorOnly = document.getElementById('game-only-actor-can-see');
      if (actorOnly) actorOnly.textContent = t(isDrawing ? 'game.onlyDrawerCanSee' : 'game.onlyMimeCanSee');
      syncDrawingBoardVisibility();
    }

    function selectGameType(type) {
      gameState.gameType = GAME_TYPES.includes(type) ? type : 'mime';
      refreshGameTypeUI();
    }

    function updateDiffWordCount() {
      const total = countWordsForSelectedCategories(gameState.selectedCategories, gameState.difficulty);
      document.getElementById('diff-word-count').textContent = t('dynamic.diffCount', {
        difficulty: getDifficultyLabel(gameState.difficulty, true),
        count: total
      });
    }

    function toggleRandomChallenge(enabled) {
      gameState.randomChallenge = gameState.gameType === 'mime' && enabled;
      refreshGameTypeUI();
    }

    function toggleCategory(category) {
      gameState.selectedCategories = normalizeSelectedCategories(gameState.selectedCategories);
      if (gameState.selectedCategories.includes(category)) {
        gameState.selectedCategories = gameState.selectedCategories.filter(c => c !== category);
      } else {
        gameState.selectedCategories.push(category);
      }
      gameState.selectedCategories = normalizeSelectedCategories(gameState.selectedCategories);
      renderCategorySelection();
    }

    function renderCategorySelection() {
      const container = document.getElementById('category-selection');
      gameState.selectedCategories = normalizeSelectedCategories(gameState.selectedCategories);
      const premiumPacks = getPremiumPacks();
      const coreMarkup = CATEGORY_KEYS.map(category => `
        <div class="category-card ${gameState.selectedCategories.includes(category) ? 'selected' : ''}" data-category="${category}">
          ${CATEGORY_ICONS[category]} ${getCategoryLabel(category)}
        </div>
      `).join('');
      const premiumMarkup = premiumPacks.map(pack => {
        const category = getPremiumCategoryToken(pack.id);
        return `
          <div class="category-card premium-category-card ${gameState.selectedCategories.includes(category) ? 'selected' : ''}" data-category="${category}">
            ⭐ ${getPackDisplayName(pack)}
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="category-section-title">${t('setup.coreCategoriesLabel')}</div>
        ${coreMarkup}
        ${premiumPacks.length ? `<div class="category-section-title">${t('setup.premiumCategoriesLabel')}</div>${premiumMarkup}` : ''}
      `;
    }

    function selectMode(mode, options = {}) {
      const { skipLoadPlayers = false } = options;
      gameState.mode = mode;
      document.getElementById('mode-teams').classList.toggle('selected', mode === 'teams');
      document.getElementById('mode-ffa').classList.toggle('selected', mode === 'ffa');
      document.getElementById('step-teams').classList.toggle('hidden', mode !== 'teams');
      document.getElementById('step-ffa').classList.toggle('hidden', mode !== 'ffa');
      if (!skipLoadPlayers) loadPlayersForMode(mode);
      updateTeamLabels();
      renderSetupPlayers();
    }

    function selectDifficulty(diff) {
      gameState.difficulty = diff;
      DIFFICULTY_KEYS.forEach(d =>
        document.getElementById('diff-' + d).classList.toggle('selected', d === diff)
      );
      updateDiffWordCount();
    }

    // ============================================================
    // PLAYERS
    // ============================================================
    function renderSetupPlayers() {
      renderTeamPlayers();
      renderFFAPlayers();
    }

    function renderTeamPlayers() {
      ['A', 'B'].forEach(team => {
        const cont = document.getElementById('team-' + team.toLowerCase() + '-players');
        cont.innerHTML = '';
        (gameState.teams[team] || []).forEach((player, index) => {
          const color = team === 'A' ? 'var(--team1)' : 'var(--team2)';
          const el = document.createElement('div');
          el.className = 'player-row';
          el.innerHTML = `<div class="player-avatar" style="background:${color}22;color:${color}">${player[0].toUpperCase()}</div><div class="player-name">${player}</div><button class="btn btn-ghost btn-sm" data-action="remove-team-player" data-team="${team}" data-index="${index}">✕</button>`;
          cont.appendChild(el);
        });
      });
    }

    function addTeamPlayer(team) {
      const inp = document.getElementById('inp-team-' + team.toLowerCase());
      const name = inp.value.trim();
      if (!name) return;
      const total = (gameState.teams.A || []).length + (gameState.teams.B || []).length;
      if (total >= 6) {
        showNotif(t('notifications.maxPlayers'), 'var(--accent1)', 'var(--btn-danger-text)');
        return;
      }
      if ((gameState.teams[team] || []).length >= 3) {
        showNotif(t('notifications.maxTeamPlayers'), 'var(--accent1)', 'var(--btn-danger-text)');
        return;
      }
      if (!gameState.teams[team]) gameState.teams[team] = [];
      gameState.teams[team].push(name);
      inp.value = '';
      renderTeamPlayers();
      showNotif(t('dynamic.teamAdded', { name, teamName: gameState.teamNames[team] || getDefaultTeamName(team) }));
    }

    function removeTeamPlayer(team, idx) {
      gameState.teams[team].splice(idx, 1);
      renderTeamPlayers();
    }

    function renderFFAPlayers() {
      const cont = document.getElementById('ffa-players');
      cont.innerHTML = '';
      (gameState.players || []).forEach((player, index) => {
        const name = player.name || player;
        const el = document.createElement('div');
        el.className = 'player-row';
        el.innerHTML = `<div class="player-avatar" style="background:var(--player-avatar-bg);color:var(--player-avatar-text)">${name[0].toUpperCase()}</div><div class="player-name">${name}</div><button class="btn btn-ghost btn-sm" data-action="remove-ffa-player" data-index="${index}">✕</button>`;
        cont.appendChild(el);
      });
    }

    function addFFAPlayer() {
      const inp = document.getElementById('inp-ffa');
      const name = inp.value.trim();
      if (!name) return;
      if (!gameState.players) gameState.players = [];
      if (gameState.players.length >= 6) {
        showNotif(t('notifications.maxPlayers'), 'var(--accent1)', 'var(--btn-danger-text)');
        return;
      }
      gameState.players.push(name);
      inp.value = '';
      renderFFAPlayers();
      showNotif(t('dynamic.playerAdded', { name }));
    }

    function removeFFAPlayer(idx) {
      gameState.players.splice(idx, 1);
      renderFFAPlayers();
    }

    function normalizeQuickGameConfig(config) {
      const gameType = config?.gameType === 'drawing' ? 'drawing' : 'mime';
      const mode = config?.mode === 'teams' ? 'teams' : 'ffa';
      const difficulty = DIFFICULTY_KEYS.includes(config?.difficulty) ? config.difficulty : 'easy';
      const rounds = Math.min(5, Math.max(1, parseInt(config?.rounds, 10) || 3));
      const selectedCategories = normalizeSelectedCategories(
        Array.isArray(config?.selectedCategories) ? config.selectedCategories : []
      );
      const teams = {
        A: Array.isArray(config?.teams?.A) ? config.teams.A.map(name => String(name).trim()).filter(Boolean).slice(0, 3) : [],
        B: Array.isArray(config?.teams?.B) ? config.teams.B.map(name => String(name).trim()).filter(Boolean).slice(0, 3) : []
      };
      const players = Array.isArray(config?.players)
        ? config.players.map(name => String(name).trim()).filter(Boolean).slice(0, 6)
        : [];
      return {
        gameType,
        mode,
        difficulty,
        rounds,
        randomChallenge: gameType === 'mime' && Boolean(config?.randomChallenge),
        selectedCategories,
        teams,
        players,
        teamNames: {
          A: String(config?.teamNames?.A || getDefaultTeamName('A')).trim() || getDefaultTeamName('A'),
          B: String(config?.teamNames?.B || getDefaultTeamName('B')).trim() || getDefaultTeamName('B')
        }
      };
    }

    function buildQuickGameConfig() {
      return normalizeQuickGameConfig({
        gameType: gameState.gameType,
        mode: gameState.mode,
        difficulty: gameState.difficulty,
        rounds: parseInt(document.getElementById('rounds-slider').value, 10) || gameState.totalRounds || 3,
        randomChallenge: gameState.randomChallenge,
        selectedCategories: [...gameState.selectedCategories],
        teams: clone(gameState.teams),
        players: (gameState.players || []).map(player => player.name || player),
        teamNames: { ...gameState.teamNames }
      });
    }

    function saveQuickGameConfig(config = buildQuickGameConfig()) {
      localStorage.setItem(QUICK_GAME_KEY, JSON.stringify(normalizeQuickGameConfig(config)));
      renderQuickGameSummary();
    }

    function getFirstAccessQuickGameConfig() {
      return normalizeQuickGameConfig({
        gameType: 'mime',
        mode: 'ffa',
        difficulty: 'easy',
        rounds: 3,
        randomChallenge: false,
        selectedCategories: getDefaultSelectedCategories(),
        teams: { A: [], B: [] },
        players: [1, 2, 3, 4].map(number => getDefaultPlayerName(number)),
        teamNames: {
          A: getDefaultTeamName('A'),
          B: getDefaultTeamName('B')
        }
      });
    }

    function loadQuickGameConfig() {
      try {
        const saved = JSON.parse(localStorage.getItem(QUICK_GAME_KEY) || 'null');
        if (saved) return normalizeQuickGameConfig(saved);
      } catch (e) { }
      return getFirstAccessQuickGameConfig();
    }

    function applyQuickGameConfig(config) {
      const normalized = normalizeQuickGameConfig(config);
      selectGameType(normalized.gameType);
      selectMode(normalized.mode, { skipLoadPlayers: true });
      gameState.teams = clone(normalized.teams);
      gameState.players = normalized.mode === 'ffa' ? [...normalized.players] : [];
      gameState.teamNames = { ...normalized.teamNames };
      gameState.randomChallenge = normalized.randomChallenge;
      gameState.selectedCategories = [...normalized.selectedCategories];
      document.getElementById('random-challenge-toggle').checked = normalized.randomChallenge;
      document.getElementById('rounds-slider').value = String(normalized.rounds);
      document.getElementById('rounds-val').textContent = String(normalized.rounds);
      selectDifficulty(normalized.difficulty);
      updateTeamLabels();
      renderSetupPlayers();
      renderCategorySelection();
      refreshGameTypeUI();
    }

    function startQuickGame() {
      applyQuickGameConfig(loadQuickGameConfig());
      startGame();
    }

    // ============================================================
    // START GAME
    // ============================================================
    function startGame() {
      const rounds = parseInt(document.getElementById('rounds-slider').value, 10);
      gameState.totalRounds = rounds;
      gameState.timerDur = parseInt(document.getElementById('timer-slider').value, 10) || 60;
      if (gameState.gameType === 'drawing') {
        gameState.randomChallenge = false;
        const randomToggle = document.getElementById('random-challenge-toggle');
        if (randomToggle) randomToggle.checked = false;
      }
      refreshGameTypeUI();

      if (gameState.mode === 'teams') {
        const teamA = gameState.teams.A || [];
        const teamB = gameState.teams.B || [];
        if (teamA.length < 1 || teamB.length < 1) {
          showNotif(t('notifications.minTeamPlayers'), 'var(--accent1)', 'var(--btn-danger-text)');
          return;
        }
        gameState.players = [];
        const maxLen = Math.max(teamA.length, teamB.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < teamA.length) gameState.players.push({ name: teamA[i], team: 'A' });
          if (i < teamB.length) gameState.players.push({ name: teamB[i], team: 'B' });
        }
        gameState.scores = { teamA: 0, teamB: 0 };
        teamA.forEach(player => { gameState.scores[player] = 0; });
        teamB.forEach(player => { gameState.scores[player] = 0; });
      } else {
        if (!gameState.players || gameState.players.length < 3) {
          showNotif(t('notifications.minFfaPlayers'), 'var(--accent1)', 'var(--btn-danger-text)');
          return;
        }
        const players = [...gameState.players];
        gameState.players = players.map(player => ({ name: player.name || player, team: null }));
        gameState.scores = {};
        players.forEach(player => { gameState.scores[player.name || player] = 0; });
      }

      gameState.currentPlayerIdx = 0;
      gameState.currentRound = 1;
      gameState.usedWords = [];
      gameState.turnsDone = 0;
      gameState.totalTurns = gameState.players.length * rounds;
      gameState.leaderboardRecorded = false;
      saveQuickGameConfig();

      const key = gameState.mode === 'teams' ? 'mm_last_teams' : 'mm_last_ffa';
      const toSave = gameState.mode === 'teams'
        ? { teams: gameState.teams, teamNames: gameState.teamNames }
        : { players: gameState.players.map(player => player.name || player) };
      localStorage.setItem(key, JSON.stringify(toSave));

      initTurn();
      goTo('game');
    }

    // ============================================================
    // TURN
    // ============================================================
    function renderCurrentPlayerInfo() {
      const player = gameState.players[gameState.currentPlayerIdx];
      if (!player) return;
      document.getElementById('current-player-name').textContent = player.name || player;
      const badge = document.getElementById('current-team-badge');
      if (player.team) {
        const color = player.team === 'A' ? 'var(--team1)' : 'var(--team2)';
        const label = gameState.teamNames[player.team] || getDefaultTeamName(player.team);
        badge.innerHTML = `<span class="team-badge" style="background:${color}22;color:${color}">${label}</span>`;
      } else {
        badge.innerHTML = '';
      }
    }

    function updateScoreManagerButton() {
      const button = document.getElementById('score-manager-open-btn');
      if (!button) return;
      button.classList.toggle('hidden', !(gameState.players.length && gameState.phase === 'preparing'));
    }

    function refreshCurrentTurnCopy() {
      if (gameState.players.length) {
        document.getElementById('round-display').textContent = t('dynamic.roundDisplay', {
          current: gameState.currentRound,
          total: gameState.totalRounds
        });
        renderCurrentPlayerInfo();
      }
      if (gameState.currentWord) {
        document.getElementById('hint-text').textContent = getCategoryLabel(gameState.currentWord.cat, { singular: true, withIcon: true });
        document.getElementById('mem-word-display').textContent = gameState.currentWord.word;
        document.getElementById('word-display').textContent = gameState.currentWord.word;
      }
      document.getElementById('btn-toggle-word').textContent = gameState.wordVisible ? t('game.hideWord') : t('game.showWord');
      updateScoreManagerButton();
    }

    function initTurn() {
      gameState.phase = 'preparing';
      gameState.currentWord = null;
      gameState.currentChallenge = null;
      gameState.hintShown = false;
      gameState.wordVisible = false;
      gameState.timerLeft = gameState.timerDur;
      updateTimerDisplay(gameState.timerDur, gameState.timerDur);
      document.getElementById('round-display').textContent = t('dynamic.roundDisplay', {
        current: gameState.currentRound,
        total: gameState.totalRounds
      });
      renderCurrentPlayerInfo();
      document.getElementById('preparing-state').classList.remove('hidden');
      document.getElementById('memorize-state').classList.add('hidden');
      document.getElementById('playing-state').classList.add('hidden');
      document.getElementById('hint-banner').classList.add('hidden');
      document.getElementById('word-hidden-placeholder').classList.remove('hidden');
      document.getElementById('word-visible-content').classList.add('hidden');
      document.getElementById('btn-toggle-word').textContent = t('game.showWord');
      refreshGameTypeUI();
      syncDrawingBoardVisibility();
      renderScoreMini();
      updateScoreManagerButton();
      broadcastHostGameState();
    }

    // ============================================================
    // REVEAL + MEMORIZE
    // ============================================================
    function revealWord() {
      gameState.phase = 'memorizing';
      updateScoreManagerButton();
      gameState.currentWord = pickWord();
      document.getElementById('mem-word-display').textContent = gameState.currentWord.word;
      document.getElementById('hint-text').textContent = getCategoryLabel(gameState.currentWord.cat, { singular: true, withIcon: true });
      document.getElementById('hint-banner').classList.add('hidden');
      document.getElementById('word-display').textContent = gameState.currentWord.word;
      document.getElementById('word-hidden-placeholder').classList.remove('hidden');
      document.getElementById('word-visible-content').classList.add('hidden');
      document.getElementById('btn-toggle-word').textContent = t('game.showWord');
      gameState.wordVisible = false;

      const challengeEl = document.getElementById('mem-challenge-display');
      const challengeTextEl = document.getElementById('mem-challenge-text');
      if (gameState.currentChallenge) {
        challengeTextEl.textContent = gameState.currentChallenge;
        challengeEl.classList.remove('hidden');
      } else {
        challengeEl.classList.add('hidden');
      }

      document.getElementById('preparing-state').classList.add('hidden');
      document.getElementById('memorize-state').classList.remove('hidden');
      document.getElementById('playing-state').classList.add('hidden');
      broadcastHostGameState();

      let memLeft = 5;
      const mc = document.getElementById('memCircle');
      const mn = document.getElementById('mem-num');
      updateMemCircle(memLeft, 5, mc, mn, 213.6);
      playAlertBeep(600);
      clearInterval(gameState.memInterval);
      gameState.memInterval = setInterval(() => {
        memLeft--;
        updateMemCircle(memLeft, 5, mc, mn, 213.6);
        if (memLeft > 0) playAlertBeep(memLeft <= 2 ? 700 : 500);
        if (memLeft <= 0) {
          clearInterval(gameState.memInterval);
          challengeEl.classList.add('hidden');
          document.getElementById('memorize-state').classList.add('hidden');
          document.getElementById('playing-state').classList.remove('hidden');
          gameState.phase = 'playing';
          updateScoreManagerButton();
          syncDrawingBoardVisibility({ reset: true });
          broadcastHostGameState({ includeDrawingSnapshot: true });
          playAlertBeep(880);
          startTimer();
        }
      }, 1000);
    }

    function updateMemCircle(left, total, circ, numEl, circumference) {
      numEl.textContent = left;
      circ.style.strokeDashoffset = circumference - (left / total) * circumference;
    }

    function toggleWordVisibility() {
      const placeholder = document.getElementById('word-hidden-placeholder');
      const visibleContent = document.getElementById('word-visible-content');
      const button = document.getElementById('btn-toggle-word');
      gameState.wordVisible = !gameState.wordVisible;
      if (gameState.wordVisible) {
        placeholder.classList.add('hidden');
        visibleContent.classList.remove('hidden');
        button.textContent = t('game.hideWord');
        const challengeEl = document.getElementById('game-challenge-display');
        const challengeTextEl = document.getElementById('game-challenge-text');
        if (gameState.currentChallenge) {
          challengeTextEl.textContent = gameState.currentChallenge;
          challengeEl.classList.remove('hidden');
        } else {
          challengeEl.classList.add('hidden');
        }
      } else {
        placeholder.classList.remove('hidden');
        visibleContent.classList.add('hidden');
        button.textContent = t('game.showWord');
      }
    }

    // ============================================================
    // PICK WORD / CHALLENGES
    // ============================================================
    function pickWord() {
      const shuffle = document.getElementById('toggle-shuffle').checked;
      const allWords = [];

      gameState.selectedCategories = normalizeSelectedCategories(gameState.selectedCategories);
      gameState.selectedCategories.forEach(category => {
        const premiumPack = getPremiumPackByToken(category);
        const words = premiumPack
          ? getPremiumWordsForPack(premiumPack, gameState.difficulty)
          : getCoreWordsForCategory(category, gameState.difficulty);
        words.forEach(word => {
          allWords.push({ word, cat: category });
        });
      });

      let available = allWords.filter(item => !gameState.usedWords.includes(item.word));
      if (available.length === 0) {
        gameState.usedWords = [];
        available = allWords;
      }
      if (available.length === 0) return { word: '???', cat: 'objects' };

      const picked = shuffle
        ? available[Math.floor(Math.random() * available.length)]
        : available[0];
      gameState.usedWords.push(picked.word);

      gameState.currentChallenge = null;
      if (gameState.gameType === 'mime' && gameState.randomChallenge) {
        const challenges = getLocalizedChallenges();
        if (challenges.length) {
          gameState.currentChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        }
      }

      return picked;
    }

    // ============================================================
    // TIMER / SOUND
    // ============================================================
    function startTimer() {
      const dur = gameState.timerDur;
      gameState.timerLeft = dur;
      gameState.hintShown = false;
      updateTimerDisplay(dur, dur);
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = setInterval(() => {
        gameState.timerLeft--;
        updateTimerDisplay(gameState.timerLeft, dur);
        const elapsed = dur - gameState.timerLeft;
        if (!gameState.hintShown && elapsed >= Math.floor(dur * 0.75)) {
          gameState.hintShown = true;
          const hint = document.getElementById('hint-banner');
          hint.classList.remove('hidden');
          hint.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 400, fill: 'forwards' });
          playAlertBeep(523);
        }
        if (gameState.timerLeft <= 10 && gameState.timerLeft > 0) {
          playAlertBeep(gameState.timerLeft <= 3 ? 880 : 440);
        }
        if (gameState.timerLeft <= 0) {
          clearInterval(gameState.timerInterval);
          markResult(false, true);
        }
      }, 1000);
    }

    function updateTimerDisplay(left, total) {
      const strokeOffset = 427.3 - (left / total) * 427.3;
      const strokeColor = left > total * 0.5
        ? getThemeVar('--timer-color-safe')
        : left > total * 0.25
          ? getThemeVar('--timer-color-warning')
          : getThemeVar('--timer-color-danger');
      document.querySelectorAll('[data-timer-num]').forEach(el => {
        el.textContent = left;
      });
      document.querySelectorAll('[data-timer-circle]').forEach(circ => {
        circ.style.strokeDashoffset = strokeOffset;
        circ.style.stroke = strokeColor;
      });
      if (multiDeviceState.role === 'host' && gameState.players.length) {
        broadcastHostGameState();
      }
    }

    function updateTimerLabel(val) {
      document.getElementById('timer-val').textContent = `${val}s`;
      gameState.timerDur = parseInt(val, 10);
    }

    // ============================================================
    // DRAWING CANVAS
    // ============================================================
    function getDrawingPoint(event) {
      const rect = drawingState.canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    function resizeDrawingCanvas(options = {}) {
      const { preserve = true } = options;
      const canvas = drawingState.canvas || document.getElementById('drawing-canvas');
      if (!canvas) return;
      drawingState.canvas = canvas;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const previous = preserve && canvas.width && canvas.height ? document.createElement('canvas') : null;
      if (previous) {
        previous.width = canvas.width;
        previous.height = canvas.height;
        previous.getContext('2d').drawImage(canvas, 0, 0);
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = canvas.getContext('2d');
      drawingState.ctx = ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (previous) {
        ctx.drawImage(previous, 0, 0, previous.width, previous.height, 0, 0, rect.width, rect.height);
      }
    }

    function clearDrawingCanvas() {
      resizeDrawingCanvas({ preserve: false });
      broadcastDrawingClear();
    }

    function selectDrawingTool(tool) {
      if (!DRAWING_TOOL_CONFIG[tool]) return;
      drawingState.activeTool = tool;
      document.querySelectorAll('[data-tool]').forEach(button => {
        button.classList.toggle('selected', button.dataset.tool === tool);
      });
    }

    function strokeDrawingLine(from, to) {
      if (!drawingState.ctx) resizeDrawingCanvas();
      const ctx = drawingState.ctx;
      const tool = DRAWING_TOOL_CONFIG[drawingState.activeTool] || DRAWING_TOOL_CONFIG['pen-thick'];
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = tool.color;
      ctx.lineWidth = tool.width;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
      broadcastDrawingStroke(from, to, drawingState.activeTool);
    }

    function startDrawing(event) {
      if (gameState.gameType !== 'drawing' || gameState.phase !== 'playing') return;
      event.preventDefault();
      resizeDrawingCanvas();
      drawingState.isDrawing = true;
      const point = getDrawingPoint(event);
      drawingState.lastX = point.x;
      drawingState.lastY = point.y;
      strokeDrawingLine(point, { x: point.x + 0.01, y: point.y + 0.01 });
      try {
        drawingState.canvas.setPointerCapture?.(event.pointerId);
      } catch (e) { }
    }

    function continueDrawing(event) {
      if (!drawingState.isDrawing) return;
      event.preventDefault();
      const point = getDrawingPoint(event);
      strokeDrawingLine({ x: drawingState.lastX, y: drawingState.lastY }, point);
      drawingState.lastX = point.x;
      drawingState.lastY = point.y;
    }

    function stopDrawing(event) {
      if (!drawingState.isDrawing) return;
      drawingState.isDrawing = false;
      try {
        drawingState.canvas.releasePointerCapture?.(event.pointerId);
      } catch (e) { }
    }

    function initializeDrawingCanvas() {
      const canvas = document.getElementById('drawing-canvas');
      if (!canvas) return;
      drawingState.canvas = canvas;
      canvas.addEventListener('pointerdown', startDrawing);
      canvas.addEventListener('pointermove', continueDrawing);
      canvas.addEventListener('pointerup', stopDrawing);
      canvas.addEventListener('pointercancel', stopDrawing);
      canvas.addEventListener('pointerleave', stopDrawing);
      window.addEventListener('resize', () => resizeDrawingCanvas());
      selectDrawingTool('pen-thick');
    }

    function isAlertSoundEnabled() {
      const toggle = document.getElementById('toggle-sound');
      return toggle ? toggle.checked : true;
    }

    function playBeep(freq = 440) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (e) { }
    }

    function playAlertBeep(freq = 440) {
      if (!isAlertSoundEnabled()) return;
      playBeep(freq);
    }

    function isNavigationSoundEnabled() {
      const toggle = document.getElementById('toggle-navigation-sound');
      return toggle ? toggle.checked : true;
    }

    function playClickSound() {
      playBeep(800);
    }

    function playNavigationSound() {
      if (!isNavigationSoundEnabled()) return;
      playClickSound();
    }

    function playCorrectSound() {
      if (!isNavigationSoundEnabled()) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) { }
    }

    function playWrongSound() {
      if (!isNavigationSoundEnabled()) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(300, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (e) { }
    }

    function animateButtonClick(button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 100);
    }

    function animateWrongButton(button) {
      button.style.transform = 'translateX(-5px)';
      setTimeout(() => { button.style.transform = 'translateX(5px)'; }, 50);
      setTimeout(() => { button.style.transform = 'translateX(-5px)'; }, 100);
      setTimeout(() => { button.style.transform = 'translateX(5px)'; }, 150);
      setTimeout(() => { button.style.transform = ''; }, 200);
    }

    // ============================================================
    // RESULT
    // ============================================================
    function resetResultGuesserPicker() {
      resultAwardState = null;
      const picker = document.getElementById('resultGuesserPicker');
      const select = document.getElementById('result-guesser-select');
      const help = document.getElementById('resultGuesserHelp');
      const nextButton = document.getElementById('result-next-turn-btn');
      picker?.classList.add('hidden');
      if (select) select.innerHTML = '';
      if (help) help.textContent = '';
      if (nextButton) nextButton.disabled = false;
    }

    function getFfaGuesserCandidates(actorName) {
      return gameState.players
        .map(player => player.name || player)
        .filter(name => name && name !== actorName);
    }

    function renderResultGuesserPicker(actorName, actorPoints) {
      const guesserPoints = getConfiguredFfaGuesserPoints();
      if (gameState.mode !== 'ffa' || !isFfaGuesserPointsEnabled() || guesserPoints <= 0) return;
      const candidates = getFfaGuesserCandidates(actorName);
      if (!candidates.length) return;

      resultAwardState = {
        actorName,
        actorPoints,
        guesserPoints,
        selectedName: '',
        requiresGuesser: true
      };

      const picker = document.getElementById('resultGuesserPicker');
      const select = document.getElementById('result-guesser-select');
      const help = document.getElementById('resultGuesserHelp');
      const nextButton = document.getElementById('result-next-turn-btn');
      if (!picker || !select || !help) return;

      select.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = t('result.guesserPlaceholder');
      select.appendChild(placeholder);
      candidates.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      });
      help.textContent = t('dynamic.chooseGuesserPoints', { points: guesserPoints });
      picker.classList.remove('hidden');
      if (nextButton) nextButton.disabled = true;
    }

    function applyResultGuesserSelection(nextName) {
      if (!resultAwardState) return;
      const { selectedName, guesserPoints, actorName, actorPoints } = resultAwardState;
      if (selectedName === nextName) return;
      if (selectedName) addScore(selectedName, -guesserPoints);
      if (nextName) addScore(nextName, guesserPoints);
      resultAwardState.selectedName = nextName;

      const sub = document.getElementById('resultSub');
      const help = document.getElementById('resultGuesserHelp');
      const nextButton = document.getElementById('result-next-turn-btn');
      if (nextName) {
        sub.textContent = t('dynamic.correctWithGuesserPoints', {
          actorName,
          actorPoints,
          guesserName: nextName,
          guesserPoints
        });
        if (help) help.textContent = t('dynamic.guesserPoints', { playerName: nextName, points: guesserPoints });
        if (nextButton) nextButton.disabled = false;
      } else {
        sub.textContent = t('dynamic.correctPlayerPoints', { playerName: actorName, points: actorPoints });
        if (help) help.textContent = t('dynamic.chooseGuesserPoints', { points: guesserPoints });
        if (nextButton) nextButton.disabled = true;
      }
      renderScoreMini();
      broadcastHostGameState();
    }

    function markResult(correct, timeUp = false) {
      clearInterval(gameState.timerInterval);
      clearInterval(gameState.memInterval);
      document.getElementById('memorize-state').classList.add('hidden');
      resetResultGuesserPicker();
      const player = gameState.players[gameState.currentPlayerIdx];
      const playerName = player.name || player;
      const emoji = document.getElementById('resultEmoji');
      const title = document.getElementById('resultTitle');
      const sub = document.getElementById('resultSub');
      const correctPoints = getConfiguredCorrectPoints();
      const wrongPenaltyPoints = getConfiguredWrongPenaltyPoints();

      if (correct) {
        if (gameState.mode === 'teams') {
          addScore('team' + player.team, correctPoints);
          addScore(playerName, correctPoints);
        } else {
          addScore(playerName, correctPoints);
        }

        emoji.textContent = '🎉';
        title.textContent = t('result.correctTitle');
        title.style.color = 'var(--accent3)';
        sub.textContent = gameState.mode === 'teams'
          ? t('dynamic.correctTeamPoints', { teamName: gameState.teamNames[player.team] || getDefaultTeamName(player.team), points: correctPoints })
          : t('dynamic.correctPlayerPoints', { playerName, points: correctPoints });
        renderResultGuesserPicker(playerName, correctPoints);
        launchConfetti();
      } else {
        if (wrongPenaltyPoints > 0) {
          if (gameState.mode === 'teams') {
            addScore('team' + player.team, -wrongPenaltyPoints);
            addScore(playerName, -wrongPenaltyPoints);
          } else {
            addScore(playerName, -wrongPenaltyPoints);
          }
          sub.textContent = timeUp
            ? t('dynamic.timeUpPenalty', { playerName, points: wrongPenaltyPoints })
            : t('dynamic.penaltyApplied', { playerName, points: wrongPenaltyPoints });
        } else {
          sub.textContent = timeUp ? t('dynamic.timeUpNoPoints') : t('dynamic.skippedNoPoints');
        }
        emoji.textContent = timeUp ? '⏰' : '😅';
        title.textContent = timeUp ? t('result.timeUpTitle') : t('result.wrongTitle');
        title.style.color = 'var(--accent1)';
      }

      gameState.phase = 'score';
      updateScoreManagerButton();
      syncDrawingBoardVisibility();
      renderScoreMini();
      broadcastHostGameState();
      document.getElementById('resultOverlay').classList.add('show');
    }

    function nextTurn() {
      if (resultAwardState?.requiresGuesser && !resultAwardState.selectedName) {
        showNotif(t('dynamic.chooseGuesserPoints', { points: resultAwardState.guesserPoints }), 'var(--accent2)', 'var(--text)');
        return;
      }
      document.getElementById('resultOverlay').classList.remove('show');
      resetResultGuesserPicker();
      gameState.turnsDone++;
      if (gameState.turnsDone >= gameState.totalTurns) {
        showFinalScore();
        return;
      }
      gameState.currentPlayerIdx = (gameState.currentPlayerIdx + 1) % gameState.players.length;
      if (gameState.currentPlayerIdx === 0) {
        gameState.currentRound++;
        showMidScore();
      } else {
        initTurn();
      }
    }

    // ============================================================
    // SCOREBOARDS
    // ============================================================
    function renderScoreMini() {
      const cont = document.getElementById('score-mini');
      if (!cont) return;
      cont.innerHTML = '';
      if (!gameState.players.length) return;
      if (gameState.mode === 'teams') {
        ['A', 'B'].forEach(team => {
          const color = team === 'A' ? 'var(--team1)' : 'var(--team2)';
          const el = document.createElement('div');
          el.style.cssText = `background:${color}22;border:1px solid ${color}44;border-radius:12px;padding:8px 14px;display:flex;align-items:center;gap:8px;white-space:nowrap`;
          const label = gameState.teamNames[team] || getDefaultTeamName(team);
          el.innerHTML = `<span style="font-weight:800;color:${color}">${label}</span><span style="font-family:var(--font-display);font-size:1.2rem;color:${color}">${gameState.scores['team' + team] || 0}</span>`;
          cont.appendChild(el);
        });
      } else {
        gameState.players.forEach(player => {
          const name = player.name || player;
          const el = document.createElement('div');
          el.style.cssText = 'background:var(--surface-bg);border:1px solid var(--surface-border);border-radius:12px;padding:8px 14px;display:flex;align-items:center;gap:8px;white-space:nowrap';
          el.innerHTML = `<span style="font-weight:800;font-size:0.85rem">${name}</span><span style="font-family:var(--font-display);font-size:1.2rem;color:var(--accent2)">${gameState.scores[name] || 0}</span>`;
          cont.appendChild(el);
        });
      }
    }

    function renderFullScoreboard(isFinal = false) {
      const cont = document.getElementById(isFinal ? 'final-scoreboard' : 'scoreboard-list');
      cont.innerHTML = '';
      let entries = [];
      if (gameState.mode === 'teams') {
        entries = [
          { name: `🔴 ${gameState.teamNames.A || getDefaultTeamName('A')}`, pts: gameState.scores.teamA || 0, team: 'A' },
          { name: `🔵 ${gameState.teamNames.B || getDefaultTeamName('B')}`, pts: gameState.scores.teamB || 0, team: 'B' }
        ];
      } else {
        entries = gameState.players.map(player => ({
          name: player.name || player,
          pts: gameState.scores[player.name || player] || 0
        }));
      }
      entries.sort((a, b) => b.pts - a.pts);
      const ranks = ['🥇', '🥈', '🥉'];
      entries.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'score-row' + (index === 0 ? ' first' : index === 1 ? ' second' : index === 2 ? ' third' : '');
        const color = entry.team === 'A' ? 'var(--team1)' : entry.team === 'B' ? 'var(--team2)' : '';
        div.innerHTML = `<div class="rank-badge">${ranks[index] || (index + 1)}</div><div class="score-name" style="flex:1;${color ? 'color:' + color : ''}">${entry.name}</div><div class="score-pts">${entry.pts} <span style="font-size:0.8rem;color:var(--text3)">${t('common.pointsShort')}</span></div>`;
        cont.appendChild(div);
      });
    }

    function getLeaderboardPlayerKey(name) {
      const normalized = String(name || '').trim().toLocaleLowerCase();
      return normalized ? `player:${normalized}` : '';
    }

    function createEmptyLeaderboardModes() {
      return LEADERBOARD_MODE_KEYS.reduce((modes, key) => {
        modes[key] = { points: 0, matches: 0 };
        return modes;
      }, {});
    }

    function normalizeLeaderboardModes(modes = {}) {
      const normalized = createEmptyLeaderboardModes();
      LEADERBOARD_MODE_KEYS.forEach(key => {
        const mode = modes[key] || {};
        normalized[key] = {
          points: Number.parseInt(mode.points, 10) || 0,
          matches: Number.parseInt(mode.matches, 10) || 0
        };
      });
      return normalized;
    }

    function normalizeLeaderboardModel(model = {}) {
      const normalized = { version: 1, matches: 0, players: {} };
      const sourcePlayers = model && typeof model === 'object' ? (model.players || {}) : {};
      Object.keys(sourcePlayers).forEach(sourceKey => {
        const player = sourcePlayers[sourceKey] || {};
        const displayName = String(player.name || sourceKey.replace(/^player:/, '')).trim();
        const playerKey = getLeaderboardPlayerKey(displayName);
        if (!playerKey) return;
        normalized.players[playerKey] = {
          name: displayName,
          totalPoints: Number.parseInt(player.totalPoints, 10) || 0,
          matches: Number.parseInt(player.matches, 10) || 0,
          modes: normalizeLeaderboardModes(player.modes)
        };
      });
      const savedMatches = Number.parseInt(model?.matches, 10);
      normalized.matches = Number.isFinite(savedMatches)
        ? savedMatches
        : Object.values(normalized.players).reduce((max, player) => Math.max(max, player.matches), 0);
      return normalized;
    }

    function loadLeaderboard() {
      try {
        return normalizeLeaderboardModel(JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '{}'));
      } catch (e) {
        return normalizeLeaderboardModel();
      }
    }

    function saveLeaderboard(model) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(normalizeLeaderboardModel(model)));
    }

    function getLeaderboardModeKey(gameType = gameState.gameType, mode = gameState.mode) {
      const typeKey = gameType === 'drawing' ? 'drawing' : 'mime';
      return `${typeKey}${mode === 'teams' ? 'Teams' : 'Ffa'}`;
    }

    function getOrCreateLeaderboardPlayer(model, name) {
      const playerKey = getLeaderboardPlayerKey(name);
      if (!playerKey) return null;
      if (!model.players[playerKey]) {
        model.players[playerKey] = {
          name: String(name || '').trim(),
          totalPoints: 0,
          matches: 0,
          modes: createEmptyLeaderboardModes()
        };
      }
      return model.players[playerKey];
    }

    function collectFinalLeaderboardEntries() {
      const entriesByName = new Map();
      const addEntry = (name, points) => {
        const playerKey = getLeaderboardPlayerKey(name);
        if (!playerKey) return;
        const entry = { name: String(name || '').trim(), points: Number.parseInt(points, 10) || 0 };
        const current = entriesByName.get(playerKey);
        if (!current || entry.points > current.points) entriesByName.set(playerKey, entry);
      };

      if (gameState.mode === 'teams') {
        gameState.players.forEach(player => {
          const team = player.team;
          if (!team) return;
          addEntry(player.name || player, gameState.scores['team' + team] || 0);
        });
      } else {
        gameState.players.forEach(player => {
          const name = player.name || player;
          addEntry(name, gameState.scores[name] || 0);
        });
      }

      return Array.from(entriesByName.values());
    }

    function recordLeaderboardFinalScore() {
      if (gameState.leaderboardRecorded) return;
      const modeKey = getLeaderboardModeKey();
      const leaderboard = loadLeaderboard();
      const entries = collectFinalLeaderboardEntries();
      if (entries.length) leaderboard.matches = (Number.parseInt(leaderboard.matches, 10) || 0) + 1;
      entries.forEach(entry => {
        const player = getOrCreateLeaderboardPlayer(leaderboard, entry.name);
        if (!player) return;
        player.totalPoints += entry.points;
        player.matches += 1;
        player.modes = normalizeLeaderboardModes(player.modes);
        player.modes[modeKey].points += entry.points;
        player.modes[modeKey].matches += 1;
      });
      saveLeaderboard(leaderboard);
      gameState.leaderboardRecorded = true;
    }

    function getLeaderboardModeType(modeKey) {
      return modeKey.startsWith('drawing') ? 'drawing' : 'mime';
    }

    function getLeaderboardModePlayStyle(modeKey) {
      return modeKey.endsWith('Teams') ? 'teams' : 'ffa';
    }

    function getLeaderboardScopedModeKeys(filters = leaderboardFilters) {
      return LEADERBOARD_MODE_KEYS.filter(modeKey => {
        const typeMatches = filters.type === 'all' || getLeaderboardModeType(modeKey) === filters.type;
        const modeMatches = filters.mode === 'all' || getLeaderboardModePlayStyle(modeKey) === filters.mode;
        return typeMatches && modeMatches;
      });
    }

    function getLeaderboardScopedStats(player, filters = leaderboardFilters) {
      if (filters.type === 'all' && filters.mode === 'all') {
        return {
          points: Number.parseInt(player.totalPoints, 10) || 0,
          matches: Number.parseInt(player.matches, 10) || 0
        };
      }

      return getLeaderboardScopedModeKeys(filters).reduce((acc, modeKey) => {
        const mode = player.modes?.[modeKey] || {};
        acc.points += Number.parseInt(mode.points, 10) || 0;
        acc.matches += Number.parseInt(mode.matches, 10) || 0;
        return acc;
      }, { points: 0, matches: 0 });
    }

    function formatLeaderboardNumber(value) {
      const locale = LANGUAGE_HTML_MAP[currentLanguage] || LANGUAGE_HTML_MAP[DEFAULT_LANGUAGE] || currentLanguage;
      return new Intl.NumberFormat(locale).format(Number.parseInt(value, 10) || 0);
    }

    function getLeaderboardBestModeKey(player, filters = leaderboardFilters) {
      const bestMode = getLeaderboardScopedModeKeys(filters)
        .map(modeKey => ({ modeKey, points: player.modes?.[modeKey]?.points || 0, matches: player.modes?.[modeKey]?.matches || 0 }))
        .sort((a, b) => (b.points - a.points) || (b.matches - a.matches))[0];
      return bestMode && (bestMode.points > 0 || bestMode.matches > 0) ? bestMode.modeKey : null;
    }

    function getLeaderboardPlayerTitle(player, filters = leaderboardFilters) {
      const bestModeKey = getLeaderboardBestModeKey(player, filters);
      if (bestModeKey) return t(`leaderboard.mode.${bestModeKey}`);
      return t('leaderboard.playerFallbackTitle');
    }

    function compareLeaderboardPlayers() {
      return (a, b) => {
        const byName = () => a.name.localeCompare(b.name, currentLanguage, { sensitivity: 'base' });
        return (b.scoped.points - a.scoped.points) || (b.scoped.matches - a.scoped.matches) || byName();
      };
    }

    function syncLeaderboardFilterUI() {
      document.querySelectorAll('[data-leaderboard-filter]').forEach(button => {
        const selected = leaderboardFilters[button.dataset.leaderboardFilter] === button.dataset.leaderboardValue;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });

      document.querySelectorAll('[data-leaderboard-tab]').forEach(button => {
        const selected = leaderboardFilters.type === button.dataset.leaderboardTab;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }

    function renderLeaderboard() {
      const container = document.getElementById('leaderboard-list');
      if (!container) return;
      const leaderboard = loadLeaderboard();
      const allPlayers = Object.values(leaderboard.players)
        .map(player => {
          const normalizedPlayer = { ...player, modes: normalizeLeaderboardModes(player.modes) };
          return { ...normalizedPlayer, scoped: getLeaderboardScopedStats(normalizedPlayer) };
        });
      const isOverallScope = leaderboardFilters.type === 'all' && leaderboardFilters.mode === 'all';
      const players = allPlayers
        .filter(player => isOverallScope || player.scoped.points > 0 || player.scoped.matches > 0)
        .sort(compareLeaderboardPlayers());
      const visiblePlayers = players.slice(0, LEADERBOARD_PAGE_SIZE);
      const totalMatches = Number.parseInt(leaderboard.matches, 10) || 0;
      const summary = document.getElementById('leaderboard-summary');
      if (summary) {
        summary.textContent = t('dynamic.leaderboardSummary', { players: players.length, matches: totalMatches });
      }
      syncLeaderboardFilterUI();

      container.innerHTML = '';
      if (!players.length) {
        const empty = document.createElement('div');
        empty.className = 'leaderboard-empty';
        empty.textContent = t('leaderboard.emptyState');
        container.appendChild(empty);
        const footer = document.getElementById('leaderboard-footer');
        if (footer) footer.textContent = '';
        return;
      }

      visiblePlayers.forEach((player, index) => {
        const row = document.createElement('div');
        const podiumClass = index === 0 ? ' rank-first' : index === 1 ? ' rank-second' : index === 2 ? ' rank-third' : '';
        row.className = `leaderboard-row${index < 3 ? ' is-podium' : ''}${podiumClass}`;

        const rank = document.createElement('div');
        rank.className = 'leaderboard-rank';
        const rankNumber = document.createElement('span');
        rankNumber.textContent = String(index + 1);
        rank.appendChild(rankNumber);

        const avatarFrame = document.createElement('div');
        avatarFrame.className = 'leaderboard-avatar-frame';
        const avatar = document.createElement('img');
        avatar.className = 'leaderboard-avatar';
        avatar.src = LEADERBOARD_DEFAULT_AVATAR;
        avatar.alt = '';
        avatar.loading = 'lazy';
        avatarFrame.appendChild(avatar);

        const identity = document.createElement('div');
        identity.className = 'leaderboard-identity';
        const name = document.createElement('div');
        name.className = 'leaderboard-player-name';
        name.textContent = player.name;
        const title = document.createElement('div');
        title.className = 'leaderboard-player-title';
        title.textContent = getLeaderboardPlayerTitle(player);
        const matches = document.createElement('div');
        matches.className = 'leaderboard-player-meta';
        matches.textContent = `${formatLeaderboardNumber(player.scoped.matches)} ${t('leaderboard.matchesLabel')}`;
        identity.append(name, title, matches);

        const score = document.createElement('div');
        score.className = 'leaderboard-score';
        const scoreStar = document.createElement('span');
        scoreStar.className = 'leaderboard-score-star';
        scoreStar.textContent = '★';
        const scoreCopy = document.createElement('span');
        const points = document.createElement('span');
        points.className = 'leaderboard-score-value';
        points.textContent = formatLeaderboardNumber(player.scoped.points);
        const pointsLabel = document.createElement('span');
        pointsLabel.className = 'leaderboard-score-label';
        pointsLabel.textContent = ` ${t('leaderboard.pointsLabel')}`;
        scoreCopy.append(points, pointsLabel);
        score.append(scoreStar, scoreCopy);

        row.append(rank, avatarFrame, identity, score);
        container.appendChild(row);
      });

      const footer = document.getElementById('leaderboard-footer');
      if (footer) {
        footer.textContent = t('dynamic.leaderboardFooter', {
          shown: visiblePlayers.length,
          total: players.length
        });
      }
    }

    function resetLeaderboard() {
      if (!confirm(t('confirmations.resetLeaderboard'))) return;
      localStorage.removeItem(LEADERBOARD_KEY);
      renderLeaderboard();
      showNotif(t('notifications.leaderboardReset'));
    }

    function getScoreManagerEntries() {
      if (gameState.mode === 'teams') {
        return [
          { key: 'teamA', name: `🔴 ${gameState.teamNames.A || getDefaultTeamName('A')}`, team: 'A' },
          { key: 'teamB', name: `🔵 ${gameState.teamNames.B || getDefaultTeamName('B')}`, team: 'B' }
        ];
      }
      return gameState.players.map(player => {
        const name = player.name || player;
        return { key: name, name };
      });
    }

    function renderScoreManager() {
      const container = document.getElementById('score-manager-list');
      if (!container) return;
      container.innerHTML = '';
      const currentPlayer = gameState.players[gameState.currentPlayerIdx];
      const currentName = currentPlayer ? (currentPlayer.name || currentPlayer) : '--';
      const context = document.getElementById('score-manager-context');
      if (context) {
        context.textContent = t('dynamic.scoreManagerContext', {
          round: gameState.currentRound,
          total: gameState.totalRounds,
          playerName: currentName
        });
      }

      getScoreManagerEntries().forEach(entry => {
        const row = document.createElement('div');
        row.className = 'score-row score-row-edit';
        const color = entry.team === 'A' ? 'var(--team1)' : entry.team === 'B' ? 'var(--team2)' : '';
        const name = document.createElement('div');
        name.className = 'score-name';
        name.textContent = entry.name;
        if (color) name.style.color = color;
        const controls = document.createElement('div');
        controls.className = 'score-manager-controls';
        const decrement = document.createElement('button');
        decrement.className = 'btn btn-ghost btn-sm';
        decrement.dataset.action = 'adjust-score-manager';
        decrement.dataset.scoreKey = entry.key;
        decrement.dataset.scoreDelta = '-1';
        decrement.textContent = '−';
        const input = document.createElement('input');
        input.className = 'inp score-manager-input';
        input.type = 'number';
        input.step = '1';
        input.value = String(gameState.scores[entry.key] || 0);
        input.dataset.scoreManagerInput = entry.key;
        const increment = document.createElement('button');
        increment.className = 'btn btn-ghost btn-sm';
        increment.dataset.action = 'adjust-score-manager';
        increment.dataset.scoreKey = entry.key;
        increment.dataset.scoreDelta = '1';
        increment.textContent = '+';
        controls.append(decrement, input, increment);
        row.append(name, controls);
        container.appendChild(row);
      });
    }

    function openScoreManager() {
      if (gameState.phase !== 'preparing' || !gameState.players.length) return;
      renderScoreManager();
      goTo('score-manager');
    }

    function closeScoreManager() {
      goTo('game');
      updateScoreManagerButton();
    }

    function resetScoreManagerInputs() {
      renderScoreManager();
    }

    function adjustScoreManagerInput(scoreKey, delta) {
      const input = Array.from(document.querySelectorAll('[data-score-manager-input]'))
        .find(item => item.dataset.scoreManagerInput === scoreKey);
      if (!input) return;
      input.value = String((Number.parseInt(input.value, 10) || 0) + delta);
    }

    function saveScoreManager() {
      document.querySelectorAll('[data-score-manager-input]').forEach(input => {
        const key = input.dataset.scoreManagerInput;
        gameState.scores[key] = Number.parseInt(input.value, 10) || 0;
      });
      renderScoreMini();
      broadcastHostGameState();
      closeScoreManager();
    }

    function refreshScoreScreenCopy() {
      if (!gameState.players.length || !document.getElementById('screen-score').classList.contains('active')) return;
      const roundDone = gameState.currentRound - 1;
      const remaining = gameState.totalRounds - roundDone;
      document.getElementById('score-subtitle').textContent = t('dynamic.roundSummary', { roundDone, remaining });
      document.getElementById('next-round-info').textContent = t('dynamic.roundDisplay', {
        current: gameState.currentRound,
        total: gameState.totalRounds
      });
      renderFullScoreboard(false);
    }

    function showMidScore() {
      gameState.phase = 'score';
      broadcastHostGameState();
      goTo('score');
      renderFullScoreboard(false);
      refreshScoreScreenCopy();
    }

    function continueGame() {
      goTo('game');
      initTurn();
    }

    function getFinalWinnerData() {
      if (gameState.mode === 'teams') {
        const a = gameState.scores.teamA || 0;
        const b = gameState.scores.teamB || 0;
        if (a > b) return { winner: `🔴 ${gameState.teamNames.A || getDefaultTeamName('A')}`, tie: false };
        if (b > a) return { winner: `🔵 ${gameState.teamNames.B || getDefaultTeamName('B')}`, tie: false };
        return { winner: t('final.tie'), tie: true };
      }
      const sorted = gameState.players
        .map(player => ({ name: player.name || player, pts: gameState.scores[player.name || player] || 0 }))
        .sort((a, b) => b.pts - a.pts);
      if (!sorted.length) return { winner: '--', tie: false };
      const isTie = sorted.length > 1 && sorted[0].pts === sorted[1].pts;
      return { winner: isTie ? t('final.tie') : sorted[0].name, tie: isTie };
    }

    function refreshFinalScreenCopy() {
      if (!gameState.players.length || !document.getElementById('screen-final').classList.contains('active')) return;
      const { winner, tie } = getFinalWinnerData();
      document.getElementById('final-trophy').textContent = tie ? '🤝' : '🏆';
      document.getElementById('final-winner').textContent = winner;
      renderFullScoreboard(true);
    }

    function showFinalScore() {
      gameState.phase = 'final';
      recordLeaderboardFinalScore();
      broadcastHostGameState();
      goTo('final');
      renderFullScoreboard(true);
      refreshFinalScreenCopy();
      launchConfetti(80);
    }

    // ============================================================
    // WORD BANK
    // ============================================================
    function selectPackFile() {
      const input = document.getElementById('pack-file-input');
      if (!input) return;
      input.value = '';
      input.click();
    }

    async function installWordPackFile(file) {
      setPackInstallStatus(t('notifications.packInstallReading'));
      const envelope = await parsePackFile(file);
      const pack = await buildInstalledPackFromEnvelope(envelope);
      const existingIndex = contentModel.packs.findIndex(item => item.id === pack.id);

      if (existingIndex >= 0) {
        const existingPack = contentModel.packs[existingIndex];
        if (existingPack.id === CORE_PACK_ID) throw new Error(t('packErrors.reservedPackId'));
        const shouldReplace = confirm(t('confirmations.replacePack', { packName: getPackDisplayName(existingPack) }));
        if (!shouldReplace) {
          setPackInstallStatus(t('notifications.packInstallCancelled'));
          return null;
        }
        contentModel.packs[existingIndex] = pack;
      } else {
        contentModel.packs.push(pack);
      }

      saveContentModel();
      wbPreviewPackId = pack.id;
      gameState.selectedCategories = normalizeSelectedCategories(gameState.selectedCategories);
      renderInstalledPacks();
      renderWordBank();
      renderPackPreview();
      renderCategorySelection();
      updateDiffWordCount();
      setPackInstallStatus(t('notifications.packInstallSuccess'), 'success');
      showNotif(t('dynamic.packInstalled', { name: getPackDisplayName(pack) }));
      return pack;
    }

    async function handlePackFileSelection(file) {
      try {
        await installWordPackFile(file);
      } catch (error) {
        const message = error?.message || t('packErrors.invalidJson');
        setPackInstallStatus(message, 'error');
        showNotif(message, 'var(--accent2)', 'var(--text)');
      }
    }

    function toggleInstalledPack(packId) {
      const pack = contentModel.packs.find(item => item.id === packId && item.source === 'downloaded');
      if (!pack) return;
      pack.enabled = pack.enabled === false;
      saveContentModel();
      gameState.selectedCategories = normalizeSelectedCategories(gameState.selectedCategories);
      renderInstalledPacks();
      renderWordBank();
      renderPackPreview();
      renderCategorySelection();
      updateDiffWordCount();
      showNotif(t('notifications.packToggled'));
    }

    function removeInstalledPack(packId) {
      const pack = contentModel.packs.find(item => item.id === packId && item.source === 'downloaded');
      if (!pack) return;
      if (!confirm(t('confirmations.removePack', { packName: getPackDisplayName(pack) }))) return;
      contentModel.packs = contentModel.packs.filter(item => item.id !== packId);
      if (wbPreviewPackId === packId) wbPreviewPackId = '';
      saveContentModel();
      gameState.selectedCategories = normalizeSelectedCategories(gameState.selectedCategories);
      renderInstalledPacks();
      renderWordBank();
      renderPackPreview();
      renderCategorySelection();
      updateDiffWordCount();
      showNotif(t('notifications.packRemoved'));
    }

    function syncWBDiffUI() {
      DIFFICULTY_KEYS.forEach(diff =>
        document.getElementById('wb-diff-' + diff).classList.toggle('selected', diff === wbDiff)
      );
      document.getElementById('wb-diff-label').textContent = getDifficultyLabel(wbDiff, true);
    }

    function syncWBCatUI() {
      CATEGORY_KEYS.forEach(category =>
        document.getElementById('tab-' + category)?.classList.toggle('active', category === wbCat)
      );
    }

    function switchWBDiff(diff) {
      wbDiff = diff;
      syncWBDiffUI();
      renderWordBank();
      renderPackPreview();
    }

    function switchWordTab(tab) {
      wbCat = tab;
      syncWBCatUI();
      renderWordBank();
    }

    function getWordEntriesForWordBank(locale = currentLanguage, diff = wbDiff, category = wbCat) {
      const entries = [];
      const pack = getCorePack();
      const localizedBank = normalizeWordBank(pack.words?.[locale] || {});
      (localizedBank[diff]?.[category] || []).forEach((word, index) => {
        entries.push({
          packId: pack.id,
          word,
          index,
          diff,
          category,
          editable: pack.editable !== false
        });
      });
      return entries;
    }

    function renderWordBank() {
      const cont = document.getElementById('words-list');
      cont.innerHTML = '';
      const entries = getWordEntriesForWordBank(currentLanguage, wbDiff, wbCat);
      entries.forEach(entry => {
        const tag = document.createElement('span');
        tag.className = 'word-tag';
        const removeBtn = entry.editable
          ? ` <span class="del-btn" data-action="remove-word" data-word-category="${entry.category}" data-word-diff="${entry.diff}" data-word-pack="${entry.packId}" data-index="${entry.index}">✕</span>`
          : '';
        tag.innerHTML = `${CATEGORY_ICONS[entry.category] || ''} ${entry.word}${removeBtn}`;
        cont.appendChild(tag);
      });
      document.getElementById('word-count').textContent = entries.length;
    }

    function getCoreChallengeList(locale = currentLanguage) {
      const pack = getCorePack();
      ensurePackLocale(pack, locale);
      const list = normalizeChallenges(pack.challenges?.[locale] || []);
      return list.length || pack.challengeOverrides?.[locale] ? list : getDefaultCoreChallenges(locale);
    }

    function setCoreChallengeList(list, locale = currentLanguage) {
      const pack = getCorePack();
      ensurePackLocale(pack, locale);
      pack.challenges[locale] = ensureUniqueWords(normalizeChallenges(list));
      pack.challengeOverrides = pack.challengeOverrides || {};
      pack.challengeOverrides[locale] = true;
      saveContentModel();
    }

    function renderChallengeBank() {
      const cont = document.getElementById('challenges-list');
      const countEl = document.getElementById('challenge-count');
      if (!cont || !countEl) return;
      const challenges = getCoreChallengeList();
      cont.innerHTML = '';
      challenges.forEach((challenge, index) => {
        const tag = document.createElement('span');
        tag.className = 'word-tag';
        const text = document.createTextNode(`🎯 ${challenge} `);
        const removeBtn = document.createElement('span');
        removeBtn.className = 'del-btn';
        removeBtn.dataset.action = 'remove-challenge';
        removeBtn.dataset.index = String(index);
        removeBtn.textContent = '✕';
        tag.append(text, removeBtn);
        cont.appendChild(tag);
      });
      countEl.textContent = challenges.length;
    }

    function addWord() {
      const inp = document.getElementById('inp-new-word');
      const category = document.getElementById('inp-word-cat').value;
      const word = inp.value.trim();
      if (!word) return;
      const currentBank = normalizeWordBank(getCorePack().words?.[currentLanguage] || {});
      if (currentBank[wbDiff][category].includes(word)) {
        showNotif(t('notifications.duplicateWord'), 'var(--accent2)', 'var(--text)');
        return;
      }

      const editablePack = getEditablePack();
      ensurePackLocale(editablePack, currentLanguage);
      editablePack.words[currentLanguage][wbDiff][category].push(word);
      editablePack.words[currentLanguage][wbDiff][category] = ensureUniqueWords(editablePack.words[currentLanguage][wbDiff][category]);
      saveContentModel();
      inp.value = '';
      renderWordBank();
      updateDiffWordCount();
      showNotif(t('dynamic.wordAdded', { word, difficulty: getDifficultyLabel(wbDiff, true) }));
    }

    function addChallenge() {
      const inp = document.getElementById('inp-new-challenge');
      const challenge = inp.value.trim();
      if (!challenge) return;
      const challenges = getCoreChallengeList();
      if (challenges.includes(challenge)) {
        showNotif(t('notifications.duplicateChallenge'), 'var(--accent2)', 'var(--text)');
        return;
      }

      setCoreChallengeList([...challenges, challenge]);
      inp.value = '';
      renderChallengeBank();
      showNotif(t('dynamic.challengeAdded', { challenge }));
    }

    function removeWord(category, diff, packId, idx) {
      const pack = contentModel.packs.find(item => item.id === packId);
      if (!pack || pack.editable === false) return;
      ensurePackLocale(pack, currentLanguage);
      pack.words[currentLanguage][diff][category].splice(idx, 1);
      saveContentModel();
      renderWordBank();
      updateDiffWordCount();
    }

    function removeChallenge(idx) {
      const challenges = getCoreChallengeList();
      if (idx < 0 || idx >= challenges.length) return;
      challenges.splice(idx, 1);
      setCoreChallengeList(challenges);
      renderChallengeBank();
      showNotif(t('notifications.challengeRemoved'));
    }

    function resetChallenges() {
      if (confirm(t('confirmations.resetChallenges'))) {
        const pack = getCorePack();
        ensurePackLocale(pack, currentLanguage);
        pack.challenges[currentLanguage] = getDefaultCoreChallenges();
        pack.challengeOverrides = pack.challengeOverrides || {};
        delete pack.challengeOverrides[currentLanguage];
        saveContentModel();
        renderChallengeBank();
        showNotif(t('notifications.challengesRestored'));
      }
    }

    function resetWords() {
      if (confirm(t('confirmations.resetWords'))) {
        const defaultCore = normalizePack(createCorePack());
        const extraPacks = contentModel.packs.filter(pack => pack.id !== CORE_PACK_ID && pack.source !== 'builtin');
        contentModel = {
          version: 1,
          packs: [defaultCore, ...extraPacks.map(normalizePack)]
        };
        saveContentModel();
        renderWordBank();
        renderChallengeBank();
        updateDiffWordCount();
        showNotif(t('notifications.bankRestored'));
      }
    }

    function clearAppStorage(storage) {
      if (!storage) return;
      const keys = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key?.startsWith(APP_STORAGE_PREFIX)) keys.push(key);
      }
      keys.forEach(key => storage.removeItem(key));
    }

    function resetAppDefaults() {
      if (!confirm(t('confirmations.resetAppDefaults'))) return;
      clearAppStorage(localStorage);
      clearAppStorage(sessionStorage);
      window.location.reload();
    }

    // ============================================================
    // CONFETTI
    // ============================================================
    function launchConfetti(count = 40) {
      const colors = [
        getThemeVar('--accent1'),
        getThemeVar('--accent2'),
        getThemeVar('--accent3'),
        getThemeVar('--accent4'),
        getThemeVar('--accent5'),
        getThemeVar('--timer-color-warning')
      ];
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.cssText = `left:${Math.random() * 100}vw;top:-10px;background:${colors[Math.floor(Math.random() * colors.length)]};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};--dur:${(Math.random() * 1.5 + 1.5).toFixed(1)}s;--del2:${(Math.random() * 1).toFixed(2)}s;`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
      }
    }

    // ============================================================
    // RESTART
    // ============================================================
    function confirmRestart() {
      if (confirm(t('confirmations.restartGame'))) {
        clearInterval(gameState.timerInterval);
        clearInterval(gameState.memInterval);
        document.getElementById('resultOverlay').classList.remove('show');
        resetResultGuesserPicker();
        const prevDiff = gameState.difficulty;
        const prevGameType = gameState.gameType;
        gameState = {
          gameType: prevGameType,
          mode: 'teams',
          difficulty: prevDiff,
          teams: { A: [], B: [] },
          players: [],
          teamNames: { A: getDefaultTeamName('A'), B: getDefaultTeamName('B') },
          scores: {},
          currentPlayerIdx: 0,
          currentRound: 1,
          totalRounds: 3,
          currentWord: null,
          currentChallenge: null,
          usedWords: [],
          timerDur: parseInt(document.getElementById('timer-slider').value, 10) || 60,
          timerInterval: null,
          memInterval: null,
          timerLeft: 60,
          hintShown: false,
          wordVisible: false,
          phase: 'preparing',
          totalTurns: 0,
          turnsDone: 0,
          leaderboardRecorded: false,
          randomChallenge: false,
          selectedCategories: getDefaultSelectedCategories()
        };
        selectGameType(prevGameType);
        selectMode('teams');
        selectDifficulty(prevDiff);
        goTo('setup');
        renderSetupPlayers();
      }
    }

    function handleNavigation(button) {
      animateButtonClick(button);
      playNavigationSound();
      goTo(button.dataset.nav);
    }

    function handleEnterSubmit(key) {
      if (key === 'team-A') addTeamPlayer('A');
      if (key === 'team-B') addTeamPlayer('B');
      if (key === 'ffa') addFFAPlayer();
      if (key === 'add-word') addWord();
      if (key === 'add-challenge') addChallenge();
    }

    function applyLayoutPreview(mode = 'auto') {
      document.body.dataset.previewMode = mode;
      localStorage.setItem('mm_layout_preview', mode);
      const select = document.getElementById('dev-layout-preview');
      if (select && select.value !== mode) select.value = mode;
    }

    function initializeLayoutPreview() {
      if (!document.getElementById('dev-layout-preview')) {
        applyLayoutPreview('auto');
        return;
      }
      const saved = localStorage.getItem('mm_layout_preview') || 'auto';
      applyLayoutPreview(saved);
    }

    function shouldPlayNavigationSoundForAction(action) {
      return action !== 'mark-correct' && action !== 'mark-wrong';
    }

    function handleAction(button) {
      const { action, team, index, wordCategory, wordDiff, wordPack, platform, packId, scoreKey, scoreDelta } = button.dataset;

      if (shouldPlayNavigationSoundForAction(action)) {
        playNavigationSound();
      }

      if (action === 'next-turn') return nextTurn();
      if (action === 'share-platform') {
        animateButtonClick(button);
        return shareToPlatform(platform);
      }
      if (action === 'quick-game') {
        animateButtonClick(button);
        return startQuickGame();
      }
      if (action === 'toggle-fullscreen') {
        animateButtonClick(button);
        return toggleFullscreen();
      }
      if (action === 'install-pwa') {
        animateButtonClick(button);
        return installPWA();
      }
      if (action === 'select-multidevice-host') {
        animateButtonClick(button);
        return selectMultiDeviceMode('host');
      }
      if (action === 'select-multidevice-join') {
        animateButtonClick(button);
        return selectMultiDeviceMode('join');
      }
      if (action === 'reset-multidevice-choice') {
        animateButtonClick(button);
        return resetMultiDeviceChoice();
      }
      if (action === 'create-multidevice-host') {
        animateButtonClick(button);
        return createMultiDeviceHost();
      }
      if (action === 'join-multidevice-session') {
        animateButtonClick(button);
        return connectToMultiDeviceHost(document.getElementById('multidevice-join-code')?.value || '');
      }
      if (action === 'continue-multidevice-setup') {
        animateButtonClick(button);
        return goTo('setup');
      }
      if (action === 'copy-multidevice-link') {
        animateButtonClick(button);
        return copyMultiDeviceLink();
      }
      if (action === 'disconnect-multidevice-guest') {
        animateButtonClick(button);
        return disconnectGuestSession();
      }
      if (action === 'donate-bmc') {
        animateButtonClick(button);
        return openDonationLink('buyMeCoffee');
      }
      if (action === 'donate-kofi') {
        animateButtonClick(button);
        return openDonationLink('koFi');
      }
      if (action === 'add-team-player') return addTeamPlayer(team);
      if (action === 'add-ffa-player') return addFFAPlayer();
      if (action === 'start-game') {
        animateButtonClick(button);
        return startGame();
      }
      if (action === 'confirm-restart') return confirmRestart();
      if (action === 'reset-leaderboard') return resetLeaderboard();
      if (action === 'open-score-manager') {
        animateButtonClick(button);
        return openScoreManager();
      }
      if (action === 'close-score-manager') return closeScoreManager();
      if (action === 'reset-score-manager-inputs') return resetScoreManagerInputs();
      if (action === 'adjust-score-manager') return adjustScoreManagerInput(scoreKey, Number(scoreDelta) || 0);
      if (action === 'save-score-manager') return saveScoreManager();
      if (action === 'reveal-word') return revealWord();
      if (action === 'toggle-word') return toggleWordVisibility();
      if (action === 'mark-correct') {
        animateButtonClick(button);
        playCorrectSound();
        return markResult(true);
      }
      if (action === 'mark-wrong') {
        animateWrongButton(button);
        playWrongSound();
        return markResult(false);
      }
      if (action === 'continue-game') return continueGame();
      if (action === 'set-draw-tool') return selectDrawingTool(button.dataset.tool);
      if (action === 'clear-drawing-canvas') return clearDrawingCanvas();
      if (action === 'add-word') return addWord();
      if (action === 'add-challenge') return addChallenge();
      if (action === 'reset-words') return resetWords();
      if (action === 'reset-challenges') return resetChallenges();
      if (action === 'reset-app-defaults') return resetAppDefaults();
      if (action === 'select-pack-file') return selectPackFile();
      if (action === 'toggle-installed-pack') return toggleInstalledPack(packId);
      if (action === 'remove-installed-pack') return removeInstalledPack(packId);
      if (action === 'copy-user-id') return copyUserId();
      if (action === 'export-user-id') return exportUserId();
      if (action === 'select-user-id-file') return selectUserIdFile();
      if (action === 'remove-word') return removeWord(wordCategory, wordDiff, wordPack, Number(index));
      if (action === 'remove-challenge') return removeChallenge(Number(index));
      if (action === 'remove-team-player') return removeTeamPlayer(team, Number(index));
      if (action === 'remove-ffa-player') return removeFFAPlayer(Number(index));
    }

    function registerEventListeners() {
      document.addEventListener('click', event => {
        unlockBackgroundMusic();

        const navButton = event.target.closest('[data-nav]');
        if (navButton) {
          handleNavigation(navButton);
          return;
        }

        const modeCard = event.target.closest('[data-mode]');
        if (modeCard) {
          selectMode(modeCard.dataset.mode);
          return;
        }

        const gameTypeCard = event.target.closest('.mode-card[data-game-type]');
        if (gameTypeCard) {
          selectGameType(gameTypeCard.dataset.gameType);
          return;
        }

        const difficultyCard = event.target.closest('[data-difficulty]');
        if (difficultyCard) {
          selectDifficulty(difficultyCard.dataset.difficulty);
          return;
        }

        const categoryCard = event.target.closest('.category-card[data-category]');
        if (categoryCard) {
          toggleCategory(categoryCard.dataset.category);
          return;
        }

        const wbDifficultyCard = event.target.closest('[data-wb-difficulty]');
        if (wbDifficultyCard) {
          switchWBDiff(wbDifficultyCard.dataset.wbDifficulty);
          return;
        }

        const wbTabButton = event.target.closest('[data-wb-tab]');
        if (wbTabButton) {
          playNavigationSound();
          switchWordTab(wbTabButton.dataset.wbTab);
          return;
        }

        const packPreviewRow = event.target.closest('[data-pack-preview-id]');
        if (packPreviewRow && !event.target.closest('[data-action]')) {
          playNavigationSound();
          selectPreviewPack(packPreviewRow.dataset.packPreviewId);
          return;
        }

        const leaderboardFilter = event.target.closest('[data-leaderboard-filter]');
        if (leaderboardFilter) {
          const filter = leaderboardFilter.dataset.leaderboardFilter;
          const value = leaderboardFilter.dataset.leaderboardValue;
          if (filter === 'type' || filter === 'mode') {
            leaderboardFilters = { ...leaderboardFilters, [filter]: value };
            playNavigationSound();
            renderLeaderboard();
          }
          return;
        }

        const leaderboardTab = event.target.closest('[data-leaderboard-tab]');
        if (leaderboardTab) {
          leaderboardFilters = { ...leaderboardFilters, type: leaderboardTab.dataset.leaderboardTab || 'all' };
          playNavigationSound();
          renderLeaderboard();
          return;
        }

        const actionButton = event.target.closest('[data-action]');
        if (actionButton) {
          handleAction(actionButton);
        }
      });

      document.querySelectorAll('[data-team-name]').forEach(input => {
        input.addEventListener('change', () => updateTeamName(input.dataset.teamName, input.value));
      });

      document.querySelectorAll('[data-enter-submit]').forEach(input => {
        input.addEventListener('keydown', event => {
          if (event.key === 'Enter') handleEnterSubmit(input.dataset.enterSubmit);
        });
      });

      document.getElementById('multidevice-join-code')?.addEventListener('keydown', event => {
        if (event.key === 'Enter') connectToMultiDeviceHost(event.target.value);
      });

      document.getElementById('rounds-slider').addEventListener('input', event => {
        document.getElementById('rounds-val').textContent = event.target.value;
      });

      document.getElementById('timer-slider').addEventListener('input', event => {
        updateTimerLabel(event.target.value);
        saveSettings();
      });

      ['correct-points-input', 'wrong-points-input', 'ffa-guesser-points-input'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', event => {
          const fallback = id === 'correct-points-input'
            ? DEFAULT_CORRECT_POINTS
            : id === 'ffa-guesser-points-input'
              ? DEFAULT_FFA_GUESSER_POINTS
              : DEFAULT_WRONG_PENALTY_POINTS;
          event.target.value = parsePointValue(event.target.value, fallback);
          saveSettings();
        });
      });

      document.getElementById('random-challenge-toggle').addEventListener('change', event => {
        toggleRandomChallenge(event.target.checked);
      });

      document.getElementById('toggle-sound').addEventListener('change', saveSettings);
      document.getElementById('toggle-navigation-sound').addEventListener('change', saveSettings);
      document.getElementById('toggle-gameroom-music').addEventListener('change', handleMusicSettingChange);
      document.getElementById('toggle-gameplay-music').addEventListener('change', handleMusicSettingChange);
      document.getElementById('toggle-ffa-guesser-points')?.addEventListener('change', saveSettings);
      document.getElementById('toggle-shuffle').addEventListener('change', saveSettings);
      document.getElementById('result-guesser-select')?.addEventListener('change', event => {
        applyResultGuesserSelection(event.target.value);
      });
      document.getElementById('language-select').addEventListener('change', event => {
        setLanguage(event.target.value, { save: true });
      });
      document.getElementById('theme-select').addEventListener('change', event => {
        applyTheme(event.target.value);
        saveSettings();
      });
      document.addEventListener('fullscreenchange', updateFullscreenButton);
      document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
      window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        deferredPWAInstallPrompt = event;
        updatePWAInstallButton();
      });
      window.addEventListener('appinstalled', () => {
        deferredPWAInstallPrompt = null;
        updatePWAInstallButton();
      });

      const packFileInput = document.getElementById('pack-file-input');
      if (packFileInput) {
        packFileInput.addEventListener('change', event => {
          const file = event.target.files?.[0];
          handlePackFileSelection(file);
          event.target.value = '';
        });
      }

      const userIdFileInput = document.getElementById('user-id-file-input');
      if (userIdFileInput) {
        userIdFileInput.addEventListener('change', event => {
          const file = event.target.files?.[0];
          handleUserIdFileSelection(file);
          event.target.value = '';
        });
      }

      const previewSelect = document.getElementById('dev-layout-preview');
      if (previewSelect) {
        previewSelect.addEventListener('change', event => {
          applyLayoutPreview(event.target.value);
        });
      }
    }

    // ============================================================
    // INIT
    // ============================================================
    initializeLayoutPreview();
    initializeSettings();
    registerEventListeners();
    initializeDrawingCanvas();
    selectGameType('mime');
    selectMode('teams');
    selectDifficulty('easy');
    initializeMultiDeviceJoinFromUrl();
