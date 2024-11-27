let font;
let fonts = []; // Array de fuentes
let tSize = 150; // Tamaño inicial del texto
let tposX = 350; // Posición X del texto
let tposY = 500; // Posición Y del texto
let targetWidth = 300; // Ancho objetivo de la palabra
let pointCount = 0.1; // Número de partículas
let speed = 20000; // Velocidad de las partículas
let comebackSpeed = 100000; // Comportamiento de las partículas tras la interacción
let dia = 50; // Diámetro
let randomPos = true; // Posición inicial - true o false
let pointsDirection = "general"; // Direcciones posibles
let interactionDirection = 0.5; // Entre -1 y 1
let fillColor = [255, 255, 255, 0]; // Color de relleno inicial (transparente)
let lockParticles = false; // Controla si las partículas se concentran en el contorno
let changeFontContinuously = false; // Controla si el cambio de fuente es continuo

let textPoints = [];
let soundEffect;

// Precarga de múltiples fuentes
function preload() {
  fonts.push(loadFont("assets/BarlowCondensed-Medium.ttf"));
  fonts.push(loadFont("assets/Chunk Five Print.ttf"));
  fonts.push(loadFont("assets/CinzelDecorative-Black.ttf"));
  fonts.push(loadFont("assets/KronaOne-Regular.ttf"));
  fonts.push(loadFont("assets/Orbitron Bold.ttf"));
  fonts.push(loadFont("assets/Roboto-Light.ttf"));
  font = fonts[0]; // Establecemos una fuente inicial
  soundEffect = loadSound("starsound.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  recalculateTextPosition();
  setFontAndSize(font); // Configura la fuente inicial y ajusta el tamaño
  createTextPoints(); // Inicializa las partículas en el contorno
}

function draw() {
  background(100, 50, 200);

  // Cambia aleatoriamente la fuente en cada fotograma si está activado
  if (changeFontContinuously) {
    let randomFont = random(fonts);
    setFontAndSize(randomFont); // Ajusta la fuente y el tamaño
    createTextPoints(); // Vuelve a inicializar las partículas en el contorno
  }

  // Dibuja el texto con el relleno actual
  fill(fillColor);
  noStroke();
  text("cuki", tposX, tposY);

  // Dibuja las partículas
  for (let i = 0; i < textPoints.length; i++) {
    let v = textPoints[i];
    v.update();
    v.show();
    v.behaviors();
  }
}

// Cambia el estado de relleno, de bloqueo de partículas y tipografía al hacer clic
function mousePressed() {
  // Detecta si el clic está dentro de la palabra
  let d = dist(mouseX, mouseY, tposX, tposY - tSize / 2);
  if (d < tSize * 2) {
    // Asegura que está dentro de la palabra
    if (fillColor[3] === 0) {
      // Primer clic: cambia el color de relleno a blanco opaco
      fillColor = [255, 255, 255, 255];
    } else {
      // Segundo clic: activa el cambio continuo de tipografía
      changeFontContinuously = !changeFontContinuously;
    }
  }
  if (mouseX > width / 2 - tSize && mouseX < width / 2 + tSize
     && mouseY > height/2 - tSize && mouseY < height/2 + tSize) {
    soundEffect.play();
  }
}

// Función para configurar la fuente y ajustar el tamaño para el ancho objetivo
function setFontAndSize(selectedFont) {
  font = selectedFont;
  textFont(font);

  // Ajuste de tamaño de fuente para mantener el ancho objetivo
  textSize(tSize);
  let currentWidth = textWidth("cuki");
  tSize = tSize * (targetWidth / currentWidth); // Escala para mantener el mismo ancho
  textSize(tSize); // Aplica el tamaño ajustado
}

// Función para calcular y ajustar la posición centrada del texto
function recalculateTextPosition() {
  textSize(tSize);
  let textWidthAdjusted = textWidth("cuki");
  tposX = (width - textWidthAdjusted) / 2; // Centrado horizontal
  tposY = (height + tSize) / 2; // Centrado vertical
}

// Función para crear puntos en el contorno de las letras
function createTextPoints() {
  textPoints = [];
  let points = font.textToPoints("cuki", tposX, tposY, tSize, {
    sampleFactor: pointCount,
  });

  for (let i = 0; i < points.length; i++) {
    let pt = points[i];
    let textPoint = new Interact(
      pt.x,
      pt.y,
      speed,
      dia,
      randomPos,
      comebackSpeed,
      pointsDirection,
      interactionDirection
    );
    textPoints.push(textPoint);
  }
}

function Interact(x, y, m, d, t, s, di, p) {
  this.home = createVector(x, y); // Puntos en el contorno de la letra
  this.pos = t ? createVector(random(width), random(height)) : this.home.copy();
  this.target = this.home.copy();

  if (di == "general") {
    this.vel = createVector();
  } else if (di == "up") {
    this.vel = createVector(0, -y);
  } else if (di == "down") {
    this.vel = createVector(0, y);
  } else if (di == "left") {
    this.vel = createVector(-x, 0);
  } else if (di == "right") {
    this.vel = createVector(x, 0);
  }

  this.acc = createVector();
  this.r = 8;
  this.maxSpeed = m;
  this.maxforce = 1; // Corregido aquí
  this.dia = d;
  this.come = s;
  this.dir = p;
}

Interact.prototype.behaviors = function () {
  let arrive = this.arrive(this.target);
  this.applyForce(arrive);

  // Solo permite el efecto de huida si las partículas no están bloqueadas
  if (!lockParticles) {
    let mouse = createVector(mouseX, mouseY);
    let flee = this.flee(mouse);
    this.applyForce(flee);
  }
};

Interact.prototype.applyForce = function (f) {
  this.acc.add(f);
};

Interact.prototype.arrive = function (target) {
  let desired = p5.Vector.sub(target, this.pos);
  let d = desired.mag();
  let speed = this.maxSpeed;
  if (d < this.come) {
    speed = map(d, 0, this.come, 0, this.maxSpeed);
  }
  desired.setMag(speed);
  let steer = p5.Vector.sub(desired, this.vel);
  return steer;
};

Interact.prototype.flee = function (target) {
  let desired = p5.Vector.sub(target, this.pos);
  let d = desired.mag();

  if (d < this.dia) {
    desired.setMag(this.maxSpeed);
    desired.mult(this.dir);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxforce); // Corregido aquí
    return steer;
  } else {
    return createVector(0, 0);
  }
};

Interact.prototype.update = function () {
  this.pos.add(this.vel);
  this.vel.add(this.acc);
  this.acc.mult(0);
};

Interact.prototype.show = function () {
  stroke(255);
  strokeWeight(4);
  point(this.pos.x, this.pos.y);
};

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Recalcula las posiciones del texto y los puntos
  recalculateTextPosition();
  createTextPoints();
}
