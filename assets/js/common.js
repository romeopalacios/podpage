const PODCAST_ID='1564012144';
const APPLE_SHOW='https://podcasts.apple.com/us/podcast/uncovered-legacy/id1564012144';
const OFFICIAL_SITE='https://www.uncoveredlegacy.com';
const SEASON_COUNTS=[10,9,12,8,8,12];
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function cleanText(html=''){const d=document.createElement('div');d.innerHTML=html;return d.textContent||d.innerText||''}
function fmtDate(s){return new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date(s))}
function assignArchiveOrder(items){
  const sorted=[...items].sort((a,b)=>new Date(a.releaseDate)-new Date(b.releaseDate));
  let offset=0;
  SEASON_COUNTS.forEach((count,index)=>{
    sorted.slice(offset,offset+count).forEach((e,i)=>{e.__season=index+1;e.__episode=i+1});
    offset+=count;
  });
  return sorted;
}
function seasonOf(e){return e.__season||null}
function episodeNo(e){return e.__episode||null}
function loadEpisodes(){return new Promise((resolve,reject)=>{
  const cb='appleEpisodes_'+Date.now();
  const script=document.createElement('script');
  let timer=setTimeout(()=>{cleanup();reject(new Error('The official Apple Podcasts archive timed out. Check your internet connection and refresh.'))},20000);
  function cleanup(){clearTimeout(timer);try{delete window[cb]}catch{};script.remove()}
  window[cb]=data=>{
    cleanup();
    const items=(data.results||[]).filter(x=>x.wrapperType==='podcastEpisode'||x.kind==='podcast-episode');
    if(!items.length){reject(new Error('Apple Podcasts returned no episodes.'));return}
    resolve(assignArchiveOrder(items));
  };
  script.src=`https://itunes.apple.com/lookup?id=${PODCAST_ID}&entity=podcastEpisode&limit=200&callback=${cb}`;
  script.onerror=()=>{cleanup();reject(new Error('The official Apple Podcasts archive could not load.'))};
  document.body.appendChild(script)
})}
function episodeLink(e){return `episode.html?id=${encodeURIComponent(e.trackId)}`}
function setupNav(){
  const btn=document.querySelector('.menu');
  const nav=document.querySelector('.nav-links');
  btn?.addEventListener('click',()=>{const open=nav?.classList.toggle('open');btn.setAttribute('aria-expanded',String(Boolean(open)))})
}
document.addEventListener('DOMContentLoaded',setupNav);
