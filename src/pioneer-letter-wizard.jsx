import React, { useState, useRef, useEffect } from 'react';

// ============================================================================
// CONFIG — edit these to change the app's behavior without touching UI code
// ============================================================================

const SITUATION_EXAMPLES = [
  'Lost their spouse recently',
  'New to the neighborhood',
  'Going through a hard time at work',
  'Recovering from an illness',
  'Just had a baby',
  'Feeling lonely or isolated'
];

// Letter font options. Each value is a CSS font-family stack — the first
// font is preferred, later fonts are fallbacks if it's not installed.
// All fonts listed are either system-installed on most devices or web-safe
// enough that they render somewhere close to intended on any machine.
const FONT_OPTIONS = [
  {
    id: 'classic-serif',
    label: 'Classic serif',
    hint: 'Traditional, formal',
    stack: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'
  },
  {
    id: 'modern-serif',
    label: 'Modern serif',
    hint: 'Clean, readable',
    stack: 'Georgia, "Times New Roman", serif'
  },
  {
    id: 'warm-serif',
    label: 'Warm serif',
    hint: 'Softer, book-like',
    stack: '"Baskerville", "Libre Baskerville", Georgia, serif'
  },
  {
    id: 'clean-sans',
    label: 'Clean sans',
    hint: 'Modern, simple',
    stack: '"Helvetica Neue", Helvetica, Arial, sans-serif'
  },
  {
    id: 'handwritten',
    label: 'Handwritten',
    hint: 'Personal, casual',
    stack: '"Bradley Hand", "Segoe Script", "Comic Sans MS", cursive'
  }
];

// Font size in points. 12pt is standard typed correspondence; 14pt and
// 16pt are large-print sizes that still fit a reasonable letter on one A4
// page (120-250 word range). Above 16pt, most letters would need a second page.
const FONT_SIZE_OPTIONS = [
  { id: 11, label: 'Small',       hint: '11pt' },
  { id: 12, label: 'Standard',    hint: '12pt' },
  { id: 14, label: 'Large',       hint: '14pt — easier to read' },
  { id: 16, label: 'Extra large', hint: '16pt — large print' }
];


// The AI uses the type to decide how to introduce the writer and what to invite.
const LETTER_TYPE_OPTIONS = [
  {
    id: 'initial',
    label: 'Initial letter',
    hint: 'First contact, no prior conversation',
    icon: 'M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l9-5 9 5'
  },
  {
    id: 'followup',
    label: 'Follow-up letter',
    hint: 'You\'ve spoken before, reconnecting',
    icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'
  },
  {
    id: 'memorial',
    label: 'Memorial invitation',
    hint: 'Annual Memorial campaign',
    icon: 'M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z'
  },
  {
    id: 'campaign',
    label: 'Special campaign',
    hint: 'Tract, convention, or special witnessing',
    icon: 'M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14'
  },
  {
    id: 'comfort',
    label: 'Comfort letter',
    hint: 'Bereavement, illness, hardship',
    icon: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z'
  }
];

const TONE_OPTIONS = [
  { id: 'neutral',    label: 'Neutral',    hint: 'Respectful, to someone you don\'t know' },
  { id: 'warm',       label: 'Warm',       hint: 'For people you\'ve met before' },
  { id: 'comforting', label: 'Comforting', hint: 'Grief, loss, hardship' },
  { id: 'thoughtful', label: 'Thoughtful', hint: 'Reflective, scripture-led' },
  { id: 'brief',      label: 'Brief',      hint: 'Short and sincere' }
];

const LENGTH_OPTIONS = [
  { id: 120, label: 'Short',  hint: '~120 words' },
  { id: 180, label: 'Medium', hint: '~180 words' },
  { id: 250, label: 'Long',   hint: '~250 words' }
];

// Topics are plain English descriptors — not titles, not quoted content.
// The AI generates fresh wording from scripture, never reproduces any publication.
const TOPIC_OPTIONS = [
  { id: 'none',        label: 'No specific topic',        hint: 'Just the situation' },
  { id: 'suffering',   label: 'Why suffering exists',     hint: 'For hardship or injustice' },
  { id: 'hope-dead',   label: 'Hope for the dead',        hint: 'After losing a loved one' },
  { id: 'anxiety',     label: 'Coping with anxiety',      hint: 'Worry, stress, fear' },
  { id: 'family',      label: 'Happy family life',        hint: 'Marriage, parenting, home' },
  { id: 'future',      label: 'A better future',          hint: 'Hope beyond current troubles' },
  { id: 'god-care',    label: 'God cares about you',      hint: 'Feeling alone or unseen' },
  { id: 'bible-help',  label: 'How the Bible helps',      hint: 'Practical guidance' }
];

// The system prompt. Keep all generation rules here, in one place.
const SYSTEM_PROMPT = `You are a writing assistant that helps a publisher draft a personal letter to someone in their neighborhood. You are a drafting tool, not the author — the publisher will edit and personalize every letter before sending.

TONE
- Conversational, sincere, and grounded. Write like a real person who thought carefully before picking up the pen.
- Avoid formal religious register ("brethren," "thy," "unto").
- Never preachy, never pushy.
- First person ("I"), addressing the recipient as "you."
- Default assumption: the recipient is a stranger to the publisher. Do not invent shared history. Do not use endearments ("dear friend," "my friend") unless the letter type specifies a prior relationship.

TONE OPTIONS
The publisher will specify one. Interpret it as follows:

- NEUTRAL: Respectful and measured, the register of a thoughtful stranger. Sincere but not warm. No endearments, no assumed familiarity, no emotional claims on the reader. Still personal — "I" and "you," not institutional. This is the right tone for most initial letters and for writing to anyone you have not personally met.

- WARM: Friendly and personal, the register of someone who has met the recipient before or shares a specific connection. Use only when the publisher has indicated prior contact. Do not default to this for strangers.

- COMFORTING: Gentle, present, acknowledging pain without trying to fix it. Appropriate for bereavement, illness, or serious hardship regardless of prior relationship — sincere human concern crosses the stranger-threshold naturally.

- THOUGHTFUL: Reflective and quiet, letting scripture do gentle work. Slightly more contemplative than neutral, less emotional than warm.

- BRIEF: Short and clear. Three or four sentences plus a scripture. Respectful, not curt.

LETTER TYPE HANDLING
The publisher will specify one of these types. Adjust opening, framing, and close accordingly:

- INITIAL: First contact with someone the publisher has not met. Do not claim any relationship. Do not say "dear friend" or "my neighbor" — just "Hello" or address them by name if known. Introduce the reason for writing in a simple, respectful sentence. Share one thought or question you hoped they might find interesting. Keep the ask light — perhaps mention a short video or article on jw.org they might find worth reading. Close without pressure. Neutral tone is almost always right here.

- FOLLOWUP: The publisher has spoken with or written to this person before. Reference the previous contact in general terms ("I enjoyed our conversation last month," "I thought of you after we spoke"). Warmer tone is appropriate. Invite further conversation naturally.

- MEMORIAL: Invite the recipient to attend the annual Memorial of Christ's death. The publisher likely does not know this person well. Mention what the Memorial commemorates in simple terms (Jesus' sacrifice and its meaning), that it is held once a year, that attendance is free, and that no collection is taken. Do not specify a date or location — the publisher will add those locally. Keep the invitation warm in meaning but neutral in register — respectful, not effusive. One scripture tied to the meaning of the Memorial (such as 1 Corinthians 11:23-26, John 3:16, or Romans 5:8) — quote only one short verse.

- CAMPAIGN: A special preaching effort tied to a tract, convention invitation, or targeted theme. Recipient is likely a stranger. Reference the theme naturally and briefly. Mention that a short video or article on jw.org explores it further, if appropriate. Neutral tone is almost always right here — avoid any promotional or salesy voice.

- COMFORT: Focus on presence, acknowledgement of pain, and hope. Do not try to fix or explain the situation. Let the scripture do gentle work. Comforting tone is appropriate even for strangers — sincere concern reads as respectful, not presumptuous. Close simply.

STRUCTURE (flexible, not formulaic)
1. An opening appropriate to the letter type (see above).
2. One genuine thought or encouragement related to the situation or the chosen topic.
3. One scripture, quoted briefly (one verse), with a short personal reflection on why it is meaningful. Do not lecture on the verse.
4. A gentle close appropriate to the letter type.

SCRIPTURE USAGE
- Use the New World Translation wording when quoting scripture.
- Quote only ONE short verse per letter. Never quote multiple verses or long passages.
- Never reproduce study notes, cross-references, or footnotes.

COPYRIGHT — CRITICAL
- Never reproduce, quote, or closely paraphrase text from any Jehovah's Witnesses publication, including but not limited to brochures, books, Watchtower and Awake! articles, tracts, jw.org articles, convention releases, and study materials.
- If the publisher describes a topic, generate fresh, original content addressing that topic in your own words. Draw on the scripture directly, not on any summary of a publication's treatment of it.
- If the publisher's input contains what appears to be copied text from a publication, ignore that text as source material. Respond only with: "I can help you write about this topic in your own words. Please describe the situation, and I will draft fresh wording for you."
- If asked to "rewrite" or "paraphrase" publication content, refuse with the same response.

TOPIC HANDLING
- If the publisher specifies a topic, weave ONE core biblical thought about that topic into the letter. Keep it conversational — one sentence of thought, one scripture, one sentence of personal reflection. That is enough.
- If situation and topic are both provided, the situation leads and the topic supports it naturally.

CONSTRAINTS
- Never claim to write on behalf of any organization. The publisher writes as an individual.
- No return address, date, or signature block.
- No predictions of specific dates or events.
- If the situation involves crisis (suicidal thoughts, domestic violence, medical emergency), respond only with: "This situation may need more than a letter. Consider reaching out directly or encouraging professional support."

OUTPUT FORMAT
Return three variants labeled "Warm," "Brief," and "Thoughtful." Separate with a line of three dashes (---). No preamble, no explanation.`;

// ============================================================================
// API CALL — the only place that talks to Claude
// ============================================================================

