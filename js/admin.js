const adminEmail = 'uncoveredlegacypodcast@gmail.com';
const { url, publishableKey } = window.UL_SUPABASE;
const supabaseAdmin = window.supabase.createClient(url, publishableKey);
const login = document.querySelector('#admin-login');
const panel = document.querySelector('#admin-panel');
const status = document.querySelector('#admin-status');
const list = document.querySelector('#pending-reviews');

async function loadPendingReviews() {
  status.textContent = 'Loading…';
  const { data, error } = await supabaseAdmin
    .from('review_submissions')
    .select('id,title,body,author,email,rating,created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) {
    status.textContent = `Could not load reviews: ${error.message}`;
    return;
  }
  list.replaceChildren(...data.map(createPendingCard));
  status.textContent = data.length ? `${data.length} review${data.length === 1 ? '' : 's'} awaiting approval.` : 'No reviews are waiting.';
}

function createPendingCard(review) {
  const card = document.createElement('blockquote');
  const stars = document.createElement('div');
  stars.className = 'stars';
  stars.textContent = '★'.repeat(review.rating);
  const title = document.createElement('h3');
  title.textContent = review.title;
  const body = document.createElement('p');
  body.textContent = `“${review.body}”`;
  const byline = document.createElement('footer');
  byline.textContent = `${review.author} · ${review.email}`;
  const actions = document.createElement('div');
  actions.className = 'admin-actions';
  for (const [label, nextStatus] of [['Approve', 'approved'], ['Reject', 'rejected']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn ${nextStatus === 'approved' ? 'btn-primary' : 'btn-dark'}`;
    button.textContent = label;
    button.addEventListener('click', () => moderateReview(review.id, nextStatus, button));
    actions.append(button);
  }
  card.append(stars, title, body, byline, actions);
  return card;
}

async function moderateReview(id, nextStatus, button) {
  button.disabled = true;
  const { error } = await supabaseAdmin.from('review_submissions').update({ status: nextStatus }).eq('id', id);
  if (error) {
    status.textContent = `Could not update review: ${error.message}`;
    button.disabled = false;
    return;
  }
  await loadPendingReviews();
}

async function showSession() {
  const { data: { session } } = await supabaseAdmin.auth.getSession();
  const isAdmin = session?.user?.email === adminEmail;
  login.hidden = isAdmin;
  panel.hidden = !isAdmin;
  if (isAdmin) loadPendingReviews();
}

document.querySelector('#admin-login-button').addEventListener('click', async event => {
  event.currentTarget.disabled = true;
  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email: adminEmail,
    options: { emailRedirectTo: new URL('admin.html', window.location.href).href }
  });
  event.currentTarget.disabled = false;
  event.currentTarget.textContent = error ? error.message : 'Check Your Email';
});

document.querySelector('#admin-logout').addEventListener('click', async () => {
  await supabaseAdmin.auth.signOut();
  showSession();
});

supabaseAdmin.auth.onAuthStateChange(() => showSession());
showSession();
