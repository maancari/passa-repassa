document.addEventListener('DOMContentLoaded', () => {
    // --- Variáveis de referência para as funções de atualização de UI ---
    // Declaradas aqui para que saveGameState possa vê-las.
    let updatePlayerUI;
    let updateManagerUI;

    // --- Funções de Gerenciamento de Estado no localStorage ---

    function initializeGameState() {
        if (localStorage.getItem('gameState') === null) {
            const initialState = {
                buttonPressed: false,
                pressedBy: null,
                isBlocked: false
            };
            localStorage.setItem('gameState', JSON.stringify(initialState));
            return initialState;
        }
        return JSON.parse(localStorage.getItem('gameState'));
    }

    function getGameState() {
        return JSON.parse(localStorage.getItem('gameState'));
    }

    // Centraliza a lógica de salvar e disparar eventos/atualizações
    function saveGameState(newState) {
        const oldState = getGameState(); // Opcional, para debug ou lógicas mais complexas
        localStorage.setItem('gameState', JSON.stringify(newState));

        // Dispara um evento personalizado para outras janelas/abas escutarem
        // Use 'true' para `bubbles` para que o evento possa ser escutado em níveis mais altos
        window.dispatchEvent(new CustomEvent('gameStateUpdated', { detail: newState }));

        // Chama a função de atualização da UI para a janela atual imediatamente
        if (document.body.classList.contains('player-page') && typeof updatePlayerUI === 'function') {
            updatePlayerUI();
        } else if (document.body.classList.contains('manager-page') && typeof updateManagerUI === 'function') {
            updateManagerUI();
        }
    }

    // --- Lógica para as interfaces dos jogadores (player1.html, player2.html) ---
    function setupPlayerInterface() {
        const playerButton = document.getElementById('player-button');
        const messageDisplay = document.getElementById('message');
        const gameStatusDisplay = document.getElementById('game-status');
        const currentPlayer = playerButton.dataset.player;

        document.body.classList.add('player-page');

        updatePlayerUI = () => { // Atribuição à variável global
            const gameState = getGameState(); // Garante que pegamos o estado mais recente

            playerButton.disabled = gameState.isBlocked || gameState.buttonPressed;
            playerButton.style.backgroundColor = (gameState.isBlocked || gameState.buttonPressed) ? '#6c757d' : '#dc3545';

            if (gameState.isBlocked) {
                messageDisplay.textContent = 'O botão está BLOQUEADO pelo gerenciador!';
                gameStatusDisplay.textContent = 'Bloqueado';
                gameStatusDisplay.style.color = '#dc3545';
            } else if (gameState.buttonPressed) {
                if (gameState.pressedBy === currentPlayer) {
                    messageDisplay.textContent = `VOCÊ apertou o botão! Aguardando o gerenciador.`;
                } else {
                    messageDisplay.textContent = `${gameState.pressedBy.toUpperCase()} apertou o botão primeiro!`;
                }
                gameStatusDisplay.textContent = `${gameState.pressedBy.toUpperCase()} apertou`;
                gameStatusDisplay.style.color = '#ffc107';
            } else {
                messageDisplay.textContent = 'Aguardando alguém apertar o botão...';
                gameStatusDisplay.textContent = 'Pronto para apertar';
                gameStatusDisplay.style.color = '#28a745';
            }
        };

        playerButton.addEventListener('click', () => {
            const gameState = getGameState();
            if (!gameState.isBlocked && !gameState.buttonPressed) {
                const newState = {
                    ...gameState,
                    buttonPressed: true,
                    pressedBy: currentPlayer
                };
                saveGameState(newState);
            }
        });

        // Escuta por mudanças no localStorage vindas de outras abas/janelas
        // e também para o evento personalizado disparado pela própria aba ou por outras
        window.addEventListener('gameStateUpdated', updatePlayerUI);
        // O evento 'storage' é disparado APENAS quando o localStorage é modificado por OUTRA janela/aba.
        // Ele não é disparado na janela que fez a modificação.
        // É importante ter ele para garantir que outras abas se atualizem.
        window.addEventListener('storage', updatePlayerUI);

        // Chamar updatePlayerUI no carregamento da página para refletir o estado atual
        updatePlayerUI();
    }

    // --- Lógica para a interface do gerenciador (manager.html) ---
    function setupManagerInterface() {
        const buttonPressedByDisplay = document.getElementById('button-pressed-by');
        const buttonGlobalStatusDisplay = document.getElementById('button-global-status');
        const resetGameButton = document.getElementById('reset-game-button');
        const blockAllButtons = document.getElementById('block-all-buttons');
        const unblockAllButtons = document.getElementById('unblock-all-buttons');
        const managerPlayer1Button = document.getElementById('manager-player1-button');
        const managerPlayer2Button = document.getElementById('manager-player2-button');

        const player1Indicator = document.getElementById('player1-indicator');
        const player2Indicator = document.getElementById('player2-indicator');

        document.body.classList.add('manager-page');

        updateManagerUI = () => { // Atribuição à variável global
            const gameState = getGameState(); // Garante que pegamos o estado mais recente

            if (gameState.buttonPressed) {
                buttonPressedByDisplay.textContent = gameState.pressedBy.toUpperCase();
                buttonPressedByDisplay.style.color = '#007bff';
            } else {
                buttonPressedByDisplay.textContent = 'Ninguém';
                buttonPressedByDisplay.style.color = '#555';
            }

            if (gameState.isBlocked) {
                buttonGlobalStatusDisplay.textContent = 'BLOQUEADO';
                buttonGlobalStatusDisplay.classList.add('blocked');
            } else {
                buttonGlobalStatusDisplay.textContent = 'DESBLOQUEADO';
                buttonGlobalStatusDisplay.classList.remove('blocked');
            }

            // Lógica para os sinalizadores
            player1Indicator.classList.remove('green', 'red');
            player2Indicator.classList.remove('green', 'red');
            player1Indicator.classList.add('gray');
            player2Indicator.classList.add('gray');

            if (gameState.buttonPressed) {
                if (gameState.pressedBy === 'player1') {
                    player1Indicator.classList.remove('gray');
                    player1Indicator.classList.add('green');
                } else if (gameState.pressedBy === 'player2') {
                    player2Indicator.classList.remove('gray');
                    player2Indicator.classList.add('green');
                }
            } else if (gameState.isBlocked) {
                // Se o botão está bloqueado, ambos ficam vermelhos (opcional, mas visualmente claro)
                player1Indicator.classList.remove('gray');
                player2Indicator.classList.remove('gray');
                player1Indicator.classList.add('red');
                player2Indicator.classList.add('red');
            }
        };

        resetGameButton.addEventListener('click', () => {
            const newState = {
                buttonPressed: false,
                pressedBy: null,
                isBlocked: false
            };
            saveGameState(newState); // saveGameState já chama updateManagerUI
        });

        blockAllButtons.addEventListener('click', () => {
            const gameState = getGameState();
            const newState = { ...gameState, isBlocked: true };
            saveGameState(newState); // saveGameState já chama updateManagerUI
        });

        unblockAllButtons.addEventListener('click', () => {
            const gameState = getGameState();
            const newState = { ...gameState, isBlocked: false };
            saveGameState(newState); // saveGameState já chama updateManagerUI
        });

        managerPlayer1Button.addEventListener('click', () => {
            const gameState = getGameState();
            if (!gameState.isBlocked && !gameState.buttonPressed) {
                const newState = { ...gameState, buttonPressed: true, pressedBy: 'player1' };
                saveGameState(newState); // saveGameState já chama updateManagerUI
            }
        });

        managerPlayer2Button.addEventListener('click', () => {
            const gameState = getGameState();
            if (!gameState.isBlocked && !gameState.buttonPressed) {
                const newState = { ...gameState, buttonPressed: true, pressedBy: 'player2' };
                saveGameState(newState); // saveGameState já chama updateManagerUI
            }
        });

        // Escuta por mudanças no localStorage vindas de outras abas/janelas
        // e também para o evento personalizado disparado pela própria aba ou por outras
        window.addEventListener('gameStateUpdated', updateManagerUI);
        window.addEventListener('storage', updateManagerUI);

        updateManagerUI(); // Inicializa a UI
    }

    // --- Lógica de Inicialização (detecta qual página está carregando) ---

    // Chame initializeGameState antes de qualquer getGameState para garantir que exista
    initializeGameState();

    const currentPath = window.location.pathname;
    if (currentPath.includes('player1.html') || currentPath.includes('player2.html')) {
        setupPlayerInterface();
    } else if (currentPath.includes('manager.html')) {
        setupManagerInterface();
    }
});