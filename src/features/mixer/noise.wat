;; Bloom soundscape noise kernel (WebAssembly SIMD128).
;; Four independent noise voices run in parallel, one per f32x4 lane:
;; each call fills 128 frames of white, pink (Paul Kellet) and brown noise
;; for all four lanes at once. Memory layout (bytes):
;;   0..15    xorshift32 state, i32x4
;;   16..127  pink filter state b0..b6, f32x4 each
;;   128..143 brown integrator, f32x4
;;   1024     white out  [128 frames x 4 lanes] f32
;;   3072     pink out
;;   5120     brown out
(module
  (memory (export "memory") 1)
  (func (export "seed") (param $a i32) (param $b i32) (param $c i32) (param $d i32)
    (v128.store (i32.const 0) (i32x4.replace_lane 3 (i32x4.replace_lane 2 (i32x4.replace_lane 1 (i32x4.splat (local.get $a)) (local.get $b)) (local.get $c)) (local.get $d))))
  (func (export "gen") (param $n i32)
    (local $x v128) (local $w v128) (local $p v128) (local $br v128)
    (local $b0 v128) (local $b1 v128) (local $b2 v128) (local $b3 v128) (local $b4 v128) (local $b5 v128) (local $b6 v128)
    (local $i i32) (local $o i32)
    (local.set $x (v128.load (i32.const 0)))
    (local.set $b0 (v128.load (i32.const 16)))
    (local.set $b1 (v128.load (i32.const 32)))
    (local.set $b2 (v128.load (i32.const 48)))
    (local.set $b3 (v128.load (i32.const 64)))
    (local.set $b4 (v128.load (i32.const 80)))
    (local.set $b5 (v128.load (i32.const 96)))
    (local.set $b6 (v128.load (i32.const 112)))
    (local.set $br (v128.load (i32.const 128)))
    (block $done
      (loop $frame
        (br_if $done (i32.ge_u (local.get $i) (local.get $n)))
        ;; xorshift32 on four lanes at once
        (local.set $x (v128.xor (local.get $x) (i32x4.shl (local.get $x) (i32.const 13))))
        (local.set $x (v128.xor (local.get $x) (i32x4.shr_u (local.get $x) (i32.const 17))))
        (local.set $x (v128.xor (local.get $x) (i32x4.shl (local.get $x) (i32.const 5))))
        ;; white in [-1, 1)
        (local.set $w (f32x4.mul (f32x4.convert_i32x4_s (local.get $x)) (f32x4.splat (f32.const 4.656612873e-10))))
        ;; pink: Paul Kellet's refined filter bank
        (local.set $b0 (f32x4.add (f32x4.mul (local.get $b0) (f32x4.splat (f32.const 0.99886))) (f32x4.mul (local.get $w) (f32x4.splat (f32.const 0.0555179)))))
        (local.set $b1 (f32x4.add (f32x4.mul (local.get $b1) (f32x4.splat (f32.const 0.99332))) (f32x4.mul (local.get $w) (f32x4.splat (f32.const 0.0750759)))))
        (local.set $b2 (f32x4.add (f32x4.mul (local.get $b2) (f32x4.splat (f32.const 0.969))) (f32x4.mul (local.get $w) (f32x4.splat (f32.const 0.153852)))))
        (local.set $b3 (f32x4.add (f32x4.mul (local.get $b3) (f32x4.splat (f32.const 0.8665))) (f32x4.mul (local.get $w) (f32x4.splat (f32.const 0.3104856)))))
        (local.set $b4 (f32x4.add (f32x4.mul (local.get $b4) (f32x4.splat (f32.const 0.55))) (f32x4.mul (local.get $w) (f32x4.splat (f32.const 0.5329522)))))
        (local.set $b5 (f32x4.sub (f32x4.mul (local.get $b5) (f32x4.splat (f32.const -0.7616))) (f32x4.mul (local.get $w) (f32x4.splat (f32.const 0.016898)))))
        (local.set $p (f32x4.add (f32x4.add (f32x4.add (local.get $b0) (local.get $b1)) (f32x4.add (local.get $b2) (local.get $b3)))
                                 (f32x4.add (f32x4.add (local.get $b4) (local.get $b5)) (f32x4.add (local.get $b6) (f32x4.mul (local.get $w) (f32x4.splat (f32.const 0.5362)))))))
        (local.set $p (f32x4.mul (local.get $p) (f32x4.splat (f32.const 0.11))))
        (local.set $b6 (f32x4.mul (local.get $w) (f32x4.splat (f32.const 0.115926))))
        ;; brown: leaky integrator
        (local.set $br (f32x4.div (f32x4.add (local.get $br) (f32x4.mul (local.get $w) (f32x4.splat (f32.const 0.02)))) (f32x4.splat (f32.const 1.02))))
        (local.set $o (i32.shl (local.get $i) (i32.const 4)))
        (v128.store (i32.add (i32.const 1024) (local.get $o)) (f32x4.mul (local.get $w) (f32x4.splat (f32.const 0.5))))
        (v128.store (i32.add (i32.const 3072) (local.get $o)) (local.get $p))
        (v128.store (i32.add (i32.const 5120) (local.get $o)) (f32x4.mul (local.get $br) (f32x4.splat (f32.const 3.5))))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $frame)))
    (v128.store (i32.const 0) (local.get $x))
    (v128.store (i32.const 16) (local.get $b0))
    (v128.store (i32.const 32) (local.get $b1))
    (v128.store (i32.const 48) (local.get $b2))
    (v128.store (i32.const 64) (local.get $b3))
    (v128.store (i32.const 80) (local.get $b4))
    (v128.store (i32.const 96) (local.get $b5))
    (v128.store (i32.const 112) (local.get $b6))
    (v128.store (i32.const 128) (local.get $br)))
)
