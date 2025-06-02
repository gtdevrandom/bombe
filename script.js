const output = document.getElementById('output');
const form = document.getElementById('command-form');
const input = document.getElementById('command-input');
const scoreboardDiv = document.getElementById('scoreboard');

let timeLeft = 45;
let disarmed = false;
let startTime = Date.now();
const allWires = ['red', 'blue', 'green', 'yellow', 'white', 'black'];
const correctWire = allWires[Math.floor(Math.random() * allWires.length)];
let wiresCut = [];

let scanPhase = 1; // Pour gérer les phases de scan

const commandHistory = [];
let historyIndex = -1;

const lores = [
  {
    title: "🍕 Mission : Pizza Explosive",
    story: [
      "Un client affamé a commandé une pizza spéciale...",
      "Le livreur était un ancien démineur reconverti.",
      "Une bombe est cachée dans la boîte à pizza !"
    ]
  },
  {
    title: "🧻 Mission : Toilettes piégées",
    story: [
      "Quelqu’un a saboté les toilettes du ministère.",
      "Une bombe a été installée dans le distributeur de papier.",
      "Votre mission ? Sauver les fesses de la nation."
    ]
  },
  {
    title: "🤖 Mission : Robot Révolté",
    story: [
      "Un robot d'entretien a acquis la conscience...",
      "Il menace de tout faire exploser si on le redémarre.",
      "Il faut désamorcer la bombe cachée dans son torse."
    ]
  },
  {
    title: "🦆 Mission : Étang piégé",
    story: [
      "Un hacker fou a miné un étang avec des explosifs.",
      "Chaque canard en plastique est un potentiel détonateur.",
      "Il ne reste que 45 secondes avant que ça saute !"
    ]
  },
  {
    title: "👻 Mission : Manoir Hanté",
    story: [
      "Des bruits étranges et une bombe spirituelle...",
      "Un fantôme farceur a armé une bombe temporelle.",
      "Elle explose à minuit pile, sauf si on l’arrête avant."
    ]
  },
  {
    title: "💼 Mission : Hôtel Piégé",
    story: [
      "Un appel anonyme a prévenu les autorités...",
      "Une bombe a été cachée dans un hôtel rempli de civils.",
      "Vous êtes le dernier espoir. Accédez au terminal de désamorçage.",
    ]
  },
  {
    title: "🛰️ Mission : Station Orbitale",
    story: [
      "Une station de recherche orbitale a été sabotée.",
      "Les systèmes de survie sont compromis.",
      "Une bombe à retardement menace toute la station.",
    ]
  },
  {
    title: "🎭 Mission : Théâtre Piégé",
    story: [
      "Une représentation en direct tourne au cauchemar...",
      "Une bombe a été placée sous la scène.",
      "Vous avez été désigné pour la désamorcer sans alerter le public.",
    ]
  },
  {
    title: "🕵️‍♂️ Mission : Trahison Interne",
    story: [
      "Un agent double a infiltré votre équipe.",
      "Il a activé un engin explosif dans le centre de commandement.",
      "Vous devez agir vite pour sauver les données classifiées."
    ]
  }
];

// Afficher un scénario aléatoire avant de lancer le compte à rebours
function displayLoreAndStart() {
  const lore = lores[Math.floor(Math.random() * lores.length)];
  print("==== 📖 BRIEFING DE MISSION ====");
  print(lore.title);
  lore.story.forEach(line => print(line));
  print("----------------------------------------");
  
  // Attendre un peu avant d'afficher l'intro et lancer le timer
  setTimeout(() => {
    printIntro();
    startCountdown();
  }, 4000); // Délai pour lire le lore
}


function updateScoreboard() {
  const scores = JSON.parse(localStorage.getItem('scores') || '[]');
  scoreboardDiv.innerText =
    scores.length === 0
      ? "🏆 Scoreboard\nAucun score"
      : "🏆 Scoreboard\n" + scores.map((s, i) => `${i + 1}. ${s}s`).join('\n');
}
updateScoreboard();

const print = (text) => {
  output.innerHTML += text + '\n';
  output.scrollTop = output.scrollHeight;
};

const printIntro = () => {
  print("==== 🔓 TERMINAL DE DÉSAMORÇAGE ====");
  print("🧠 Tape 'help' pour voir les commandes disponibles.");
  print("⏱️  La bombe explosera dans 45 secondes...");
  print("----------------------------------------");
};

displayLoreAndStart(); // Lance le lore et ensuite le compte à rebours

