import type { Profile } from '../../../../shared/types'

interface Props {
  onSelect: (profile: Profile) => void
}

export default function ProfileSelector({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0f] select-none">
      <div className="mb-16 text-center">
        <h1 className="text-6xl font-bold tracking-[0.4em] text-white mb-4">E.D.I.T.H.</h1>
        <p className="text-[#334155] text-xs tracking-[0.3em]">EVEN DEAD I'M THE HERO</p>
      </div>

      <p className="text-[#475569] text-xs tracking-[0.25em] mb-8">SELECT OPERATING MODE</p>

      <div className="flex gap-5">
        <button
          onClick={() => onSelect('work')}
          className="flex flex-col items-center gap-5 px-20 py-10 border border-[#1e1e2a] rounded-lg bg-[#0d0d14] hover:border-amber-500/40 hover:bg-[#13131c] transition-all duration-200 group"
        >
          <svg
            className="w-8 h-8 text-[#334155] group-hover:text-amber-400 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
          <span className="text-[#475569] group-hover:text-amber-400 font-semibold tracking-[0.2em] text-xs transition-colors">
            WORK
          </span>
        </button>

        <button
          onClick={() => onSelect('personal')}
          className="flex flex-col items-center gap-5 px-20 py-10 border border-[#1e1e2a] rounded-lg bg-[#0d0d14] hover:border-emerald-500/40 hover:bg-[#13131c] transition-all duration-200 group"
        >
          <svg
            className="w-8 h-8 text-[#334155] group-hover:text-emerald-400 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          <span className="text-[#475569] group-hover:text-emerald-400 font-semibold tracking-[0.2em] text-xs transition-colors">
            PERSONAL
          </span>
        </button>
      </div>
    </div>
  )
}
