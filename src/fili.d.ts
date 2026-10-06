declare module 'fili' {
  type Coeffs = unknown
  interface CalcCascades {
    bandpass(o: { order: number; characteristic: 'butterworth' | 'bessel'; Fs: number; Fc: number; BW?: number }): Coeffs
    lowpass(o: { order: number; characteristic: 'butterworth' | 'bessel'; Fs: number; Fc: number }): Coeffs
    highpass(o: { order: number; characteristic: 'butterworth' | 'bessel'; Fs: number; Fc: number }): Coeffs
  }
  interface IirFilter {
    singleStep(x: number): number
    multiStep(x: number[]): number[]
  }
  const Fili: { CalcCascades: new () => CalcCascades; IirFilter: new (c: Coeffs) => IirFilter }
  export default Fili
}
