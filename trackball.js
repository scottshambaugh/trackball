/**
 * A virtual trackball controller for 3D rotations, with multiple rotation methods.
 * Requires https://github.com/rawify/Quaternion.js
 * Author: @scottshambaugh
 * License: MIT
 */
class Trackball {
  // Private fields
  #q0;
  #q;
  #azimuth;
  #elevation;
  #azimuth_start = 0;
  #elevation_start = 0;
  #drag = null;
  #isUpdatePending = false;
  #lastMousePosition = null;
  #opts;

  /**
   * Constructs a new Trackball instance.
   * @param {Object} opts - Configuration options for the trackball.
   */
  constructor(opts = {}) {
    if (opts.nodeType) opts = { scene: opts };
    if (typeof opts.scene === 'string') {
      opts.scene = document.querySelector(opts.scene);
    }

    const {
      /** @type {HTMLElement} The DOM element that will contain the trackball */
      scene,
      /** @type {string} The rotation method to use. One of:
       * - 'azel': Azimuth/elevation rotation
       * - 'trackball': Classic trackball rotation
       * - 'trackball_no_precession': Trackball without precession
       * - 'shoemake': Shoemake's arcball rotation
       * - 'sphere': Sphere rotation
       * - 'bell': Bell's trackball rotation
       * - 'rounded_arcball': Rounded arcball rotation 
       */
      rotationMethod,
      /** @type {function} Callback function called when trackball is rotated */
      onDraw = () => { },
      /** @type {boolean} Whether to clamp elevation rotation */
      clampElevation = false,
      /** @type {number} Border size in pixels */
      border = 0,
      /** @type {number} Size of the trackball relative to container */
      ballsize = 0.75,
      /** @type {Quaternion} Initial rotation quaternion */
      q = Quaternion.ONE
    } = opts;

    this.#opts = { scene, rotationMethod, onDraw, clampElevation, border, ballsize };

    // Core state initialization
    this.#q0 = this.#q = q;

    if (this.#opts.rotationMethod === 'rounded_arcball') {
      this.#opts.border = 0.5;
    }

    this.#initEventListeners();
    this.#draw();
  }

  /**
   * Rotates the trackball by a given quaternion.
   * @param {Quaternion} quaternion - The quaternion to rotate by.
   */
  rotate(quaternion) {
    if (!this.#drag) {
      this.#q = this.#q0 = this.#q0.mul(quaternion);
      this.#draw();
    }
  }

  /**
   * Resets the trackball to its initial state.
   */
  reset() {
    this.#drag = null;
    this.#q = this.#q0 = new Quaternion(1, 0, 0, 0);
    this.#azimuth = this.#azimuth_start = 0;
    this.#elevation = this.#elevation_start = 0;
    this.#draw();
  }

  // Private methods
  #initEventListeners() {
    const scene = this.#opts.scene;

