import clsx from "clsx";

interface ScoreRingProps {
  score: number;
  delta: number;
  className?: string;
}

export function ScoreRing({ score, delta, className }: ScoreRingProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={clsx("relative flex h-[160px] w-[160px] items-center justify-center", className)}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140" aria-hidden>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#EEEAF9" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="url(#score-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
        />
        <defs>
          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B692FF" />
            <stop offset="100%" stopColor="#7C4DFF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[42px] font-semibold leading-none text-text">{score}</span>
        <span className="mt-2 text-xs font-semibold text-primary-500">+{delta}% 比上周</span>
      </div>
    </div>
  );
}
