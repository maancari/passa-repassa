// Inclua a biblioteca cliente do Socket.IO (será carregada via script tag no HTML)
// Isso é necessário porque o Socket.IO não é parte padrão do navegador
// <script src="/socket.io/socket.io.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    // Conecta ao servidor Socket.IO
    // Se o seu servidor estiver rodando em 'localhost:3000', não precisa de argumento
    // Se estiver online, coloque a URL do seu servidor aqui (ex: 'https://seu-servidor.com')
    const socket = io('https://passa-repassa-server.onrender.com'); // Conecta-se ao host/porta de onde a página foi servida

    let updatePlayerUI; // Será definida em setupPlayerInterface
    let updateManagerUI; // Será definida em setupManagerInterface

    // --- Lógica para as interfaces dos jogadores (player1.html, player2.html) ---
    function setupPlayerInterface() {
        const playerButton = document.getElementById('player-button');
        const messageDisplay = document.getElementById('message');
        const gameStatusDisplay = document.getElementById('game-status');
        const currentPlayer = playerButton.dataset.player; // 'player1' ou 'player2'

        document.body.classList.add('player-page');

        updatePlayerUI = (gameState) => { // Agora recebe o gameState como argumento
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
            // Em vez de salvar no localStorage, EMITE PARA O SERVIDOR
            socket.emit('playerButtonClick', { player: currentPlayer });
        });

        // Ouve atualizações do estado do jogo vindas do servidor
        socket.on('gameStateUpdate', (newGameState) => {
            updatePlayerUI(newGameState);
        });

        // No primeiro carregamento, o servidor enviará o estado inicial
        // updatePlayerUI(socket.gameState); // Não funciona assim, o evento 'gameStateUpdate' vai cuidar
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

        updateManagerUI = (gameState) => { // Agora recebe o gameState como argumento
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

            player1Indicator.classList.remove('green', 'red');
            player2Indicator.classList.remove('green', 'red');
            player1Indicator.classList.add('gray');
            player2Indicator.classList.add('gray');
			player1Indicator.textContent = "";
			player2Indicator.textContent = "";

            if (gameState.buttonPressed) {
                if (gameState.pressedBy === 'player1') {
                    player1Indicator.classList.remove('gray');
                    player1Indicator.classList.add('green');
					player1Indicator.textContent = gameState.pressedBy.toUpperCase();
					
                } else if (gameState.pressedBy === 'player2') {
                    player2Indicator.classList.remove('gray');
                    player2Indicator.classList.add('green');
					player2Indicator.textContent = gameState.pressedBy.toUpperCase();
                }
            } else if (gameState.isBlocked) {
                player1Indicator.classList.remove('gray');
                player2Indicator.classList.remove('gray');
                player1Indicator.classList.add('red');
                player2Indicator.classList.add('red');
            }
        };

        resetGameButton.addEventListener('click', () => {
            socket.emit('resetGame'); // Emite para o servidor
        });

        blockAllButtons.addEventListener('click', () => {
            socket.emit('blockButtons'); // Emite para o servidor
        });

        unblockAllButtons.addEventListener('click', () => {
            socket.emit('unblockButtons'); // Emite para o servidor
        });

        managerPlayer1Button.addEventListener('click', () => {
            socket.emit('managerPlayerClick', { player: 'player1' }); // Emite para o servidor
        });

        managerPlayer2Button.addEventListener('click', () => {
            socket.emit('managerPlayerClick', { player: 'player2' }); // Emite para o servidor
        });

        // Ouve atualizações do estado do jogo vindas do servidor
        socket.on('gameStateUpdate', (newGameState) => {
            updateManagerUI(newGameState);
        });

        // No primeiro carregamento, o servidor enviará o estado inicial
        // updateManagerUI(socket.gameState); // Não funciona assim, o evento 'gameStateUpdate' vai cuidar
    }

    // --- Lógica de Inicialização (detecta qual página está carregando) ---

    // Remover initializeGameState() pois o estado é agora no servidor

    const currentPath = window.location.pathname;
    if (currentPath.includes('player1.html') || currentPath.includes('player2.html')) {
        setupPlayerInterface();
    } else if (currentPath.includes('manager.html')) {
        setupManagerInterface();
    }
});

/*************************** COM FULLSCREEN ******************************************/

const enterFullscreenButton = document.getElementById('enterFullscreenButton');
const fullscreenPrompt = document.getElementById('fullscreen-prompt');
const playerContent = document.getElementById('playerContent');

// Garante que o playerContent esteja oculto no carregamento
// (Isso complementa o display: none no CSS, caso algo externo o sobreponha)
playerContent.style.display = 'none';
// Garante que o prompt esteja visível no carregamento
fullscreenPrompt.style.display = 'flex'; // Use flex para centralizar o prompt

enterFullscreenButton.addEventListener('click', () => {
	const elem = document.documentElement; // Obtém o elemento raiz HTML

	// Solicita o modo tela cheia
	if (elem.requestFullscreen) {
		elem.requestFullscreen();
	} else if (elem.mozRequestFullScreen) { /* Firefox */
		elem.mozRequestFullScreen();
	} else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
		elem.webkitRequestFullScreen(); // Note: webkitRequestFullScreen (capital S)
	} else if (elem.msRequestFullscreen) { /* IE/Edge */
		elem.msRequestFullscreen();
	}

	// Esconde o prompt e mostra o conteúdo do jogador
	fullscreenPrompt.style.display = 'none';
	playerContent.style.display = 'flex'; // Torna o playerContent flex para centralizar o conteúdo

	// Opcional: Se seu script.js inicializar algo ou tiver funções que dependem do DOM estar visível,
	// você pode chamar uma função aqui. Por exemplo, se script.js tem uma função initGame():
	// if (typeof initGame === 'function') {
	//     initGame();
	// }
});

// Opcional: Lidar com a saída do modo tela cheia (por exemplo, ao pressionar ESC)
document.addEventListener('fullscreenchange', exitHandler);
document.addEventListener('webkitfullscreenchange', exitHandler);
document.addEventListener('mozfullscreenchange', exitHandler);
document.addEventListener('MSFullscreenChange', exitHandler);

function exitHandler() {
	if (!document.fullscreenElement &&    // Padrão
		!document.webkitIsFullScreen &&   // Chrome, Safari e Opera
		!document.mozFullScreen &&        // Firefox
		!document.msFullscreenElement) {  // IE/Edge
		// Se sair da tela cheia, mostra o prompt novamente
		fullscreenPrompt.style.display = 'flex'; // Volta para flex para centralizar
		playerContent.style.display = 'none';
	}
}