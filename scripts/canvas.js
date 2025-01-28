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
  if (animateGR) {
    GRupdatePositions();
    GRdrawPlanets();
  }
  requestAnimationFrame(GRanimate);
}
//-----------------------------------

//---------- Tilings animation ----------
const geoScale = 0.5;
const geoSpeed = 1;
const debug = false;
// Discretise the canvas and find max lattice sizes
var xmax = Math.ceil(canvas.width/(geoScale * 80));
var ymax = Math.ceil(canvas.height/(geoScale * 80));

var tiling = [];
var wavefunction = Array.from({ length: xmax }, () => Array(ymax).fill([]));
var entropies = Array.from({ length: xmax }, () => Array(ymax).fill(-1));

function resetGEO() {
  tiling = [];
  wavefunction = Array.from({ length: xmax }, () => Array(ymax).fill([]));
  entropies = Array.from({ length: xmax }, () => Array(ymax).fill(-1));
}

// Robinson tiles
// edges robinsonTiles[0].edges are uniquely specified by a digit
// [top, right, bottom, left, diagonals]
// if the sum of two of these vanishes, they can be paired up
// diagonals either stick out (rt.edges[-1] = 1) or not (rt.edges[-1] = 0)
const robinsonTiles = [
  {
    tile: [[-60,0],[-40,10],[-40,30],[-50,40],[-40,50],[-30,40],[-10,40],[-10,60],[10,40],[30,40],[40,50],[50,40],[40,30],[40,10],[60,-10],[40,-10],[40,-30],[50,-40],[40,-50],[30,-40],[10,-40],[0,-60],[-10,-40],[-30,-40],[-40,-50],[-50,-40],[-40,-30],[-40,-10],[-60,0]],
    lines: [[[0,50],[0,0],[50,0]]],
    edges: [2, 3, 1, 1, 1]
  },
  {
    tile: [[-40,-10],[-20,-10],[-40,10],[-40,30],[-30,40],[-10,40],[-10,20],[10,40],[30,40],[40,30],[40,10],[20,-10],[40,-10],[40,-30],[30,-40],[10,-40],[-10,-60],[-10,-40],[-30,-40],[-40,-30],[-40,-10]],
    lines: [[[-30,0],[30,0]],[[0,-50],[0,30]]],
    edges: [-3, -2, 3, -3, 0]
  },
  {
    tile: [[-40,-10],[-20,-10],[-40,10],[-40,30],[-30,40],[-10,40],[0,20],[10,40],[30,40],[40,30],[40,10],[20,-10],[40,-10],[40,-30],[30,-40],[10,-40],[0,-60],[-10,-40],[-30,-40],[-40,-30],[-40,-10]],
    lines: [[[-30,0],[30,0]]],
    edges: [-1, -2, 1, -3, 0]
  },
  {
    tile: [[-40,-10],[-60,0],[-40,10],[-40,30],[-30,40],[-10,40],[-10,60],[10,40],[30,40],[40,30],[40,10],[60,-10],[40,-10],[40,-30],[30,-40],[10,-40],[0,-60],[-10,-40],[-30,-40],[-40,-30],[-40,-10]],
    lines: [[[0,50],[0,0],[50,0]]],
    edges: [2, 3, 1, 1, 0]
  },
  {
    tile: [[-40,-10],[-20,0],[-40,10],[-40,30],[-30,40],[-10,40],[-10,20],[10,40],[30,40],[40,30],[40,10],[20,0],[40,-10],[40,-30],[30,-40],[10,-40],[-10,-60],[-10,-40],[-30,-40],[-40,-30],[-40,-10]],
    lines: [[[0,30],[0,-50]]],
    edges: [-3, -1, 3, -1, 0]
  },
  {
    tile: [[-40,-10],[-20,0],[-40,10],[-40,30],[-30,40],[-10,40],[0,20],[10,40],[30,40],[40,30],[40,10],[20,0],[40,-10],[40,-30],[30,-40],[10,-40],[0,-60],[-10,-40],[-30,-40],[-40,-30],[-40,-10]],
    lines: [],
    edges: [-1, -1, 1, -1, 0]
  }
];

