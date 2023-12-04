const DOT_CONVERT = {
  BORDER : 2
};

var canvasWidth  = 0;
var canvasHeight = 0;
var dotSize = 0;
var csPosX;
var csPosY;

// run when load page
$(window).on('load', function() {
  dotSize = $('[name="dot-size"]').val();
  canvasWidth  = $("#canvas-grid")[0].width;
  canvasHeight = $("#canvas-grid")[0].height;
  const cxtGrid = $("#canvas-grid")[0].getContext("2d", {willReadFrequently: true});
  let isDrawing = false;

  drawGrid(cxtGrid);
  // addLayer("canvas0", "canvas1");

  $('[name="dot-size"]').change(function() {
    let result = confirm("キャンバスサイズを変更すると全てのドット画像が消去されます。\nよろしいですか？");
    if (result) {
      // dotSize update
      dotSize = $('[name="dot-size"]').val();
      // clear
      clearCanvas("canvas-grid");
      clearCanvas("canvas0");
      drawGrid(cxtGrid);
    } else {
      $('[name="dot-size"]').val(dotSize);
    }
  });


  $("#canvas-space").mousedown(function(e) {
    csPosX = e.pageX - $(this).offset().left - DOT_CONVERT.BORDER;
    csPosY = e.pageY - $(this).offset().top  - DOT_CONVERT.BORDER;
    const context = $("#canvas0")[0].getContext("2d", {willReadFrequently: true});
    const penType = $('input:radio[name="pen-type"]:checked').val();
    drawDot(context, csPosX, csPosY, penType);
    isDrawing = true;
    dotCanvasToHexArray("canvas0");
  }).mousemove(function(e) {
    csPosX = e.pageX - $(this).offset().left - DOT_CONVERT.BORDER;
    csPosY = e.pageY - $(this).offset().top  - DOT_CONVERT.BORDER;
    calcCoordinate(csPosX, csPosY); // calc coordinate on canvas
    dotCanvasToHexArray("canvas0");
    if (isDrawing) {
      const context = $("#canvas0")[0].getContext("2d", {willReadFrequently: true});
      const penType = $('input:radio[name="pen-type"]:checked').val();
      drawDot(context, csPosX, csPosY, penType);
      isDrawing = true;
    }
  }).mouseup(function() {
    isDrawing = false;
  }).mouseleave(function() {
    isDrawing = false;
    $("#coordinate").text("(null, null)");
  });
});

// draw grid
function drawGrid(context) {
  let grid_max_w = canvasWidth / dotSize;
  let grid_max_h = canvasHeight / dotSize;

  // draw w line
  for (let i = 0; i <= grid_max_w; i++) {
    drawLine(context, i*dotSize, 0, i*dotSize, canvasHeight, "gray", 1);
  }

  // draw h line
  for (let i = 0; i <= grid_max_h; i++) {
    drawLine(context, 0, i*dotSize, canvasWidth, i*dotSize, "gray", 1);
  }
}

// draw line
function drawLine(context, startX, startY, endX, endY, color, lineWidth) {
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.stroke();
}

// drawRect
function drawRect(context, startX, startY, endX, endY, color) {
  context.beginPath ();
  context.rect(startX, startY, endX, endY);
  context.fillStyle = color;
  context.fill();
}

// addCanvas
function addLayer(targetId, createId) {
  let context = '<canvas id="' + createId + '" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas>'
  $("#" + targetId).after(context);
}

// drawDot
function drawDot(context, posX, posY, penType) {
  let color = (penType == "pen") ? 'black' : 'white';
  let gridX = Math.floor(posX / dotSize) * dotSize;
  let gridY = Math.floor(posY / dotSize) * dotSize;
  drawRect(context, gridX+DOT_CONVERT.BORDER, gridY+DOT_CONVERT.BORDER, dotSize-DOT_CONVERT.BORDER, dotSize-DOT_CONVERT.BORDER, color);
}

// dot count
function dotCanvasToHexArray(targetId) {
  const context = $("#"+targetId)[0].getContext("2d", {willReadFrequently: true});
  const binStr = dotCountToBinStr(context);

  let hexArray = [];
  const binArray = binStr.split("\n");

  for (let i = 0; i < binArray.length-1; i++) {
    let hexStr = "0x";
    // to hex
    if (binArray[i].length == 64) {
      // 64bit
      const high_str = parseInt(binArray[i].substring(0, 32), 2).toString(16);
      let low_str  = parseInt(binArray[i].substring(32, 64), 2).toString(16);

      if (high_str == "0") {
        hexStr = hexStr + low_str;
      } else {
        while (low_str.length < 8) { low_str = "0" + low_str; }
        hexStr = hexStr + high_str + low_str;
      }
    } else {
      // other
      hexStr = hexStr + parseInt(binArray[i], 2).toString(16);
    }

    hexArray.push(hexStr);
  }

  $("#text-area").val(hexArray);
}

// dot count to bin string
function dotCountToBinStr(context) {
  let binStr = "";
  let grid_max_w = canvasWidth / dotSize;
  let grid_max_h = canvasHeight / dotSize;

  // dot count
  for (let j = 0; j < grid_max_h; j++) {
    const y = j * dotSize + Math.floor(dotSize / 2);
    for (let i = 0; i < grid_max_w; i++) {
      const x = i * dotSize + Math.floor(dotSize / 2);
      const colorData = context.getImageData(x, y, 1, 1);
      
      if (isBlackColor(colorData)) {
        // dot is black
        binStr = binStr + "1";
      } else {
        // dot is not black
        binStr = binStr + "0";
      }
    }
    binStr = binStr + "\n";
  }

  return binStr;
}

