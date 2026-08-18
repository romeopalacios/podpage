
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
if (menuButton && nav) {
  const closeMenu = () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
  };
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', event => {
    if (nav.classList.contains('open') && !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
}
if (nav && !nav.querySelector('a[href="follow.html"]')) {
  const followLink = document.createElement('a');
  followLink.href = 'follow.html';
  followLink.textContent = 'Follow';
  const navCta = nav.querySelector('.nav-cta');
  nav.insertBefore(followLink, navCta);
}
const revealSelector = [
  '.episode-card',
  'blockquote',
  '.about-copy',
  '.statement > p',
  '.section-heading',
  '.season-strip',
  '.about-photo-wrap',
  '.reviews-grid',
  '.newsletter > *',
  '.footer > *'
].join(',');
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('revealed');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }) : null;

function setupReveals(scope = document) {
  scope.querySelectorAll(revealSelector).forEach((el, index) => {
    if (el.classList.contains('reveal')) return;
    el.classList.add('reveal');
    el.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 70}ms`);
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add('revealed');
  });
}

setupReveals();

const FORM_ENDPOINT = 'https://formsubmit.co/ajax/uncoveredlegacypodcast@gmail.com';
const voicemailButton = document.createElement('button');
voicemailButton.className = 'voicemail-button';
voicemailButton.type = 'button';
voicemailButton.setAttribute('aria-label', 'Leave Uncovered Legacy a voicemail');
voicemailButton.innerHTML = `
  <span class="voicemail-label">Leave a voicemail</span>
  <span class="voicemail-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" role="img"><path d="M12 15.5a4.5 4.5 0 0 0 4.5-4.5V6.5a4.5 4.5 0 0 0-9 0V11a4.5 4.5 0 0 0 4.5 4.5Zm-2.5-9a2.5 2.5 0 0 1 5 0V11a2.5 2.5 0 0 1-5 0V6.5ZM5 10a1 1 0 0 1 1 1 6 6 0 0 0 12 0 1 1 0 1 1 2 0 8 8 0 0 1-7 7.94V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.06A8 8 0 0 1 4 11a1 1 0 0 1 1-1Z"/></svg>
  </span>`;
document.body.append(voicemailButton);

const voicemailModal = document.createElement('div');
voicemailModal.className = 'voicemail-overlay';
voicemailModal.hidden = true;
voicemailModal.innerHTML = `
  <section class="voicemail-modal" role="dialog" aria-modal="true" aria-labelledby="voicemail-title">
    <button class="voicemail-close" type="button" aria-label="Close voicemail recorder">×</button>
    <div class="eyebrow dark">LEAVE YOUR VOICE</div>
    <h2 id="voicemail-title">Send Curtis a voicemail.</h2>
    <p class="voicemail-help">Record up to two minutes. You can listen back before sending.</p>
    <div class="recorder-controls">
      <button class="btn btn-dark recorder-start" type="button">● Start recording</button>
      <button class="btn btn-dark recorder-stop" type="button" hidden>Stop recording</button>
      <span class="recorder-time" aria-live="polite">0:00 / 2:00</span>
    </div>
    <audio class="voicemail-preview" controls hidden></audio>
    <form class="premium-form voicemail-form" hidden>
      <input type="hidden" name="_subject" value="New Uncovered Legacy voicemail">
      <input class="form-honey" type="text" name="_honey" tabindex="-1" autocomplete="off">
      <div class="form-row"><label>Your name<input type="text" name="name" autocomplete="name" required></label><label>Your email<input type="email" name="email" autocomplete="email" required></label></div>
      <label>Optional note<textarea name="message" rows="3" placeholder="Add a little context…"></textarea></label>
      <p class="recording-consent">By sending, you consent to your recording being stored, edited, and publicly used by the podcast.</p>
      <button class="btn btn-primary" type="submit">Send Voicemail →</button>
      <button class="text-button recorder-redo" type="button">Record again</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>
  </section>`;
document.body.append(voicemailModal);

const closeVoicemail = () => {
  stopRecording();
  voicemailModal.hidden = true;
  document.body.classList.remove('modal-open');
};
voicemailButton.addEventListener('click', () => {
  voicemailModal.hidden = false;
  document.body.classList.add('modal-open');
  voicemailModal.querySelector('.voicemail-close').focus();
});
voicemailModal.querySelector('.voicemail-close').addEventListener('click', closeVoicemail);
voicemailModal.addEventListener('click', event => { if (event.target === voicemailModal) closeVoicemail(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !voicemailModal.hidden) closeVoicemail(); });

let mediaRecorder;
let mediaStream;
let recordingBlob;
let recordingTimer;
let recordingSeconds = 0;
const startButton = voicemailModal.querySelector('.recorder-start');
const stopButton = voicemailModal.querySelector('.recorder-stop');
const timeDisplay = voicemailModal.querySelector('.recorder-time');
const preview = voicemailModal.querySelector('.voicemail-preview');
const voicemailForm = voicemailModal.querySelector('.voicemail-form');

function stopRecording() {
  if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
}

startButton.addEventListener('click', async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.addEventListener('dataavailable', event => { if (event.data.size) chunks.push(event.data); });
    mediaRecorder.addEventListener('stop', () => {
      clearInterval(recordingTimer);
      mediaStream.getTracks().forEach(track => track.stop());
      recordingBlob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      preview.src = URL.createObjectURL(recordingBlob);
      preview.hidden = false;
      voicemailForm.hidden = false;
      startButton.hidden = false;
      startButton.textContent = '● Record again';
      stopButton.hidden = true;
    });
    mediaRecorder.start();
    recordingSeconds = 0;
    timeDisplay.textContent = '0:00 / 2:00';
    startButton.hidden = true;
    stopButton.hidden = false;
    preview.hidden = true;
    voicemailForm.hidden = true;
    recordingTimer = setInterval(() => {
      recordingSeconds += 1;
      timeDisplay.textContent = `${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')} / 2:00`;
      if (recordingSeconds >= 120) stopRecording();
    }, 1000);
  } catch (error) {
    timeDisplay.textContent = 'Microphone access is needed to record a voicemail.';
  }
});
stopButton.addEventListener('click', stopRecording);
voicemailModal.querySelector('.recorder-redo').addEventListener('click', () => startButton.click());