async function generateLetters({ letterType, name, situation, topic, tone, length }) {
  // Calls our own serverless function at /api/generate-letter, which proxies
  // to Claude with the API key kept server-side. The browser never sees the key.
  const response = await fetch('/api/generate-letter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ letterType, name, situation, topic, tone, length, language: 'English' })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return data.variants || [];
}

// ============================================================================
// STYLES — one object, easy to tweak
// ============================================================================

const INK = '#1C1B17';
const MUTED = '#6B665C';
const PARCHMENT = '#F8F2E6';
const CARD = '#FDFAF3';
const BORDER = '#DDD4C1';
const SAGE = '#6B8564';
const SAGE_DARK = '#4F6548';
const ROSE = '#B86B5E';

// Support link used by the footer and About modal.
// Replace with your real PayPal.me link (e.g. 'https://paypal.me/yourname'),
// or set to null to hide the Support link everywhere.
const PAYPAL_URL = 'https://paypal.me/ejrosa';

// Formspree form IDs — create free forms at formspree.io (2 minutes to set up).
// Steps: go to formspree.io → New Form → copy the ID from the URL or embed code.
// The ID looks like: xdknpwqv (short alphanumeric string).
// Replace the placeholders below with your real IDs, then push to GitHub.
const FORMSPREE_TICKETS_ID = 'YOUR_TICKETS_FORM_ID';     // <-- replace this
const FORMSPREE_SUGGESTIONS_ID = 'YOUR_SUGGESTIONS_FORM_ID'; // <-- replace this

// Height of the fixed bottom tab bar in pixels.
// All scrollable content areas need bottom padding equal to this so nothing
// hides under the tab bar on any screen.
const TAB_BAR_H = 62;

const styles = {
  outer: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    background: PARCHMENT,
    color: INK,
    // Fill the entire viewport on phones, including the safe-area insets
    // so content doesn't hide behind iPhone notches or Android gesture bars.
    minHeight: '100vh',
    minHeight: '100dvh',  // 'dvh' = dynamic viewport height, accounts for mobile browser chrome
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch'
  },
  phone: {
    // On mobile: fills edge-to-edge, full height. On desktop: bounded card.
    width: '100%',
    maxWidth: '440px',
    background: CARD,
    // Border and shadow only visible on desktop via media query below.
    // On mobile the card visually IS the page.
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
    // Safe-area padding for iPhone notches and home indicators,
    // plus comfortable reading padding on all sides.
    padding: 'max(24px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))',
    display: 'flex',
    flexDirection: 'column',
    // Fill the screen height on mobile so buttons are always reachable at the bottom.
    minHeight: '100vh',
    minHeight: '100dvh',
    boxSizing: 'border-box'
  },
  stepLabel: {
    fontSize: '13px',
    color: MUTED,
    textAlign: 'center',
    marginBottom: '8px',
    letterSpacing: '0.02em'
  },
  progressTrack: {
    height: '4px',
    background: BORDER,
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '28px'
  },
  progressFill: {
    height: '100%',
    background: SAGE,
    transition: 'width 0.3s ease'
  },
  heading: {
    fontFamily: 'Fraunces, "Iowan Old Style", Georgia, serif',
    fontSize: '26px',
    fontWeight: 500,
    lineHeight: 1.25,
    marginBottom: '20px',
    color: INK
  },
  textInput: {
    width: '100%',
    minHeight: '80px',
    padding: '14px 16px',
    fontSize: '17px',
    fontFamily: 'inherit',
    color: INK,
    background: '#fff',
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.5,
    boxSizing: 'border-box'
  },
  smallInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '17px',
    fontFamily: 'inherit',
    color: INK,
    background: '#fff',
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  voiceBtn: {
    marginTop: '12px',
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontFamily: 'inherit',
    color: INK,
    background: 'transparent',
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  exampleLabel: {
    fontSize: '14px',
    color: MUTED,
    marginTop: '20px',
    marginBottom: '10px'
  },
  chipList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  chip: {
    padding: '12px 14px',
    background: '#fff',
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    fontSize: '15px',
    color: INK,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit'
  },
  optionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  option: {
    padding: '16px',
    background: '#fff',
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit'
  },
  optionSelected: {
    background: '#EFF2EB',
    borderColor: SAGE,
    borderWidth: '2px',
    padding: '15px' // compensate for 2px border so it doesn't jump
  },
  optionTitle: {
    fontSize: '17px',
    fontWeight: 500,
    color: INK,
    marginBottom: '2px'
  },
  optionHint: {
    fontSize: '14px',
    color: MUTED
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto',
    paddingTop: '24px'
  },
  backBtn: {
    flex: 1,
    padding: '16px',
    fontSize: '16px',
    fontFamily: 'inherit',
    color: INK,
    background: 'transparent',
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    cursor: 'pointer'
  },
  primaryBtn: {
    flex: 2,
    padding: '16px',
    fontSize: '16px',
    fontWeight: 500,
    fontFamily: 'inherit',
    color: '#fff',
    background: SAGE,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  primaryBtnDisabled: {
    background: '#B8BEB2',
    cursor: 'not-allowed'
  },
  loadingWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: MUTED
  },
  draftCard: {
    background: '#fff',
    border: `1px solid ${BORDER}`,
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '14px',
    whiteSpace: 'pre-wrap',
    fontSize: '15px',
    lineHeight: 1.65,
    color: INK
  },
  draftLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: ROSE,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '10px'
  },
  errorBox: {
    background: '#FBECE7',
    border: '1px solid #E8C4B4',
    color: '#6E2A17',
    padding: '14px',
    borderRadius: '10px',
    fontSize: '14px',
    marginBottom: '14px'
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// ============================================================================
// PWA INSTALL PROMPT — shows when the app can be installed on the user's device
// ============================================================================

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('pioneerInstallDismissed') === 'true'; } catch { return false; }
  });
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Chrome, Edge, Android browsers fire this event when the app is installable.
    // Safari doesn't — iOS users need manual instructions (handled below).
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Detect iOS Safari, where the Web Share API is the install path.
  const isIosSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  // Detect whether the app is already running as an installed PWA.
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                    || window.navigator.standalone === true;

  // Don't show if: already installed, already dismissed, or no install path available.
  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIosSafari) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIosSafari) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('pioneerInstallDismissed', 'true'); } catch {}
  };

  if (showIosGuide) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(28, 27, 23, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000
      }}>
        <div style={{
          background: CARD,
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '340px',
          width: '100%'
        }}>
          <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>
            Install on iPhone or iPad
          </div>
          <ol style={{ fontSize: '15px', lineHeight: 1.7, color: INK, paddingLeft: '20px', margin: 0 }}>
            <li>Tap the <strong>Share</strong> button at the bottom of Safari (the square with an arrow pointing up)</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong> in the top-right</li>
          </ol>
          <button
            onClick={() => setShowIosGuide(false)}
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '14px',
              background: SAGE,
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      maxWidth: '440px',
      margin: '0 auto',
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: '14px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      zIndex: 100,
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        background: '#EFF2EB',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SAGE_DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: INK }}>Install the app</div>
        <div style={{ fontSize: '12px', color: MUTED, marginTop: '1px' }}>Add to your home screen for quick access</div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          padding: '8px 14px',
          background: SAGE,
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap'
        }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        title="Dismiss"
        style={{
          padding: '4px 8px',
          background: 'transparent',
          color: MUTED,
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          lineHeight: 1,
          flexShrink: 0
        }}
      >
        ×
      </button>
    </div>
  );
}

// ============================================================================
// SPLASH SCREEN — shows on every app launch. Animated fountain pen traverses
// the screen while the PioneerPen wordmark fades in letter-by-letter.
// User taps "Begin" (or "Skip" in the corner) to enter the app.
// ============================================================================