// List of all proto-tiles including transformations [tile num, trans]
const tiles = [
  [0,0],
  [0,1],
  [0,2],
  [0,4],
  [1,0],
  [1,1],
  [1,2],
  [1,3],
  [1,4],
  [1,5],
  [1,6],
  [1,7],
  [2,0],
  [2,2],
  [2,3],
  [2,5],
  [3,0],
  [3,1],
  [3,2],
  [3,4],
  [4,0],
  [4,1],
  [4,2],
  [4,3],
  [4,4],
  [4,5],
  [4,6],
  [4,7],
  [5,0],
  [5,2],
  [5,3],
  [5,5]
];
const labels = Array.from({ length: tiles.length + 1 }, (_, i) => i);

// Function to reverse edge orientation label
function flipEdge(edge) {
  if (edge == 1) {
    return 1;
  } else if (edge == 2) {
    return 3;
  } else if (edge == 3) {
    return 2;
  } else if (edge == -1) {
    return -1;
  } else if (edge == -2) {
    return -3;
  } else if (edge == -3) {
    return -2;
  } else {
    return edge;
  }
}

// Function to rotate/flip a proto-tile
function transformTile(tile, trans) {
  const edges = tile.edges;

  if (trans == 0) {
    return tile;
  } else if (trans == 1) { // flip x
    return {
      tile: tile.tile.map(([x, y]) => [-x, y]),
      lines: tile.lines.map(line => line.map(([x, y]) => [-x, y])),
      edges: [edges[0],edges[3],edges[2],edges[1],edges[4]].map(flipEdge),
    };
  } else if (trans == 2) { // flip y
    return {
      tile: tile.tile.map(([x, y]) => [x, -y]),
      lines: tile.lines.map(line => line.map(([x, y]) => [x, -y])),
      edges: [edges[2],edges[1],edges[0],edges[3],edges[4]].map(flipEdge),
    };
  } else if (trans == 3) { // rotate 90deg counter clockwise
    return {
      tile: tile.tile.map(([x, y]) => [-y, x]),
      lines: tile.lines.map(line => line.map(([x, y]) => [-y, x])),
      edges: [edges[1],edges[2],edges[3],edges[0],edges[4]]
    };
  } else if (trans == 4) { // rotate 180deg counter clockwise
    return {
      tile: tile.tile.map(([x, y]) => [-x, -y]),
      lines: tile.lines.map(line => line.map(([x, y]) => [-x, -y])),
      edges: [edges[2],edges[3],edges[0],edges[1],edges[4]],
    };
  } else if (trans == 5) { // rotate 270deg counter clockwise
    return {
      tile: tile.tile.map(([x, y]) => [y, -x]),
      lines: tile.lines.map(line => line.map(([x, y]) => [y, -x])),
      edges: [edges[3],edges[0],edges[1],edges[2],edges[4]]
    };
  } else if (trans == 6) { // flip along diagonal /
    return {
      tile: tile.tile.map(([x, y]) => [y, x]),
      lines: tile.lines.map(line => line.map(([x, y]) => [y, x])),
      edges: [edges[1],edges[0],edges[3],edges[2],edges[4]].map(flipEdge)
    };
  } else if (trans == 7) { // flip along diagonal \
    return {
      tile: tile.tile.map(([x, y]) => [-y, -x]),
      lines: tile.lines.map(line => line.map(([x, y]) => [-y, -x])),
      edges: [edges[3],edges[2],edges[1],edges[0],edges[4]].map(flipEdge)
    };
  }
}

