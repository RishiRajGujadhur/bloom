import { useMemo, useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Color, type ShaderMaterial } from 'three'
import { Scene3D } from '../../components/ui/Scene3D'

/**
 * Procedural silk (or water): layered folds that swell as you inhale and
 * settle as you exhale — a visual biofeedback loop driven by `breath`.
 */
const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uBreath;
  varying vec2 vUv;
  varying float vFold;
  void main() {
    vUv = uv;
    vec3 p = position;
    float amp = 0.08 + uBreath * 0.32;
    float f = sin(p.x * 2.2 + uTime * 0.6) * 0.6
            + sin(p.y * 3.1 - uTime * 0.45 + p.x) * 0.4
            + sin((p.x + p.y) * 4.0 + uTime * 0.9) * 0.15;
    p.z += f * amp;
    vFold = f;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uBreath;
  uniform float uRipple;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  varying vec2 vUv;
  varying float vFold;
  void main() {
    vec2 uv = vUv;
    float silk = 0.5 + 0.5 * sin(uv.x * 9.0 + vFold * 3.0 + uTime * 0.4);
    float sheen = pow(max(0.0, sin(uv.y * 14.0 + vFold * 5.0 - uTime * 0.7)), 6.0);
    // Ripple mode: rings spreading from the centre with each breath.
    float d = distance(uv, vec2(0.5));
    float ring = uRipple * (0.5 + 0.5 * sin(d * 40.0 - uTime * 2.0 - uBreath * 6.0)) * smoothstep(0.7, 0.0, d);
    vec3 col = mix(uA, uB, silk);
    col = mix(col, uC, sheen * (0.35 + uBreath * 0.5) + ring * 0.25);
    col *= 0.85 + 0.25 * uBreath;
    gl_FragColor = vec4(col, 1.0);
  }
`

export const silkPalettes = {
  dawn: ['#f7c7a8', '#e27396', '#fff3e4'],
  jade: ['#8fd3b8', '#3f8a76', '#e8fff6'],
  dusk: ['#7b6bd6', '#2a2d6b', '#d9c8ff'],
  ocean: ['#5aa9e6', '#1d4e89', '#dff4ff'],
} as const
export type SilkPalette = keyof typeof silkPalettes

function Surface({ breath, palette, ripple }: { breath: MutableRefObject<number>; palette: SilkPalette; ripple: boolean }) {
  const mat = useRef<ShaderMaterial>(null)
  const smooth = useRef(breath.current)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBreath: { value: 0 },
      uRipple: { value: 0 },
      uA: { value: new Color() },
      uB: { value: new Color() },
      uC: { value: new Color() },
    }),
    [],
  )
  useFrame((_, dt) => {
    const m = mat.current
    if (!m) return
    smooth.current += (breath.current - smooth.current) * Math.min(1, dt * 4)
    m.uniforms.uTime.value += dt
    m.uniforms.uBreath.value = smooth.current
    m.uniforms.uRipple.value += ((ripple ? 1 : 0) - m.uniforms.uRipple.value) * Math.min(1, dt * 2)
    const [a, b, c] = silkPalettes[palette]
    ;(m.uniforms.uA.value as Color).lerp(new Color(a), Math.min(1, dt * 2))
    ;(m.uniforms.uB.value as Color).lerp(new Color(b), Math.min(1, dt * 2))
    ;(m.uniforms.uC.value as Color).lerp(new Color(c), Math.min(1, dt * 2))
  })
  return (
    <mesh rotation={[-0.35, 0, 0]} scale={[1.6, 1.1, 1]}>
      <planeGeometry args={[6, 4, 160, 110]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} />
    </mesh>
  )
}

export function Silk({ breath, palette = 'dawn', ripple = false, className }: { breath: MutableRefObject<number>; palette?: SilkPalette; ripple?: boolean; className?: string }) {
  return (
    <div className={className ?? 'silk-canvas'} aria-hidden="true">
      <Scene3D fallback={<div className="silk-fallback" />}>
        <Canvas camera={{ position: [0, 0, 3.2], fov: 50 }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'low-power' }}>
          <Surface breath={breath} palette={palette} ripple={ripple} />
        </Canvas>
      </Scene3D>
    </div>
  )
}
