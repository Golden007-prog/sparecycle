const video=document.querySelector('#demo-video');
const captionsButton=document.querySelector('#captions-toggle');
const captionsLabel=document.querySelector('#captions-label');
const chapterStatus=document.querySelector('#chapter-status');
const chapterButtons=[...document.querySelectorAll('#chapter-list button')];
let currentChapter=-1;

function captionTrack(){return [...video.textTracks].find(track=>track.kind==='captions');}
function syncCaptions(){
  const track=captionTrack();
  if(!track)return;
  captionsButton.hidden=false;
  const showing=track.mode==='showing';
  captionsButton.setAttribute('aria-pressed',String(showing));
  captionsLabel.textContent=showing?'Captions on':'Captions off';
}
captionsButton.addEventListener('click',()=>{
  const track=captionTrack();
  if(!track)return;
  track.mode=track.mode==='showing'?'hidden':'showing';
  syncCaptions();
});
video.textTracks.addEventListener('change',syncCaptions);
video.textTracks.addEventListener('addtrack',syncCaptions);
document.querySelector('#english-captions').addEventListener('load',syncCaptions);
syncCaptions();

function syncChapter(){
  let index=chapterButtons.findLastIndex(button=>Number(button.dataset.time)<=video.currentTime+.05);
  if(index<0)index=0;
  if(index===currentChapter)return;
  currentChapter=index;
  chapterButtons.forEach((button,i)=>{if(i===index)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
  chapterStatus.textContent=chapterButtons[index].textContent.trim().replace(/^\d{2}:\d{2}\s*/, '');
}
chapterButtons.forEach(button=>button.addEventListener('click',()=>{
  const seek=()=>{video.currentTime=Number(button.dataset.time);syncChapter();video.focus();};
  if(video.readyState>=1)seek();else{video.addEventListener('loadedmetadata',seek,{once:true});video.load();}
  video.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}));
video.addEventListener('timeupdate',syncChapter);
video.addEventListener('loadedmetadata',()=>{syncChapter();syncCaptions();});
syncChapter();