// Function to draw a shape given its edge coordinates
function drawTiling(fillColor = null, strokeColor = 'gray') {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (debug) {
    for (let i = 0; i < xmax; i++) {
      for (let j = 0; j < ymax; j++) {
        ctx.font = "10px Arial";
        ctx.fillStyle = "red";
        if (wavefunction[i][j].includes(0) || wavefunction[i][j].includes(1) || wavefunction[i][j].includes(2) || wavefunction[i][j].includes(3)) {
          ctx.fillText(wavefunction[i][j].length, geoScale * (80 * i), geoScale * (80 * j));
        } else if (!(wavefunction[i][j].length == 0)) {
          ctx.fillStyle = "blue";
          ctx.fillText(wavefunction[i][j].length, geoScale * (80 * i), geoScale * (80 * j));
        }
      }
    }
  }

  tiling.forEach(tileData => {
    const xpos = tileData[0];
    const ypos = tileData[1];
    const label = tileData[2];
    const coordinates = transformTile(robinsonTiles[tiles[label][0]],tiles[label][1]).tile;
    const lines = transformTile(robinsonTiles[[tiles[label][0]]],tiles[label][1]).lines;

    if (coordinates.length < 2) {
        console.error('At least two points are needed to draw a shape.');
        return;
    }

    // Debug
    if (debug) {
      const edges = transformTile(robinsonTiles[tiles[label][0]],tiles[label][1]).edges;
      ctx.font = "10px Arial";
      ctx.fillText(edges[0], geoScale * (80 * xpos), geoScale * (80 * ypos + 30));
      ctx.fillText(edges[1], geoScale * (80 * xpos + 30), geoScale * (80 * ypos));
      ctx.fillText(edges[2], geoScale * (80 * xpos), geoScale * (80 * ypos - 30));
      ctx.fillText(edges[3], geoScale * (80 * xpos - 30), geoScale * (80 * ypos));
      ctx.fillStyle = "green";
      ctx.font = "15px Arial";
      ctx.fillText(tiles[label][0], geoScale * (80 * xpos), geoScale * (80 * ypos));
    }

    ctx.beginPath();
    ctx.fillStyle = "black";
    // Move to the first coordinate
    ctx.moveTo(geoScale * (80 * xpos + coordinates[0][0]), geoScale * (80 * ypos + coordinates[0][1]));

    // Draw lines to the subsequent coordinates
    for (let i = 1; i < coordinates.length; i++) {
        ctx.lineTo(geoScale * (80 * xpos + coordinates[i][0]), geoScale * (80 * ypos + coordinates[i][1]));
    }

    // Close the shape by connecting the last point to the first
    ctx.closePath();

    // Fill the shape if a fill color is specified
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    // Stroke the shape
    ctx.strokeStyle = strokeColor;
    ctx.stroke();

    // Draw the lines
    lines.forEach(line => {
      ctx.beginPath();
      // Move to the first coordinate
      ctx.moveTo(geoScale * (80 * xpos + line[0][0]), geoScale * (80 * ypos + line[0][1]));

      // Draw lines to the subsequent coordinates
      for (let i = 1; i < line.length; i++) {
          ctx.lineTo(geoScale * (80 * xpos + line[i][0]), geoScale * (80 * ypos + line[i][1]));
      }
      // Close the shape by connecting the last point to the first
      //ctx.closePath();

      ctx.strokeStyle = "blue";
      ctx.stroke();
    });
  });
}

// Finds the set of allowed tiles around a given tile
// [[dx,dy],[[tile num, trans],...]]
function wavefunctioncollapseRules(label) {
  const tile = tiles[label];
  const edges = transformTile(robinsonTiles[tile[0]],tile[1]).edges;
  var rules = [];

  // Force dx = 2 rules for the first proto tiles
  if (tile[0] == 0 && tile[1] == 0) {
    rules.push([[2,0],[1]]);
    rules.push([[0,2],[2]]);
    rules.push([[-2,0],[1]]);
    rules.push([[0,-2],[2]]);
  } else if (tile[0] == 0 && tile[1] == 1) {
    rules.push([[2,0],[0]]);
    rules.push([[0,2],[3]]);
    rules.push([[-2,0],[0]]);
    rules.push([[0,-2],[3]]);
  } else if (tile[0] == 0 && tile[1] == 2) {
    rules.push([[2,0],[3]]);
    rules.push([[0,2],[0]]);
    rules.push([[-2,0],[3]]);
    rules.push([[0,-2],[0]]);
  } else if (tile[0] == 0 && tile[1] == 4) {
    rules.push([[2,0],[2]]);
    rules.push([[0,2],[1]]);
    rules.push([[-2,0],[2]]);
    rules.push([[0,-2],[1]]);
  }

  // Search for suitable neighbours within all possible tiles
  const searchPositions = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  searchPositions.forEach(pos => {
    var rule = [pos,[]];
    tiles.forEach((rt, i) => {
      const rtEdges = transformTile(robinsonTiles[rt[0]],rt[1]).edges;
      if (pos[0] == 0 && pos[1] == 1) {
        if (edges[0] + rtEdges[2] == 0) {
          rule[1].push(i);
        }
      } else if (pos[0] == 1 && pos[1] == 0) {
        if (edges[1] + rtEdges[3] == 0) {
          rule[1].push(i);
        }
      } else if (pos[0] == 0 && pos[1] == -1) {
        if (edges[2] + rtEdges[0] == 0) {
          rule[1].push(i);
        }
      } else if (pos[0] == -1 && pos[1] == 0) {
        if (edges[3] + rtEdges[1] == 0) {
          rule[1].push(i);
        }
      } else {
        if (edges[4] != rtEdges[4]) {
          rule[1].push(i);
        }
      }
    });

    // don't add rule if no neighbours were found
    if (rule[1].length > 0) {
      rules.push(rule);
    }
  });

  return rules;
}

