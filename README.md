# Trackball.js

A virtual trackball controller for 3D rotations with multiple rotation methods. Perfect for manipulating 3D objects in web applications.

## Features
- Multiple rotation methods (trackball, arcball, azimuth/elevation)
- Touch support
- Smooth animations
- Customizable behavior
- Easy integration with Three.js and other 3D libraries

## Installation

```html
<script src="https://raw.githubusercontent.com/rawify/Quaternion.js/master/quaternion.min.js"></script>
<script src="trackball.js"></script>
```

## Quick Start

```javascript
const trackball = new Trackball({
    scene: document.getElementById('container'),
    onDraw: (quaternion) => {
        // Update your 3D object rotation here
        object.quaternion.copy(quaternion);
    }
});
```

## Options

```javascript
{
    scene: HTMLElement,          // Container element
    rotationMethod: 'trackball', // Rotation method
    ballsize: 0.75,             // Size relative to container
    clampElevation: false,      // Restrict vertical rotation
    border: 0,                  // Border size
    onDraw: (quaternion) => {}  // Rotation callback
}
```

### Available Rotation Methods
- `'azel'` - Azimuth/Elevation
- `'trackball'` - Classic Trackball
- `'trackball_no_precession'` - Trackball without precession
- `'sphere'` - Sphere rotation
- `'shoemake'` - Shoemake's Arcball
- `'rounded_arcball'` - Rounded Arcball
- `'bell'` - Bell's Trackball

## Methods

```javascript
// Programmatically rotate
trackball.rotate(quaternion);

// Reset to initial position
trackball.reset();
```

## Example with Three.js

```javascript
import * as THREE from 'three';

const container = document.getElementById('container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

// Setup scene
renderer.setSize(400, 400);
container.appendChild(renderer.domElement);
camera.position.z = 5;

// Create object
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Initialize trackball
const trackball = new Trackball({
    scene: container,
    onDraw: (quaternion) => {
        cube.quaternion.set(
            quaternion.x,
            quaternion.y,
            quaternion.z,
            quaternion.w
        );
    }
});

// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
```

## License
MIT

## Dependencies
- [Quaternion.js](https://github.com/rawify/Quaternion.js)