    scene.addEventListener('mousedown', this.#handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.#handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.#handleMouseUp.bind(this));

    scene.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this.#handleMouseDown(e.touches[0]);
      }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        this.#handleMouseMove(e.touches[0]);
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        this.#handleMouseUp(e.changedTouches[0]);
      }
    }, { passive: true });
  }

  #handleMouseDown(event) {
    const box = this.#opts.scene.getBoundingClientRect();

    this.#drag = {
      startVector: this.#project(event.clientX, event.clientY, box),
      startPosition: [event.clientX, event.clientY],
      box: box
    };

    this.#draw();
  }

  #handleMouseMove(event) {
    if (!this.#drag) return;

    this.#lastMousePosition = { clientX: event.clientX, clientY: event.clientY };

    if (!this.#isUpdatePending) {
      this.#isUpdatePending = true;
      requestAnimationFrame(this.#update.bind(this));
    }
  }

  #update() {
    if (this.#lastMousePosition && this.#drag) {
      const { clientX, clientY } = this.#lastMousePosition;

      const box = this.#drag.box;
      if (this.#isInBounds(clientX, clientY, box)) {
        this.#updateRotation(clientX, clientY);
        this.#draw();
      }
    }

    this.#isUpdatePending = false;
  }

  #updateRotation(clientX, clientY) {
    const deltaX = clientX - this.#drag.startPosition[0];
    const deltaY = clientY - this.#drag.startPosition[1];
    if (deltaX === 0 && deltaY === 0) return;

    const { rotationMethod } = this.#opts;

    if (rotationMethod === 'azel') {
      this.#updateAzEl(deltaX, deltaY);
    } else if (rotationMethod === 'trackball' || rotationMethod === 'trackball_no_precession') {
      this.#updateTrackball(deltaX, deltaY, clientX, clientY);
    } else {
      this.#updateSphericalMethods(clientX, clientY);
    }
  }

  #updateTrackball(deltaX, deltaY, clientX, clientY) {
    const minDim = Math.min(this.#drag.box.height, this.#drag.box.width);
    const k = [deltaY / minDim, deltaX / minDim, 0];
    const norm = Math.sqrt(k[0] * k[0] + k[1] * k[1] + k[2] * k[2]);
    const theta = norm * Math.PI / 2;

    const cosTheta = Math.cos(theta);
    const sinThetaNormalized = Math.sin(theta) / norm;
    const dq = new Quaternion(
      cosTheta,
      k[0] * sinThetaNormalized,
      k[1] * sinThetaNormalized,
      k[2] * sinThetaNormalized
    );
    this.#q = dq.mul(this.#q0);

    if (this.#opts.rotationMethod === 'trackball') {
      this.#q0 = this.#q;
      this.#drag.startPosition = [clientX, clientY];
    }
  }

  #updateSphericalMethods(clientX, clientY) {
    const currentVector = this.#project(clientX, clientY, this.#drag.box);
    const dq = Quaternion.fromVectors(this.#drag.startVector, currentVector);

    if (this.#opts.rotationMethod === 'sphere') {
      this.#q = dq.mul(this.#q0);
      this.#q0 = this.#q;
      this.#drag.startVector = currentVector;
      this.#drag.startPosition = [clientX, clientY];
    } else if (['shoemake', 'rounded_arcball', 'bell'].includes(this.#opts.rotationMethod)) {
      this.#q = dq.mul(dq.mul(this.#q0));
    }
  }

  #handleMouseUp() {
    if (!this.#drag) return;

    this.#drag = null;
    this.#q0 = this.#q;
    this.#lastMousePosition = null;
    this.#azimuth_start = this.#azimuth;
    this.#elevation_start = this.#elevation;
    this.#draw();
  }

  #project(x, y, box) {
    const maxDim = Math.max(box.width, box.height) - 1;
    const ballsize = this.#opts.ballsize;
    const border = this.#opts.border;
    const ra = 1 + border;
    const a = border * (1 + border / 2);
    const ri = 2 / (ra + 1 / ra);

    let px = (2 * (x - box.x) - box.width - 1) / maxDim / ballsize;
    let py = -(2 * (y - box.y) - box.height - 1) / maxDim / ballsize;

    const dist2 = (px * px + py * py) * (ra * ra);
    const dist = Math.sqrt(dist2);

    if (['sphere', 'shoemake', 'rounded_arcball'].includes(this.#opts.rotationMethod)) {
      if (dist < ri) {
        return [px, py, Math.sqrt(1 - dist2)];
      } else if (dist < ra) {
        const dr = ra - dist;
        return [px, py, a - Math.sqrt((a + dr) * (a - dr))];
      }
      return [px, py, 0];
    }
    else if (this.#opts.rotationMethod === 'bell') {
      if (dist < 1 / Math.sqrt(2)) {
        return [px, py, Math.sqrt(1 - dist2)];
      }
      return [px, py, 1 / (2 * dist)];
    }
  }

  #updateAzEl(deltaX, deltaY) {
    const scaleX = Math.PI / (Math.min(this.#drag.box.width, this.#drag.box.height));
    const scaleY = scaleX;

    this.#azimuth = this.#azimuth_start + deltaX * scaleX;

    if (this.#opts.clampElevation) {
      this.#elevation = Math.max(-Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01,
          this.#elevation_start + deltaY * scaleY));
    } else {
      this.#elevation = this.#elevation_start + deltaY * scaleY;
    }

    this.#q = Quaternion.fromEuler(this.#elevation, this.#azimuth, 0, 'XYZ');
  }

  #isInBounds(x, y, box) {
    return x >= box.left && x <= box.right &&
      y >= box.top && y <= box.bottom;
  }

  #draw() {
    this.#opts.onDraw.call(this, this.#q);
  }
}