function wavefunctioncollapse(wavefunction) {
  var colx;
  var coly;
  var colTile;

  // If tiling is empty, add random tile
  if (tiling.length == 0) {
    randx = Math.floor(Math.random() * xmax);
    randy = Math.floor(Math.random() * ymax);
    randtile = Math.floor(Math.random() * tiles.length);

    wavefunction[randx][randy] = [randtile];
    entropies[randx][randy] = 0;
    tiling = [[randx,randy,randtile]];

    colx = randx;
    coly = randy;
    colTile = randtile;
  } else {

    // Find highest entropy
    var toCollapse = entropies.reduce(
      (acc, row, i) =>
          row.reduce((innerAcc, val, j) => {
              if (val > innerAcc.max) {
                  return { max: val, indices: [i, j] };
              }
              return innerAcc;
          }, acc),
      { max: -1, indices: [] }
    );
    //console.log("Highest entropy: ", toCollapse.max, toCollapse.indices);
    // Overwrite highest entropy state if there are uncollapsed unique states
    overWrite = false;
    totalLoop: for (let i = 0; i < xmax; i++) {
      for (let j = 0; j < ymax; j++) {
        if (entropies[i][j] != 0 && wavefunction[i][j].length == 1) {
          toCollapse = {max: entropies[i][j], indices: [i,j]};
          break totalLoop;
        }
      }
    }

    // Collapse highest entropy state
    if (toCollapse.max == 0) {
      return;
    } else {
      // Highest entropy state data
      colx = toCollapse.indices[0];
      coly = toCollapse.indices[1];
      //console.log("Highest entropy: ", colx, coly);
      colTile = wavefunction[colx][coly][Math.floor(Math.random() * wavefunction[colx][coly].length)];

      wavefunction[colx][coly] = [colTile]
      entropies[colx][coly] = 0;
      tiling.push([colx, coly, colTile]);
    }
  }

  rules = wavefunctioncollapseRules(colTile);
  //console.log("Rules: ", rules);
  rules.forEach(rule => {
    const x = colx + rule[0][0];
    const y = coly + rule[0][1];
    if (!(x < 0 || x >= xmax || y < 0 || y >= ymax)) {
      if (!wavefunction[x][y].length == 1) {
      
        if (wavefunction[x][y].length == 0) {
          wavefunction[x][y] = labels;
        }

        // Only keep tile labels allowed by the rules
        wavefunction[x][y] = wavefunction[x][y].filter(num => rule[1].includes(num));

        if (wavefunction[x][y].length == 1) {
          // collapse state if it's unique
          //entropies[x][y] = 0
          //console.log("collapsing: ", wavefunction[x][y][0]);
          //tiling.push([x,y,wavefunction[x][y][0]]);
          //console.log("hello");
          //test(wavefunctioncollapseRules(wavefunction[x][y][0]));
        } else {
          // otherwise assign non-zero entropy
          entropies[x][y] = wavefunction[x][y].length;
        }
      }
    }
  });
}

//document.addEventListener("keydown", (key) => {
//  if (key.key == "ArrowRight") {
//    wavefunctioncollapse(wavefunction);
//  } else if (key.key == "ArrowLeft") {
//    const lastTile = tiling[tiling.length-1];
//    tiling = tiling.filter((_, i) => i !== tiling.length-1);
//    wavefunction[lastTile[0]][lastTile[1]] = [];
//  }
//  drawTiling();
//});
function GEOanimate() {
  if (animateGEO) {
    wavefunctioncollapse(wavefunction);
    drawTiling();
  }
  requestAnimationFrame(GEOanimate);
}
//---------------------------------------