async function submitEmailForm(form, attachment) {
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('[type="submit"]');
  status.textContent = 'Sending…';
  submit.disabled = true;
  const data = new FormData(form);
  data.append('_template', 'table');
  data.append('_captcha', 'false');
  if (attachment) data.append('attachment', new File([attachment], `uncovered-legacy-voicemail-${Date.now()}.webm`, { type: attachment.type }));
  try {
    const response = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
    if (!response.ok) throw new Error('Submission failed');
    form.reset();
    status.textContent = attachment ? 'Your voicemail was sent. Thank you!' : 'Your review was sent. Thank you!';
  } catch (error) {
    status.textContent = 'We could not send that right now. Please try again.';
  } finally {
    submit.disabled = false;
  }
}

voicemailForm.addEventListener('submit', event => {
  event.preventDefault();
  if (recordingBlob) submitEmailForm(voicemailForm, recordingBlob);
});

const reviewForm = document.querySelector('#review-form');
if (reviewForm) reviewForm.addEventListener('submit', event => {
  event.preventDefault();
  submitEmailForm(reviewForm);
});

function createReviewCard(review) {
  const quote = document.createElement('blockquote');
  const stars = document.createElement('div');
  stars.className = 'stars';
  stars.textContent = '★'.repeat(review.rating || 5);
  const title = document.createElement('h3');
  title.textContent = review.title;
  const body = document.createElement('p');
  body.textContent = `“${review.body}”`;
  const footer = document.createElement('footer');
  footer.textContent = review.author;
  const date = document.createElement('small');
  date.textContent = review.date;
  footer.append(date);
  quote.append(stars, title, body, footer);
  return quote;
}

