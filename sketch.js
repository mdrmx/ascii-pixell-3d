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
let ascii = true;
let eraseBackground = true;
let gridSize = 10;
// let chars = "○@#8&%*+=-:….   ";
let chars = "     ░▒▓▔▕▖▗▘▙▚▛▜▝▞▟";
let mapChars = (brightness, inverted) => {
  let index;
  if (inverted) {
    index = floor(map(brightness, 0, 255, chars.length - 1, 0));
  } else {
    index = floor(map(brightness, 0, 255, 0, chars.length - 1));
  }
  return chars.charAt(index);
};

//3D Model
let object;
let objectPath;
let selectedModel = 0;
let rotateY = false;
let rotateYvalue = -1.2;

let models = [
  {
    name: "skull",
    path: "assets/sugarSkull/untitled.obj",
    scale: 2.8,
    flipV: true, // textures were authored for glTF (V origin at top)
    texture:
      "assets/sugarSkull/textures/Color_4bf91c65-c73f-47b4-b95f-85d6f1e1e4c1_0.jpeg",
  },
  {
    name: "dinoSkull",
    path: "assets/dinoSkull/untitled.obj",
    scale: 2.9,
    flipV: true, // textures were authored for glTF (V origin at top)
    texture: "assets/dinoSkull/textures/SM_Velociraptor1M_u1_v1_diffuse_0.png",
  },
  {
    name: "napoleon",
    path: "assets/napoleon/source/3D_MNK_A_810_Popiersie_Napoleona/3D_MNK_A_810_Popiersie_Napoleona.obj",
    scale: 3.5,
    texture:
      "assets/napoleon/source/3D_MNK_A_810_Popiersie_Napoleona/810_Diffuse.jpg",
  },
];

function handleModel(data) {
  object = data;
}

// Print an error message if the file doesn't load.
function handleError(error) {
  console.error("Oops! Cannot load model", error);
}

//materials
// "normal" | "specular" | "texture"
let materialMode = "normal";
let textures = {};
let materialSelect;

function availableModes() {
  const modes = ["normal", "specular"];
  if (textures[selectedModel]) modes.push("texture");
  return modes;
}

function updateMaterialSelect() {
  const modes = availableModes();
  if (!modes.includes(materialMode)) {
    materialMode = "normal";
  }

  materialSelect.elt.replaceChildren();
  modes.forEach((mode) => {
    materialSelect.option(mode);
  });
  materialSelect.selected(materialMode);
}

function keyPressed() {
  if (key === "m" || key === "M") {
    const modes = availableModes();
    materialMode = modes[(modes.indexOf(materialMode) + 1) % modes.length];
    materialSelect.selected(materialMode);
  }
}

function buildUI() {
  const menuDiv = createDiv();
  menuDiv.id("menu");
  menuDiv.style("position", "absolute");
  menuDiv.style("top", "10px");
  menuDiv.style("left", "10px");
  menuDiv.style("background-color", "rgba(0, 0, 0, 0.5)");
  menuDiv.style("padding", "10px");
  menuDiv.style("border-radius", "5px");
  menuDiv.style("color", "#fff");

  const modelSelect = createSelect();
  modelSelect.parent(menuDiv);
  models.forEach((model, index) => {
    modelSelect.option(model.name, index);
  });
  modelSelect.selected(selectedModel);
  modelSelect.changed(() => {
    selectedModel = int(modelSelect.value());
    updateMaterialSelect();
    loadModel(models[selectedModel].path, {
      fileType: ".obj",
      normalize: true,
      successCallback: handleModel,
      failureCallback: handleError,
    }).then((loaded) => {
      if (loaded) object = loaded;
      object.vertexColors = [];
      object.computeNormals();
      if (models[selectedModel].flipV) {
        object.flipV();
      }
    });
  });

  materialSelect = createSelect();
  materialSelect.parent(menuDiv);
  updateMaterialSelect();
  materialSelect.changed(() => {
    materialMode = materialSelect.value();
  });

  const asciiCheckbox = createCheckbox("ASCII Mode", ascii);
  asciiCheckbox.parent(menuDiv);
  asciiCheckbox.changed(() => {
    ascii = asciiCheckbox.checked();
  });

  const invertMappingCheckbox = createCheckbox("Invert Mapping", false);
  invertMappingCheckbox.parent(menuDiv);
  invertMappingCheckbox.changed(() => {
    const inverted = invertMappingCheckbox.checked();
    mapChars = (brightness) => {
      let index;
      if (inverted) {
        index = floor(map(brightness, 0, 255, chars.length - 1, 0));
      } else {
        index = floor(map(brightness, 0, 255, 0, chars.length - 1));
      }
      return chars.charAt(index);
    };
  });

  const gridSizeNumInput = createInput(gridSize.toString(), "number");
  gridSizeNumInput.parent(menuDiv);
  gridSizeNumInput.input(() => {
    const value = parseInt(gridSizeNumInput.value());
    if (!isNaN(value) && value > 0) {
      gridSize = value;
    }
  });

  const rotateYcheckbox = createCheckbox("Rotate Y", false);
  rotateYcheckbox.parent(menuDiv);
  rotateYcheckbox.changed(() => {
    rotateY = rotateYcheckbox.checked();
  });
  const rotateYslider = createSlider(0, TWO_PI, PI, PI / 16);
  rotateYslider.parent(menuDiv);
  rotateYslider.input(() => {
    rotateYvalue = rotateYslider.value();
  });
}

