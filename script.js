document.addEventListener('DOMContentLoaded', () => {
    console.log("Settlers spillet starter...");

    // --- Globale referanser til HTML-elementer ---
    const boardElement = document.getElementById('game-board');
    const playerInfoArea = document.getElementById('player-info-area');
    const dice1Img = document.getElementById('dice1');
    const dice2Img = document.getElementById('dice2');
    const rollDiceBtn = document.getElementById('btn-roll-dice');
    const endTurnBtn = document.getElementById('btn-end-turn');
    const buildRoadBtn = document.getElementById('btn-build-road');
    const buildSettlementBtn = document.getElementById('btn-build-settlement');
    const buildCityBtn = document.getElementById('btn-build-city');
    const buyDevCardBtn = document.getElementById('btn-buy-devcard');
    const gameLogUl = document.getElementById('game-log');
    const gameStatusDiv = document.getElementById('game-status');
    // ... legg til flere etter behov

    // --- Konstanter og spillinnstillinger ---
    const TERRAIN_TYPES = ['forest', 'hills', 'pasture', 'fields', 'mountains', 'desert'];
    const RESOURCES = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
    const PLAYER_COLORS = ['red', 'blue', 'white', 'orange']; // Eksempel
    const VICTORY_POINTS_TARGET = 10;
    const BUILDING_COSTS = {
        road: { wood: 1, brick: 1 },
        settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
        city: { wheat: 2, ore: 3 },
        devCard: { sheep: 1, wheat: 1, ore: 1 }
    };

    // --- Spilltilstand (State) ---
    let gameState = {
        players: [], // { name: 'Spiller 1', color: 'red', resources: { wood: 0, ... }, points: 0, settlements: [], cities: [], roads: [], devCards: [] }
        board: {
            hexes: [], // { id: 'hex-0', terrain: 'forest', numberToken: 5, q: 0, r: 0, vertices: [...], edges: [...] }
            ports: [],
            robberHexId: null // Start på ørkenen
        },
        currentPlayerIndex: 0,
        diceRolled: false,
        diceResult: [1, 1],
        gamePhase: 'setup' // 'setup', 'playing', 'ended'
        // ... mer state etter behov (f.eks. development card deck)
    };

    // --- Initialiseringsfunksjon ---
    function initGame() {
        logMessage("Starter nytt spill...");
        setupPlayers(prompt("Hvor mange spillere (2-4)?", 4) || 4); // Få antall spillere
        setupBoard();
        // setupDevelopmentCards(); // Lag kortstokken
        renderBoard();
        renderAllPlayerInfo();
        // TODO: Implementer startplassering av bosetninger/veier
        gameState.gamePhase = 'playing'; // Eller start med setup-fasen
        updateGameStatus();
        updateControls(); // Oppdater knapper basert på starttilstand
        logMessage("Spillet er klart. Spiller 1 sin tur.");
    }

    // --- Spillogikk-funksjoner (Eksempler - MÅ UTVIDES) ---

    function setupPlayers(numPlayers) {
        gameState.players = [];
        for (let i = 0; i < numPlayers; i++) {
            gameState.players.push({
                id: i,
                name: `Spiller ${i + 1}`,
                color: PLAYER_COLORS[i % PLAYER_COLORS.length],
                resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
                points: 0, // Start med 0, øker med bygninger/VP-kort
                settlementsPlaced: 0, // For telling av brikker
                citiesPlaced: 0,
                roadsPlaced: 0,
                devCards: [],
                // ... andre spiller-spesifikke data
            });
        }
        console.log("Spillere satt opp:", gameState.players);
    }

    function setupBoard() {
        // *** DETTE ER EN KOMPLISERT DEL ***
        // Her må du:
        // 1. Generere hexagon-data (posisjoner q, r eller x, y).
        // 2. Tilordne terrengtyper tilfeldig (men balansert, følg Catan-regler).
        // 3. Tilordne tallbrikker tilfeldig (følg Catan-regler, ingen 6/8 ved siden av hverandre, ingen på ørken).
        // 4. Identifisere hjørner (vertices) og kanter (edges) for bygging.
        // 5. Plassere havner (ports).
        // 6. Finne start-hexen for røveren (ørkenen).

        // Forenklet eksempel (bare for struktur):
        gameState.board.hexes = [
            // { id: 'hex-0', terrain: 'forest', numberToken: 5, q: 0, r: 0, vertices: ['v0','v1',...], edges:['e0','e1',...] },
            // ... fyll inn alle hexes basert på layout
        ];
        // Finn ørkenen og plasser røveren
        const desertHex = gameState.board.hexes.find(h => h.terrain === 'desert');
        if (desertHex) {
            gameState.board.robberHexId = desertHex.id;
        }
        console.log("Brett satt opp (logikk mangler)", gameState.board);
    }

    function rollDice() {
        if (gameState.diceRolled || gameState.gamePhase !== 'playing') return;

        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        gameState.diceResult = [die1, die2];
        const total = die1 + die2;

        dice1Img.src = `images/dice-${die1}.png`;
        dice2Img.src = `images/dice-${die2}.png`;
        logMessage(`Spiller ${gameState.currentPlayerIndex + 1} kastet ${die1} + ${die2} = ${total}`);

        if (total === 7) {
            handleRobber();
        } else {
            distributeResources(total);
        }

        gameState.diceRolled = true;
        updateControls();
    }

    function distributeResources(number) {
        logMessage(`Deler ut ressurser for tall ${number}...`);
        // 1. Finn alle hexes med numberToken === number som IKKE har røveren.
        // 2. For hver slik hex:
        //    a. Finn alle hjørner (vertices) rundt hexen.
        //    b. Sjekk om noen spillere har en bosetning (1 ressurs) eller by (2 ressurser) på disse hjørnene.
        //    c. Oppdater gameState.players[...].resources tilsvarende.
        //    d. Animer/vis ressursøkning.
        // 3. Oppdater spillerinfo-visningen.
        renderAllPlayerInfo(); // Forenklet - oppdater alt
        logMessage(`Ressurser utdelt (logikk mangler).`);
    }

    function handleRobber() {
        logMessage("Syver! Røveren aktiveres.");
        // 1. Sjekk spillere med > 7 kort - de må kaste halvparten (implementer valg).
        // 2. La currentPlayer flytte røveren:
        //    a. Fremhev alle hexes som mulige mål.
        //    b. Vent på klikk på en gyldig hex (ikke den den står på).
        //    c. Oppdater gameState.board.robberHexId.
        //    d. Oppdater røverens posisjon visuelt.
        // 3. La currentPlayer stjele fra en spiller ved den nye hexen (hvis mulig).
        //    a. Vis hvilke spillere som kan stjeles fra.
        //    b. La spilleren velge offer.
        //    c. Trekk et tilfeldig ressurskort fra offer til currentPlayer.
        // 4. Oppdater spillerinfo.
        logMessage(`Røver flyttet og stjeling utført (logikk mangler).`);
        // Røverhåndtering er kompleks og krever ofte en midlertidig "state" i spillet.
    }

    function attemptBuild(itemType) {
        // itemType = 'road', 'settlement', 'city'
        logMessage(`Forsøker å bygge ${itemType}...`);
        // 1. Sjekk om spilleren har råd (gameState.players[...].resources vs BUILDING_COSTS).
        // 2. Sjekk om det er spillerens tur og terning er kastet (eller setup-fase).
        // 3. Start "byggemodus":
        //    a. Finn og fremhev *gyldige* byggeplasser for itemType på brettet (f.eks. ledige kanter for vei, ledige hjørner for bosetning). Dette er KREVENDE logikk (avstandsregel, tilknytning til egne veier osv.).
        //    b. Vent på at spilleren klikker på en gyldig plass.
        // 4. Ved gyldig klikk:
        //    a. Trekk ressurskostnad fra spilleren.
        //    b. Oppdater gameState (legg til brikken på brettet, øk poeng for settlement/city).
        //    c. Oppdater brettets visuelle representasjon (tegn veien/bygningen).
        //    d. Oppdater spillerinfo (ressurser, poeng).
        //    e. Avslutt "byggemodus".
        // 5. Sjekk for seier (checkVictory).
        // 6. Oppdater kontroller (kanskje ikke råd til mer).
        logMessage(`Bygging av ${itemType} (logikk mangler).`);
    }

    function endTurn() {
        if (!gameState.diceRolled && gameState.gamePhase === 'playing') {
             logMessage("Du må kaste terning før du avslutter turen.");
             return;
        }
        if (gameState.gamePhase !== 'playing') return;

        logMessage(`Spiller ${gameState.currentPlayerIndex + 1} avslutter sin tur.`);

        // Gå til neste spiller
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        gameState.diceRolled = false; // Tilbakestill for neste spiller

        logMessage(`Det er nå Spiller ${gameState.currentPlayerIndex + 1} sin tur.`);

        updateGameStatus();
        updateControls();
        renderAllPlayerInfo(); // Fremhev neste spiller
        // TODO: Håndter eventuelle "start of turn"-effekter (som å kunne spille Knight før terningkast)
    }

    function checkVictory() {
        const player = gameState.players[gameState.currentPlayerIndex];
        if (player.points >= VICTORY_POINTS_TARGET) {
            gameState.gamePhase = 'ended';
            gameStatusDiv.textContent = `Spiller ${player.name} VANT SPILLET med ${player.points} poeng!`;
            logMessage(`Spiller ${player.name} VANT SPILLET!`);
            updateControls(); // Deaktiver de fleste knapper
            return true;
        }
        return false;
    }

    // --- Hjelpefunksjoner for Rendering og UI ---

    function renderBoard() {
        boardElement.innerHTML = ''; // Tøm brettet før ny tegning

        // Definer SVG patterns for terreng-bilder (gjør dette én gang)
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        TERRAIN_TYPES.forEach(type => {
            if (type !== 'desert') { // Ørken trenger kanskje ikke bilde?
                 const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
                 pattern.setAttribute('id', `img-${type}`);
                 pattern.setAttribute('patternUnits', 'objectBoundingBox');
                 pattern.setAttribute('width', '1');
                 pattern.setAttribute('height', '1');
                 const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                 image.setAttribute('href', `images/terrain-${type}.png`);
                 image.setAttribute('width', '20'); // Juster størrelse etter hexagon-størrelse
                 image.setAttribute('height', '23'); // Juster størrelse (hexagon høyde)
                 image.setAttribute('x', '-10'); // Juster posisjon
                 image.setAttribute('y', '-11.5'); // Juster posisjon
                 pattern.appendChild(image);
                 defs.appendChild(pattern);
            }
        });
        boardElement.appendChild(defs);


        // *** Dette er en veldig forenklet måte å tegne hex-grid på ***
        // Du trenger en algoritme for å beregne (x, y) fra (q, r) og tegne SVG <polygon>
        // Eksempel: Bruk en hex-grid-bibliotek eller implementer selv.
        // const hexSize = 10; // Radius
        // gameState.board.hexes.forEach(hex => {
        //     const points = calculateHexagonPoints(hex.q, hex.r, hexSize); // Implementer denne
        //     const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        //     polygon.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
        //     polygon.setAttribute('class', `hexagon terrain-${hex.terrain}`);
        //     polygon.dataset.hexId = hex.id; // Lagre ID for klikk-håndtering
        //     boardElement.appendChild(polygon);

        //     // Legg til tallbrikke (hvis ikke ørken og har tall)
        //     if (hex.numberToken && hex.terrain !== 'desert') {
        //          const center = calculateHexagonCenter(hex.q, hex.r, hexSize); // Implementer denne
        //          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        //          text.setAttribute('x', center.x);
        //          text.setAttribute('y', center.y);
        //          text.setAttribute('class', `number-token ${[6, 8].includes(hex.numberToken) ? 'red-number' : ''}`);
        //          text.textContent = hex.numberToken;
        //          boardElement.appendChild(text);
        //     }

            // TODO: Tegn veier, bosetninger, byer basert på gameState
            // TODO: Tegn røveren
        // });

         // Legg til event listener for klikk på brettet (delegering)
        boardElement.addEventListener('click', handleBoardClick);

        console.log("Brett rendret (visuell logikk mangler).");
    }

    function renderAllPlayerInfo() {
        playerInfoArea.innerHTML = ''; // Tøm for ny tegning
        gameState.players.forEach((player, index) => {
            const card = document.createElement('div');
            card.classList.add('player-card');
            card.dataset.playerId = player.id;
            if (index === gameState.currentPlayerIndex && gameState.gamePhase === 'playing') {
                card.classList.add('active-player');
            }

            let resourcesHtml = '';
            for (const resource in player.resources) {
                 // Bruk gjerne små ikoner her hvis du har dem
                 resourcesHtml += `<span class="resource-item">
                    <img src="images/icon-${resource}.png" alt="${resource}" title="${resource}">
                    ${player.resources[resource]}
                 </span> `;
            }

            card.innerHTML = `
                <h4>${player.name} (${player.color})</h4>
                <p>Poeng: ${player.points}</p>
                <div class="player-resources">Ressurser: ${resourcesHtml}</div>
                <p>Utviklingskort: ${player.devCards.length}</p>
                <!-- Legg til mer info: longest road, largest army? -->
            `;
            playerInfoArea.appendChild(card);
        });
    }

    function updateControls() {
        const isMyTurn = gameState.gamePhase === 'playing'; // Forenklet - må sjekke index senere for online
        const canAffordRoad = canAfford('road'); // Implementer canAfford
        const canAffordSettlement = canAfford('settlement');
        const canAffordCity = canAfford('city');
        const canAffordDevCard = canAfford('devCard');

        rollDiceBtn.disabled = !isMyTurn || gameState.diceRolled;
        endTurnBtn.disabled = !isMyTurn || !gameState.diceRolled;

        buildRoadBtn.disabled = !isMyTurn || !gameState.diceRolled || !canAffordRoad;
        buildSettlementBtn.disabled = !isMyTurn || !gameState.diceRolled || !canAffordSettlement;
        buildCityBtn.disabled = !isMyTurn || !gameState.diceRolled || !canAffordCity;
        buyDevCardBtn.disabled = !isMyTurn || !gameState.diceRolled || !canAffordDevCard;

        // TODO: Flere deaktiveringsregler (f.eks. maks antall brikker)
        // TODO: Aktiver/deaktiver trade- og spill-devcard-knapper basert på regler
    }

    function updateGameStatus() {
         if (gameState.gamePhase === 'playing') {
             const currentPlayerName = gameState.players[gameState.currentPlayerIndex]?.name || 'Ukjent';
             gameStatusDiv.textContent = `Nå er det ${currentPlayerName} sin tur.`;
         } else if (gameState.gamePhase === 'setup') {
             gameStatusDiv.textContent = "Setter opp spillet...";
         } else if (gameState.gamePhase === 'ended') {
             // Status settes av checkVictory()
         }
    }

    function logMessage(message) {
        console.log(message); // Også til konsollen for debugging
        const li = document.createElement('li');
        li.textContent = message;
        gameLogUl.appendChild(li);
        // Scroll til bunnen av loggen
        logArea.scrollTop = logArea.scrollHeight;
    }

    // --- Event Handlers ---
    function handleRollDiceClick() {
        rollDice();
    }

    function handleEndTurnClick() {
        endTurn();
    }

    function handleBuildClick(event) {
        const action = event.target.id; // f.eks. "btn-build-road"
        if (action === 'btn-build-road') attemptBuild('road');
        if (action === 'btn-build-settlement') attemptBuild('settlement');
        if (action === 'btn-build-city') attemptBuild('city');
        if (action === 'btn-buy-devcard') { /* TODO: attemptBuyDevCard(); */ }
    }

    function handleBoardClick(event) {
        // Denne er viktig for interaksjon med brettet (bygge, flytte røver)
        const target = event.target;
        console.log("Klikk på brettet:", target);

        // Sjekk om vi er i en modus som venter på klikk (f.eks. bygge modus)
        // Identifiser hva som ble klikket (hexagon, hjørne, kant) - krever data-attributter eller klasser på SVG-elementene
        const hexId = target.closest('.hexagon')?.dataset.hexId;
        // const vertexId = target.closest('.vertex-point')?.dataset.vertexId; // Eksempel
        // const edgeId = target.closest('.edge-line')?.dataset.edgeId; // Eksempel

        if (hexId) {
            logMessage(`Klikket på hexagon: ${hexId}`);
            // TODO: Håndter klikk basert på spilltilstand (f.eks. flytte røver hit?)
        }
        // TODO: Håndter klikk på hjørner/kanter for bygging
    }

    // --- Hjelpefunksjoner (Eksempler) ---
    function canAfford(itemType) {
        const player = gameState.players[gameState.currentPlayerIndex];
        if (!player) return false;
        const costs = BUILDING_COSTS[itemType];
        if (!costs) return false;

        for (const resource in costs) {
            if (player.resources[resource] < costs[resource]) {
                return false;
            }
        }
        return true;
    }

    function calculateHexagonPoints(q, r, size) {
        // Implementer konvertering fra hex-koordinater (q, r) til SVG-polygon-punkter (x, y)
        // Se hexagon grid algoritmer på nett (f.eks. RedBlobGames' guide)
        // Returner en array av {x, y} objekter
        return []; // Placeholder
    }
    function calculateHexagonCenter(q, r, size) {
         // Implementer konvertering fra hex-koordinater til senterpunkt (x, y)
        return {x: 0, y: 0}; // Placeholder
    }


    // --- Knytt Event Listeners ---
    rollDiceBtn.addEventListener('click', handleRollDiceClick);
    endTurnBtn.addEventListener('click', handleEndTurnClick);
    buildRoadBtn.addEventListener('click', handleBuildClick);
    buildSettlementBtn.addEventListener('click', handleBuildClick);
    buildCityBtn.addEventListener('click', handleBuildClick);
    buyDevCardBtn.addEventListener('click', handleBuildClick);
    // Legg til flere for Trade, Play DevCard etc.


    // --- Start Spillet ---
    initGame();

}); // Slutt på DOMContentLoaded
