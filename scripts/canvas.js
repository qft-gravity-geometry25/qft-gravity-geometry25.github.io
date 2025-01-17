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
const b = 0.001; // constant magnetic field
const particleInfo = [
  {type: "e", color: "rgb(0, 142, 250)", radius: 3, charge: -1, hl: 500},
  {type: "ep", color: "rgb(0, 250, 250)", radius: 3, charge: 1, hl: 500},
  {type: "nue", color: "rgb(90, 136, 136)", radius: 3, charge: 0, hl: 100000},
  {type: "mu", color: "rgb(142, 0, 250)", radius: 5, charge: -1, hl: 100000},
  {type: "mup", color: "rgb(250, 0, 250)", radius: 5, charge: 1, hl: 100000},
  {type: "numu", color: "rgb(136, 90, 136)", radius: 3, charge: 0, hl: 100000},
  {type: "tau", color: "rgb(250, 250, 0)", radius: 7, charge: -1, hl: 200},
  {type: "taup", color: "rgb(250, 142, 0)", radius: 7, charge: 1, hl: 200},
  {type: "nutau", color: "rgb(136, 136, 90)", radius: 3, charge: 0, hl: 100000},
  {type: "Z", color: "rgb(140, 140, 0)", radius: 10, charge: 0, hl: 200},
  {type: "Wp", color: "rgb(30, 140, 0)", radius: 10, charge: 1, hl: 200},
  {type: "Wm", color: "rgb(140, 30, 0)", radius: 10, charge: -1, hl: 200},
  {type: "ph", color: "rgb(250, 90, 0)", radius: 3, charge: 0, hl: 100000}
];
const decayTable = [
  {type: "e", decay: [["e","ph"],["Wm","nue"]], cumprob: [0.3, 0.4]},
  {type: "ep", decay: [["ep","ph"],["Wp","nue"]], cumprob: [0.3, 0.4]},
  {type: "Wm", decay: [["e","nue"],["mu","numu"],["tau","nutau"]], cumprob: [0.5, 0.8, 1]},
  {type: "Wp", decay: [["ep","nue"],["mup","numu"],["taup","nutau"]], cumprob: [0.5, 0.8, 1]},
  {type: "Z", decay: [["e","ep"],["mu","mup"],["tau","taup"]], cumprob: [0.4, 0.7, 1]},
  {type: "ph", decay: [["e","ep"],["mu","mup"],["tau","taup"]], cumprob: [0.2, 0.3, 0.35]}
];
var particlesAdd = [];
var particlesRemove = [];
var particles = [];

function QFTdrawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(particle => {
    const index = particleInfo.findIndex(item => item.type === particle.type);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particleInfo[index].radius, 0, Math.PI * 2);
    ctx.fillStyle = particleInfo[index].color;
    ctx.fill();
    ctx.closePath();
  });
}

function QFTdecay() {
  particles.forEach((particle, pindex) => {
    const phl = particleInfo[particleInfo.findIndex(item => item.type === particle.type)].hl;
    if (particle.time > phl) {
      const dindex = decayTable.findIndex(item => item.type === particle.type);
      
      if (dindex != -1) {
        const decay = decayTable[dindex].cumprob.findIndex(prob => Math.random() <= prob);

        if (decay != -1) {
          // Append index of particle to remove
          particlesRemove.push(pindex);
          
          const px = particle.x;
          const py = particle.y;
          const vx = particle.vx;
          const vy = particle.vy;

          var rvx = Math.random();
          var rvy = Math.random();

          // Append to list of particles to add
          decayTable[dindex].decay[decay].forEach(dparticle => {
            particlesAdd.push({type: dparticle, x: px, y: py, vx: vx + rvx, vy: vy + rvy, time: 0});
            rvx = -rvx;
            rvy = -rvy;
          });
        }
      }
      
      particle.time = 0;
    }
  });

  particlesRemove = particlesRemove.sort().reverse();

  particlesRemove.forEach(pindex => {
    particles = particles.filter((_, i) => i !== pindex);
  });

  particlesAdd.forEach(particle => {
    particles.push(particle);
  });

  particlesRemove = [];
  particlesAdd = [];
}

function QFTupdatePositions() {
  particles.forEach(particle => {
    var force = {fx: 0, fy: 0};
    const pcharge = particleInfo[particleInfo.findIndex(item => item.type === particle.type)].charge;

    // Calculate forces from all charged particles
    for (let i = 0; i < particles.length; i++) {
      const pcharge2 = particleInfo[particleInfo.findIndex(item => item.type === particles[i].type)].charge;
      if (pcharge2 != 0) {
        const dx = (particles[i].x - particle.x);
        const dy = (particles[i].y - particle.y);
        const eforce = 0.01 * pcharge2 * pcharge / Math.sqrt(0.1 + dx*dx + dy*dy);

        force.fx += dx * eforce;
        force.fy += dy * eforce;
      }
    }
    // Add force due to constant magnetic field
    force.fx += particle.vy * b;
    force.fy += -particle.vx * b;

    particle.vx += force.fx;
    particle.vy += force.fy;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.time += 1;

    if (particle.x < 0 || particle.x > canvas.width) {
      particle.vx = -particle.vx;
    }
    if (particle.y < 0 || particle.y > canvas.height) {
      particle.vy = -particle.vy;
    }
  });
}

// Animation loop
function QFTanimate() {
  QFTdecay();
  QFTupdatePositions();
  QFTdrawParticles();
  requestAnimationFrame(QFTanimate);
}
//-----------------------------------------

//---------- Start all animations ----------
animateGR = false;
animateQFT = false;
//------------------------------------------

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
    // Stop the other simulations
    animateGR = false;
    planets = [];

    const ptype = particleInfo[Math.floor(Math.random() * particleInfo.length)].type;
    particles.push({type: ptype,x: Math.floor(Math.random() * canvas.width), y: Math.floor(Math.random() * canvas.height), vx: 0.5 * Math.random(), vy: 0.5 * Math.random(), time: 0});

    // Start the animation
    if (!animateQFT) {
      animateQFT = true;
      particles.push({type: ptype,x: Math.floor(Math.random() * canvas.width), y: Math.floor(Math.random() * canvas.height), vx: 0.5 * Math.random(), vy: 0.5 * Math.random(), time: 0});
      QFTanimate();
    }

    userInput = []; // Reset the input after triggering
  }
  if (userInput.slice(-secret_3.length).join('') === secret_3.join('')) {
    console.log('You found a secret!'); // Trigger the animation
    // Stop the other simulations
    animateQFT = false;
    particles = [];

    // Add a new planet
    const massradius = Math.floor(Math.random() * 40);
    planets.push({ x: Math.floor(Math.random() * canvas.width), y: Math.floor(Math.random() * canvas.height), radius: massradius, mass: massradius/10, vx: 0, vy: 0, color: 'black' });

    // Start the animation
    if (!animateGR) {
      animateGR = true;
      GRanimate();
    }

    userInput = []; // Reset the input after triggering
  }
  if (userInput.slice(-secret_2.length).join('') === secret_2.join('')) {
    console.log('You found a secret!'); // Trigger the animation
    // Stop the other simulations
    animateQFT = false;
    animateGR = false;
    particles = [];
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

    userInput = []; // Reset the input after triggering
  }
});