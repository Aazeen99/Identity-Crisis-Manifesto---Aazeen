// =====================================================
// ZINDAGI TAMASHA BANI - INSTALLATION VERSION
// =====================================================

// Animated wave background
let bands = [];
let colors = [];

// Main calligraphy artwork
let calligraphy;

// Main font used for responses
let indieFlower;
let urduFont;
let hindiFont;

// Google Form responses
let responsePool = [];
let visibleResponses = [];
let keywords = [];
let aiWords = [];
let keywordCells = [];

// =====================================================
// EXHIBITION CONTROLS
// =====================================================

// Margin around screen edges
// Increase if projector crops the image.
// Typical range: 40–100
const MARGIN = 60;

// Published Google Sheet CSV URL
const CSV_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vS2UeAr0vBGQ22GarhkxI1OLjNipzqRk1H6OB_VYvbt0Dy5Dwlu5PH3V6GPK7AGu3Qkt0GEHtE4TiIB/pub?output=csv";

// =====================================================
// FULLSCREEN TOGGLE
// =====================================================

function keyPressed() {

  if (key === "f" || key === "F") {

    let fs = fullscreen();
    fullscreen(!fs);

  }
}

let lastTap = 0;

function touchStarted() {

  let now = millis();

  if (
    now - lastTap < 400
  ) {

    let fs = fullscreen();

    fullscreen(!fs);
  }

  lastTap = now;

  return false;
}

// =====================================================
// FETCH RESPONSES FROM GOOGLE SHEET
// =====================================================

