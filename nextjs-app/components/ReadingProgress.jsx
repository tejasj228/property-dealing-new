'use client';
import { useEffect, useRef } from 'react';
import { attachReadingProgress } from './reading-progress.mjs';
import './ReadingProgress.css';

export default function ReadingProgress() {
  const track = useRef(null), fill = useRef(null);
  useEffect(() => attachReadingProgress(track.current, fill.current), []);
  return <div ref={track} className="reading-progress" role="progressbar" aria-label="Page explored" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
    <span ref={fill} />
  </div>;
}
