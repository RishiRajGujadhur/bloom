import { subOn } from '../subFeatures'
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Color, type ShaderMaterial } from 'three'
import gsap from 'gsap'
import { Scene3D } from '../../components/ui/Scene3D'
import { orbLabel } from './moodOrbModel'

/**
 * Liquid-glass orb. `calm` (0 = anxious … 1 = calm) drives the shader:
 * anxious is jagged, fast and hot; calm is smooth, slow and cool. Changes are
 * tweened with GSAP so the surface settles like liquid.
 */
const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uChaos;
  varying vec3 vNormal;
  varying vec3 vView;
  // Cheap 3D value noise
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                      mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                  mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                      mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    return n;
  }
  void main() {
    float speed = mix(0.35, 2.6, uChaos);
    float freq = mix(1.2, 4.5, uChaos);
    float amp = mix(0.05, 0.32, uChaos);
    float d = noise(normal * freq + uTime * speed) * amp;
    d += sin(uTime * mix(0.8, 3.0, uChaos) + position.y * 3.0) * 0.02;
    vec3 displaced = position + normal * d;
    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGloss;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.5);
    vec3 light = normalize(vec3(0.4, 0.8, 0.6));
    float spec = pow(max(dot(reflect(-light, vNormal), vView), 0.0), mix(8.0, 64.0, uGloss));
    vec3 color = uColor * (0.55 + 0.45 * max(dot(vNormal, light), 0.0)) + fresnel * 0.6 + spec * uGloss;
    gl_FragColor = vec4(color, 0.92);
  }
`

const anxious = new Color('#e8574a')
const neutral = new Color('#f2b35a')
const calm = new Color('#4fb7a8')
/** Three-stop blend: anxious red → warm amber → calm teal. */
const orbColor = (value: number) =>
  value < 0.5
    ? anxious.clone().lerp(neutral, value * 2)
    : neutral.clone().lerp(calm, (value - 0.5) * 2)

function Orb({ value }: { value: number }) {
  const material = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uChaos: { value: 1 - value },
      uColor: { value: orbColor(value) },
      uGloss: { value: value },
    }),
    // Uniforms are created once, then tweened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useEffect(() => {
    const target = subOn('moodOrb', 'colorShift') ? orbColor(value) : orbColor(0.5)
    const tl = gsap.timeline()
    tl.to(uniforms.uChaos, { value: 1 - value, duration: 1.2, ease: 'power2.out' }, 0)
      .to(uniforms.uGloss, { value: subOn('moodOrb', 'gloss') ? value : 0, duration: 1.2, ease: 'power2.out' }, 0)
      .to(uniforms.uColor.value, { r: target.r, g: target.g, b: target.b, duration: 1.2, ease: 'power2.out' }, 0)
    return () => {
      tl.kill()
    }
  }, [value, uniforms])
  const liquid = subOn('moodOrb', 'liquid')
  useFrame((_, delta) => {
    if (liquid) uniforms.uTime.value += delta
  })
  return (
    <mesh>
      <icosahedronGeometry args={[1.4, 64]} />
      <shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent />
    </mesh>
  )
}


export function MoodOrb({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="mood-orb">
      <div className="mood-orb-stage" aria-hidden="true">
        <Scene3D fallback={<div className="mood-orb-fallback" style={{ ['--calm' as string]: value }} />}>
          <Canvas camera={{ position: [0, 0, 4.4], fov: 45 }} dpr={[1, 2]} gl={{ alpha: true }}>
            <Orb value={value} />
          </Canvas>
        </Scene3D>
      </div>
      <label className="mood-orb-slider">
        <span>
          Anxious <strong>{orbLabel(value)}</strong> Calm
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(value * 100)}
          aria-valuetext={orbLabel(value)}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
        />
      </label>
    </div>
  )
}