//---------- Particle Simulation ----------
const b = 0.01; // magnetic field strength
const e = 0.01; // Coulomb force strength
const particleInfo = [
  {type: "e", color: "rgb(0, 142, 250)", radius: 3, charge: -1, hl: 500, display: "electron"},
  {type: "ep", color: "rgb(0, 250, 250)", radius: 3, charge: 1, hl: 500, display: "positron"},
  {type: "nue", color: "rgb(90, 136, 136)", radius: 3, charge: 0, hl: 100000, display: "electron neutrino"},
  {type: "mu", color: "rgb(142, 0, 250)", radius: 5, charge: -1, hl: 100000, display: "muon"},
  {type: "mup", color: "rgb(250, 0, 250)", radius: 5, charge: 1, hl: 100000, display: "anti muon"},
  {type: "numu", color: "rgb(136, 90, 136)", radius: 3, charge: 0, hl: 100000, display: "muon neutrino"},
  {type: "tau", color: "rgb(250, 250, 0)", radius: 7, charge: -1, hl: 200, display: "tauon"},
  {type: "taup", color: "rgb(250, 142, 0)", radius: 7, charge: 1, hl: 200, display: "anti tauon"},
  {type: "nutau", color: "rgb(136, 136, 90)", radius: 3, charge: 0, hl: 100000, display: "tauon neutrino"},
  {type: "Z", color: "rgb(140, 140, 0)", radius: 10, charge: 0, hl: 200, display: "Z boson"},
  {type: "Wp", color: "rgb(30, 140, 0)", radius: 10, charge: 1, hl: 200, display: "W plus boson"},
  {type: "Wm", color: "rgb(140, 30, 0)", radius: 10, charge: -1, hl: 200, display: "W minus boson"},
  {type: "ph", color: "rgb(250, 90, 0)", radius: 3, charge: 0, hl: 10000, display: "photon"},
  {type: "H", color: "rgb(30, 30, 30)", radius: 20, charge: 0, hl: 100, display: "Higgs boson"}
  //{type: "u", color: "rgb(255, 30, 30)", radius: 2, charge: 0.6, hl: 100000, display: "up quark"},
  //{type: "ub", color: "rgb(0, 225, 225)", radius: 2, charge: -0.6, hl: 100000, display: "anti up quark"},
  //{type: "d", color: "rgb(30, 255, 30)", radius: 2, charge: -0.3, hl: 100000, display: "down quark"},
  //{type: "db", color: "rgb(225, 0, 225)", radius: 2, charge: 0.3, hl: 100000, display: "anti down quark"}
];
const decayTable = [
  {type: "e", decay: [["e","ph"],["Wm","nue"]], cumprob: [0.3, 0.4]},
  {type: "ep", decay: [["ep","ph"],["Wp","nue"]], cumprob: [0.3, 0.4]},
  {type: "mu", decay: [["e","Z"]], cumprob: [0.2]},
  {type: "mup", decay: [["ep","Z"]], cumprob: [0.2]},
  {type: "tau", decay: [["mu","Z"],["e","Z"]], cumprob: [0.4, 0.8]},
  {type: "taup", decay: [["mup","Z"],["ep","Z"]], cumprob: [0.4, 0.8]},
  {type: "Wm", decay: [["e","nue"],["mu","numu"],["tau","nutau"]], cumprob: [0.5, 0.8, 1]},
  {type: "Wp", decay: [["ep","nue"],["mup","numu"],["taup","nutau"]], cumprob: [0.5, 0.8, 1]},
  {type: "Z", decay: [["e","ep"],["mu","mup"],["tau","taup"]], cumprob: [0.4, 0.7, 1]},
  {type: "ph", decay: [["e","ep"],["mu","mup"],["tau","taup"]], cumprob: [0.2, 0.3, 0.35]},
  {type: "H", decay: [["Wp","Wm"],["Z","Z"],["ph","Z"]], cumprob: [0.3, 0.6, 1]}
];
const interactionTable = [
  {in: ["e","ep"], out: ["ph","Z"], cumprob: [0.8, 1]},
  {in: ["mu","mup"], out: ["ph","Z"], cumprob: [0.8, 1]},
  {in: ["tau","taup"], out: ["ph","Z"], cumprob: [0.8, 1]},
  {in: ["Wp","nue"], out: ["ep"], cumprob: [1]},
  {in: ["Wm","nue"], out: ["e"], cumprob: [1]},
  {in: ["Wp","numu"], out: ["mup"], cumprob: [1]},
  {in: ["Wm","numu"], out: ["mu"], cumprob: [1]},
  {in: ["Wp","nutau"], out: ["taup"], cumprob: [1]},
  {in: ["Wm","nutau"], out: ["tau"], cumprob: [1]},
  {in: ["ph","e"], out: ["e"], cumprob: [1]},
  {in: ["ph","ep"], out: ["ep"], cumprob: [1]},
  {in: ["ph","mu"], out: ["mu"], cumprob: [1]},
  {in: ["ph","mup"], out: ["mup"], cumprob: [1]},
  {in: ["ph","tau"], out: ["tau"], cumprob: [1]},
  {in: ["ph","taup"], out: ["taup"], cumprob: [1]},
  {in: ["ph","Wm"], out: ["Wm"], cumprob: [1]},
  {in: ["ph","Wp"], out: ["Wp"], cumprob: [1]},
  {in: ["ph","Z"], out: ["Z"], cumprob: [1]},
  {in: ["ph","ph"], out: ["H"], cumprob: [1]},
  {in: ["Wp","Wm"], out: ["H"], cumprob: [1]},
  {in: ["Z","Z"], out: ["H"], cumprob: [1]}
];
var particlesAdd = [];
var particlesRemove = [];
var particles = [];

