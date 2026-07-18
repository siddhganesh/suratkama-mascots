import { useRef } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ── Define custom GLSL shader material ───────────────────────────────────────
const HolographicShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#4F46E5'),
    uGlowColor: new THREE.Color('#06B6D4'),
    uDistortion: 0.18,
    uSpeed: 0.8,
    uTexture: null,
    uHasTexture: 0.0,
    uOpacity: 1.0,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uDistortion;
    uniform float uSpeed;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying float vNoise;

    // Simplex 3D noise generator
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - D.yyy;

      i = mod(i, 289.0 );
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // Compute 3D noise values based on time
      float noiseVal = snoise(position * 1.8 + vec3(0.0, 0.0, uTime * uSpeed));
      vNoise = noiseVal;
      
      // Extrude vertex along normal based on noise
      vec3 displacedPosition = position + normal * noiseVal * uDistortion;
      
      vec4 modelViewPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
      vViewPosition = -modelViewPosition.xyz;
      
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uGlowColor;
    uniform sampler2D uTexture;
    uniform float uHasTexture;
    uniform float uOpacity;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying float vNoise;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // Fresnel effect (outer glow)
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
      
      // Iridescent color shift (cycling magenta/violet/indigo/cyan)
      vec3 iridescence = vec3(
        sin(uTime * 0.4 + vNoise * 1.5) * 0.5 + 0.5,
        cos(uTime * 0.25 + vNoise * 2.0) * 0.4 + 0.4,
        sin(uTime * 0.5 + vNoise * 1.0 + 1.0) * 0.5 + 0.5
      );
      
      vec4 texColor = vec4(1.0);
      if (uHasTexture > 0.5) {
        texColor = texture2D(uTexture, vUv);
        if (texColor.a < 0.01) {
          discard;
        }
      }
      
      // Apply color values
      vec3 base = mix(uColor, iridescence, 0.55);
      if (uHasTexture > 0.5) {
        base = mix(texColor.rgb, iridescence, 0.35);
      }
      vec3 finalColor = mix(base, uGlowColor, fresnel * 1.1);
      
      // Futuristic horizontal scanning lines
      float scanline = sin(vUv.y * 140.0 - uTime * 5.0) * 0.045 + 0.955;
      finalColor *= scanline;
      
      // Glasslike transparency
      float alpha = mix(0.70, 0.96, fresnel);
      if (uHasTexture > 0.5) {
        alpha = texColor.a * mix(0.50, 0.95, fresnel);
      }
      
      gl_FragColor = vec4(finalColor, alpha * uOpacity);
    }
  `
)

// Register the custom shader material under Three/R3F JSX
extend({ HolographicShaderMaterial })

// Declare module augmentation for TypeScript support in JSX elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      holographicShaderMaterial: any
    }
  }
}

interface HolographicMaterialProps {
  color?: string
  glowColor?: string
  distortion?: number
  speed?: number
  texture?: THREE.Texture | null
  blending?: THREE.Blending
  depthWrite?: boolean
  opacity?: number
}

export function HolographicMaterial({
  color = '#4F46E5',
  glowColor = '#06B6D4',
  distortion = 0.18,
  speed = 0.8,
  texture = null,
  blending = THREE.AdditiveBlending,
  depthWrite = false,
  opacity = 1.0,
}: HolographicMaterialProps) {
  const materialRef = useRef<any>(null)

  useFrame(({ clock, pointer }) => {
    if (materialRef.current) {
      materialRef.current.uTime = clock.getElapsedTime()
      // Warp distortion based on pointer distance from center
      const distance = Math.sqrt(pointer.x * pointer.x + pointer.y * pointer.y)
      materialRef.current.uDistortion = THREE.MathUtils.lerp(
        materialRef.current.uDistortion,
        distortion + distance * 0.16,
        0.05
      )
    }
  })

  return (
    <holographicShaderMaterial
      ref={materialRef}
      uColor={new THREE.Color(color)}
      uGlowColor={new THREE.Color(glowColor)}
      uDistortion={distortion}
      uSpeed={speed}
      uTexture={texture}
      uHasTexture={texture ? 1.0 : 0.0}
      uOpacity={opacity}
      transparent
      depthWrite={depthWrite}
      blending={blending}
    />
  )
}
export default HolographicMaterial
