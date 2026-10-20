// Runs-only pad (0-6): one tap = one ball faced by the batter
export default function RunPad({ onTap }) {
  return <div className="runs rp">{[0, 1, 2, 3, 4, 5, 6].map(n => <button type="button" key={n} className={'run r' + n} aria-label={`${n} runs`} onClick={() => onTap(String(n))}>{n === 0 ? '•' : n}</button>)}</div>;
}
