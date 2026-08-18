let all=[];let active=new URLSearchParams(location.search).get('season')||'all';
const grid=document.querySelector('#episodesGrid');const search=document.querySelector('#search');
function render(){
 const q=(search?.value||'').trim().toLowerCase();
 let list=all.filter(e=>active==='all'||seasonOf(e)===+active).filter(e=>`${e.trackName} ${cleanText(e.description||e.shortDescription||'')}`.toLowerCase().includes(q));
 list.sort((a,b)=>new Date(b.releaseDate)-new Date(a.releaseDate));
 grid.innerHTML=list.length?list.map(e=>`<article class="episode-card"><a href="${episodeLink(e)}" aria-label="Open ${esc(e.trackName)}"><img loading="lazy" src="${esc((e.artworkUrl600||e.artworkUrl100||'').replace('100x100','600x600'))}" alt="${esc(e.trackName)} official episode artwork"></a><div class="card-body"><div class="meta">Season ${seasonOf(e)} · Episode ${episodeNo(e)} · ${fmtDate(e.releaseDate)}</div><h3><a href="${episodeLink(e)}">${esc(e.trackName)}</a></h3><p>${esc(cleanText(e.description||e.shortDescription||''))}</p><div class="card-actions"><a class="btn btn-dark" href="${episodeLink(e)}">View episode</a><a class="btn" target="_blank" rel="noopener" href="${esc(e.trackViewUrl||APPLE_SHOW)}">Apple Podcasts</a></div></div></article>`).join(''):'<div class="empty">No episodes match your search.</div>'
}
loadEpisodes().then(items=>{all=items;document.querySelectorAll('.season-btn').forEach(b=>b.classList.toggle('active',b.dataset.season===active));render()}).catch(err=>grid.innerHTML=`<div class="empty"><strong>${esc(err.message)}</strong><br><br><a class="btn btn-dark" href="https://www.uncoveredlegacy.com/episodes/" target="_blank" rel="noopener">Open the official archive</a></div>`);
document.querySelectorAll('.season-btn').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.season;history.replaceState({},'',active==='all'?'episodes.html':`episodes.html?season=${active}`);document.querySelectorAll('.season-btn').forEach(x=>x.classList.toggle('active',x===b));render()}));
search?.addEventListener('input',render);
