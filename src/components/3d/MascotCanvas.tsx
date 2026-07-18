import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars, OrbitControls, Torus, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import HolographicMaterial from './HolographicMaterial'

import { resolvePath } from '../../lib/paths'

// ── Mascot image list (7 real costumes) ─────────────────────────────────────
const MASCOTS = [
  { src: resolvePath('/assets/gorilla_3d.png'),    label: 'Gorilla',      color: '#6D28D9' },
  { src: resolvePath('/assets/panda_3d.png'),      label: 'Panda',        color: '#06B6D4' },
  { src: resolvePath('/assets/yellowteddy_3d.png'),label: 'Yellow Teddy', color: '#F59E0B' },
  { src: resolvePath('/assets/pinkteddy_3d.png'),  label: 'Pink Fox',     color: '#EC4899' },
  { src: resolvePath('/assets/rabbit_3d_new.png'), label: 'Red Rabbit',   color: '#EF4444' },
  { src: resolvePath('/assets/teddy_3d.png'),      label: 'Brown Teddy',  color: '#92400E' },
  { src: resolvePath('/assets/wolf_3d.png'),       label: 'Black Wolf',   color: '#374151' },
]

// ── Moving Grid Floor ────────────────────────────────────────────────────────
function MovingGrid({ color }: { color: string }) {
  const gridRef = useRef<THREE.GridHelper>(null)
  useFrame(({ clock }) => {
    if (gridRef.current) {
      // Infinite scrolling z-axis effect
      gridRef.current.position.z = (clock.getElapsedTime() * 0.45) % 1.0
    }
  })
  return (
    <gridHelper
      ref={gridRef}
      args={[35, 35, color, color]}
      position={[0, -1.8, 0]}
    />
  )
}

// ── Floating mascot image plane ───────────────────────────────────────────────
function MascotImage({ src, position, isActive, color: _color, mode }: {
  src: string
  position: [number, number, number]
  isActive: boolean
  color: string
  mode: 'reality' | 'hologram' | 'cyber'
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(src)
  const targetScale = isActive ? 1.65 : 0.75
  const targetOpacity = isActive ? 1 : 0.35

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, 1),
      delta * 5
    )
    
    // Smoothly interpolate opacity of materials reactively
    const mat = meshRef.current.material as any
    if (mat) {
      if (mat.uniforms && mat.uniforms.uOpacity) {
        mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
          mat.uniforms.uOpacity.value,
          targetOpacity,
          delta * 5
        )
      } else if ('opacity' in mat) {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 5)
      }
    }
  })

  return (
    <Float speed={isActive ? 2.5 : 1.2} floatIntensity={isActive ? 0.6 : 0.2}>
      <mesh ref={meshRef} position={position}>
        <planeGeometry args={[1.8, 2.4, 1, 1]} />
        {mode === 'reality' ? (
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={targetOpacity}
            side={THREE.DoubleSide}
          />
        ) : mode === 'hologram' ? (
          <HolographicMaterial
            texture={texture}
            color="#06B6D4" // Cyan base
            glowColor="#3B82F6" // Blue glow
            distortion={0.14}
            speed={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            opacity={targetOpacity}
          />
        ) : (
          <HolographicMaterial
            texture={texture}
            color="#EC4899" // Magenta base
            glowColor="#F43F5E" // Rose glow
            distortion={0.06}
            speed={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            opacity={targetOpacity}
          />
        )}
      </mesh>
    </Float>
  )
}

// ── Orbiting ring ─────────────────────────────────────────────────────────────
function OrbitRing({ radius, color, speed, tilt }: {
  radius: number; color: string; speed: number; tilt: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.getElapsedTime() * speed
  })
  return (
    <Torus ref={ref} args={[radius, 0.012, 16, 100]} rotation={[Math.PI / tilt, 0, 0]}>
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </Torus>
  )
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function Scene({ activeIdx, mode }: { activeIdx: number; mode: 'reality' | 'hologram' | 'cyber' }) {
  // Arrange mascots in a carousel arc
  const total = MASCOTS.length
  const radius = 3.8

  const ring1Color = mode === 'hologram' ? '#06B6D4' : mode === 'cyber' ? '#EC4899' : '#818CF8'
  const ring2Color = mode === 'hologram' ? '#3B82F6' : mode === 'cyber' ? '#F43F5E' : MASCOTS[activeIdx].color

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#818CF8" />
      <pointLight position={[-5, -3, -5]} intensity={1} color="#7C3AED" />
      <pointLight position={[0, -5, 3]} intensity={0.8} color="#EC4899" />

      <Stars radius={80} depth={50} count={2500} factor={4} saturation={0} fade speed={0.4} />

      {MASCOTS.map((m, i) => {
        const offset = i - activeIdx
        // Wrap offset for circular carousel
        let wrapped = offset
        if (wrapped > total / 2) wrapped -= total
        if (wrapped < -total / 2) wrapped += total
        const angle = (wrapped / total) * Math.PI * 2.2
        const x = Math.sin(angle) * radius
        const z = Math.cos(angle) * radius - radius
        const y = 0
        return (
          <MascotImage
            key={m.src}
            src={m.src}
            position={[x, y, z]}
            isActive={i === activeIdx}
            color={m.color}
            mode={mode}
          />
        )
      })}

      <OrbitRing radius={2.5} color={ring1Color} speed={0.25} tilt={2} />
      <OrbitRing radius={3.5} color={ring2Color} speed={-0.18} tilt={3} />

      {mode !== 'reality' && (
        <MovingGrid color={mode === 'hologram' ? '#06B6D4' : '#EC4899'} />
      )}

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
      />
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────────
interface MascotCanvasProps {
  className?: string
  mode?: 'reality' | 'hologram' | 'cyber'
}

export default function MascotCanvas({ className = '', mode = 'reality' }: MascotCanvasProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  // Auto-rotate through mascots
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % MASCOTS.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Scene activeIdx={activeIdx} mode={mode} />
        </Canvas>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24
                        bg-gradient-to-t from-charcoal-deep/80 to-transparent pointer-events-none" />
      </div>

      {/* Mascot name label */}
      <div className="text-center pb-2 -mt-6 relative z-10">
        <p className="text-white font-heading font-bold text-xl tracking-wide drop-shadow-lg">
          {MASCOTS[activeIdx].label}
        </p>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {MASCOTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`transition-all duration-300 rounded-full ${
                i === activeIdx
                  ? 'w-5 h-2 bg-indigo-electric'
                  : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
