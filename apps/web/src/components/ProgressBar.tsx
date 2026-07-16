interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="h-2.5 rounded-full bg-primary-50 dark:bg-[#2A2346]">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#9E74FF,#7C4DFF)] transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
