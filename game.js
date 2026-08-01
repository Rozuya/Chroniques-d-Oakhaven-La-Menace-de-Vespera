const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Gestion des écrans et variables globales
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const startBtn = document.getElementById("start-btn");
const playerNameInput = document.getElementById("player-name-input");

const zoneDisplay = document.getElementById("zone-display");
const hpDisplay = document.getElementById("hp-display");
const goldDisplay = document.getElementById("gold-display");
const dialogueText = document.getElementById("dialogue-text");
const dialogueOptions = document.getElementById("dialogue-options");
const inventoryList = document.getElementById("inventory-list");

let playerName = "Laura";
let playerHP = 100;
let maxHP = 100;
let playerGold = 50;
let currentZoneIndex = 0; // 0: Village, 1: Forêt/Marais, 2: Donjon

const zones = [
    { name: "Oakhaven (Village)", bgFile: "Oakhaven.png" },
    { name: "La Forêt & Le Marais", bgFile: "Forêt et Le Marais.png" },
    { name: "Donjon Sanctuaire de Vespera", bgFile: "Donjon Sanctuaire de Vespera.png" }
];

// Chargement sécurisé des images avec gestion exacte des noms fournis
const assets = {};
const assetFiles = {
    laura: "laura2d.jpg",
    garrick: "Garrick le Veilleur.jpg",
    kaelen: "Kaelen le Vénérable.jpg",
    lys: "Lys la Vagabonde.jpg",
    elara: "Elara la Marchande d'Objets.jpg",
    vespera: "Vespera l'Exilée.jpg",
    village: "Oakhaven.png",
    foret: "Forêt et Le Marais.png",
    donjon: "Donjon Sanctuaire de Vespera.png"
};

let imagesLoaded = 0;
const totalImages = Object.keys(assetFiles).length;

function loadAssets() {
    for (let key in assetFiles) {
        assets[key] = new Image();
        assets[key].src = encodeURI(assetFiles[key]);
        assets[key].onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                console.log("Tous les assets graphiques sont chargés !");
            }
        };
        assets[key].onerror = () => {
            console.warn(`Alerte : Impossible de charger ${assetFiles[key]}. Vérifiez sa présence pour GitHub Pages.`);
            imagesLoaded++; // Permet de continuer malgré une image manquante
        };
    }
}

// État du Joueur et Position
let player = {
    x: 100,
    y: 300,
    width: 40,
    height: 60,
    speed: 4
};

// Inventaire
let inventory = ["Potion de Vie x1"];

// Entités / PNJ selon la zone
const npcs = [
    // Zone 0 : Village
    [
        { name: "Elara la Marchande", x: 300, y: 280, width: 40, height: 60, key: "elara", type: "merchant" },
        { name: "Garrick le Veilleur", x: 550, y: 280, width: 40, height: 60, key: "garrick", type: "npc" }
    ],
    // Zone 1 : Forêt / Marais
    [
        { name: "Lys la Vagabonde", x: 400, y: 270, width: 40, height: 60, key: "lys", type: "npc" },
        { name: "Kaelen le Vénérable", x: 600, y: 270, width: 40, height: 60, key: "kaelen", type: "npc" }
    ],
    // Zone 2 : Donjon
    [
        { name: "Vespera l'Exilée", x: 400, y: 220, width: 50, height: 70, key: "vespera", type: "boss" }
    ]
];

// Contrôles clavier
const keys = {};
window.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

startBtn.addEventListener("click", () => {
    if (playerNameInput.value.trim() !== "") {
        playerName = playerNameInput.value.trim();
    }
    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    updateUI();
    gameLoop();
});

function updateUI() {
    zoneDisplay.innerText = `Zone : ${zones[currentZoneIndex].name}`;
    hpDisplay.innerText = `PV : ${playerHP}/${maxHP}`;
    goldDisplay.innerText = `Or : ${playerGold} 🪙`;
    
    inventoryList.innerHTML = "";
    inventory.forEach(item => {
        let li = document.createElement("li");
        li.innerText = `- ${item}`;
        inventoryList.appendChild(li);
    });
}

function setDialogue(text, options = []) {
    dialogueText.innerText = text;
    dialogueOptions.innerHTML = "";
    options.forEach(opt => {
        let btn = document.createElement("button");
        btn.innerText = opt.text;
        btn.onclick = opt.action;
        dialogueOptions.appendChild(btn);
    });
}