// judge black
function isBlackColor(colorData) {
  if (colorData.data[0] == 0 && colorData.data[1] == 0 && colorData.data[2] == 0 && colorData.data[3] == 255) {
    return true;
  } else {
    return false;
  }
}

// calc corrdinate and show
function calcCoordinate(posX, posY) {
  let x = Math.floor(posX / dotSize);
  let y = Math.floor(posY / dotSize);
  let coordinate = "(" + x + ", " + y + ")"
  if (x == -1 || y == -1) {
    coordinate = "(null, null)"
  }
  $("#coordinate").text(coordinate);
}

// copy text-area
function copyText(targetId) {
  // get text
  let text = $("#"+targetId).val();

  // copy
  if (navigator.clipboard == undefined) {
    window.clipboardData.setData("Text", text);
  } else {
    navigator.clipboard.writeText(text);
  }

  alert("クリップボードにコピーしました。");
}

// paste text-area
function pasteText(targetId) {

  // get text
  if (navigator.clipboard == undefined) {
    let paste_text = window.clipboardData.getData("Text");
    // hex check
    if (!isHexCheck(paste_text)) { return; }
    $("#"+targetId).val(paste_text);
  } else {
    navigator.clipboard.readText()
    .then((text) => {
      // hex check
      if (!isHexCheck(text)) { return; }
      $("#"+targetId).val(text);
    }).catch(err => {
      alert("ペーストをするには許可をしてください。");
      return;
    });
  }
}

// clearConfirm
function clearConfirm(targetId) {
  let result = confirm("キャンバスをクリアします。\nよろしいですか？");
  if (result) {
    // clear
    clearCanvas(targetId);
  }
}

// clearCanvas
function clearCanvas(targetId) {
  const context = $("#"+targetId)[0].getContext("2d", {willReadFrequently: true});
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  $("#text-area").val("");
}

// reverseCanvas
function reverseCanvas(targetId) {
  const context = $("#"+targetId)[0].getContext("2d", {willReadFrequently: true});
  let grid_max_w = canvasWidth / dotSize;
  let grid_max_h = canvasHeight / dotSize;

  // dot reverse
  for (let j = 0; j < grid_max_h; j++) {
    const y = j * dotSize + Math.floor(dotSize / 2);
    for (let i = 0; i < grid_max_w; i++) {
      const x = i * dotSize + Math.floor(dotSize / 2);
      const colorData = context.getImageData(x, y, 1, 1);
      let color = 'black';
      if (isBlackColor(colorData)) {
        // dot is black
        color = 'white';
      }
      drawRect(context, i*dotSize+DOT_CONVERT.BORDER, j*dotSize+DOT_CONVERT.BORDER, dotSize-DOT_CONVERT.BORDER, dotSize-DOT_CONVERT.BORDER, color);
    }
  }
  // hex update
  dotCanvasToHexArray(targetId);
}

// hexAttay to Canvas
function hexToCanvas(targetId) {
  const hexStr = $("#text-area").val();
  const hexArray = hexStr.replace(/\s/g, "").split(",");

  // hex check
  if (!isHexCheck(hexStr)) { return; }

  let binArray = [];
  for (let i = 0; i < hexArray.length; i++) {
    let binLine = "";
    // to bin
    if (hexArray[i].length > 10) {
      // 64bit
      let high_str = parseInt(hexArray[i].substring(0, hexArray[i].length-8), 16).toString(2);
      let low_str  = parseInt("0x" + hexArray[i].substring(hexArray[i].length-8, hexArray[i].length), 16).toString(2);
      while (low_str.length < 32)  { low_str = "0" + low_str; }
      binLine = high_str + low_str;
      console.log(binLine);
    } else {
      // other
      binLine = parseInt(hexArray[i], 16).toString(2);
    }

    if (binLine.length > (canvasWidth / dotSize)) {
      alert("16進数配列に含まれる横一列のデータが現在のキャンバスよりも大きいため、反映できません。");
      return;
    } else {
      while (binLine.length < (canvasWidth / dotSize)) {
        binLine = "0" + binLine;
      }
      binArray.push(binLine);
    }
  }

  // draw dotImage
  const context = $("#"+targetId)[0].getContext("2d", {willReadFrequently: true});
  for (let j = 0; j < binArray.length; j++) {
    for (let k = 0; k < (canvasWidth / dotSize); k++) {
      let color = (binArray[j].toString()[k] == '1') ? "black" : "white";
      drawRect(context, k*dotSize+DOT_CONVERT.BORDER, j*dotSize+DOT_CONVERT.BORDER, dotSize-DOT_CONVERT.BORDER, dotSize-DOT_CONVERT.BORDER, color);
    }
  }
}

// check hex
function isHexCheck(hexStr) {
  const hexArray = hexStr.replace(/\s/g, "").split(",");
  const hexCount = (hexStr.match( /0x/g ) || []).length;

  if (hexCount != hexArray.length) {
    alert("全ての16進数の頭に0xがついていないため、反映できません。\n\n" + hexStr);
    return false;
  } else if (hexArray.length > (canvasHeight / dotSize)) {
    alert("16進数の配列の数の方が現在のキャンバスよりも大きいため、反映できません。");
    return false;
  }

  return true;
}