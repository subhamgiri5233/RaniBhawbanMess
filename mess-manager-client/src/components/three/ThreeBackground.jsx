import { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';

const ThreeBackground = memo(({ isFocused }) => {
    const containerRef = useRef(null);
    const focusRef = useRef(isFocused);
    const mouseRef = useRef(new THREE.Vector2(0, 0));
    const viewportRef = useRef({ width: 0, height: 0 });
    const isVisibleRef = useRef(true);

    useEffect(() => {
        focusRef.current = isFocused;
    }, [isFocused]);

    useEffect(() => {
        if (!containerRef.current) return;

        // --- Setup ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false, // Turned off for performance boost
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Capped at 1.5 for performance
        containerRef.current.appendChild(renderer.domElement);

        // Pre-allocate common vectors
        const tempViewport = new THREE.Vector2();

        const updateViewport = () => {
            const h = 2 * Math.tan((camera.fov * Math.PI) / 180 / 2) * camera.position.z;
            const w = h * camera.aspect;
            viewportRef.current = { width: w, height: h };
        };
        updateViewport();

        // --- Aurora Blobs Configuration ---
        const blobConfigs = [
            { color: '#4f46e5', size: 12, speed: 0.3, offset: 0 },
            { color: '#7c3aed', size: 14, speed: 0.2, offset: 2 },
            { color: '#06b6d4', size: 10, speed: 0.4, offset: 4 },
            { color: '#ec4899', size: 11, speed: 0.25, offset: 1.5 },
            { color: '#10b981', size: 8, speed: 0.5, offset: 5 }
        ];

        const blobs = [];
        const blobGeometry = new THREE.IcosahedronGeometry(1, 2);

        const blobVertexShader = `
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform float uTime;
            uniform float uOffset;
            uniform float uSpeed;
            uniform vec2 uMouse;
            uniform float uFocus;
            uniform vec2 uViewport;

            void main() {
                vUv = uv;
                vec3 pos = position;
                
                float time = uTime * uSpeed + uOffset;
                pos.x += sin(time * 0.7 + pos.y * 0.5) * 2.0;
                pos.y += cos(time * 0.5 + pos.x * 0.5) * 2.0;
                pos.z += sin(time * 0.3 + pos.y * 0.3) * 1.5;

                pos.y += uTime * 2.0 * uSpeed; 
                float wrapRange = uViewport.y * 1.5;
                pos.y = mod(pos.y + wrapRange * 0.5, wrapRange) - wrapRange * 0.5;

                vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
                vec2 mousePos = uMouse * uViewport * 0.5;
                float dist = distance(modelPosition.xy, mousePos);
                float radius = uViewport.x * 0.25;
                float force = smoothstep(radius, 0.0, dist);
                modelPosition.xy += (mousePos - modelPosition.xy) * force * 0.8;

                modelPosition.xyz *= (1.0 + uFocus * 0.4);

                vec4 viewPosition = viewMatrix * modelPosition;
                gl_Position = projectionMatrix * viewPosition;
                vPosition = modelPosition.xyz;
            }
        `;

        const blobFragmentShader = `
            varying vec3 vPosition;
            uniform vec3 uColor;
            uniform float uTime;
            uniform vec2 uViewport;

            void main() {
                float dist = length(vPosition.xy / uViewport);
                float alpha = smoothstep(1.2, 0.0, dist);
                float pulse = sin(uTime * 0.5) * 0.1 + 0.9;
                gl_FragColor = vec4(uColor, alpha * 0.5 * pulse);
            }
        `;

        blobConfigs.forEach(cfg => {
            const material = new THREE.ShaderMaterial({
                vertexShader: blobVertexShader,
                fragmentShader: blobFragmentShader,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                uniforms: {
                    uTime: { value: 0 },
                    uColor: { value: new THREE.Color(cfg.color) },
                    uOffset: { value: cfg.offset },
                    uSpeed: { value: cfg.speed },
                    uMouse: { value: new THREE.Vector2(0, 0) },
                    uFocus: { value: 0 },
                    uViewport: { value: new THREE.Vector2(viewportRef.current.width, viewportRef.current.height) }
                }
            });

            const mesh = new THREE.Mesh(blobGeometry, material);
            mesh.scale.setScalar(cfg.size);
            mesh.position.set(
                (Math.random() - 0.5) * viewportRef.current.width * 1.2,
                (Math.random() - 0.5) * viewportRef.current.height * 1.2,
                (Math.random() - 0.5) * 10
            );
            scene.add(mesh);
            blobs.push(mesh);
        });

        // --- Simplified Grain Overlay ---
        const grainVertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;

        const grainFragmentShader = `
            varying vec2 vUv;
            uniform float uTime;
            float random(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            void main() {
                // Throttle grain noise calculation
                float noise = random(vUv + floor(uTime * 24.0) * 0.01);
                gl_FragColor = vec4(vec3(noise), 0.02);
            }
        `;

        const grainPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.ShaderMaterial({
                vertexShader: grainVertexShader,
                fragmentShader: grainFragmentShader,
                transparent: true,
                uniforms: { uTime: { value: 0 } }
            })
        );
        scene.add(grainPlane);

        // --- Event Listeners ---
        const handleMouseMove = (e) => {
            mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            updateViewport();

            tempViewport.set(viewportRef.current.width, viewportRef.current.height);
            blobs.forEach(blob => {
                blob.material.uniforms.uViewport.value.copy(tempViewport);
            });
        };

        const handleVisibilityChange = () => {
            isVisibleRef.current = !document.hidden;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // --- Animation Loop ---
        const clock = new THREE.Clock();
        let animationFrameId;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            if (!isVisibleRef.current) return; // Throttling

            const elapsedTime = clock.getElapsedTime();
            const targetFocus = focusRef.current ? 1 : 0;
            const focusVal = blobs[0].material.uniforms.uFocus.value;
            const newFocusVal = focusVal + (targetFocus - focusVal) * 0.05;

            // Batch Updates
            for (let i = 0; i < blobs.length; i++) {
                const blob = blobs[i];
                const uniforms = blob.material.uniforms;
                uniforms.uTime.value = elapsedTime;
                uniforms.uMouse.value.copy(mouseRef.current);
                uniforms.uFocus.value = newFocusVal;

                blob.rotation.x = elapsedTime * 0.1 * uniforms.uSpeed.value;
                blob.rotation.y = elapsedTime * 0.15 * uniforms.uSpeed.value;
            }

            grainPlane.material.uniforms.uTime.value = elapsedTime;
            camera.position.x += (mouseRef.current.x * 2 - camera.position.x) * 0.02;
            camera.position.y += (mouseRef.current.y * 2 - camera.position.y) * 0.02;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        animate();

        // Fade in
        requestAnimationFrame(() => {
            if (containerRef.current) containerRef.current.style.opacity = '1';
        });

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            containerRef.current?.removeChild(renderer.domElement);

            // Comprehensive cleanup
            blobGeometry.dispose();
            blobs.forEach(b => {
                b.material.dispose();
            });
            grainPlane.geometry.dispose();
            grainPlane.material.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-0 bg-[#010411] transition-opacity duration-1000"
            style={{ pointerEvents: 'none', opacity: 0 }}
        />
    );
});

ThreeBackground.displayName = 'ThreeBackground';

export default ThreeBackground;