async function setup() {
  createCanvas(900, 1200);
  buildUI();
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

  const loaded = await loadModel(models[selectedModel].path, options);
  if (loaded) object = loaded;
  // drop the .mtl colors so normalMaterial isn't overridden by vertex colors
  object.vertexColors = [];
  // this OBJ has no vn entries, so normals come back all zero
  object.computeNormals();

  if (models[selectedModel].flipV) {
    object.flipV();
  }

  for (let i = 0; i < models.length; i++) {
    if (models[i].texture) {
      textures[i] = await loadImage(models[i].texture);
    }
  }
  updateMaterialSelect();

  ctx = createGraphics(900, 1200, WEBGL);
  ctx.pixelDensity(1);
}

function draw() {
  background(25);

  if (eraseBackground) {
    ctx.background(0);
  }

  // ctx.normalMaterial();

  // ctx.push();

  // ctx.translate(0, 0, distanceFromCamera);
  // for (let i = 0; i < numRings; i++) {
  //   ctx.rotateX(sin(angle));
  //   ctx.rotateY(sin(angle) * 0.1);
  //   ctx.rotateZ(sin(angle3) * 0.9);

  //   ctx.torus(ringSpacing + i * ringSpacing, ringRadius + i / 5, 24, 16);

  //   angle += angleIncrement;
  //   angle3 += angleIncrement * 2;
  // }
  // ctx.pop();

  ctx.noLights();
  if (materialMode === "texture" && textures[selectedModel]) {
    ctx.noStroke();
    ctx.ambientLight(255);
    ctx.texture(textures[selectedModel]);
  } else if (materialMode === "specular") {
    ctx.noStroke();
    // ctx.ambientLight(30);
    ctx.directionalLight(200, 200, 200, 0.3, 0.5, -1);
    ctx.pointLight(200, 200, 200, 300, -300, 400);
    ctx.fill(89, 0, 220);
    ctx.specularMaterial(255);
    ctx.shininess(20);
  } else {
    ctx.ambientLight(255);
    ctx.normalMaterial();
  }
  // p5.js 2.x does not expose model() on secondary WEBGL graphics buffers.
  if (object?.vertices?.length) {
    ctx.push();
    ctx.scale(models[selectedModel].scale);
    if (rotateY) {
      ctx.rotateY(frameCount * 0.007);
    } else {
      ctx.rotateY(rotateYvalue);
    }

    ctx.rotateX(PI);
    ctx._renderer.model(object);
    ctx.pop();
  }

  // Run your ASCII pixel sampling and drawing here.
  //sample ctx and draw ASCII characters based on pixel brightness or color.
  ctx.loadPixels();
  textSize(gridSize);

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

  textSize(13);
  if (models[selectedModel].name === "skull") {
    fill("rgb(255, 255, 255)");
    text("Día de los Muertos______2026", width - 200, height - 30);
  }
  // image(ctx, 0, 0, width, height);
}
