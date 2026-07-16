export function WheelSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none dark:bg-[#1B1531]">
      {options.map((item) => (
        <option key={item} value={item}>{item}</option>
      ))}
    </select>
  );
}
