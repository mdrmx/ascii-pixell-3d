// let cam;
// let angle = 0;
// let angle2 = 0;
// let angle3 = 0;

// function setup() {
//   createCanvas(1000, 1000, WEBGL);
//   cam = createCamera();
//   pixelDensity(1);
//   smooth();
//   camera(0, 0, 250);
// }
// let camz = 0;
// function draw() {
//   orbitControl();
//   ambientLight(255, 0, 255);
//   noStroke();
//   // Move the camera to the top-right.

//   // camz += 0.1;
//   let xoff = sin(angle2) * 2000;
//   let yoff = sin(angle2) * 1200;
//   // camera(xoff, 0, yoff);
//   // cam.lookAt(0, 0, 0);
//   // background(0);
//   for (let i = 0; i < 100; i++) {
//     normalMaterial();
//     // angle2 = sin(frameCount * 0.01) * 0.8;
//     // angle2 = tan(frameCount * 0.001) * 0.2;
//     rotateX(sin(angle));
//     rotateY(tan(angle) * 0.5);
//     rotateZ(cos(angle) * 0.02);
//     // rotateZ(angle * 1.2);
//     torus(10 + i * 6, 8, 24, 16);
//     angle += 0.000002;
//   }
// }

let cam;
let camz = 0;
let ctx;
let font;

//ring variables
let numRings = 30;
let ringRadius = 20;
let ringSpacing = 20;

let angle = 0;
let angle2 = 0;
let angle3 = 0;
let angleIncrement = 0.00002;
let distanceFromCamera = 280;
let distanceFromCamera2 = 280;

// ascii variables
let ascii = false;
let eraseBackground = true;
let gridSize = 15;
let chars = "○@#8&%*+=-:….   ";
let mapChars = (brightness) => {
  let index = floor(map(brightness, 0, 255, chars.length - 1, 0));
  return chars.charAt(index);
};

//3D Model
let object;
// let objectPath = "assets/skull/source/craneo.OBJ";
let objectPath =
  "assets/napoleon/source/3D_MNK_A_810_Popiersie_Napoleona/3D_MNK_A_810_Popiersie_Napoleona.obj";

// Set the shape variable and print the geometry's
// ID to the console.
function handleModel(data) {
  object = data;
  console.log(object.gid);
}

// Print an error message if the file doesn't load.
function handleError(error) {
  console.error("Oops! Cannot load model", error);
}

async function setup() {
  createCanvas(1000, 1400);

  pixelDensity(1);

  font = await loadFont("assets/C64_Pro_Mono-STYLE.ttf");
  textFont(font);
  textAlign(CENTER, CENTER);

  let options = {
    fileType: ".obj",
    normalize: true,
    successCallback: handleModel,
    failureCallback: handleError,
  };

  const loaded = await loadModel(objectPath, options);
  if (loaded) object = loaded;
  // drop the .mtl colors so normalMaterial isn't overridden by vertex colors
  object.vertexColors = [];
  // this OBJ has no vn entries, so normals come back all zero
  object.computeNormals();

  ctx = createGraphics(1000, 1400, WEBGL);
  ctx.pixelDensity(1);
}

function draw() {
  background(25);

  if (eraseBackground) {
    ctx.background(0);
  }

  // ctx.noStroke();
  ctx.normalMaterial();

  // distanceFromCamera = sin(frameCount * 0.01) * 600; // Adjust this value to move the rings closer or further away
  // distanceFromCamera2 = cos(frameCount * 0.01) * 800;
  ctx.push();

  ctx.translate(0, 0, distanceFromCamera);
  for (let i = 0; i < numRings; i++) {
    ctx.rotateX(sin(angle));
    ctx.rotateY(sin(angle) * 0.1);
    ctx.rotateZ(sin(angle3) * 0.9);

    // ctx.torus(ringSpacing + i * ringSpacing, ringRadius + i / 5, 24, 16);

    angle += angleIncrement;
    angle3 += angleIncrement * 2;
  }

  ctx.pop();
  ctx.ambientLight(255);
  // p5.js 2.x does not expose model() on secondary WEBGL graphics buffers.
  if (object?.vertices?.length) {
    ctx.push();
    ctx.scale(4.5);
    ctx.rotateY(frameCount * 0.01);
    // ctx.rotateY(PI + 0.4);
    ctx.rotateX(PI);
    ctx._renderer.model(object);
    ctx.pop();
  }
  // image(ctx, 0, 0, width, height);

  // Run your ASCII pixel sampling and drawing here.
  //sample ctx and draw ASCII characters based on pixel brightness or color.
  ctx.loadPixels();
  textSize(gridSize);
  // console.log(ctx.pixels);
  for (let y = 0; y < height; y += gridSize) {
    for (let x = 0; x < width; x += gridSize) {
      let index = (x + y * width) * 4;
      let r = ctx.pixels[index];
      let g = ctx.pixels[index + 1];
      let b = ctx.pixels[index + 2];

      let brightness = (r + g + b) / 3;
      let char = mapChars(brightness);

      if (brightness > 10) {
        if (ascii) {
          // fill(r, g, b);
          fill(230);
          text(char, x, y);
        } else {
          noStroke();
          fill(r, g, b);
          rect(x, y, gridSize, gridSize);
        }
      }
    }
  }
}