function SplashScreen({ onContinue }) {
  // Phase tracking for the animation sequence.
  // 0 = initial, 1 = pen animating + letters appearing, 2 = complete (button shown)
  const [phase, setPhase] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const WORDMARK = 'PioneerPen';
  const ANIMATION_TOTAL_MS = 2800; // roughly how long the writing takes

  useEffect(() => {
    // Start the pen/letter animation shortly after mount
    const t1 = setTimeout(() => setPhase(1), 300);
    // After animation finishes, reveal the Begin button
    const t2 = setTimeout(() => setPhase(2), 300 + ANIMATION_TOTAL_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleDismiss = () => {
    if (leaving) return;
    setLeaving(true);
    // Give the fade-out animation time before swapping to wizard
    setTimeout(() => onContinue(), 420);
  };

  // Per-letter delay: spread across the animation duration
  const letterDelay = (i) => 400 + i * (ANIMATION_TOTAL_MS / WORDMARK.length) * 0.9;

  return (
    <>
      <style>{`
        @keyframes pioneer-splash-penglide {
          0%   { transform: translate(-80px, -20px) rotate(-28deg); opacity: 0; }
          12%  { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translate(280px, -20px) rotate(-28deg); opacity: 0; }
        }
        @keyframes pioneer-splash-letter {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pioneer-splash-fade-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes pioneer-splash-ink-appear {
          0%   { opacity: 0; transform: scale(0.4); }
          100% { opacity: 1; transform: scale(1); }
        }
        .pioneer-splash-root {
          transition: opacity 0.42s ease-out;
        }
        .pioneer-splash-root.leaving {
          opacity: 0;
          pointer-events: none;
        }
      `}</style>

      <div
        className={`pioneer-splash-root${leaving ? ' leaving' : ''}`}
        style={{
          position: 'fixed',
          inset: 0,
          background: PARCHMENT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          overflow: 'hidden',
          padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'
        }}
      >
        {/* Skip link, top-right */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top) + 20px)',
            right: 'calc(env(safe-area-inset-right) + 20px)',
            background: 'none',
            border: 'none',
            color: MUTED,
            fontSize: '13px',
            letterSpacing: '0.14em',
            cursor: 'pointer',
            padding: '10px 14px',
            opacity: 0.7,
            fontFamily: 'inherit'
          }}
        >
          Skip →
        </button>

        {/* Faint inner frame, matches Instagram images */}
        <div style={{
          position: 'absolute',
          top: '56px',
          right: '56px',
          bottom: '56px',
          left: '56px',
          border: `1px solid rgba(28,27,23,0.15)`,
          pointerEvents: 'none'
        }} />

        {/* Animation stage */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '26px'
        }}>
          {/* Pen + wordmark group — positioned relative so pen animation can pass over letters */}
          <div style={{
            position: 'relative',
            height: '140px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}>
            {/* Fountain pen SVG — slides in from upper-left and glides across */}
            {phase >= 1 && (
              <svg
                width="70"
                height="170"
                viewBox="0 0 70 170"
                style={{
                  position: 'absolute',
                  top: '-40px',
                  left: '50%',
                  marginLeft: '-140px',
                  animation: `pioneer-splash-penglide ${ANIMATION_TOTAL_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
                }}
                aria-hidden="true"
              >
                {/* Pen barrel — dark ink color */}
                <rect x="28" y="20" width="14" height="90" rx="3" fill="#1C1B17"/>
                {/* Cap band — small sage accent */}
                <rect x="28" y="50" width="14" height="3" fill="#6B8564"/>
                {/* Grip (lighter section near nib) */}
                <rect x="29" y="108" width="12" height="20" rx="2" fill="#3A3732"/>
                {/* Nib — parchment-colored triangle */}
                <path d="M 35 128 L 26 162 L 30 164 L 35 168 L 40 164 L 44 162 Z" fill="#1C1B17"/>
                {/* Nib slit */}
                <line x1="35" y1="140" x2="35" y2="162" stroke="#F8F2E6" strokeWidth="1.2"/>
                {/* Breather hole */}
                <circle cx="35" cy="144" r="1.8" fill="#F8F2E6"/>
                {/* Clip on barrel */}
                <rect x="41" y="22" width="2" height="26" fill="#F8F2E6" opacity="0.7"/>
              </svg>
            )}

            {/* Wordmark — letters appear one at a time, in classical serif */}
            <div style={{
              fontFamily: '"Playfair Display", "EB Garamond", Garamond, Georgia, serif',
              fontSize: 'clamp(48px, 11vw, 76px)',
              fontWeight: 500,
              fontStyle: 'italic',
              color: INK,
              letterSpacing: '0.005em',
              display: 'flex',
              position: 'relative',
              zIndex: 1,
              lineHeight: 1,
              justifyContent: 'center',
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap'
            }}>
              {WORDMARK.split('').map((char, i) => (
                <span
                  key={i}
                  style={{
                    opacity: 0,
                    display: 'inline-block',
                    // Spaces render as empty with inline-block — use a fixed width
                    // so the word spacing looks right and the space still fades in with the animation.
                    width: char === ' ' ? '0.3em' : 'auto',
                    animation: phase >= 1
                      ? `pioneer-splash-letter 0.35s ease-out ${letterDelay(i)}ms forwards`
                      : 'none'
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </div>

            {/* Sage ink drop — appears once writing is complete */}
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              width: '10px',
              height: '10px',
              marginLeft: '-5px',
              borderRadius: '50%',
              background: SAGE,
              opacity: 0,
              animation: phase >= 2
                ? `pioneer-splash-ink-appear 0.5s ease-out forwards`
                : 'none'
            }} />
          </div>

          {/* Tagline — fades in with the button */}
          <div style={{
            fontFamily: '"Playfair Display", "EB Garamond", Garamond, Georgia, serif',
            fontSize: '18px',
            fontStyle: 'italic',
            fontWeight: 400,
            color: MUTED,
            textAlign: 'center',
            letterSpacing: '0.01em',
            opacity: 0,
            animation: phase >= 2
              ? 'pioneer-splash-fade-in 0.6s ease-out 0.2s forwards'
              : 'none'
          }}>
            A quieter way to begin.
          </div>

          {/* Begin button — fades in after animation completes */}
          <button
            onClick={handleDismiss}
            style={{
              marginTop: '18px',
              padding: '15px 44px',
              background: INK,
              color: PARCHMENT,
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500,
              opacity: 0,
              animation: phase >= 2
                ? 'pioneer-splash-fade-in 0.6s ease-out 0.5s forwards'
                : 'none'
            }}
          >
            Begin
          </button>
        </div>

        {/* Footer attribution — fades in with button */}
        <div style={{
          position: 'absolute',
          bottom: 'calc(env(safe-area-inset-bottom) + 32px)',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '11px',
          letterSpacing: '0.28em',
          color: MUTED,
          opacity: 0,
          animation: phase >= 2
            ? 'pioneer-splash-fade-in 0.6s ease-out 0.7s forwards'
            : 'none'
        }}>
          BY EJ ROSA
        </div>
      </div>
    </>
  );
}

// ============================================================================
// BOTTOM TAB BAR — fixed to the bottom of every screen after the splash.
// Three tabs: Home (wizard), Tickets (bug reports), Suggestions (feature ideas).
// ============================================================================

function BottomTabBar({ activeTab, setActiveTab }) {
  // Each tab has its own accent color so they're visually distinct.
  // Active state brightens the icon and label; inactive is a muted version.
  const tabs = [
    {
      id: 'home',
      label: 'Write',
      activeColor: '#4A90D9',   // sky blue
      icon: (active) => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          {/* Barrel */}
          <rect x="10.5" y="2" width="5" height="11" rx="2.5"
            fill={active ? '#4A90D9' : '#B0C4DE'}/>
          {/* Cap band */}
          <rect x="10.5" y="7" width="5" height="2"
            fill={active ? '#2E6DB4' : '#8FA8C8'}/>
          {/* Clip */}
          <rect x="15" y="2.5" width="1.2" height="7" rx="0.6"
            fill={active ? '#2E6DB4' : '#8FA8C8'} opacity="0.8"/>
          {/* Grip section */}
          <path d="M11 13h4l.5 2h-5z"
            fill={active ? '#2E6DB4' : '#8FA8C8'}/>
          {/* Nib */}
          <path d="M11.5 15L12 22l.5-1 .5 1 .5-7z"
            fill={active ? '#1C1B17' : '#7A8FA8'}/>
          {/* Nib slit */}
          <line x1="12.5" y1="16.5" x2="12.5" y2="20.5"
            stroke={active ? '#ffffff' : '#E8F0F8'}
            strokeWidth="0.8" strokeLinecap="round"/>
          {/* Ink drop */}
          <circle cx="12.5" cy="22" r="1.2"
            fill={active ? '#4A90D9' : '#B0C4DE'} opacity="0.85"/>
          {/* Shine on barrel */}
          <rect x="11.5" y="3" width="1" height="5" rx="0.5"
            fill="white" opacity={active ? 0.35 : 0.2}/>
        </svg>
      )
    },
    {
      id: 'ticket',
      label: 'Tickets',
      activeColor: '#E05C5C',   // coral red
      icon: (active) => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          {/* Ticket background */}
          <path d="M2 8a2 2 0 012-2h16a2 2 0 012 2v1.5a2.5 2.5 0 000 5V16a2 2 0 01-2 2H4a2 2 0 01-2-2v-1.5a2.5 2.5 0 000-5V8z"
            fill={active ? '#E05C5C' : '#F0B8B8'}/>
          {/* Dashed divider */}
          <line x1="9" y1="8" x2="9" y2="16"
            stroke={active ? '#ffffff' : '#F8E0E0'}
            strokeWidth="1.2" strokeDasharray="1.5 1.5"/>
          {/* Ticket text lines */}
          <rect x="11" y="10" width="7" height="1.5" rx="0.75"
            fill={active ? '#ffffff' : '#F8E0E0'} opacity="0.9"/>
          <rect x="11" y="13" width="5" height="1.5" rx="0.75"
            fill={active ? '#ffffff' : '#F8E0E0'} opacity="0.7"/>
          {/* Alert dot */}
          <circle cx="5.5" cy="12" r="1.5"
            fill={active ? '#ffffff' : '#F8E0E0'}/>
        </svg>
      )
    },
    {
      id: 'suggest',
      label: 'Ideas',
      activeColor: '#F5A623',   // warm amber/gold
      icon: (active) => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          {/* Bulb glass */}
          <path d="M12 2a7 7 0 015.196 11.732c-.71.8-1.196 1.8-1.196 2.768v.5H8v-.5c0-.968-.486-1.968-1.196-2.768A7 7 0 0112 2z"
            fill={active ? '#F5A623' : '#F5D78E'}/>
          {/* Glow effect when active */}
          {active && (
            <path d="M12 2a7 7 0 015.196 11.732c-.71.8-1.196 1.8-1.196 2.768v.5H8v-.5c0-.968-.486-1.968-1.196-2.768A7 7 0 0112 2z"
              fill="#FFF0B0" opacity="0.4"/>
          )}
          {/* Base of bulb */}
          <rect x="9" y="17" width="6" height="1.5" rx="0.75"
            fill={active ? '#D4891A' : '#C8A855'}/>
          <rect x="9.5" y="19" width="5" height="1.5" rx="0.75"
            fill={active ? '#D4891A' : '#C8A855'}/>
          {/* Filament */}
          <path d="M10 11 Q12 9 14 11" stroke={active ? '#ffffff' : '#FFF8E0'}
            strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          {/* Shine lines */}
          <line x1="12" y1="4" x2="12" y2="5.5"
            stroke={active ? '#ffffff' : '#FFF8E0'}
            strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
          <line x1="15.5" y1="5.5" x2="14.5" y2="6.5"
            stroke={active ? '#ffffff' : '#FFF8E0'}
            strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
        </svg>
      )
    }
  ];

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: `calc(${TAB_BAR_H}px + env(safe-area-inset-bottom))`,
        background: CARD,
        borderTop: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        paddingTop: '6px',
        zIndex: 100,
        boxShadow: '0 -2px 16px rgba(0,0,0,0.08)'
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 20px',
              fontFamily: 'inherit',
              fontSize: '10px',
              letterSpacing: '0.06em',
              fontWeight: isActive ? 700 : 400,
              color: isActive ? tab.activeColor : MUTED,
              transition: 'color 0.15s',
              // Subtle active pill background
              borderRadius: '12px',
              backgroundColor: isActive ? `${tab.activeColor}18` : 'transparent'
            }}
          >
            {tab.icon(isActive)}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// FEEDBACK FORM — shared layout used by both TicketView and SuggestView.
// On submit, opens the user's native email app with all fields pre-filled.
// The user taps "Send" in their email app to complete the submission.
// ============================================================================

function FeedbackForm({ type }) {
  const isTicket = type === 'ticket';

  const config = {
    ticket: {
      heading: 'Report an issue',
      subheading: 'Something not working right? Tell me what happened and I\'ll look into it.',
      placeholder: 'Describe what you were doing and what went wrong…',
      label: 'What\'s the issue?',
      buttonLabel: 'Send ticket',
      subject: 'PioneerPen Ticket',
      emoji: '🎫'
    },
    suggest: {
      heading: 'Suggest a feature',
      subheading: 'Have an idea that would make PioneerPen more useful? I\'d love to hear it.',
      placeholder: 'Describe the feature or improvement you\'d like to see…',
      label: 'Your suggestion',
      buttonLabel: 'Send suggestion',
      subject: 'PioneerPen Suggestion',
      emoji: '💡'
    }
  }[type];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // Validate all fields
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields before sending.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');

    // Build the pre-filled email
    const subject = encodeURIComponent(`${config.subject} — ${name.trim()}`);
    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${isTicket ? 'Issue' : 'Suggestion'}:\n${message.trim()}\n\n---\nSent from PioneerPen`
    );

    // Open native email app
    window.location.href = `mailto:eunice@ejrosa.com?subject=${subject}&body=${body}`;

    // Show confirmation after a short delay
    setTimeout(() => setSubmitted(true), 400);
  };

  if (submitted) {
    return (
      <div className="pioneer-outer" style={{ ...styles.outer, paddingBottom: `${TAB_BAR_H + 20}px` }}>
        <FontLink />
        <div className="pioneer-card" style={styles.phone}>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '16px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '48px' }}>{config.emoji}</div>
            <h2 style={{ ...styles.heading, marginBottom: 0 }}>
              {isTicket ? 'Ticket ready to send' : 'Suggestion ready to send'}
            </h2>
            <p style={{ fontSize: '15px', color: MUTED, lineHeight: 1.6, maxWidth: '280px' }}>
              Your email app should have opened with your {isTicket ? 'ticket' : 'suggestion'} pre-filled.
              Tap <strong>Send</strong> there to submit it.
            </p>
            <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5, maxWidth: '280px', opacity: 0.8 }}>
              If your email app didn't open, email{' '}
              <a href="mailto:eunice@ejrosa.com" style={{ color: SAGE }}>eunice@ejrosa.com</a>
              {' '}directly with your {isTicket ? 'issue' : 'suggestion'}.
            </p>
            <button
              onClick={() => { setSubmitted(false); setName(''); setEmail(''); setMessage(''); }}
              style={{ ...styles.backBtn, marginTop: '8px', flex: 'none', padding: '12px 24px' }}
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pioneer-outer" style={{ ...styles.outer, paddingBottom: `${TAB_BAR_H + 20}px` }}>
      <FontLink />
      <div className="pioneer-card" style={styles.phone}>
        <h1 style={styles.heading}>{config.heading}</h1>
        <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.5, marginBottom: '24px', marginTop: '-8px' }}>
          {config.subheading}
        </p>

        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        {/* Name */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: INK, marginBottom: '6px', letterSpacing: '0.02em' }}>
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rosa Santos"
            style={styles.smallInput}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: INK, marginBottom: '6px', letterSpacing: '0.02em' }}>
            Your email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="so I can follow up with you"
            style={styles.smallInput}
          />
        </div>

        {/* Message */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: INK, marginBottom: '6px', letterSpacing: '0.02em' }}>
            {config.label}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={config.placeholder}
            style={{ ...styles.textInput, minHeight: '120px' }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          style={{ ...styles.primaryBtn, flex: 'none', width: '100%' }}
        >
          {config.buttonLabel}
        </button>

        <p style={{ fontSize: '11px', color: MUTED, textAlign: 'center', marginTop: '12px', lineHeight: 1.5, opacity: 0.8 }}>
          Tapping send will open your email app with your message pre-filled.
          You'll just need to tap Send there to submit.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// FLOATING TIMER — persistent stopwatch for tracking ministry letter time.
// Designed to match the app's quiet parchment-and-ink aesthetic.
// Sessions are saved to localStorage so they survive app closes.
// ============================================================================

function FloatingTimer() {
  const [running, setRunning]           = useState(false);
  const [startTime, setStartTime]       = useState(null);
  const [elapsed, setElapsed]           = useState(0);
  const [sessions, setSessions]         = useState([]);
  const [showSessions, setShowSessions] = useState(false);
  const [toast, setToast]               = useState(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const pad = (n) => String(n).padStart(2, '0');

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${pad(m)}:${pad(s)}`
      : `${pad(m)}:${pad(s)}`;
  };

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    if (m === 0) return '< 1m';
    return `${m}m`;
  };

  const formatDate = (iso) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (iso === today) return 'Today';
    if (iso === yesterday) return 'Yesterday';
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const monthTotal = () => {
    const now = new Date();
    return sessions
      .filter(s => {
        const d = new Date(s.date + 'T00:00:00');
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, s) => sum + s.duration, 0);
  };

  const showToast = (text) => {
    const key = Date.now();
    setToast({ text, key });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Restore from localStorage on mount ────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pioneerTimerStart');
      if (saved) {
        const ts = parseInt(saved);
        setStartTime(ts);
        setRunning(true);
        setElapsed(Math.floor((Date.now() - ts) / 1000));
      }
      const savedSessions = localStorage.getItem('pioneerSessions');
      if (savedSessions) setSessions(JSON.parse(savedSessions));
    } catch {}
  }, []);

  // ── Tick ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!running || !startTime) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [running, startTime]);

  // ── Start / Stop ──────────────────────────────────────────────────────────
  const handleStart = () => {
    const now = Date.now();
    setStartTime(now);
    setRunning(true);
    setElapsed(0);
    try { localStorage.setItem('pioneerTimerStart', String(now)); } catch {}
  };

  const handleStop = () => {
    const end = Date.now();
    const duration = Math.floor((end - startTime) / 1000);
    const session = {
      id: String(end),
      date: new Date().toISOString().split('T')[0],
      startTime,
      endTime: end,
      duration
    };
    const updated = [session, ...sessions];
    setSessions(updated);
    setRunning(false);
    setStartTime(null);
    setElapsed(0);
    showToast(`${formatDuration(duration)} logged`);
    try {
      localStorage.removeItem('pioneerTimerStart');
      localStorage.setItem('pioneerSessions', JSON.stringify(updated));
    } catch {}
  };

  const [confirmClear, setConfirmClear] = useState(false);

  const deleteSession = (id) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    try { localStorage.setItem('pioneerSessions', JSON.stringify(updated)); } catch {}
  };

  const clearAll = () => {
    setSessions([]);
    setConfirmClear(false);
    try { localStorage.removeItem('pioneerSessions'); } catch {}
  };

  const fabBottom = `calc(${TAB_BAR_H}px + env(safe-area-inset-bottom) + 14px)`;

  return (
    <>
      <style>{`
        @keyframes pioneer-timer-breathe {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }
        @keyframes pioneer-timer-toast {
          0%   { opacity: 0; transform: translateY(6px) scale(0.97); }
          15%  { opacity: 1; transform: translateY(0) scale(1); }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* ── Toast notification ──────────────────────────────────────────────── */}
      {toast && (
        <div
          key={toast.key}
          className="no-print"
          style={{
            position: 'fixed',
            top: `calc(env(safe-area-inset-top) + 80px)`,
            left: '14px',
            background: CARD,
            border: `1px solid ${BORDER}`,
            color: SAGE_DARK,
            fontSize: '12px',
            fontWeight: 600,
            padding: '7px 13px',
            borderRadius: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            zIndex: 300,
            letterSpacing: '0.02em',
            animation: 'pioneer-timer-toast 3s ease-out forwards',
            pointerEvents: 'none'
          }}
        >
          ✦ {toast.text}
        </div>
      )}

      {/* ── Floating timer pill ─────────────────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          top: `calc(env(safe-area-inset-top) + 14px)`,
          left: '14px',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '5px'
        }}
      >
        {/* Main pill button */}
        <button
          onClick={running ? handleStop : handleStart}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: running ? '10px 16px' : '9px 15px',
            background: running ? INK : SAGE,
            border: `1.5px solid ${running ? INK : SAGE_DARK}`,
            borderRadius: '30px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: running
              ? '0 4px 20px rgba(28,27,23,0.25)'
              : '0 4px 14px rgba(107,133,100,0.35)',
            transition: 'all 0.2s ease'
          }}
        >
          {running ? (
            <>
              {/* Breathing dot */}
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: ROSE,
                flexShrink: 0,
                animation: 'pioneer-timer-breathe 1.6s ease-in-out infinite'
              }} />
              {/* Elapsed time */}
              <span style={{
                fontSize: '15px',
                fontWeight: 800,
                color: PARCHMENT,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.06em',
                minWidth: '52px',
                textAlign: 'left',
                textTransform: 'uppercase'
              }}>
                {formatElapsed(elapsed)}
              </span>
              {/* Stop label */}
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: PARCHMENT,
                letterSpacing: '0.14em',
                textTransform: 'uppercase'
              }}>
                STOP
              </span>
            </>
          ) : (
            <>
              {/* Pen nib icon — white when on green background */}
              <svg width="13" height="16" viewBox="0 0 13 16" fill="none">
                <path d="M6.5 0 L3 8 L5 9 L6.5 12 L8 9 L10 8 Z" fill={PARCHMENT}/>
                <line x1="6.5" y1="2" x2="6.5" y2="9"
                  stroke={SAGE} strokeWidth="0.8" strokeLinecap="round"/>
                <circle cx="6.5" cy="14" r="1.5" fill={PARCHMENT} opacity="0.8"/>
              </svg>
              {/* Label */}
              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                color: PARCHMENT,
                letterSpacing: '0.14em',
                textTransform: 'uppercase'
              }}>
                START TIMER
              </span>
            </>
          )}
        </button>

        {/* Sessions link — only when stopped */}
        {!running && sessions.length > 0 && (
          <button
            onClick={() => setShowSessions(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              color: MUTED,
              fontFamily: 'inherit',
              padding: '2px 6px',
              letterSpacing: '0.04em',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: '3px',
              textAlign: 'left'
            }}
          >
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* ── Sessions bottom sheet ───────────────────────────────────────────── */}
      {showSessions && (
        <div
          className="no-print"
          onClick={() => setShowSessions(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28,27,23,0.45)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 500
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: PARCHMENT,
              borderRadius: '20px 20px 0 0',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '72vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -4px 30px rgba(28,27,23,0.12)',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
          >
            {/* Handle bar */}
            <div style={{
              width: '36px', height: '4px',
              background: BORDER, borderRadius: '2px',
              margin: '12px auto 0',
              flexShrink: 0
            }} />

            {/* Header */}
            <div style={{
              padding: '16px 20px 12px',
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: '18px',
                    fontWeight: 500,
                    fontStyle: 'italic',
                    color: INK
                  }}>
                    Letter-writing time
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: MUTED,
                    marginTop: '3px'
                  }}>
                    This month —{' '}
                    <span style={{ color: SAGE_DARK, fontWeight: 600 }}>
                      {formatDuration(monthTotal())}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSessions(false)}
                  style={{
                    background: 'none', border: 'none',
                    fontSize: '20px', color: MUTED,
                    cursor: 'pointer', padding: '0 4px',
                    lineHeight: 1
                  }}
                >×</button>
              </div>
            </div>

            {/* Session list */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 20px 20px' }}>
              {sessions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 0',
                  color: MUTED,
                  fontSize: '14px',
                  fontStyle: 'italic',
                  fontFamily: 'Fraunces, Georgia, serif'
                }}>
                  No sessions recorded yet.
                </div>
              ) : (
                <>
                  {sessions.map((s, i) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '13px 0',
                        borderBottom: i < sessions.length - 1 ? `1px solid ${BORDER}` : 'none'
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: INK
                        }}>
                          {formatDate(s.date)}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: MUTED,
                          marginTop: '2px',
                          letterSpacing: '0.01em'
                        }}>
                          {formatTime(s.startTime)} – {formatTime(s.endTime)}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px'
                      }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: SAGE,
                          fontVariantNumeric: 'tabular-nums',
                          fontFamily: 'Fraunces, Georgia, serif',
                          fontStyle: 'italic'
                        }}>
                          {formatDuration(s.duration)}
                        </span>
                        <button
                          onClick={() => deleteSession(s.id)}
                          style={{
                            background: 'none', border: 'none',
                            color: BORDER, cursor: 'pointer',
                            fontSize: '16px', padding: '2px 4px',
                            lineHeight: 1,
                            transition: 'color 0.15s'
                          }}
                          onMouseOver={e => e.currentTarget.style.color = ROSE}
                          onMouseOut={e => e.currentTarget.style.color = BORDER}
                        >×</button>
                      </div>
                    </div>
                  ))}

                  {!confirmClear ? (
                    <button
                      onClick={() => setConfirmClear(true)}
                      style={{
                        width: '100%',
                        marginTop: '20px',
                        padding: '11px',
                        background: 'none',
                        border: `1px solid ${BORDER}`,
                        borderRadius: '10px',
                        color: MUTED,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '12px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase'
                      }}
                    >
                      Clear all sessions
                    </button>
                  ) : (
                    <div style={{
                      marginTop: '20px',
                      padding: '14px',
                      background: '#FFF0EE',
                      border: `1px solid ${ROSE}`,
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '13px',
                        color: INK,
                        marginBottom: '12px',
                        fontWeight: 500
                      }}>
                        Clear all sessions?
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setConfirmClear(false)}
                          style={{
                            flex: 1,
                            padding: '9px',
                            background: 'none',
                            border: `1px solid ${BORDER}`,
                            borderRadius: '8px',
                            color: MUTED,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '13px'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={clearAll}
                          style={{
                            flex: 1,
                            padding: '9px',
                            background: ROSE,
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '13px',
                            fontWeight: 600
                          }}
                        >
                          Clear all
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// APP FOOTER — copyright line, privacy note, and About modal trigger.
// Appears at the bottom of every screen with minimal visual weight so it
// doesn't compete with the app's main content.
// ============================================================================

function AppFooter() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <div
        className="no-print"
        style={{
          marginTop: '20px',
          paddingTop: '14px',
          borderTop: `1px solid ${BORDER}`,
          textAlign: 'center',
          fontSize: '11px',
          color: MUTED,
          lineHeight: 1.5
        }}
      >
        <div>© 2026 EJ Rosa · PioneerPen</div>
        <div style={{ marginTop: '4px' }}>
          Your letters are private. Nothing is saved.
          {' '}
          <button
            onClick={() => setShowAbout(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
              color: SAGE,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            About
          </button>
          {PAYPAL_URL && (
            <>
              {' · '}
              <a
                href={PAYPAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: SAGE,
                  textDecoration: 'underline'
                }}
              >
                Support this project
              </a>
            </>
          )}
        </div>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
}

// ============================================================================
// ABOUT MODAL — tapping the "About" link in the footer opens this overlay.
// Covers the whole screen on mobile; feels native with rounded corners.
// ============================================================================

function AboutModal({ onClose }) {
  // ---------------------------------------------------------------------------
  // CONTACT INFO — change these values to update the About page.
  //   • instagramHandle: Instagram username (without the @)
  //   • contactEmail: full email address
  //   • websiteUrl: personal website (full URL with https://)
  // Set any value to null if you don't want to show it.
  // (The support link uses PAYPAL_URL, defined near the top of this file.)
  // ---------------------------------------------------------------------------
  const instagramHandle = 'itsejrosa';
  const contactEmail = 'eunice@ejrosa.com';
  const websiteUrl = 'https://ejrosa.com';
  const paypalUrl = PAYPAL_URL;

  return (
    <div
      className="no-print"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 27, 23, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: CARD,
          borderRadius: '16px',
          padding: '28px 24px',
          maxWidth: '440px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)'
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: MUTED,
            cursor: 'pointer',
            padding: '4px 10px',
            lineHeight: 1
          }}
        >
          ×
        </button>

        <h2 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: '22px',
          fontWeight: 500,
          margin: '0 0 16px 0',
          color: INK
        }}>
          About PioneerPen
        </h2>

        <div style={{ fontSize: '14px', lineHeight: 1.6, color: INK }}>
          <p style={{ margin: '0 0 14px 0' }}>
            PioneerPen is a writing assistant that helps publishers draft
            personal letters for the ministry — initial letters, memorial
            invitations, comfort letters, follow-ups, and campaign letters.
          </p>

          <p style={{ margin: '0 0 14px 0' }}>
            It's meant to help get past the blank page. The drafts it provides
            are starting points, not finished letters. Always read, edit, and
            personalize each draft so the letter sounds like you.
          </p>

          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            margin: '18px 0 6px 0',
            color: INK
          }}>
            Privacy
          </h3>
          <p style={{ margin: '0 0 14px 0' }}>
            Your letters are not stored. Each request is independent and
            private — nothing is saved to an account, a database, or shared
            with anyone. When you close or refresh the app, nothing remains.
          </p>

          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            margin: '18px 0 6px 0',
            color: INK
          }}>
            A note on letters
          </h3>
          <p style={{ margin: '0 0 14px 0' }}>
            PioneerPen does not represent any organization. The letters are
            drafts created for the publisher to edit and send personally.
          </p>

          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            margin: '18px 0 6px 0',
            color: INK
          }}>
            Contact
          </h3>
          <p style={{ margin: '0 0 10px 0' }}>
            Questions or feedback? Message{' '}
            {instagramHandle && (
              <a
                href={`https://instagram.com/${instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: SAGE, textDecoration: 'underline' }}
              >
                @{instagramHandle}
              </a>
            )}
            {instagramHandle && contactEmail && ' on Instagram, or email '}
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                style={{ color: SAGE, textDecoration: 'underline' }}
              >
                {contactEmail}
              </a>
            )}
            .
          </p>
          {websiteUrl && (
            <p style={{ margin: '0 0 14px 0' }}>
              See more of my work at{' '}
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: SAGE, textDecoration: 'underline' }}
              >
                {websiteUrl.replace(/^https?:\/\//, '')}
              </a>
              .
            </p>
          )}

          {paypalUrl && (
            <>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                margin: '18px 0 6px 0',
                color: INK
              }}>
                Support this project
              </h3>
              <p style={{ margin: '0 0 14px 0' }}>
                PioneerPen is a personal project. If you've found it useful
                and want to help cover the server and development costs,{' '}
                <a
                  href={paypalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: SAGE, textDecoration: 'underline' }}
                >
                  you can support it here
                </a>
                . Entirely optional and always appreciated.
              </p>
            </>
          )}

          <div style={{
            borderTop: `1px solid ${BORDER}`,
            marginTop: '20px',
            paddingTop: '14px',
            fontSize: '12px',
            color: MUTED,
            textAlign: 'center'
          }}>
            © 2026 EJ Rosa · PioneerPen
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PioneerLetterWizard() {
  const [step, setStep] = useState(0);
  const [letterType, setLetterType] = useState('initial');
  const [name, setName] = useState('');
  const [situation, setSituation] = useState('');
  const [topic, setTopic] = useState('none');
  const [tone, setTone] = useState('neutral');
  const [length, setLength] = useState(180);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState(null);
  const [error, setError] = useState(null);

  // Splash screen — shown on every app launch until user taps Begin or Skip.
  // Defaults to true so every launch starts with the splash animation.
  const [showSplash, setShowSplash] = useState(true);

  // Bottom tab bar — controls which screen is shown after the splash.
  // 'home' = the letter wizard, 'ticket' = bug report, 'suggest' = feature idea.
  const [currentTab, setCurrentTab] = useState('home');

  const TOTAL_STEPS = 5;

  // Recommended tone for each letter type — applied when the user picks a type,
  // but they can still override it on the tone step.
  const recommendedTone = {
    initial:  'neutral',
    followup: 'warm',
    memorial: 'neutral',
    campaign: 'neutral',
    comfort:  'comforting'
  };

  // When the letter type changes, set the tone to its recommended default.
  // This runs on every letterType change, so if the user goes back and
  // switches types, the tone updates to match. They can still override.
  const handleLetterTypeChange = (newType) => {
    setLetterType(newType);
    setTone(recommendedTone[newType] || 'neutral');
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleNext = async () => {
    setError(null);
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    // Final step: generate
    setLoading(true);
    try {
      const variants = await generateLetters({ letterType, name, situation, topic, tone, length });
      setDrafts(variants);
    } catch (e) {
      setError("Couldn't reach the writing assistant. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep(0);
    setLetterType('initial');
    setName('');
    setSituation('');
    setTopic('none');
    setTone('neutral');
    setLength(180);
    setDrafts(null);
    setError(null);
  };

  const canProceed = () => {
    // For memorial and campaign letters, the situation field is optional —
    // the letter type itself carries the purpose.
    if (step === 2) {
      if (letterType === 'memorial' || letterType === 'campaign') return true;
      return situation.trim().length > 0;
    }
    return true;
  };

  // ---------- SPLASH SCREEN ----------
  // Shows on every launch. Taps "Begin" (or "Skip") to enter the wizard.
  if (showSplash) {
    return (
      <>
        <FontLink />
        <SplashScreen onContinue={() => setShowSplash(false)} />
      </>
    );
  }

  // ---------- TICKET / SUGGEST TABS ----------
  if (currentTab === 'ticket') {
    return (
      <>
        <FeedbackForm type="ticket" />
        <FloatingTimer />
        <BottomTabBar activeTab={currentTab} setActiveTab={setCurrentTab} />
      </>
    );
  }

  if (currentTab === 'suggest') {
    return (
      <>
        <FeedbackForm type="suggest" />
        <FloatingTimer />
        <BottomTabBar activeTab={currentTab} setActiveTab={setCurrentTab} />
      </>
    );
  }

  // ---------- LOADING SCREEN ----------
  if (loading) {
    return (
      <>
        <div className="pioneer-outer" style={{ ...styles.outer, paddingBottom: `${TAB_BAR_H + 20}px` }}>
          <FontLink />
          <InstallPrompt />
          <div className="pioneer-card" style={styles.phone}>
            <div style={styles.loadingWrap}>
              <Spinner />
              <div style={{ fontSize: '16px' }}>Writing three drafts…</div>
              <div style={{ fontSize: '13px', maxWidth: '260px', textAlign: 'center' }}>
                The assistant is thinking about what to say. This usually takes 5–15 seconds.
              </div>
            </div>
          </div>
        </div>
        <FloatingTimer />
        <BottomTabBar activeTab={currentTab} setActiveTab={setCurrentTab} />
      </>
    );
  }

  // ---------- RESULTS SCREEN ----------
  if (drafts) {
    return (
      <>
        <DraftsView
          drafts={drafts}
          setDrafts={setDrafts}
          recipientName={name}
          letterType={letterType}
          name={name}
          situation={situation}
          topic={topic}
          tone={tone}
          length={length}
          onStartOver={handleStartOver}
        />
        <FloatingTimer />
        <BottomTabBar activeTab={currentTab} setActiveTab={setCurrentTab} />
      </>
    );
  }

  // ---------- WIZARD SCREENS ----------
  return (
    <>
      <div className="pioneer-outer" style={{ ...styles.outer, paddingBottom: `${TAB_BAR_H + 20}px` }}>
        <FontLink />
        <InstallPrompt />
        <div className="pioneer-card" style={styles.phone}>
        <div style={styles.stepLabel}>Step {step + 1} of {TOTAL_STEPS}</div>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
        </div>

        {/* Scrollable content area — content overflows inside here, */}
        {/* not on the page, so buttons stay pinned to the bottom. */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {error && <div style={styles.errorBox}>{error}</div>}

          {step === 0 && <StepLetterType letterType={letterType} setLetterType={handleLetterTypeChange} /> }
          {step === 1 && <StepRecipient name={name} setName={setName} />}
          {step === 2 && (
            <StepSituation
              letterType={letterType}
              situation={situation}
              setSituation={setSituation}
              topic={topic}
              setTopic={setTopic}
            />
          )}
          {step === 3 && <StepTone tone={tone} setTone={setTone} recommended={recommendedTone[letterType]} />}
          {step === 4 && <StepLength length={length} setLength={setLength} />}
        </div>

        <div style={styles.buttonRow}>
          {step > 0 && (
            <button style={styles.backBtn} onClick={handleBack}>
              Back
            </button>
          )}
          <button
            style={{
              ...styles.primaryBtn,
              ...(canProceed() ? {} : styles.primaryBtnDisabled)
            }}
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {step === TOTAL_STEPS - 1 ? 'Write the drafts' : 'Next'}
          </button>
        </div>

        <AppFooter />
      </div>
    </div>
      <FloatingTimer />
        <BottomTabBar activeTab={currentTab} setActiveTab={setCurrentTab} />
    </>
  );
}

// ============================================================================
// DRAFTS VIEW — where editing, printing, and envelope-making happen
// ============================================================================

function DraftsView({
  drafts,
  setDrafts,
  recipientName,
  letterType,
  name,
  situation,
  topic,
  tone,
  length,
  onStartOver
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editedText, setEditedText] = useState(null);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [returnAddress, setReturnAddress] = useState('');
  const [editorRecipientName, setEditorRecipientName] = useState(recipientName || '');

  // Track which refresh is in flight, if any. null = nothing refreshing,
  // 'all' = regenerating all three drafts, number = regenerating that index only.
  const [refreshing, setRefreshing] = useState(null);

  // Regenerate all three drafts from scratch using the original inputs.
  // Clears any edits, resets selection to the first draft.
  const handleRefreshAll = async () => {

    setRefreshing('all');
    try {
      const variants = await generateLetters({ letterType, name, situation, topic, tone, length });
      setDrafts(variants);
      setSelectedIndex(0);
      setEditedText(null);
    } catch {
      alert("Couldn't refresh the drafts. Check your connection and try again.");
    } finally {
      setRefreshing(null);
    }
  };

  // Regenerate only the currently selected draft, keeping the other two.
  // Clears the edit on this one specifically.
  const handleRefreshOne = async () => {

    setRefreshing(selectedIndex);
    try {
      const variants = await generateLetters({ letterType, name, situation, topic, tone, length });
      // Pick a replacement at random from the new batch so the refreshed
      // draft differs from what the user just saw, even if the model output similar content.
      const replacement = variants[Math.floor(Math.random() * variants.length)] || variants[0];
      const next = [...drafts];
      next[selectedIndex] = replacement;
      setDrafts(next);
      setEditedText(null);
    } catch {
      alert("Couldn't refresh this draft. Check your connection and try again.");
    } finally {
      setRefreshing(null);
    }
  };

  // Paper size preference — persisted across sessions.
  // Reads from localStorage on mount, writes on every change.
  const [paperSize, setPaperSize] = useState(() => {
    try {
      return localStorage.getItem('pioneerLetterPaperSize') || 'a4';
    } catch {
      return 'a4';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pioneerLetterPaperSize', paperSize);
    } catch {
      // Silently ignore — some browsers/modes block localStorage.
    }
  }, [paperSize]);

  // Font family preference — persisted across sessions.
  const [fontId, setFontId] = useState(() => {
    try {
      return localStorage.getItem('pioneerLetterFont') || 'classic-serif';
    } catch {
      return 'classic-serif';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pioneerLetterFont', fontId);
    } catch {}
  }, [fontId]);

  // Font size in points — persisted across sessions.
  const [fontSize, setFontSize] = useState(() => {
    try {
      return parseInt(localStorage.getItem('pioneerLetterFontSize'), 10) || 12;
    } catch {
      return 12;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pioneerLetterFontSize', String(fontSize));
    } catch {}
  }, [fontSize]);

  // Resolve the active font stack from the selected id.
  const activeFontStack = (FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0]).stack;

  // Date settings. includeDate toggles whether a date prints at the top
  // of the letter. letterDate is stored as YYYY-MM-DD so the native date
  // input can read/write it directly. It defaults to today.
  const [includeDate, setIncludeDate] = useState(true);
  const [letterDate, setLetterDate] = useState(() => {
    const today = new Date();
    // Format as YYYY-MM-DD in the user's local timezone (not UTC)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Format the stored YYYY-MM-DD into a warm long-form date for the printed letter.
  // Uses the user's locale — "April 20, 2026" in US English, "20 April 2026" in UK English, etc.
  const formattedDate = (() => {
    if (!includeDate || !letterDate) return '';
    const [y, m, d] = letterDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  })();

  const labels = ['Warm', 'Brief', 'Thoughtful'];

  // The letter body shown in the editor and print output.
  // Starts as the selected draft; edits are kept in editedText.
  const cleanDraft = (d) => d.replace(/^(Warm|Brief|Thoughtful)[:\s]*/i, '').trim();
  const letterBody = editedText !== null ? editedText : cleanDraft(drafts[selectedIndex]);

  // Switching drafts resets any edits the user made on the previous one.
  const handleSelectDraft = (i) => {

    setSelectedIndex(i);
    setEditedText(null);
  };

  // Build a complete standalone HTML document for printing, open it in a
  // new window, and print from there. This approach works reliably on iOS
  // Safari PWAs where the standard `window.print()` + `@media print` pattern
  // produces blank pages. By building a fresh document with inline styles,
  // there's no ambiguity about what should be rendered — the document IS
  // only the printable content.
  const buildPrintDocument = (mode) => {
    const isA4 = paperSize === 'a4';
    const greeting = editorRecipientName ? `Dear ${editorRecipientName},` : 'Hello,';
    const letterFont = activeFontStack.replace(/"/g, '&quot;');
    const escapedBody = (letterBody || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedGreeting = greeting.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedDate = (formattedDate || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedRecip = (recipientAddress || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedReturn = (returnAddress || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (mode === 'letter') {
      const pageSize = isA4 ? 'A4 portrait' : '8.5in 11in';
      const pageWidth = isA4 ? '210mm' : '8.5in';
      const pageMinHeight = isA4 ? '297mm' : '11in';
      const pagePadding = isA4 ? '25mm 22mm' : '1in';

      return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Letter</title>
<style>
  @page { size: ${pageSize}; margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: white; color: #1C1B17; }
  .page {
    font-family: ${letterFont};
    font-size: ${fontSize}pt;
    line-height: 1.6;
    color: #1C1B17;
    background: white;
    width: ${pageWidth};
    min-height: ${pageMinHeight};
    padding: ${pagePadding};
    box-sizing: border-box;
  }
  .date { text-align: right; margin-bottom: 2em; }
  .greeting { margin-bottom: 1.2em; }
  .body { white-space: pre-wrap; }
</style>
</head>
<body>
<div class="page">
  ${escapedDate ? `<div class="date">${escapedDate}</div>` : ''}
  <div class="greeting">${escapedGreeting}</div>
  <div class="body">${escapedBody}</div>
</div>
</body>
</html>`;
    }

    // Envelope mode
    const envSize = isA4 ? '220mm 110mm' : '9.5in 4.125in';
    const envWidth = isA4 ? '220mm' : '9.5in';
    const envHeight = isA4 ? '110mm' : '4.125in';
    const returnTop = isA4 ? '10mm' : '0.375in';
    const returnLeft = isA4 ? '10mm' : '0.375in';
    const recipTop = isA4 ? '45mm' : '1.75in';
    const recipLeft = isA4 ? '95mm' : '4in';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Envelope</title>
<style>
  @page { size: ${envSize}; margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: white; color: #1C1B17; }
  .envelope {
    font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
    color: #1C1B17;
    background: white;
    width: ${envWidth};
    height: ${envHeight};
    position: relative;
    box-sizing: border-box;
  }
  .return {
    position: absolute;
    top: ${returnTop};
    left: ${returnLeft};
    font-size: 10pt;
    line-height: 1.3;
    white-space: pre-line;
  }
  .recipient {
    position: absolute;
    top: ${recipTop};
    left: ${recipLeft};
    font-size: 12pt;
    line-height: 1.35;
    white-space: pre-line;
  }
</style>
</head>
<body>
<div class="envelope">
  ${escapedReturn ? `<div class="return">${escapedReturn}</div>` : ''}
  <div class="recipient">${escapedRecip}</div>
</div>
</body>
</html>`;
  };

  // Open a popup with the print document and trigger print.
  // This bypasses all iOS quirks with the main-page print flow.
  const openPrintWindow = (mode) => {
    const html = buildPrintDocument(mode);
    const printWindow = window.open('', '_blank', 'width=800,height=1000');

    if (!printWindow) {
      alert('Please allow pop-ups for this app in your browser settings, then try Print again.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for the document to render before calling print — iOS needs this.
    const triggerPrint = () => {
      printWindow.focus();
      printWindow.print();
      // Close the window after printing. Small delay so print dialog can appear.
      setTimeout(() => {
        try { printWindow.close(); } catch (e) { /* some browsers block .close() */ }
      }, 1000);
    };

    // If the new window has already loaded, print immediately; otherwise wait.
    if (printWindow.document.readyState === 'complete') {
      setTimeout(triggerPrint, 200);
    } else {
      printWindow.onload = () => setTimeout(triggerPrint, 200);
    }
  };

  const handlePrintLetter = () => {
    openPrintWindow('letter');
  };

  const handlePrintEnvelope = () => {
    if (!recipientAddress.trim()) {
      alert('Please add the recipient\'s address first.');
      return;
    }
    openPrintWindow('envelope');
  };

  return (
    <div className="pioneer-outer" style={{ ...styles.outer, paddingBottom: `${TAB_BAR_H + 20}px` }}>
      <FontLink />
      <PrintStyles />
      <InstallPrompt />

      {/* ---------- SCREEN UI (hidden during print) ---------- */}
      <div className="no-print pioneer-card" style={{ ...styles.phone, minHeight: 'auto', maxWidth: '560px' }}>
        <h1 style={styles.heading}>Your drafts</h1>
        <div style={{ fontSize: '14px', color: MUTED, marginBottom: '18px' }}>
          Pick a draft, edit it if you like, then print or make an envelope.
        </div>

        {/* Tabs for the three variants, with a "refresh this one" button on the right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {drafts.map((_, i) => {
            const active = selectedIndex === i;
            const isLoading = refreshing === i;
            return (
              <button
                key={i}
                onClick={() => handleSelectDraft(i)}
                disabled={isLoading}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  background: active ? SAGE : 'transparent',
                  color: active ? '#fff' : INK,
                  border: active ? `1px solid ${SAGE}` : `1px solid ${BORDER}`,
                  borderRadius: '8px',
                  cursor: isLoading ? 'wait' : 'pointer',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                {isLoading ? 'Refreshing…' : (labels[i] || `Draft ${i + 1}`)}
              </button>
            );
          })}
          {/* Subtle refresh-this-one control, aligned with tabs */}
          <button
            onClick={handleRefreshOne}
            disabled={refreshing !== null}
            title="Try a different version of this draft"
            style={{
              marginLeft: 'auto',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: `1px solid ${BORDER}`,
              borderRadius: '8px',
              cursor: refreshing !== null ? 'wait' : 'pointer',
              color: MUTED,
              opacity: refreshing !== null ? 0.5 : 1
            }}
          >
            <RefreshIcon spinning={refreshing === selectedIndex} />
          </button>
        </div>

        {/* Editable letter body — live preview: font, size reflect current settings */}
        <div style={{ fontSize: '13px', color: MUTED, marginBottom: '6px' }}>Letter</div>
        <textarea
          value={letterBody}
          onChange={(e) => setEditedText(e.target.value)}
          style={{
            ...styles.textInput,
            minHeight: '260px',
            fontFamily: activeFontStack,
            fontSize: `${fontSize + 1}pt`,  /* +1pt on screen — screen reads slightly smaller than print */
            lineHeight: 1.6,
            marginBottom: '16px'
          }}
        />

        {/* Date — on/off toggle plus a date picker, defaults to today */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', color: MUTED }}>Date on letter</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: MUTED }}>
            <input
              type="checkbox"
              checked={includeDate}
              onChange={(e) => setIncludeDate(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Include
          </label>
        </div>
        {includeDate && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
            <input
              type="date"
              value={letterDate}
              onChange={(e) => setLetterDate(e.target.value)}
              style={{ ...styles.smallInput, flex: 1, marginBottom: 0 }}
            />
            <button
              onClick={() => {
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const d = String(today.getDate()).padStart(2, '0');
                setLetterDate(`${y}-${m}-${d}`);
              }}
              style={{
                padding: '10px 14px',
                fontSize: '13px',
                fontFamily: 'inherit',
                color: INK,
                background: 'transparent',
                border: `1px solid ${BORDER}`,
                borderRadius: '10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Today
            </button>
          </div>
        )}

        {/* Recipient name — for the greeting if they want to adjust */}
        <div style={{ fontSize: '13px', color: MUTED, marginBottom: '6px' }}>
          Recipient's name (for the greeting)
        </div>
        <input
          type="text"
          value={editorRecipientName}
          onChange={(e) => setEditorRecipientName(e.target.value)}
          placeholder="e.g. Rosa — leave blank for a general greeting"
          style={{ ...styles.smallInput, marginBottom: '16px' }}
        />

        {/* Envelope section — collapsible */}
        <button
          onClick={() => setShowEnvelope(!showEnvelope)}
          style={{
            ...styles.voiceBtn,
            justifyContent: 'space-between',
            marginTop: 0,
            marginBottom: '16px'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EnvelopeIcon />
            <span>Envelope addresses {showEnvelope ? '' : '(optional)'}</span>
          </span>
          <span style={{ color: MUTED, fontSize: '18px' }}>{showEnvelope ? '−' : '+'}</span>
        </button>

        {showEnvelope && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: MUTED, marginBottom: '6px' }}>
              Recipient's address
            </div>
            <textarea
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder={'Rosa Santos\n42 Oak Street\nSummerville, SC 29483'}
              style={{ ...styles.textInput, minHeight: '70px', marginBottom: '12px' }}
            />
            <div style={{ fontSize: '13px', color: MUTED, marginBottom: '6px' }}>
              Return address (yours)
            </div>
            <textarea
              value={returnAddress}
              onChange={(e) => setReturnAddress(e.target.value)}
              placeholder={'Your name\n123 Main Street\nYour city, State ZIP'}
              style={{ ...styles.textInput, minHeight: '70px' }}
            />
          </div>
        )}

        {/* Font family picker */}
        <div style={{ fontSize: '13px', color: MUTED, marginBottom: '8px' }}>Letter font</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {FONT_OPTIONS.map((opt) => {
            const selected = fontId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setFontId(opt.id)}
                style={{
                  padding: '10px 12px',
                  background: selected ? '#EFF2EB' : '#fff',
                  border: selected ? `2px solid ${SAGE}` : `1px solid ${BORDER}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit'
                }}
              >
                {/* Label renders in the actual font so users see a live preview */}
                <div style={{ fontSize: '15px', fontWeight: 500, color: INK, fontFamily: opt.stack }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{opt.hint}</div>
              </button>
            );
          })}
        </div>

        {/* Font size picker */}
        <div style={{ fontSize: '13px', color: MUTED, marginBottom: '8px' }}>Font size</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
          {FONT_SIZE_OPTIONS.map((opt) => {
            const selected = fontSize === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setFontSize(opt.id)}
                style={{
                  padding: '10px 6px',
                  background: selected ? '#EFF2EB' : '#fff',
                  border: selected ? `2px solid ${SAGE}` : `1px solid ${BORDER}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontFamily: 'inherit'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500, color: INK }}>{opt.label}</div>
                <div style={{ fontSize: '11px', color: MUTED, marginTop: '2px' }}>{opt.hint}</div>
              </button>
            );
          })}
        </div>

        {/* Paper size toggle */}
        <div style={{ fontSize: '13px', color: MUTED, marginBottom: '8px' }}>Paper size</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'a4',     label: 'A4',        hint: 'with DL envelope' },
            { id: 'letter', label: 'US Letter', hint: 'with #10 envelope' }
          ].map((opt) => {
            const selected = paperSize === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setPaperSize(opt.id)}
                style={{
                  padding: '12px',
                  background: selected ? '#EFF2EB' : '#fff',
                  border: selected ? `2px solid ${SAGE}` : `1px solid ${BORDER}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500, color: INK }}>{opt.label}</div>
                <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{opt.hint}</div>
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <button onClick={handlePrintLetter} style={{ ...styles.primaryBtn, flex: 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <PrinterIcon /> Print letter
            </span>
          </button>
          <button
            onClick={handlePrintEnvelope}
            style={{
              padding: '16px',
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'inherit',
              color: INK,
              background: 'transparent',
              border: `1px solid ${BORDER}`,
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <EnvelopeIcon /> Print envelope
            </span>
          </button>
        </div>

        {/* Two secondary actions side by side — refresh regenerates with same inputs, */}
        {/* start over walks back through the wizard. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={handleRefreshAll}
            disabled={refreshing !== null}
            style={{
              ...styles.backBtn,
              flex: 'none',
              cursor: refreshing !== null ? 'wait' : 'pointer',
              opacity: refreshing !== null ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <RefreshIcon spinning={refreshing === 'all'} />
            <span>{refreshing === 'all' ? 'Refreshing…' : 'Refresh all three'}</span>
          </button>
          <button
            onClick={onStartOver}
            style={{
              ...styles.backBtn,
              flex: 'none'
            }}
          >
            Start over
          </button>
        </div>

        <div style={{ fontSize: '12px', color: MUTED, marginTop: '16px', lineHeight: 1.5, textAlign: 'center' }}>
          {paperSize === 'a4'
            ? 'Letters print on A4 (210 × 297 mm) and fold into thirds for a DL envelope.'
            : 'Letters print on US Letter (8.5 × 11 in) and fold into thirds for a #10 envelope.'}
          <br />
          Choose "Save as PDF" in the print dialog to keep a digital copy.
          <br />
          <span style={{ fontSize: '11px' }}>
            If your printout shows a URL or date, uncheck "Headers and footers" in the print dialog.
          </span>
        </div>

        <AppFooter />
      </div>

      {/* ---------- PRINTABLE LETTER (visible only when printing the letter) ---------- */}
      {/* Font family and size are applied inline so they override the stylesheet defaults */}
      <div className="print-letter">
        <div
          className="letter-page"
          style={{ fontFamily: activeFontStack, fontSize: `${fontSize}pt` }}
        >
          {/* Date appears top-right, traditional letter placement, with space below before the greeting */}
          {formattedDate && (
            <div style={{ textAlign: 'right', marginBottom: '2em' }}>{formattedDate}</div>
          )}
          <div className="letter-greeting">
            {editorRecipientName ? `Dear ${editorRecipientName},` : 'Hello,'}
          </div>
          <div className="letter-body">{letterBody}</div>
        </div>
      </div>

      {/* ---------- PRINTABLE ENVELOPE (visible only when printing the envelope) ---------- */}
      <div className="print-envelope">
        <div className="envelope-page">
          {returnAddress && (
            <div className="envelope-return">{returnAddress}</div>
          )}
          <div className="envelope-recipient">{recipientAddress}</div>
        </div>
      </div>
    </div>
  );
}

// A component that injects the @media print CSS into the document head.
// The CSS hides everything except the print-letter or print-envelope block
// depending on the data-print-mode attribute on the body.
function PrintStyles() {
  useEffect(() => {
    if (document.getElementById('pioneer-print-styles')) return;
    const style = document.createElement('style');
    style.id = 'pioneer-print-styles';
    style.textContent = `
      /* ===================================================================
         iOS-SAFE PRINT STRATEGY
         Instead of 'display: none' + '@media print { display: block }' which
         is unreliable in iOS Safari PWAs, we keep print content rendered
         at all times but positioned FAR off-screen. At print time we bring
         it into view. This guarantees the browser has already laid out the
         content, so print doesn't catch a collapsed/empty box.
         =================================================================== */

      /* Screen: push print-only content far off-screen but KEEP it rendered.
         Using position: absolute + large negative left, not display: none. */
      .print-letter, .print-envelope {
        position: absolute;
        left: -10000px;
        top: 0;
        width: 210mm;           /* sensible default so layout computes */
        background: white;
        color: #1C1B17;
        pointer-events: none;
        z-index: -1;
      }

      @media print {
        /* Force iOS to preserve colors and not "optimize" them away */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* Hide the screen UI wrappers when printing */
        .no-print,
        .pioneer-outer,
        .pioneer-card {
          display: none !important;
        }

        /* Reset body/html so only print content shows */
        html, body {
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
          color: #1C1B17 !important;
          width: auto !important;
          height: auto !important;
        }

        /* Bring the relevant print block INTO view during print.
           Inverse of the off-screen positioning above. */
        body[data-print-mode="letter"] .print-letter,
        body[data-print-mode="envelope"] .print-envelope {
          position: static !important;
          left: auto !important;
          top: auto !important;
          width: auto !important;
          pointer-events: auto !important;
          z-index: auto !important;
          display: block !important;
        }

        /* Hide the OTHER print block so only one mode shows at a time */
        body[data-print-mode="letter"] .print-envelope,
        body[data-print-mode="envelope"] .print-letter {
          display: none !important;
        }

        /* Shared typography for letter and envelope pages */
        .letter-page, .envelope-page {
          font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
          color: #1C1B17 !important;
          background: white !important;
          box-sizing: border-box;
          position: relative;
        }
        .letter-page {
          font-size: 12pt;
          line-height: 1.6;
        }
        .letter-greeting {
          margin-bottom: 1.2em;
          color: #1C1B17 !important;
        }
        .letter-body {
          white-space: pre-wrap;
          color: #1C1B17 !important;
        }
        .envelope-page { font-size: 11pt; }
        .envelope-return {
          position: absolute;
          font-size: 10pt;
          line-height: 1.3;
          white-space: pre-line;
          color: #1C1B17 !important;
        }
        .envelope-recipient {
          position: absolute;
          font-size: 12pt;
          line-height: 1.35;
          white-space: pre-line;
          color: #1C1B17 !important;
        }

        /* ===================================================================
           A4 + DL envelope
           =================================================================== */
        body[data-paper-size="a4"] .letter-page {
          width: 210mm;
          min-height: 297mm;
          padding: 25mm 22mm;
        }
        body[data-paper-size="a4"] .envelope-page {
          width: 220mm;
          height: 110mm;
        }
        body[data-paper-size="a4"] .envelope-return { top: 10mm; left: 10mm; }
        body[data-paper-size="a4"] .envelope-recipient { top: 45mm; left: 95mm; }

        @page a4-letter {
          size: A4 portrait;
          margin: 0;
          @top-left     { content: ""; }
          @top-center   { content: ""; }
          @top-right    { content: ""; }
          @bottom-left  { content: ""; }
          @bottom-center{ content: ""; }
          @bottom-right { content: ""; }
        }
        @page a4-envelope {
          size: 220mm 110mm;
          margin: 0;
          @top-left     { content: ""; }
          @top-center   { content: ""; }
          @top-right    { content: ""; }
          @bottom-left  { content: ""; }
          @bottom-center{ content: ""; }
          @bottom-right { content: ""; }
        }
        body[data-paper-size="a4"][data-print-mode="letter"] .letter-page { page: a4-letter; }
        body[data-paper-size="a4"][data-print-mode="envelope"] .envelope-page { page: a4-envelope; }

        /* ===================================================================
           US Letter + #10 envelope
           =================================================================== */
        body[data-paper-size="letter"] .letter-page {
          width: 8.5in;
          min-height: 11in;
          padding: 1in 1in;
        }
        body[data-paper-size="letter"] .envelope-page {
          width: 9.5in;
          height: 4.125in;
        }
        body[data-paper-size="letter"] .envelope-return { top: 0.375in; left: 0.375in; }
        body[data-paper-size="letter"] .envelope-recipient { top: 1.75in; left: 4in; }

        @page us-letter {
          size: 8.5in 11in;
          margin: 0;
          @top-left     { content: ""; }
          @top-center   { content: ""; }
          @top-right    { content: ""; }
          @bottom-left  { content: ""; }
          @bottom-center{ content: ""; }
          @bottom-right { content: ""; }
        }
        @page us-envelope {
          size: 9.5in 4.125in;
          margin: 0;
          @top-left     { content: ""; }
          @top-center   { content: ""; }
          @top-right    { content: ""; }
          @bottom-left  { content: ""; }
          @bottom-center{ content: ""; }
          @bottom-right { content: ""; }
        }
        body[data-paper-size="letter"][data-print-mode="letter"] .letter-page { page: us-letter; }
        body[data-paper-size="letter"][data-print-mode="envelope"] .envelope-page { page: us-envelope; }
      }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}


function StepLetterType({ letterType, setLetterType }) {
  return (
    <>
      <h1 style={styles.heading}>What kind of letter?</h1>
      <div style={{ fontSize: '15px', color: MUTED, marginBottom: '18px', lineHeight: 1.5 }}>
        Pick the one that fits best. You can always change it.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {LETTER_TYPE_OPTIONS.map((opt) => {
          const selected = letterType === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setLetterType(opt.id)}
              style={{
                padding: '14px 16px',
                background: selected ? '#EFF2EB' : '#fff',
                border: selected ? `2px solid ${SAGE}` : `1px solid ${BORDER}`,
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={selected ? SAGE_DARK : MUTED}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d={opt.icon} />
              </svg>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: INK, lineHeight: 1.3 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: '13px', color: MUTED, marginTop: '2px' }}>
                  {opt.hint}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepRecipient({ name, setName }) {
  return (
    <>
      <h1 style={styles.heading}>Who are you writing to?</h1>
      <div style={{ fontSize: '15px', color: MUTED, marginBottom: '16px', lineHeight: 1.5 }}>
        A first name is fine. You can skip this if you don't know it.
      </div>
      <input
        style={styles.smallInput}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Rosa"
      />
    </>
  );
}

function StepSituation({ letterType, situation, setSituation, topic, setTopic }) {
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);

  // Current news topics — fetched once on mount, shown as read-only inspiration.
  // If the fetch fails for any reason the section simply doesn't render.
  const [newsTopics, setNewsTopics] = useState(null); // null = loading, [] = failed, [...] = loaded
  useEffect(() => {
    let cancelled = false;
    fetch('/api/current-topics')
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => { if (!cancelled) setNewsTopics(data.topics || []); })
      .catch(() => { if (!cancelled) setNewsTopics([]); });
    return () => { cancelled = true; };
  }, []);

  // The heading and placeholder shift based on letter type,
  // because a memorial invitation asks a different question than a comfort letter.
  const copy = {
    initial:   { heading: 'What would you like to share?',       placeholder: 'A thought, a question, an interest you noticed…' },
    followup:  { heading: 'What do you want to reconnect about?', placeholder: 'Something from your last conversation…' },
    memorial:  { heading: 'Anything specific to mention?',        placeholder: 'Optional — leave blank for a general invitation' },
    campaign:  { heading: 'What is the campaign theme?',          placeholder: 'e.g. a tract on Bible prophecy, a convention invitation…' },
    comfort:   { heading: "What's happening in their life?",      placeholder: 'A few words is enough' }
  };
  const { heading, placeholder } = copy[letterType] || copy.initial;

  // Voice input. Two behaviors:
  //  - Not listening: start a new recognition session.
  //  - Already listening: stop the active session.
  // All error paths surface a visible message so the user is never left guessing.
  const handleVoice = () => {
    setVoiceError(null);

    // If already listening, tapping stops it.
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Voice input isn\'t supported in this browser. Try Chrome or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSituation((prev) => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onerror = (event) => {
      // Translate raw error codes into plain-language messages.
      const message = {
        'not-allowed':         'Microphone access was blocked. Check your browser\'s site settings.',
        'service-not-allowed': 'Microphone access was blocked. Check your browser\'s site settings.',
        'no-speech':           "I didn't hear anything. Tap to try again.",
        'audio-capture':       'No microphone detected. Check that one is connected.',
        'network':             'Voice input needs an internet connection.',
        'aborted':             null  // User stopped it — don't show an error.
      }[event.error] ?? `Voice error: ${event.error}`;

      if (message) setVoiceError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    // start() itself can throw synchronously in sandboxed iframes.
    try {
      recognition.start();
    } catch (e) {
      setVoiceError('Voice input couldn\'t start. This usually means the microphone is blocked or unavailable in this environment.');
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  // Clean up if the user navigates away mid-recording.
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Examples are most useful for comfort letters. Hide for memorial/campaign.
  const showExamples = letterType === 'comfort' || letterType === 'initial' || letterType === 'followup';

  return (
    <>
      <h1 style={styles.heading}>{heading}</h1>
      <textarea
        ref={textareaRef}
        style={styles.textInput}
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
        placeholder={placeholder}
      />
      <button
        style={{
          ...styles.voiceBtn,
          background: isListening ? '#FDECEA' : 'transparent',
          borderColor: isListening ? '#E27A72' : BORDER,
          color: isListening ? '#8E2A22' : INK
        }}
        onClick={handleVoice}
      >
        <MicIcon />
        <span>{isListening ? 'Listening — tap to stop' : 'Speak instead'}</span>
      </button>
      {voiceError && (
        <div style={{
          fontSize: '13px',
          color: '#8E2A22',
          background: '#FDECEA',
          border: '1px solid #E8C4B4',
          padding: '10px 12px',
          borderRadius: '8px',
          marginTop: '8px',
          lineHeight: 1.4
        }}>
          {voiceError}
        </div>
      )}

      {showExamples && (
        <>
          <div style={styles.exampleLabel}>Or tap an example:</div>
          <div style={styles.chipList}>
            {SITUATION_EXAMPLES.slice(0, 4).map((ex) => (
              <button key={ex} style={styles.chip} onClick={() => setSituation(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ----------------------------------------------------------------
          IN THE NEWS — current global news themes as letter-writing
          inspiration. Fetched from /api/current-topics (cached 24h).
          Read-only; user types their own situation based on what resonates.
          Shows a subtle loading state while fetching, disappears on failure.
          ---------------------------------------------------------------- */}
      {newsTopics === null && (
        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5 }}>
          <span style={{ fontSize: '14px' }}>🌐</span>
          <span style={{ fontSize: '12px', color: MUTED, letterSpacing: '0.04em' }}>
            Loading current topics…
          </span>
        </div>
      )}
      {newsTopics && newsTopics.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '14px' }}>🌐</span>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: MUTED,
              textTransform: 'uppercase'
            }}>
              In the news
            </span>
            <span style={{
              fontSize: '11px',
              color: MUTED,
              opacity: 0.7,
              marginLeft: '4px'
            }}>
              — for inspiration
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {newsTopics.map((item, i) => (
              <div
                key={i}
                style={{
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                <span style={{ fontSize: '20px', lineHeight: 1.2, flexShrink: 0 }}>
                  {item.emoji}
                </span>
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: INK,
                    lineHeight: 1.3,
                    marginBottom: '3px'
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: MUTED,
                    lineHeight: 1.45
                  }}>
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            fontSize: '11px',
            color: MUTED,
            opacity: 0.65,
            marginTop: '8px',
            textAlign: 'right'
          }}>
            Updated daily
          </div>
        </div>
      )}

      <div style={{ ...styles.exampleLabel, marginTop: '28px' }}>
        Weave in a topic (optional):
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {TOPIC_OPTIONS.map((opt) => {
          const selected = topic === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTopic(opt.id)}
              style={{
                padding: '10px 12px',
                background: selected ? '#EFF2EB' : '#fff',
                border: selected ? `2px solid ${SAGE}` : `1px solid ${BORDER}`,
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 500, color: INK, lineHeight: 1.3 }}>
                {opt.label}
              </div>
              <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>
                {opt.hint}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepTone({ tone, setTone, recommended }) {
  return (
    <>
      <h1 style={styles.heading}>How should it feel?</h1>
      <div style={{ fontSize: '14px', color: MUTED, marginBottom: '16px', lineHeight: 1.5 }}>
        We've suggested one based on your letter type. Change it if you'd like.
      </div>
      <div style={styles.optionList}>
        {TONE_OPTIONS.map((opt) => {
          const selected = tone === opt.id;
          const isRecommended = opt.id === recommended;
          return (
            <button
              key={opt.id}
              style={{
                ...styles.option,
                ...(selected ? styles.optionSelected : {})
              }}
              onClick={() => setTone(opt.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.optionTitle}>{opt.label}</div>
                {isRecommended && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: SAGE_DARK,
                      background: '#EFF2EB',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      letterSpacing: '0.02em'
                    }}
                  >
                    Suggested
                  </span>
                )}
              </div>
              <div style={styles.optionHint}>{opt.hint}</div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepLength({ length, setLength }) {
  return (
    <>
      <h1 style={styles.heading}>How long?</h1>
      <div style={styles.optionList}>
        {LENGTH_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            style={{
              ...styles.option,
              ...(length === opt.id ? styles.optionSelected : {})
            }}
            onClick={() => setLength(opt.id)}
          >
            <div style={styles.optionTitle}>{opt.label}</div>
            <div style={styles.optionHint}>{opt.hint}</div>
          </button>
        ))}
      </div>
    </>
  );
}

// ============================================================================
// TINY BITS
// ============================================================================

function FontLink() {
  // Injects the Fraunces font (main UI) and Playfair Display (splash wordmark) once.
  // Fallbacks handle cases where they can't load.
  // Also injects a small responsive stylesheet so the app feels phone-native
  // (edge-to-edge, fills screen) on mobile, while still looking like a centered
  // card on tablets and desktops.
  useEffect(() => {
    if (!document.getElementById('pioneer-font')) {
      const link = document.createElement('link');
      link.id = 'pioneer-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('pioneer-responsive')) {
      const style = document.createElement('style');
      style.id = 'pioneer-responsive';
      style.textContent = `
        /* Prevent iOS from zooming in when the user taps an input — we already use 16px+ fonts */
        html { -webkit-text-size-adjust: 100%; }
        body { margin: 0; overscroll-behavior: none; }

        /* On tablet and desktop, restore the floating-card appearance. */
        @media (min-width: 520px) {
          .pioneer-outer {
            padding: 24px 16px !important;
            align-items: flex-start !important;
          }
          .pioneer-card {
            min-height: 620px !important;
            max-height: calc(100dvh - 48px);
            border: 1px solid ${BORDER} !important;
            border-radius: 24px !important;
            box-shadow: 0 2px 20px rgba(0,0,0,0.04) !important;
            padding: 28px 24px 24px !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  return null;
}

function Spinner() {
  return (
    <div
      style={{
        width: 40, height: 40,
        border: `3px solid ${BORDER}`,
        borderTopColor: SAGE,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="13" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function RefreshIcon({ spinning = false }) {
  // Rotating refresh arrows. When `spinning` is true, the icon rotates
  // continuously to indicate an in-flight regeneration.
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: spinning ? 'pioneer-spin 0.9s linear infinite' : 'none' }}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      <style>{`@keyframes pioneer-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