// Create the info box that counts particles
const infoBox = document.createElement("div");
infoBox.style.position = "fixed";
infoBox.style.bottom = "10px";
infoBox.style.right = "10px";
infoBox.style.backgroundColor = "white";
infoBox.style.border = "1px solid black";
infoBox.style.borderRadius = "8px";
infoBox.style.padding = "10px";
infoBox.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
infoBox.style.fontFamily = "Arial, sans-serif";
infoBox.style.fontSize = "14px";
infoBox.style.color = "#333";
infoBox.style.display = "none";
document.body.appendChild(infoBox);

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
    if (particle.time > phl * (1 + Math.random())) {
      const dindex = decayTable.findIndex(item => item.type === particle.type);
      
      if (dindex != -1) {
        var decay = decayTable[dindex].cumprob.findIndex(prob => Math.random() <= prob);

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

function QFTinteract() {
  particles.forEach((particle, pindex) => {
    if (particle.time > 100) { // Only allow older particles to interact
      for (let i = 0; i < particles.length && i != pindex; i++) {
        if (Math.pow(particle.x - particles[i].x, 2) + Math.pow(particle.y - particles[i].y, 2) < 100) { // Search all other particles in a radius of 10
          interaction = interactionTable.findIndex(item => (item.in[0] === particle.type && item.in[1] === particles[i].type) || (item.in[1] === particle.type && item.in[0] === particles[i].type));
          if (interaction != -1) {
            //Remove the interacting particles
            particlesRemove.push(pindex, i);

            var out = interactionTable[interaction].cumprob.findIndex(prob => Math.random() <= prob);

            // get average position and com speed
            const px = (particle.x + particles[i].x)/2;
            const py = (particle.y + particles[i].y)/2;
            const vx = (particle.vx + particles[i].vx) * 0.9;
            const vy = (particle.vy + particles[i].vy) * 0.9;

            // Append to list of particles to add
            particlesAdd.push({type: interactionTable[interaction].out[out], x: px, y: py, vx: vx, vy: vy, time: 0});
          }
        }
      }
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

    if (pcharge != 0) {
      // Calculate forces from all charged particles
      for (let i = 0; i < particles.length; i++) {
        const pcharge2 = particleInfo[particleInfo.findIndex(item => item.type === particles[i].type)].charge;
        if (pcharge2 != 0) {
          const dx = (particle.x - particles[i].x);
          const dy = (particle.y - particles[i].y);
          const eforce = e * pcharge2 * pcharge / Math.sqrt(0.1 + dx*dx + dy*dy);

          force.fx += dx * eforce;
          force.fy += dy * eforce;
        }
      }
      // Add force due to constant magnetic field
      force.fx += pcharge * particle.vy * b;
      force.fy += -pcharge * particle.vx * b;

      particle.vx += force.fx;
      particle.vy += force.fy;
    }
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.time += 1;

    if (particle.x < 0 || particle.x > canvas.width) {
      particle.vx = -particle.vx;
      if (particle.x < 0) {
        particle.x = 0;
      } else {
        particle.x = canvas.width;
      }
    }
    if (particle.y < 0 || particle.y > canvas.height) {
      particle.vy = -particle.vy;
      if (particle.y < 0) {
        particle.y = 0;
      } else {
        particle.y = canvas.height;
      }
    }
  });
}

// Function to update the info box
function updateInfoBox() {
  // Clear existing content
  infoBox.innerHTML = "";

  if (particles.length > 0) {
    infoBox.style.display = "inherit";
    // Count occurrences of each type
    const typeCounts = particles.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    // Add the updated content
    Object.keys(typeCounts).forEach(type => {
      const color = particleInfo[particleInfo.findIndex(item => item.type === type)].color;
      const display = particleInfo[particleInfo.findIndex(item => item.type === type)].display;

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.marginBottom = "5px";

      const colorBox = document.createElement("div");
      colorBox.style.width = "12px";
      colorBox.style.height = "12px";
      colorBox.style.backgroundColor = color;
      colorBox.style.marginRight = "8px";
      colorBox.style.border = "1px solid #000";

      const text = document.createElement("span");
      text.textContent = `${display}: ${typeCounts[type]}`;

      row.appendChild(colorBox);
      row.appendChild(text);
      infoBox.appendChild(row);
    });
  } else {
    infoBox.style.display = "none";
  }
}

// Animation loop
function QFTanimate() {
  if (animateQFT) {
    QFTinteract();
    QFTdecay();
    QFTupdatePositions();
    QFTdrawParticles();
  }
  updateInfoBox();
  requestAnimationFrame(QFTanimate);
}
//-----------------------------------------

//---------- Start all animations ----------
animateGR = false;
animateQFT = false;
animateGEO = false;
QFTanimate();
GRanimate();
GEOanimate();
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
    animateGEO = false;
    planets = [];
    tiling = [];
    canvas.style.zIndex = '1000'; // Ensure the canvas at the front

    var ptype = particleInfo[Math.floor(Math.random() * particleInfo.length)].type;
    particles.push({type: ptype,x: Math.floor(Math.random() * canvas.width), y: Math.floor(Math.random() * canvas.height), vx: Math.random(), vy: Math.random(), time: 0});

    // Start the animation with three random particles
    if (!animateQFT) {
      animateQFT = true;
      for (let i = 0; i<4; i++) {
        ptype = particleInfo[Math.floor(Math.random() * particleInfo.length)].type;
        particles.push({type: ptype,x: Math.floor(Math.random() * canvas.width), y: Math.floor(Math.random() * canvas.height), vx: 0.5 * Math.random(), vy: 0.5 * Math.random(), time: 0});
      }
    }

    userInput = []; // Reset the input after triggering
  }
  if (userInput.slice(-secret_3.length).join('') === secret_3.join('')) {
    console.log('You found a secret!'); // Trigger the animation
    // Stop the other simulations
    animateQFT = false;
    animateGEO = false;
    particles = [];
    tiling = [];
    canvas.style.zIndex = '1000'; // Ensure the canvas at the front

    // Add a new planet
    const massradius = Math.floor(Math.random() * 40);
    planets.push({ x: Math.floor(Math.random() * canvas.width), y: Math.floor(Math.random() * canvas.height), radius: massradius, mass: massradius/10, vx: 2*(Math.random()-0.5), vy: 2*(Math.random()-0.5), color: 'black' });

    // Start the animation
    if (!animateGR) {
      animateGR = true;
      const massradius = Math.floor(Math.random() * 40);
      planets.push({ x: Math.floor(Math.random() * canvas.width), y: Math.floor(Math.random() * canvas.height), radius: massradius, mass: massradius/10, vx: 2*(Math.random()-0.5), vy: 2*(Math.random()-0.5), color: 'black' });
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
    resetGEO();
    canvas.style.zIndex = '-1'; // Ensure the canvas at the back

    // Start the animation
    if (!animateGEO) {
      animateGEO = true;
    }

    userInput = []; // Reset the input after triggering
  }
});