async function fetchResponses() {

  try {

    let response = await fetch(CSV_URL);
    let csv = await response.text();

    let lines = csv.split("\n");

    responsePool = [];

    for (let i = 1; i < lines.length; i++) {

      let cols = lines[i].split(",");

      // Skip malformed rows

      if (cols.length >= 4) {

        let q1 = cols[1]
          .replace(/"/g, "")
          .trim()
          .toLowerCase();

        let q2 = cols[2]
          .replace(/"/g, "")
          .trim()
          .toLowerCase();

        let q3 = cols[3]
          .replace(/"/g, "")
          .trim()
          .toLowerCase();

        if (q1) responsePool.push(q1 + ".");
        if (q2) responsePool.push(q2 + ".");
        if (q3) responsePool.push(q3 + ".");
      }
    }

    // =================================================
    // INITIAL RESPONSE POPULATION
    //
    // Increase number if screen feels empty.
    // Decrease if screen feels crowded.
    // =================================================

    if (
      visibleResponses.length === 0 &&
      responsePool.length > 0
    ) {

      let amount =
        min(300, responsePool.length);

      for (let i = 0; i < amount; i++) {

        visibleResponses.push({

          text: random(responsePool),

          alpha: 180,

          replacing: false,

          fadingIn: false

        });
      }
    }

    // Mark a few responses for replacement

    for (let i = 0; i < 4; i++) {

      if (visibleResponses.length > 0) {

        let idx =
          floor(
            random(
              visibleResponses.length
            )
          );

        visibleResponses[idx].replacing = true;
      }
    }

  }

  catch (err) {

    console.log(err);

  }
}

// =====================================================
// SUBTLE RESPONSE REPLACEMENT
// =====================================================

function replaceRandomResponse() {

  if (
    visibleResponses.length === 0 ||
    responsePool.length === 0
  ) return;

  let idx =
    floor(
      random(
        visibleResponses.length
      )
    );

  visibleResponses[idx].replacing =
    true;
}


function loadKeywords() {

  loadJSON(
    "keywords.json",
    data => {

      keywords =
        data.keywords || [];

      console.log(
        "keywords loaded:",
        keywords
      );

    }
  );
}

function buildKeywordGrid() {

  if (!calligraphy) return;

  let scaleFactor =
    min(
      width / calligraphy.width,
      height / calligraphy.height
    ) * 0.5;

  let cw =
    calligraphy.width *
    scaleFactor;

  let ch =
    calligraphy.height *
    scaleFactor;

  let left =
    width / 2 - cw / 2;

  let right =
    width / 2 + cw / 2;

  let top =
    height / 2 - ch / 2;

  let bottom =
    height / 2 + ch / 2;

  keywordCells = [

    // 1
    {
      x: MARGIN,
      y: MARGIN,
      w: left - MARGIN,
      h: top - MARGIN
    },

    // 2
    {
      x: left,
      y: MARGIN,
      w: cw,
      h: top - MARGIN
    },

    // 3
    {
      x: right,
      y: MARGIN,
      w: width - right - MARGIN,
      h: top - MARGIN
    },

    // 4
    {
      x: MARGIN,
      y: top,
      w: left - MARGIN,
      h: ch
    },

    // 6
    {
      x: right,
      y: top,
      w: width - right - MARGIN,
      h: ch
    },

    // 7
    {
      x: MARGIN,
      y: bottom,
      w: left - MARGIN,
      h: height - bottom - MARGIN
    },

    // 8
    {
      x: left,
      y: bottom,
      w: cw,
      h: height - bottom - MARGIN
    },

    // 9
    {
      x: right,
      y: bottom,
      w: width - right - MARGIN,
      h: height - bottom - MARGIN
    }

  ];
}

function detectLanguage(word) {

  // Urdu / Arabic script

  if (
    /[\u0600-\u06FF]/.test(word)
  ) {
    return "urdu";
  }

  // Devanagari (Hindi)

  if (
    /[\u0900-\u097F]/.test(word)
  ) {
    return "hindi";
  }

  return "english";
}

function spawnChalkWord() {

  if (
    keywords.length === 0 ||
    keywordCells.length === 0
  ) return;

  // Which words are currently visible?

  let visibleWords =
    aiWords.map(
      w => w.text
    );

  // Remove already-visible words

  let availableWords =
    keywords.filter(
      word =>
        !visibleWords.includes(word)
    );

  if (
    availableWords.length === 0
  ) return;

  // Which cells are occupied?

  let occupiedCells =
    aiWords.map(
      w => w.cell
    );

  // Find free cells

  let availableCells = [];

  for (
    let i = 0;
    i < keywordCells.length;
    i++
  ) {

    if (
      !occupiedCells.includes(i)
    ) {

      availableCells.push(i);
    }
  }

  if (
    availableCells.length === 0
  ) return;

  let chosenWord =
    random(availableWords);

  let cellIndex =
    random(availableCells);

  let cell =
    keywordCells[cellIndex];

  let wordWidth =
    textWidth(chosenWord);

  let x;

if (
  detectLanguage(chosenWord) === "urdu"
) {

  x =
    random(
      cell.x +
      wordWidth +
      20,

      cell.x +
      cell.w -
      20
    );

}
else {

  x =
    random(
      cell.x + 20,

      max(
        cell.x + 21,

        cell.x +
        cell.w -
        wordWidth -
        20
      )
    );

}

  let y =
    random(
      cell.y + 40,
      cell.y +
      cell.h -
      40
    );

  aiWords.push({

    text: chosenWord,
    
    language:
    detectLanguage(
      chosenWord
    ),

    currentLength: 0,

    age: 0,

    x: x,

    y: y,

    cell: cellIndex

  });
}

// =====================================================
// SETUP
// =====================================================

function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );

  // ---------------------------------------------------
  // MAIN ARTWORK PNG
  // ---------------------------------------------------

loadImage(
  "calligraphy.png",
  img => {

    calligraphy = img;

    buildKeywordGrid();

  }
);

  // ---------------------------------------------------
  // RESPONSE FONT
  // ---------------------------------------------------

  loadFont(
    "indieflower.ttf",
    f => {

      indieFlower = f;

      console.log(
        "font loaded"
      );

    }
  );

  loadFont(
  "urdu.ttf",
  f => {

    urduFont = f;

    console.log(
      "urdu font loaded"
    );

  }
);

loadFont(
  "hindi.ttf",
  f => {

    hindiFont = f;

    console.log(
      "hindi font loaded"
    );

  }
);

  // ---------------------------------------------------
  // WAVE COLOUR PALETTE
  // ---------------------------------------------------

  colors = [

    color(180, 60, 80),
    color(210, 120, 70),
    color(220, 190, 90),
    color(100, 160, 120),

    color(180, 60, 80),
    color(210, 120, 70),
    color(220, 190, 90),
    color(100, 160, 120),

    color(180, 60, 80),
    color(210, 120, 70),
    color(220, 190, 90),
    color(100, 160, 120)

  ];

  buildBands();

  noStroke();

  fetchResponses();

  loadKeywords();

  // ---------------------------------------------------
  // CHECK FOR NEW FORM SUBMISSIONS
  // ---------------------------------------------------

  setInterval(
    fetchResponses,
    10000
  );

  setInterval(
  loadKeywords,
  60000
);

  // ---------------------------------------------------
  // RESPONSE CHANGE FREQUENCY
  //
  // 3000 = active
  // 5000 = subtle
  // 8000 = very subtle
  // ---------------------------------------------------

  setInterval(
    replaceRandomResponse,
    5000
  );

  setInterval(
  spawnChalkWord,
  3000
);
  
}

// =====================================================
// BUILD WAVES
// =====================================================

function buildBands() {

  bands = [];

  let spacing =
    width / (colors.length - 1);

  for (
    let i = 0;
    i < colors.length;
    i++
  ) {

    bands.push({

      x: i * spacing,

      w: spacing * 2.2,

      col: colors[i],

      offset: random(1000)

    });
  }
}

// =====================================================
// DRAW
// =====================================================

function draw() {

  background(colors[0]);

  // ===================================================
  // WAVES
  // ===================================================

  for (let b of bands) {

    fill(b.col);

    beginShape();

    for (
      let y = -50;
      y <= height + 50;
      y += 6
    ) {

      let wave =

        sin(
          y * 0.004 +
          frameCount * 0.008 +
          b.offset
        ) * 25 +

        sin(
          y * 0.0015 +
          frameCount * 0.004 +
          b.offset
        ) * 18;

      vertex(
        b.x + wave,
        y
      );
    }

    for (
      let y = height + 50;
      y >= -50;
      y -= 6
    ) {

      let wave =

        sin(
          y * 0.004 +
          frameCount * 0.008 +
          b.offset
        ) * 25 +

        sin(
          y * 0.0015 +
          frameCount * 0.004 +
          b.offset
        ) * 18;

      vertex(
        b.x + b.w + wave,
        y
      );
    }

    endShape(CLOSE);
  }

  // ===================================================
  // RESPONSE FADE TRANSITIONS
  // ===================================================

  for (let r of visibleResponses) {

    if (r.replacing) {

      // Fade out speed
      // Lower = smoother

      r.alpha -= 1;

      if (r.alpha <= 0) {

        r.alpha = 0;

        r.text =
          random(
            responsePool
          );

        r.replacing = false;

        r.fadingIn = true;
      }
    }

    else if (r.fadingIn) {

      // Fade in speed
      // Lower = smoother

      r.alpha += 1;

      if (r.alpha >= 180) {

        r.alpha = 180;

        r.fadingIn = false;
      }
    }
  }

  // ===================================================
  // BUILD RESPONSE TEXT STREAM
  // ===================================================

  let stream = "";

  for (let r of visibleResponses) {

    stream +=
      r.text + " ";
  }

  if (indieFlower) {

    textFont(
      indieFlower
    );

    // -----------------------------------------------
    // RESPONSE TEXT SIZE
    //
    // 20 = smaller
    // 26 = current
    // 32 = large wall projection
    // -----------------------------------------------

    textSize(26);

    // -----------------------------------------------
    // LINE SPACING
    // -----------------------------------------------

    textLeading(28);

    // -----------------------------------------------
    // TEXT OPACITY
    //
    // 100 = subtle
    // 150 = balanced
    // 220 = strong
    // -----------------------------------------------

    fill(0, 100);

    textAlign(
      CENTER,
      TOP
    );

    // -----------------------------------------------
    // FILL SCREEN WITH RESPONSES
    // Increase if lower screen feels empty
    // -----------------------------------------------

    let fullStream = stream;

    while (
      fullStream.length < 60000
    ) {

      fullStream +=
        " " + stream;
    }

    text(

      fullStream,

      MARGIN,

      MARGIN,

      width -
      MARGIN * 2,

      height -
      MARGIN * 2

    );
  }

  // ===================================================
  // MAIN CALLIGRAPHY
  // ===================================================


// =====================================
// AI CHALK WORDS
// =====================================

if (indieFlower) {

  textFont(indieFlower);

  textAlign(
    LEFT,
    CENTER
  );

  textSize(64);

  for (
    let i = aiWords.length - 1;
    i >= 0;
    i--
  ) {

    let w = aiWords[i];

    if (
  w.language === "urdu" &&
  urduFont
) {

  textFont(urduFont);

}
else if (

  w.language === "hindi" &&
  hindiFont

) {

  textFont(hindiFont);

}
else {

  textFont(indieFlower);

}
    
    w.age++;

    // slower handwriting

    if (
      frameCount % 8 === 0 &&
      w.currentLength <
      w.text.length
    ) {

      w.currentLength++;

    }

    let wordAlpha = 255;

    // hold word for ~15 seconds

    if (w.age > 240) {

  wordAlpha =
    map(
      w.age,
      240,
      360,
      255,
      0
    );

}

    // remove and reuse space

    if (w.age > 360) {

      aiWords.splice(i, 1);

      spawnChalkWord();

      continue;
    }

    let visibleText =
      w.text.substring(
        0,
        w.currentLength
      );

    let wordWidth =
  textWidth(w.text);

if (
  w.x + wordWidth >
  width - MARGIN
) {

  w.x =
    width -
    MARGIN -
    wordWidth;
}

    fill(
      255,
      wordAlpha * 0.70
    );

    if (
  w.language === "urdu"
) {

  textAlign(
    RIGHT,
    CENTER
  );

  text(
    visibleText,
    w.x,
    w.y
  );

}
else if (

  w.language === "hindi"

) {

  textAlign(
    LEFT,
    CENTER
  );

  text(
    visibleText,
    w.x,
    w.y
  );

}
else {

  textAlign(
    LEFT,
    CENTER
  );

  text(
    visibleText,
    w.x,
    w.y
  );

}
  }
}
  if (calligraphy) {

    imageMode(CENTER);

    // -----------------------------------------------
    // MAIN ARTWORK SCALE
    //
    // 0.4 = smaller
    // 0.5 = balanced
    // 0.6 = larger
    // -----------------------------------------------

    let scaleFactor =

      min(

        width /
        calligraphy.width,

        height /
        calligraphy.height

      ) * 0.5;

    image(

      calligraphy,

      width / 2,

      height / 2,

      calligraphy.width *
      scaleFactor,

      calligraphy.height *
      scaleFactor

    );
  }
}

// =====================================================
// RESPONSIVE RESIZE
// =====================================================

function windowResized() {
  
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  buildBands();
  buildKeywordGrid();
}