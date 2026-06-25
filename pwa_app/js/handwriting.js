(function () {
  function createHandwritingPad(canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    const state = {
      drawing: false,
      lastX: 0,
      lastY: 0,
      tool: "pen",
      size: 5
    };

    function fillPaper() {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const image = canvas.width > 0 ? canvas.toDataURL("image/png") : "";

      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      fillPaper();

      if (image) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = image;
      }
    }

    function pointFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    function begin(event) {
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      const point = pointFromEvent(event);
      state.drawing = true;
      state.lastX = point.x;
      state.lastY = point.y;
    }

    function draw(event) {
      if (!state.drawing) return;
      event.preventDefault();

      const point = pointFromEvent(event);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = state.tool === "eraser" ? state.size * 2.2 : state.size;
      ctx.strokeStyle = state.tool === "eraser" ? "#ffffff" : "#222222";

      ctx.beginPath();
      ctx.moveTo(state.lastX, state.lastY);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      state.lastX = point.x;
      state.lastY = point.y;
    }

    function end(event) {
      if (!state.drawing) return;
      event.preventDefault();
      state.drawing = false;
    }

    function clear() {
      fillPaper();
    }

    function setTool(tool) {
      state.tool = tool;
    }

    function setSize(size) {
      state.size = Number(size) || 5;
    }

    function toImageData() {
      return canvas.toDataURL("image/png");
    }

    function loadImage(imageData) {
      fillPaper();
      if (!imageData) return;

      const rect = canvas.getBoundingClientRect();
      const img = new Image();
      img.onload = () => {
        fillPaper();
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = imageData;
    }

    canvas.addEventListener("pointerdown", begin);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    window.addEventListener("resize", resizeCanvas);

    resizeCanvas();

    return {
      clear,
      setTool,
      setSize,
      toImageData,
      loadImage
    };
  }

  window.HandwritingPad = {
    create: createHandwritingPad
  };
})();
