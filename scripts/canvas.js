// Set up the canvas
const canvas = document.createElement('canvas');
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = '1000'; // Ensure the canvas is in front of other elements
canvas.style.pointerEvents = 'none'; // Allow clicks to pass through to elements below
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Resize canvas dynamically
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

//---------- GR simulation ----------
// Array to hold planet objects
var planets = [];

// Gravitational constant
const G = 1;

// Function to calculate the gravitational force between two planets
function calculateForce(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dsquared = dx * dx + dy * dy;
  var force = 0;
  if (dsquared == 0) {
    const dsquared = 1;
  } else {
    force = (G * p1.mass * p2.mass) / (dsquared);
  }

  // Normalize direction and calculate force components
  const fx = (force * dx);
  const fy = (force * dy);

  return { fx, fy };
}

// Function to update the positions of all planets
function GRupdatePositions() {
  // Create an array to store forces for each planet
  const forces = planets.map(() => ({ fx: 0, fy: 0 }));

  // Calculate forces between all pairs of planets
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const force = calculateForce(planets[i], planets[j]);
      forces[i].fx += force.fx;
      forces[i].fy += force.fy;
      forces[j].fx -= force.fx;
      forces[j].fy -= force.fy;
    }
  }

  // Update velocities and positions based on forces
  planets.forEach((planet, index) => {
    planet.vx += forces[index].fx / planet.mass;
    planet.vy += forces[index].fy / planet.mass;
    planet.x += planet.vx;
    planet.y += planet.vy;
  });
}

// Function to draw the planets
function GRdrawPlanets() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  planets.forEach(planet => {
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fillStyle = planet.color;
    ctx.fill();
    ctx.closePath();
  });
}

// Animation loop
function GRanimate() {
  GRupdatePositions();
  GRdrawPlanets();
  requestAnimationFrame(GRanimate);
}
//-----------------------------------

//---------- Particle Simulation ----------
var particles = [{ x: 0, y: canvas.height/2, radius: 10, vx: 0, vy: 0, time: 0, color: 'blue' }]

function QFTdrawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(particle => {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.closePath();
  });
}

// Animation loop
function QFTanimate() {
  QFTdrawParticles();
  requestAnimationFrame(QFTanimate);
}
//-----------------------------------------

const secret_1 = ['q','f','t'];
const secret_2 = ['g','e','o'];
const secret_3 = ['g','r',];
const secret_4 = ['a','h','m','e','d'];
var userInput = [];
// Listen for keypress events
window.addEventListener('keydown', (e) => {
  userInput.push(e.key);

  // Check if the user input matches the secret key sequence
  if (userInput.slice(-secret_1.length).join('') === secret_1.join('')) {
    console.log('You found a secret!'); // Trigger the animation
    planets = [];

    confetti({
      particleCount: 100,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: Math.random(),
        // since they fall down, start a bit higher than random
        y: Math.random() - 0.2
      }
    });

    setTimeout(() => {
      confetti.reset();
    }, 10000);

    QFTanimate();

    userInput = []; // Reset the input after triggering
  }
  if (userInput.slice(-secret_3.length).join('') === secret_3.join('')) {
    console.log('You found a secret!'); // Trigger the animation
    // Add a new planet
    const massradius = Math.floor(Math.random() * 40);
    planets.push({ x: Math.floor(Math.random() * canvas.width), y: Math.floor(Math.random() * canvas.height), radius: massradius, mass: massradius/10, vx: 0, vy: 0, color: 'black' });

    // Start the animation
    GRanimate();
    userInput = []; // Reset the input after triggering
  }
});