// Logique de mise à jour du jeu
function update() {
    // Déplacements fluides (ZQSD ou Flèches)
    if (keys["arrowleft"] || keys["q"]) player.x -= player.speed;
    if (keys["arrowright"] || keys["d"]) player.x += player.speed;
    if (keys["arrowup"] || keys["z"]) player.y -= player.speed;
    if (keys["arrowdown"] || keys["s"]) player.y += player.speed;

    // Limites de l'écran Canvas
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    if (player.y < 200) player.y = 200; // Limite haute du décor
    if (player.y > canvas.height - player.height - 20) player.y = canvas.height - player.height - 20;

    // Changement de zone automatique si le joueur atteint le bord droit
    if (player.x >= canvas.width - 50) {
        if (currentZoneIndex < zones.length - 1) {
            currentZoneIndex++;
            player.x = 50; // Réinitialise à gauche de la nouvelle zone
            updateUI();
            setDialogue(`Vous entrez dans : ${zones[currentZoneIndex].name}. Restez sur vos gardes !`);
        } else {
            player.x = canvas.width - 50; // Bloque au boss final
        }
    }

    // Gestion des interactions avec les PNJ de la zone actuelle
    let currentNpcs = npcs[currentZoneIndex];
    for (let npc of currentNpcs) {
        let dist = Math.hypot((player.x + player.width/2) - (npc.x + npc.width/2), (player.y + player.height/2) - (npc.y + npc.height/2));
        if (dist < 60) {
            triggerNpcInteraction(npc);
            break;
        }
    }
}

function triggerNpcInteraction(npc) {
    if (npc.key === "elara") {
        setDialogue("Elara : 'Bienvenue voyageuse ! Veux-tu acheter une potion de soin pour 20 pièces d'or ?'", [
            { text: "Acheter Potion", action: () => {
                if (playerGold >= 20) {
                    playerGold -= 20;
                    inventory.push("Potion de Vie x1");
                    updateUI();
                    setDialogue("Elara : 'Merci pour votre achat ! Bonne chance dans les marais.'");
                } else {
                    setDialogue("Elara : 'Vous n'avez pas assez d'or !'");
                }
            }},
            { text: "Partir", action: () => setDialogue("Elara : 'Revenez quand vous voulez.'") }
        ]);
    } else if (npc.key === "garrick") {
        setDialogue("Garrick : 'Pour survivre à la forêt, n'avancez jamais sans vérifier vos arrières.'");
    } else if (npc.key === "lys") {
        setDialogue("Lys : 'Vespera utilise de puissantes illusions. Prenez cette amulette cachée.'");
    } else if (npc.key === "kaelen") {
        setDialogue("Kaelen : 'Le sanctuaire maléfique est proche. Préparez votre magie, Laura.'");
    } else if (npc.key === "vespera") {
        setDialogue("Vespera l'Exilée : 'Oserais-tu t'interproser, misérable mortelle ? Affronte ma colère !'", [
            { text: "Attaquer le Boss", action: () => {
                let damage = Math.floor(Math.random() * 30) + 20;
                playerHP -= damage;
                updateUI();
                if (playerHP <= 0) {
                    setDialogue("Vespera : 'Votre voyage s'arrête ici...' [GAME OVER]");
                } else {
                    setDialogue(`Vous ripostez vaillamment ! Vespera subit de lourds dégâts mais vous inflige ${damage} PV.`);
                }
            }},
            { text: "Utiliser Potion", action: () => {
                let index = inventory.findIndex(item => item.includes("Potion"));
                if (index !== -1 && playerHP < maxHP) {
                    inventory.splice(index, 1);
                    playerHP = Math.min(maxHP, playerHP + 50);
                    updateUI();
                    setDialogue("Vous consommez une potion et regagnez 50 PV !");
                } else {
                    setDialogue("Aucune potion disponible ou PV déjà au maximum.");
                }
            }}
        ]);
    }
}

// Boucle de rendu graphique
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessin du fond de la zone actuelle
    let currentZoneKey = ["village", "foret", "donjon"][currentZoneIndex];
    if (assets[currentZoneKey] && assets[currentZoneKey].complete && assets[currentZoneKey].naturalWidth !== 0) {
        ctx.drawImage(assets[currentZoneKey], 0, 0, canvas.width, canvas.height);
    } else {
        // Fond de secours si l'image externe n'est pas encore chargée
        ctx.fillStyle = currentZoneIndex === 0 ? "#27ae60" : currentZoneIndex === 1 ? "#2c3e50" : "#4a154b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Dessin des PNJ / Boss de la zone active
    let currentNpcs = npcs[currentZoneIndex];
    for (let npc of currentNpcs) {
        if (assets[npc.key] && assets[npc.key].complete && assets[npc.key].naturalWidth !== 0) {
            ctx.drawImage(assets[npc.key], npc.x, npc.y, npc.width, npc.height);
        } else {
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(npc.x, npc.y, npc.width, npc.height);
        }
        // Nom du PNJ au-dessus
        ctx.fillStyle = "#fff";
        ctx.font = "8px 'Press Start 2P'";
        ctx.fillText(npc.name, npc.x - 10, npc.y - 8);
    }

    // Dessin de l'héroïne Laura
    if (assets.laura && assets.laura.complete && assets.laura.naturalWidth !== 0) {
        ctx.drawImage(assets.laura, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = "#3498db";
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Affichage du nom au-dessus du joueur
    ctx.fillStyle = "#f1c40f";
    ctx.font = "8px 'Press Start 2P'";
    ctx.fillText(playerName, player.x, player.y - 8);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialisation au chargement
loadAssets();