if (document.title.startsWith('Listener Reviews') || document.querySelector('.reviews-grid')) {
  fetch('data/reviews.json', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error('Reviews could not be loaded');
      return response.json();
    })
    .then(data => {
      const wall = document.querySelector('.review-wall');
      if (wall) wall.replaceChildren(...data.reviews.map(createReviewCard));
      const homeReviews = document.querySelector('.reviews-grid');
      if (homeReviews) {
        homeReviews.replaceChildren(...data.reviews.slice(0, 3).map(createReviewCard));
        setupReveals(homeReviews);
      }
    })
    .catch(() => {});
}

if (document.title.startsWith('Contact')) {
  const managePodcastCard = [...document.querySelectorAll('.contact-card')].find(card => card.querySelector('h2')?.textContent.trim() === 'Manage the podcast');
  managePodcastCard?.remove();
  const recordLink = [...document.querySelectorAll('a')].find(link => link.textContent.trim().startsWith('Record a Message'));
  if (recordLink) recordLink.addEventListener('click', event => {
    event.preventDefault();
    voicemailButton.click();
  });
}

if (document.title.startsWith('Listener Reviews')) {
  document.querySelector('.site-note')?.remove();
  const leaveReviewLink = [...document.querySelectorAll('a')].find(link => link.textContent.trim() === 'Leave a Review');
  if (leaveReviewLink) {
    leaveReviewLink.href = 'leave-a-review.html';
    leaveReviewLink.removeAttribute('target');
    leaveReviewLink.removeAttribute('rel');
  }
}

const episodeArtwork = {
  '9eb63689-8383-4912-bf43-722b3c32b0e8': 'images/episode-valarie.webp',
  '4888fc32-cc6c-4887-bf80-d4c1aa9d0011': 'images/episode-layne.png',
  'e7c57a48-443b-496b-8f5e-a49e53342c74': 'images/episode-carl.png'
};

const getArtwork = episode => episode.artwork || episodeArtwork[episode.id] || 'images/podcast-cover.webp';
const episodeUrl = episode => `episode.html?id=${encodeURIComponent(episode.id)}`;
const formatDate = value => new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric', year: 'numeric'
}).format(new Date(value));