function startCountdown() {
  timer = setInterval(() => {
    if (disarmed) return clearInterval(timer);
    timeLeft--;
    if (timeLeft <= 0) {
      print("\n💥 💀 BOUM ! La bombe a explosé !");
      triggerExplosion();
      input.disabled = true;
      clearInterval(timer);
    }
  }, 1000);
}


form.addEventListener('submit', (e) => {
  e.preventDefault();
  const command = input.value.trim();
  if (command === '') return;
  
  commandHistory.push(command);
  historyIndex = commandHistory.length; // Reset index
  
  input.value = '';
  print("> " + command.toLowerCase());

  handleCommand(command.toLowerCase());
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (commandHistory.length === 0) return;

    if (historyIndex > 0) {
      historyIndex--;
    } else {
      historyIndex = 0;
    }

    input.value = commandHistory[historyIndex];
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (commandHistory.length === 0) return;

    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      input.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      input.value = '';
    }
  }
});

function handleCommand(command) {
  if (disarmed) return;

  if (command === 'help') {
    print("📖 Commandes disponibles :");
    print("- status         : temps restant");
    print("- list           : liste des câbles restants");
    print("- scan           : scan simplifié (3 phases, résultats décroissants)");
    print("- exit           : quitter le terminal");
    return;
  }

  if (command === 'status') {
    print(`⏱️ Temps restant : ${timeLeft}s`);
    return;
  }

  if (command === 'list') {
    const remaining = allWires.filter(w => !wiresCut.includes(w));
    print("🔌 Câbles visibles : " + remaining.join(', '));
    return;
  }

  if (command === 'scan') {
    performScan();
    return;
  }

  if (command.startsWith('cut ')) {
    const color = command.split(' ')[1];
    if (!allWires.includes(color)) {
      print("❗ Ce câble n'existe pas !");
      return;
    }
    if (wiresCut.includes(color)) {
      print(`⚠️ Le câble ${color} a déjà été coupé.`);
      return;
    }

    wiresCut.push(color);

    if (color === correctWire) {
      disarmed = true;
      clearInterval(timer);
      const endTime = Math.floor((Date.now() - startTime) / 1000);
      print(`✔️ Bombe désamorcée en ${endTime}s ! Câble ${color} neutralisé.`);
      saveScore(endTime);
      updateScoreboard();
    } else {
      print(`❌ Mauvais câble... (${color})`);
      print("💥 BOUM !");
      triggerExplosion();
      input.disabled = true;
      clearInterval(timer);
    }
    return;
  }

  if (command === 'exit') {
    print("🔌 Fermeture du terminal...");
    setTimeout(() => {
      window.close();
      location.href = 'about:blank';
    }, 1000);
    return;
  }

  print("Commande inconnue. Tapez 'help' pour la liste.");
}

function performScan() {
  let resultsCount;
  let delay;

  if (scanPhase === 1) {
    resultsCount = 4;
    delay = 2000;  // x2
  } else if (scanPhase === 2) {
    resultsCount = 3;
    delay = 3000;  // x2
  } else {
    resultsCount = 2;
    delay = 4000;  // x2
  }

  print(`🛰️ Analyse électromagnétique en cours... (phase ${scanPhase})`);
  setTimeout(() => {
    let suspects = [...allWires].sort(() => 0.5 - Math.random()).slice(0, resultsCount);
    if (!suspects.includes(correctWire)) suspects[0] = correctWire;
    print("📡 Fréquences anormales détectées sur : " + suspects.map(c => `🔹 ${c}`).join(', '));
    
    scanPhase++;
    if (scanPhase > 3) scanPhase = 1;
  }, delay);
}

function saveScore(time) {
  const scores = JSON.parse(localStorage.getItem('scores') || '[]');
  scores.push(time);
  scores.sort((a, b) => a - b);
  localStorage.setItem('scores', JSON.stringify(scores.slice(0, 5)));
}

function triggerExplosion() {
  const explosion = document.createElement('div');
  explosion.classList.add('explosion');
  document.body.appendChild(explosion);

  for (let i = 0; i < 60; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    explosion.appendChild(particle);

    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * 150 + 80;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    particle.style.setProperty('--x', `${x}px`);
    particle.style.setProperty('--y', `${y}px`);

    const size = Math.random() * 6 + 4 + 'px';
    particle.style.width = size;
    particle.style.height = size;

    const r = 255;
    const g = Math.floor(Math.random() * 100);
    const b = 0;
    particle.style.backgroundColor = `rgb(${r},${g},${b})`;

    particle.style.left = '0px';
    particle.style.top = '0px';
  }

  setTimeout(() => {
    explosion.remove();
  }, 2600);
}
