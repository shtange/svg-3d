/*
 *  "SVG 3D" JavaScript widget
 *  source code : https://github.com/shtange/svg-3d
 *  demo : https://shtange.github.io/svg-3d/
 *
 *  Copyright 2019, Yurii Shtanhei
 *  GitHub : https://github.com/shtange/
 *  Habr   : https://habrahabr.ru/users/shtange/
 *  email  : y.shtanhei@gmail.com
 *
 *  Licensed under the MIT license:
 *  http://www.opensource.org/licenses/MIT
 */

// Helpers
Element.prototype.setSVGAttributes = function(attrList) {
  if (!(this instanceof Element) || !(attrList instanceof Object)) {
    return false;
  }

  Object.keys(attrList).forEach(function(attrName) {
    this.setAttribute(attrName, attrList[attrName]);
  }, this);
}

Number.prototype.toPX = function() {
  return this + 'px';
};

// SVG 3D
function GraphDrawer3D(elem, indX) {
  this.layout = elem;

  this.width = null;
  this.height = null;

  // SVG config
  this.svgLayer = null;
  this.svgGraph = null;
  this.svgViewBox = null;
  this.svgBgColor = 'white';
  this.svgColor = 'tomato';
  this.svgStrokeWidth = 1;
  this.svgMaxPoints = null;

  // Graph options
  this.gMult = null;
  this.gOffset = null;
  this.indX = indX || 2;
  this.cosY = 3.5;
  this.ratioY = 0.2;
  
  this.frameDelay = 25;
  this.frameCount = 40;

  // constants
  this.xmlns = 'http://www.w3.org/2000/svg';

  // Flow
  this.init();
  this.setup();
  this.drawLayout();
  this.drawGraph();
  this.drawNavY();
}

GraphDrawer3D.prototype = {
  init: function() {
    if (!(this.layout instanceof Element)) return false;

    this.widget = this._createDivElement(['widget-wrapper']);
    this.layout.appendChild(this.widget)
    
    this.width = this.widget.offsetWidth;
    this.height = this.width * 0.75;
    this.gMult = this.width / 5;
    this.gOffsetX = this.width / 2;
    this.gOffsetY = this.height / 2;

    this.svgViewBox = [0, 0, this.width, this.height].join(' ');
    this.svgMaxPoints = Math.ceil(this.width / 4) * 2;
    this.onHold = false;
  },
  setup: function() {
    // SVG Layer
    this.svgLayer = this._createGraphElement('svg', {
      xmlns: this.xmlns,
      width: this.width,
      height: this.height,
      viewBox: this.svgViewBox
    });

    // Math Graph
    this.svgGraph = this._createGraphElement('polyline', {
      points: '',
      stroke: this.svgColor,
      fill: 'none',
      'stroke-width': this.svgStrokeWidth
    });
  },
  drawLayout: function() {
    if (!(this.svgLayer instanceof Element) || !(this.svgGraph instanceof Element)) {
      return false;
    }

    this.svgLayer.appendChild(this.svgGraph);
    this.widget.appendChild(this.svgLayer);
  },
  drawGraph: function(iterator, callback) {
    var self = this;

    if (!iterator) iterator = 0;

    var points = [].reduce.call(
      Array(self.svgMaxPoints + 1).fill(null),
      function(result, item, i) {
        return result += i > 0
          ? [Math.cos(i * self.indX) * self.gMult + self.gOffsetX, (Math.sin(i) + ((self.ratioY + iterator) * Math.cos(self.cosY * i))) * self.gMult + self.gOffsetY + ' '].join(',')
          : '';
      },
      ''
    );

    if (!!iterator) this.ratioY += iterator;

    this.svgGraph.setAttribute('points', points);

    callback && callback();
  },
  drawNavY: function() {
    var dropzoneHeight = this.height * 0.5,
        dropzoneNull = dropzoneHeight / 2,
        caretHeight = 40,
        caretTopOffset = dropzoneHeight - caretHeight,
        widgetRatio = 2,
        self = this;

    var wrapper = this._createDivElement(['navigator-wrapper'], {
      height: dropzoneHeight.toPX(),
      top: (dropzoneHeight / 2).toPX(),
      right: (this.width / 20).toPX()
    });
    var caret = this._createDivElement(['navigator-caret', ['draggable']], {
      height: caretHeight.toPX(),
      marginTop: ((dropzoneHeight - caretHeight) / 2).toPX()
    });
    var animBtn = this._createDivElement(['anim-btn']);

    // Mouse
    caret.addEventListener('mousedown', function(e) {
      var offsetTop = e.target.offsetTop,
          startY = e.pageY - offsetTop;

      e.target.style.cursor = 'grabbing';

      caret.onmousemove = function(e) {
        e.preventDefault();
        var top = e.pageY - startY;
        if (top < 0) top = 0;
        if (top > caretTopOffset) top = caretTopOffset;
        e.target.style.marginTop = top.toPX();

        self.ratioY = (top - dropzoneNull) / dropzoneHeight;
        self.drawGraph();
      };
    }, false);
    
    caret.addEventListener('mouseup', function(e) {
      e.preventDefault();
      e.target.style.cursor = 'grab';
      caret.onmousemove = null;
    }, false);

    animBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (self.onHold) return false;
      self._holder(true);
      Array(self.frameCount * 4).fill(null).forEach(function(item, i, list) {
        var iterator = i <= self.frameCount || i >= self.frameCount * 3 ? -0.02 : 0.02;
        return setTimeout(self.drawGraph.bind(self, iterator, function() {
          self._holder(i !== list.length - 1)
        }), i * self.frameDelay);
      }, this);
    }, false);

    wrapper.appendChild(caret);
    this.widget.appendChild(wrapper);
    this.widget.appendChild(animBtn);
  },
  _holder: function(status) {
    if (this.onHold === status) return false;
    this.onHold = !!status;
    if (this.onHold) {
      this.widget.classList.add('locked');
    } else {
      this.widget.classList.remove('locked');
    }
  },
  _createGraphElement: function(type, attrList) {
    var node = document.createElementNS(this.xmlns, type);
    node.setSVGAttributes(attrList);

    return node;
  },
  _createDivElement: function(classes, styles) {
    var elem = document.createElement('div');

    elem.setAttribute('class', (classes || []).join(' '));
    
    Object.getOwnPropertyNames(styles || {}).forEach(function(prop) {
      elem.style[prop] = styles[prop];
    });

    return elem;
  }
};