import CountUp from "react-countup";

type XpGainToastProps = {
  points: number;
  label: string;
};

export function XpGainToast({ points, label }: XpGainToastProps) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <strong className="text-foreground">
        +<CountUp end={points} duration={0.8} />
      </strong>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
