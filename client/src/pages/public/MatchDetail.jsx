import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useGet from '../../lib/useGet';
import { useApp } from '../../context/AppContext';
import { Batting, Bowling, Reconcile } from '../../components/Scorecard';
import BestCard from '../../components/BestCard';
import { Badge, Chip, Loading, Pick, Bad } from '../../components/ui';
import { ov } from '../../lib/cricket';

export default function MatchDetail() {
  const { id } = useParams(), { t } = useApp(), [m, , err] = useGet('/matches/' + id, 8000), [tab, setTab] = useState('card'), [inn, setInn] = useState(0);
  if (err) return <Bad text={err} />;
  if (!m) return <Loading />;
  const started = m.innings.length > 0, I = m.innings[inn];
  return <>
    <Link to="/" className="back">← {t('Fixtures')}</Link>
    <div className="card score">
      <div className="row"><span>{t('Match')} {m.no} · {m.round?.name} · {m.group ? `${t('Group')} ${m.group}` : m.label}</span><span className={'chip ' + m.status}>{m.status === 'live' ? 'LIVE' : m.status === 'done' ? t('Completed') : t('Upcoming')}</span></div>
      {(started ? m.innings.map(x => ({ team: x.team, sum: x.sum })) : [{ team: m.teamA }, { team: m.teamB }]).map((x, i) => <div className="tr" key={i}><Badge name={x.team.name} size={44} /><span className="tn">{x.team.name}</span>
        {started && <b className="bigscore">{x.sum.runs}/{x.sum.wickets}<small> ({ov(x.sum.balls, m.ballsPerOver)}/{m.overs})</small></b>}</div>)}
      <div className="mut">📅 {m.date || 'Date TBA'} {m.time} · {t('Pitch')} {m.pitch} {m.toss && `· ${t('Toss')}: ${[m.teamA, m.teamB].find(x => String(x._id) === String(m.toss.winner))?.name} (${m.toss.elected})`}</div>
      <div className={'bigstatus ' + (m.status === 'done' ? 'won' : 'chase')}>{m.status === 'done' ? '🏆 ' : ''}{m.statusText}</div>
    </div>
    {m.status === 'done' && m.next && <div className="card upnext"><b>▶ {t("What's next")}</b><p>{m.winner && m.teamA._id && m.teamB._id ? <><b>{[m.teamA, m.teamB].find(x => String(x._id) === String(m.winner))?.name}</b> moves to </> : null}
      <Link to={'/match/' + m.next._id}>{m.next.label} (Match {m.next.no}): <b>{m.next.teamA.name} vs {m.next.teamB.name}</b></Link></p></div>}
    {!started ? <p className="mut">{t('Not started')}. The scorecard will appear when scoring begins.</p> : <>
      <Pick value={tab} onChange={setTab} items={[{ v: 'card', l: t('Scorecard') }, { v: 'bowl', l: t('Bowling') }, { v: 'best', l: 'Best players' }, { v: 'info', l: 'Rules' }]} />
      {tab !== 'best' && tab !== 'info' && <Pick value={inn} onChange={setInn} cls="small" items={m.innings.map((x, i) => ({ v: i, l: x.team.name + (i ? ' (2nd)' : ' (1st)') }))} />}
      {tab === 'card' && <><Batting I={I} bpo={m.ballsPerOver} /><Reconcile I={I} /></>}
      {tab === 'bowl' && <Bowling I={I} team={m.innings[1 - inn].team} bpo={m.ballsPerOver} />}
      {tab === 'best' && (m.best ? <div className="g2"><BestCard title="Best batter" kind="bat" p={m.best.bat} /><BestCard title="Best bowler" kind="bow" p={m.best.bow} /></div> : <p className="mut">Available when both innings have started.</p>)}
      {tab === 'info' && <div className="card"><h4>Match rules {m.rulesMode && <Chip>{m.rulesMode === 'special' ? 'Special' : 'Round default'}</Chip>}</h4>
        <div className="rrow"><span>Overs</span><b>{m.overs}</b></div><div className="rrow"><span>Balls per over</span><b>{m.ballsPerOver}</b></div>
        <div className="rrow"><span>Wide</span><b>{m.rules.wideRuns} run(s){m.rules.wideBall ? ', counts as a ball' : ', re-bowled'}</b></div>
        <div className="rrow"><span>No ball</span><b>{m.rules.noBallRuns} run(s){m.rules.noBallBall ? ', counts as a ball' : ', re-bowled'}</b></div>
        {m.scorer && <div className="rrow"><span>Scorer</span><b>{m.scorer.name}</b></div>}</div>}
    </>}
  </>;
}
