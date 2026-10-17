import React, { useEffect, useState } from 'react';
import ArticleOutlined from '@mui/icons-material/ArticleOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import MailOutline from '@mui/icons-material/MailOutline';
import CheckRounded from '@mui/icons-material/CheckRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import './PropertyStory.css';

const chapters = [
  { label: 'Publish', title: 'A place worth discovering.', text: 'Bring homes, commercial spaces and land to market with photographs, details and a clear location.' },
  { label: 'Explore', title: 'Help buyers find their place.', text: 'Your listings become an interactive neighbourhood. Buyers can explore each property and its surroundings.' },
  { label: 'Connect', title: 'Turn interest into a conversation.', text: 'Receive enquiries, arrange viewings and guide buyers through their next move.' },
];
export default function PropertyStory() {
  const [turn, setTurn] = useState(0), [paused, setPaused] = useState(false);
  const step = turn % chapters.length;
  const selectChapter = index => { setTurn(value => value + (index - value % chapters.length + chapters.length) % chapters.length); setPaused(true); };
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (paused) return;
    const timer = setInterval(() => { if (!document.hidden && !media?.matches) setTurn(value => value + 1); }, 2200);
    return () => clearInterval(timer);
  }, [paused]);
  return <div className="property-story" data-step={step} data-paused={paused} style={{ '--story-turn': `${turn * 120}deg` }}>
    <div className="story-viewport" aria-hidden="true"><div className="story-workflow">
      <div className="story-orbit story-publish" style={{ '--story-slot': '0deg' }}><div className="story-sheet">
        <span className="story-sheet-icon"><ArticleOutlined /></span><span className="story-sheet-kicker">YOUR PORTFOLIO</span>
        <strong>One listing.<br />Every detail.</strong><div className="story-fields"><span>Photos <CheckRounded /></span><span>Price & location <CheckRounded /></span></div>
        <span className="story-sheet-footer">Ready to publish <ArrowForwardRounded /></span>
      </div></div>
      <div className="story-orbit story-explore" style={{ '--story-slot': '120deg' }}><div className="story-sheet">
        <span className="story-sheet-icon"><SearchOutlined /></span><span className="story-sheet-kicker">THE WEBSITE</span>
        <strong>The right place,<br />within reach.</strong><div className="story-search"><SearchOutlined /> Find a property</div>
        <div className="story-filter-chips"><span>Homes</span><span>Land</span><span>Commercial</span></div>
        <span className="story-sheet-footer">Explore your listings <ArrowForwardRounded /></span>
      </div></div>
      <div className="story-orbit story-connect" style={{ '--story-slot': '240deg' }}><div className="story-sheet">
        <span className="story-sheet-icon"><MailOutline /></span><span className="story-sheet-kicker">YOUR ENQUIRIES</span>
        <strong>A conversation.<br />A next step.</strong><div className="story-message">“I'd like to arrange a viewing.”</div>
        <span className="story-sheet-footer"><span className="story-status-dot" /> Enquiry received <CheckRounded /></span>
      </div></div>
    </div></div>
    <div className="story-copy"><span className="story-eyebrow">From a listing to a new beginning</span><h2>{chapters[step].title}</h2><p>{chapters[step].text}</p></div>
    <div className="story-controls"><div className="story-chapters" aria-label="How Pawan Buildhome works">{chapters.map((chapter, index) => <button key={chapter.label} type="button" aria-pressed={step === index} onClick={() => selectChapter(index)}><span>{index + 1}</span>{chapter.label}</button>)}</div><button className="story-pause" type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play property introduction' : 'Pause property introduction'}>{paused ? 'Play' : 'Pause'}</button></div>
  </div>;
}
