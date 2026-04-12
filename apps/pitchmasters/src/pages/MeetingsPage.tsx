import { Video, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const ZOOM_URL = 'https://us06web.zoom.us/j/88312687020?pwd=4rznm8mkEG0T2rbnBHbUZ81xNRIWtP.1';
const MEETING_ID = '883 1268 7020';
const PASSCODE = 'Pitch888';

const meetings = [
  {
    date: 'Saturday, 19 April 2026',
    theme: 'Investor Pitches',
    roles: [
      { role: 'Toastmaster of the Day', name: 'TBD' },
      { role: 'General Evaluator', name: 'TBD' },
      { role: 'Table Topics Master', name: 'TBD' },
      { role: 'Timer', name: 'TBD' },
      { role: 'Ah Counter', name: 'TBD' },
      { role: 'Grammarian', name: 'TBD' },
    ],
    speakers: [
      { slot: 'Speaker 1', name: 'TBD', project: '' },
      { slot: 'Speaker 2', name: 'TBD', project: '' },
    ],
  },
  {
    date: 'Saturday, 26 April 2026',
    theme: 'Storytelling',
    roles: [
      { role: 'Toastmaster of the Day', name: 'TBD' },
      { role: 'General Evaluator', name: 'TBD' },
      { role: 'Table Topics Master', name: 'TBD' },
      { role: 'Timer', name: 'TBD' },
      { role: 'Ah Counter', name: 'TBD' },
      { role: 'Grammarian', name: 'TBD' },
    ],
    speakers: [
      { slot: 'Speaker 1', name: 'TBD', project: '' },
      { slot: 'Speaker 2', name: 'TBD', project: '' },
    ],
  },
  {
    date: 'Saturday, 3 May 2026',
    theme: 'Elevator Pitches',
    roles: [
      { role: 'Toastmaster of the Day', name: 'TBD' },
      { role: 'General Evaluator', name: 'TBD' },
      { role: 'Table Topics Master', name: 'TBD' },
      { role: 'Timer', name: 'TBD' },
      { role: 'Ah Counter', name: 'TBD' },
      { role: 'Grammarian', name: 'TBD' },
    ],
    speakers: [
      { slot: 'Speaker 1', name: 'TBD', project: '' },
      { slot: 'Speaker 2', name: 'TBD', project: '' },
    ],
  },
  {
    date: 'Saturday, 10 May 2026',
    theme: 'Q&A and Handling Objections',
    roles: [
      { role: 'Toastmaster of the Day', name: 'TBD' },
      { role: 'General Evaluator', name: 'TBD' },
      { role: 'Table Topics Master', name: 'TBD' },
      { role: 'Timer', name: 'TBD' },
      { role: 'Ah Counter', name: 'TBD' },
      { role: 'Grammarian', name: 'TBD' },
    ],
    speakers: [
      { slot: 'Speaker 1', name: 'TBD', project: '' },
      { slot: 'Speaker 2', name: 'TBD', project: '' },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="ml-2 p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function MeetingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-[2rem] font-bold text-gray-900">Meetings</h1>
        <p className="text-gray-500 mt-1">
          Every Saturday · 10:00–11:30 AM (UTC+8) · Online warm-up from 9:45 AM
        </p>
      </div>

      {/* Zoom link card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <h2 className="text-xl sm:text-2xl font-[650] text-gray-900">Join via Zoom</h2>
        </div>
        <a
          href={ZOOM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-medium text-tm-blue hover:underline break-all"
        >
          {ZOOM_URL}
        </a>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-1 text-gray-700">
            <span className="text-gray-400">Meeting ID:</span>
            <span className="font-mono font-medium">{MEETING_ID}</span>
            <CopyButton text={MEETING_ID} />
          </div>
          <div className="flex items-center gap-1 text-gray-700">
            <span className="text-gray-400">Passcode:</span>
            <span className="font-mono font-medium">{PASSCODE}</span>
            <CopyButton text={PASSCODE} />
          </div>
        </div>
      </div>

      {/* Upcoming meetings */}
      <div className="space-y-4">
        {meetings.map((meeting, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Meeting header */}
            <div className="px-5 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{meeting.date}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Theme: {meeting.theme}</p>
                </div>
                {i === 0 && (
                  <span className="text-xs font-medium text-tm-blue bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    Next
                  </span>
                )}
              </div>
            </div>

            {/* Speakers */}
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Speakers</p>
              <div className="space-y-1.5">
                {meeting.speakers.map((s, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <span className="text-gray-500">{s.slot}</span>
                    <span className={s.name === 'TBD' ? 'text-gray-300 italic' : 'text-gray-900 font-medium'}>
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roles */}
            <div className="px-5 py-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Roles</p>
              <div className="space-y-1.5">
                {meeting.roles.map((r, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <span className="text-gray-500">{r.role}</span>
                    <span className={r.name === 'TBD' ? 'text-gray-300 italic' : 'text-gray-900 font-medium'}>
                      {r.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
