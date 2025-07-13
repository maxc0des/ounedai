function submit(user, message){
    fetch('http://localhost:3000/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' // wichtig!
        },
        body: JSON.stringify({
            name: user,
            message: message
        })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Fehler:', error));

    document.getElementById('message').value = '';
    document.getElementById('user').value = '';
    location.reload();
}

function get_guests(){
    fetch('http://localhost:3000/guests')
    .then(response => response.json())
    .then(data => {
        const guestList = document.getElementById('guest-list');
        guestList.innerHTML = '';
        data.forEach(item => {
            var entry = document.createElement('li');
            entry.appendChild(document.createTextNode(`${item.created_at} ${item.name}: ${item.message}`));
            guestList.appendChild(entry);
        });
    })
    .catch(error => console.error('Fehler:', error));
}
get_guests();

const canvas = document.getElementById('confettiCanvas');
const ctx = canvas.getContext('2d');
let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const colors = ['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7', '#ffc09f', '#ffee93', '#f6f7d7', '#c1e1c5', '#a8e6cf', '#b9fbc0', '#caffbf', '#d0f4de', '#b9fbc0', '#a8e6cf'];
const confettiCount = 150;
const confetti = [];

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function createConfetti() {
  for (let i = 0; i < confettiCount; i++) {
    confetti.push({
      x: random(0, width),
      y: random(0, height),
      r: random(2, 6),
      d: random(1, 3),
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: random(-10, 10),
      tiltAngleIncrement: random(0.05, 0.12),
      tiltAngle: 0
    });
  }
}

function drawConfetti() {
  ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < confetti.length; i++) {
    const c = confetti[i];
    ctx.beginPath();
    ctx.lineWidth = c.r;
    ctx.strokeStyle = c.color;
    ctx.moveTo(c.x + c.tilt + c.r / 2, c.y);
    ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 2);
    ctx.stroke();
  }
  updateConfetti();
}

function updateConfetti() {
  for (let i = 0; i < confetti.length; i++) {
    const c = confetti[i];
    c.tiltAngle += c.tiltAngleIncrement;
    c.y += (Math.cos(c.d) + 1 + c.r / 2) / 2;
    c.x += Math.sin(c.d);
    c.tilt = Math.sin(c.tiltAngle) * 15;

    if (c.y > height) {
      c.x = random(0, width);
      c.y = -10;
    }
  }
}

function animateConfetti() {
  drawConfetti();
  requestAnimationFrame(animateConfetti);
}

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});

createConfetti();
animateConfetti();
