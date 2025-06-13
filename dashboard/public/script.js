function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.scrollIntoView({ behavior: 'smooth' });
}

function selectAllCommands() {
    const commandsSelect = document.getElementById('commands');
    for (let option of commandsSelect.options) {
        option.selected = true;
    }
    scrollToSection('adminOfCommands');
}

function submitConfig() {
    const appstate = document.getElementById('appstate').value.trim();
    const commands = Array.from(document.getElementById('commands').selectedOptions).map(option => option.value);
    const adminUid = document.getElementById('inputOfAdmin').value.trim() || 'default';
    const prefix = document.getElementById('inputOfPrefix').value.trim() || 'non-prefix';

    if (!appstate) {
        showResult('Please paste an appstate JSON.', 'error');
        return;
    }

    try {
        JSON.parse(appstate);
    } catch (e) {
        showResult('Invalid JSON format in appstate.', 'error');
        return;
    }

    fetch('/config', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appstate, commands, adminUid, prefix })
    })
    .then(response => response.text())
    .then(result => {
        checkBotStatus(result);
    })
    .catch(error => showResult(`Error: ${error.message}`, 'error'));
}

function checkBotStatus(result) {
    fetch('/bot-status')
        .then(response => response.json())
        .then(data => {
            const prefix = document.getElementById('inputOfPrefix').value.trim() || '/';
            const status = data.running ? `✅ Bot is running with prefix ${prefix}!` : '⚠ Bot is not running.';
            showResult(`${result}\n${status}`, data.running ? 'success' : 'error');
        })
        .catch(error => showResult(`Error checking bot status: ${error.message}`, 'error'));
}

function showResult(message, type) {
    const result = document.getElementById('result');
    result.textContent = message;
    result.className = `container text-center ${type === 'success' ? 'success-message' : 'error-message'}`;
    result.style.display = 'block';
    setTimeout(() => result.style.display = 'none', 5000);
}

document.getElementById('appstate').addEventListener('input', function() {
    document.getElementById('submitButton').disabled = !this.value.trim();
});

fetch('/commands')
    .then(response => response.json())
    .then(commandNames => {
        const commandsSelect = document.getElementById('commands');
        commandNames.forEach(cmd => {
            const option = document.createElement('option');
            option.value = cmd;
            option.textContent = cmd;
            commandsSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error fetching commands:', error);
        const fallbackCommands = ['admin', 'python', 'quiz', 'help'];
        const commandsSelect = document.getElementById('commands');
        fallbackCommands.forEach(cmd => {
            const option = document.createElement('option');
            option.value = cmd;
            option.textContent = cmd;
            commandsSelect.appendChild(option);
        });
    });

window.addEventListener('scroll', () => {
    const scrollUpBtn = document.getElementById('scrollUpBtn');
    if (window.scrollY > 300) {
        scrollUpBtn.classList.add('show');
        scrollUpBtn.classList.remove('hide');
    } else {
        scrollUpBtn.classList.add('hide');
        scrollUpBtn.classList.remove('show');
    }
});

document.getElementById('scrollUpBtn').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

function updateTime() {
    const now = new Date();
    document.getElementById('time').textContent = now.toLocaleTimeString();
}
setInterval(updateTime, 1000);
updateTime();

document.getElementById('ping').textContent = 'N/A';

// Audio playback (moved from inline script)
let tracks = [
    "https://raw.githubusercontent.com/Kaizenji/Kaizenji/main/aura.mp3",
    "https://raw.githubusercontent.com/Kaizenji/Kaizenji/main/next.mp3",
    "https://raw.githubusercontent.com/Kaizenji/Kaizenji/main/avangard.mp3",
    "https://raw.githubusercontent.com/Kaizenji/Kaizenji/main/life-force.mp3",
    "https://raw.githubusercontent.com/Kaizenji/Kaizenji/main/cute-depressed.mp3"
];

let randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

let sound = new Howl({
    src: [randomTrack],
    autoplay: true,
    loop: false,
    format: ["mp3"],
    volume: 0.5,
    onend: () => {},
});

sound.play();