async function loadEpisodeData() {
  const response = await fetch('data/episodes.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('The episode archive could not be loaded.');
  return response.json();
}

function renderEpisodeArchive(episodes) {
  const list = document.querySelector('#episode-list');
  if (!list) return;
  const availableSeasons = [...new Set(episodes.map(episode => episode.season).filter(Boolean))].sort((a, b) => a - b);
  const latestSeason = availableSeasons[availableSeasons.length - 1];
  const requested = new URLSearchParams(window.location.search).get('season');
  const requestedNumber = Number(requested);
  const season = requested === 'all' ? 'all' : (availableSeasons.includes(requestedNumber) ? requestedNumber : latestSeason);
  const visible = season === 'all' ? episodes : episodes.filter(episode => episode.season === season);
  document.querySelector('#archive-title').textContent = season === 'all' ? 'All Episodes' : `Season ${season}`;
  document.querySelector('#archive-count').textContent = `${visible.length} ${visible.length === 1 ? 'story' : 'stories'}`;
  const seasonStrip = document.querySelector('.inner-main .season-strip');
  if (seasonStrip) {
    const seasonLinks = availableSeasons.map(number => {
      const link = document.createElement('a');
      link.href = `episodes.html?season=${number}`;
      link.dataset.season = String(number);
      link.append(`Season ${number} `);
      const count = document.createElement('span');
      count.textContent = episodes.filter(episode => episode.season === number).length;
      link.append(count);
      return link;
    });
    const allLink = document.createElement('a');
    allLink.href = 'episodes.html?season=all';
    allLink.dataset.season = 'all';
    allLink.append('All ');
    const allCount = document.createElement('span');
    allCount.textContent = episodes.length;
    allLink.append(allCount);
    seasonStrip.replaceChildren(...seasonLinks, allLink);
  }
  document.querySelectorAll('[data-season]').forEach(link => {
    const active = link.dataset.season === String(season);
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
  });
  list.replaceChildren(...visible.map(episode => {
    const article = document.createElement('article');
    article.className = 'episode-row';
    const number = document.createElement('div');
    number.className = 'episode-number';
    number.textContent = episode.episode ? String(episode.episode).padStart(2, '0') : '◆';
    const imageLink = document.createElement('a');
    imageLink.href = episodeUrl(episode);
    imageLink.className = 'episode-thumb-link';
    const image = document.createElement('img');
    image.src = getArtwork(episode);
    image.alt = `${episode.title} artwork`;
    image.loading = 'lazy';
    imageLink.append(image);
    const info = document.createElement('div');
    info.className = 'episode-info';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${formatDate(episode.published)}${episode.duration ? ` · ${episode.duration}` : ''}`;
    const heading = document.createElement('h2');
    const titleLink = document.createElement('a');
    titleLink.href = episodeUrl(episode);
    titleLink.textContent = episode.title;
    heading.append(titleLink);
    info.append(meta, heading);
    const listen = document.createElement('a');
    listen.className = 'text-link';
    listen.href = episodeUrl(episode);
    listen.textContent = 'Listen →';
    article.append(number, imageLink, info, listen);
    return article;
  }));
}

function renderHomeEpisodes(episodes) {
  const grid = document.querySelector('#latest-episodes');
  if (!grid) return;
  const latest = episodes.filter(episode => episode.type !== 'trailer').slice(0, 3);
  const mobileLatest = document.querySelector('#mobile-latest-episode');
  if (mobileLatest && latest[0]) {
    const episode = latest[0];
    const header = document.createElement('div');
    header.className = 'mobile-latest-header';
    const artwork = document.createElement('img');
    artwork.className = 'mobile-latest-artwork';
    artwork.src = getArtwork(episode);
    artwork.alt = `${episode.title} artwork`;
    const copy = document.createElement('div');
    copy.className = 'mobile-latest-copy';
    const label = document.createElement('span');
    label.className = 'mini-label';
    label.textContent = 'LATEST EPISODE';
    const title = document.createElement('a');
    title.className = 'mobile-latest-title';
    title.href = episodeUrl(episode);
    title.textContent = episode.title;
    const meta = document.createElement('small');
    meta.textContent = `${formatDate(episode.published)}${episode.duration ? ` · ${episode.duration}` : ''}`;
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'metadata';
    audio.src = episode.audio;
    audio.setAttribute('aria-label', `Play ${episode.title}`);
    const appleLink = document.createElement('a');
    appleLink.className = 'btn btn-ghost mobile-apple-link';
    appleLink.href = 'https://podcasts.apple.com/us/podcast/uncovered-legacy/id1564012144';
    appleLink.target = '_blank';
    appleLink.rel = 'noopener';
    appleLink.textContent = 'Listen on Apple Podcasts';
    copy.append(label, title, meta);
    header.append(artwork, copy);
    mobileLatest.replaceChildren(header, audio, appleLink);
  }
  grid.replaceChildren(...latest.map((episode, index) => {
    const article = document.createElement('article');
    article.className = `episode-card${index === 0 ? ' featured' : ''}`;
    article.dataset.href = episodeUrl(episode);
    const art = document.createElement('div');
    art.className = `episode-art art-${index + 1}`;
    art.style.backgroundImage = `url("${getArtwork(episode)}")`;
    const label = document.createElement('span');
    label.textContent = episode.season ? `S${String(episode.season).padStart(2, '0')} E${String(episode.episode || '').padStart(2, '0')}` : 'NEW';
    art.append(label);
    const copy = document.createElement('div');
    copy.className = 'episode-copy';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = formatDate(episode.published);
    const heading = document.createElement('h3');
    heading.textContent = episode.title;
    const detailsButton = document.createElement('button');
    detailsButton.className = 'episode-details-toggle';
    detailsButton.type = 'button';
    detailsButton.setAttribute('aria-expanded', 'false');
    detailsButton.textContent = 'More info';
    const summary = document.createElement('p');
    summary.className = 'episode-summary';
    summary.id = `home-episode-summary-${index}`;
    detailsButton.setAttribute('aria-controls', summary.id);
    const firstParagraph = episode.description.split(/\n+/)[0];
    summary.textContent = firstParagraph.length > 220 ? `${firstParagraph.slice(0, 217).trimEnd()}…` : firstParagraph;
    const link = document.createElement('a');
    link.href = episodeUrl(episode);
    link.textContent = 'Listen to Episode →';
    detailsButton.addEventListener('click', () => {
      const expanded = detailsButton.getAttribute('aria-expanded') === 'true';
      detailsButton.setAttribute('aria-expanded', String(!expanded));
      detailsButton.textContent = expanded ? 'More info' : 'Less info';
      article.classList.toggle('details-open', !expanded);
    });
    article.addEventListener('click', event => {
      if (!window.matchMedia('(max-width: 560px)').matches || event.target.closest('a, button, audio')) return;
      window.location.href = article.dataset.href;
    });
    copy.append(meta, heading, detailsButton, summary, link);
    article.append(art, copy);
    return article;
  }));
  setupReveals(grid);
  const totalLink = document.querySelector('#all-episodes-link');
  if (totalLink) totalLink.textContent = `View all ${episodes.length} episodes →`;
}

function renderEpisodeDetail(episodes) {
  const container = document.querySelector('#episode-detail');
  if (!container) return;
  const id = new URLSearchParams(window.location.search).get('id');
  const episode = episodes.find(item => item.id === id);
  if (!episode) {
    container.innerHTML = '<section class="episode-not-found"><h1>Episode not found.</h1><p><a class="btn btn-dark" href="episodes.html">Browse all episodes</a></p></section>';
    return;
  }
  document.title = `${episode.title} — Uncovered Legacy`;
  const hero = document.createElement('section');
  hero.className = 'episode-page-hero';
  const image = document.createElement('img');
  image.src = getArtwork(episode);
  image.alt = `${episode.title} artwork`;
  const copy = document.createElement('div');
  const eyebrow = document.createElement('div');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = episode.season ? `SEASON ${episode.season}${episode.episode ? ` · EPISODE ${episode.episode}` : ''}` : 'UNCOVERED LEGACY';
  const heading = document.createElement('h1');
  heading.textContent = episode.title;
  const meta = document.createElement('p');
  meta.className = 'episode-page-meta';
  meta.textContent = `${formatDate(episode.published)}${episode.duration ? ` · ${episode.duration}` : ''}`;
  const player = document.createElement('audio');
  player.controls = true;
  player.preload = 'metadata';
  player.src = episode.audio;
  copy.append(eyebrow, heading, meta, player);
  hero.append(image, copy);
  const notes = document.createElement('section');
  notes.className = 'episode-notes long-copy';
  const notesHeading = document.createElement('h2');
  notesHeading.textContent = 'About this episode';
  notes.append(notesHeading);
  episode.description.split(/\n\n+/).filter(Boolean).forEach(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    notes.append(paragraph);
  });
  const back = document.createElement('a');
  back.className = 'btn btn-dark';
  back.href = episode.season ? `episodes.html?season=${episode.season}` : 'episodes.html?season=all';
  back.textContent = 'Back to episodes';
  notes.append(back);
  container.replaceChildren(hero, notes);
}

if (document.body.dataset.page === 'episodes' || document.body.dataset.page === 'episode' || document.querySelector('#latest-episodes')) {
  loadEpisodeData()
    .then(data => {
      renderEpisodeArchive(data.episodes);
      renderEpisodeDetail(data.episodes);
      renderHomeEpisodes(data.episodes);
    })
    .catch(error => {
      const target = document.querySelector('#episode-list, #episode-detail');
      if (target) target.textContent = error.message;
    });
}
