import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
// Load data from the server. poll = refresh every N ms (used for live scores).
export default function useGet(path, poll = 0) {
  const [d, setD] = useState(null), [err, setErr] = useState('');
  const load = useCallback(() => path ? api(path).then(x => { setD(x); setErr('') }).catch(e => setErr(e.message)) : Promise.resolve(), [path]);
  useEffect(() => { setD(null); load() }, [load]);
  useEffect(() => { if (!poll) return; const i = setInterval(load, poll); return () => clearInterval(i) }, [poll, load]);
  return [d, load, err];
}
