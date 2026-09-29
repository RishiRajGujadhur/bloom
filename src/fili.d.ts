declare module 'fili' {
  type Coeffs = unknown
  class CalcCascades {
    bandpass(o: { order: number; characteristic: 'butterworth' | 'bessel'; Fs: number; Fc: number; BW?: number }): Coeffs
    lowpass(o: { order: number; characteristic: 'butterworth' | 'bessel'; Fs: number; Fc: number }): Coeffs
    highpass(o: { order: number; characteristic: 'butterworth' | 'bessel'; Fs: number; Fc: number }): Coeffs
  }
  class IirFilter {
    constructor(c: Coeffs)
    singleStep(x: number): number
    multiStep(x: number[]): number[]
  }
  const Fili: { CalcCascades: typeof CalcCascades; IirFilter: typeof IirFilter }
  export default Fili
}
