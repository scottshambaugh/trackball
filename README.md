# Trackball.js

A virtual trackball controller for 3D rotations with multiple rotation methods.

See this post for many more details and live demonstration widgets: [Virtual Trackballs: A Taxonomy and New Method](https://theshamblog.com/virtual-trackballs-a-taxonomy-and-new-method/)

Inspired by https://github.com/rawify/Trackball.js, but with additional options for different virtual trackball methods.

## Features
- Multiple rotation control methods
- Smooth animations
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
```html
<!DOCTYPE html>
<html>
<head>
    <title>Trackball.js Demo</title>
    <style>
        #container {
            width: 400px;
            height: 400px;
            position: relative;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div id="container"></div>
    
    <!-- Dependencies -->
    <script src="https://unpkg.com/quaternion@2.0.1/dist/quaternion.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="trackball.js"></script>
    
    <!-- Demo Code -->
    <script>
        const container = document.getElementById('container');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            alpha: true  // Enable transparency
        });

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
            rotationMethod: 'azel',
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
    </script>
</body>
</html>
```

## License
MIT

## Dependencies
- [Quaternion.js](https://github.com/rawify/Quaternion.js)
