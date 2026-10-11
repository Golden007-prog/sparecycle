import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const deepDive=process.argv.includes('--deep-dive');
const output = path.join(root, 'test-results', 'video',...(deepDive?['deep-dive']:[]));
const basename=deepDive?'sparecycle-backend-deep-dive':'sparecycle-review-demo';
const scenes = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, deepDive?'storyboard-deep-dive.json':'storyboard.json'), 'utf8'));
function command(exe, args) {
  const p = spawnSync(exe, args, { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (p.status !== 0) throw new Error(`${exe} failed: ${p.stderr?.slice(-6000)}`);
  return p.stdout.trim();
}
const seconds = file => Number(command('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file]));
const stamp = (sec, ass = false) => {
  let n = Math.round(sec * (ass ? 100 : 1000));
  const units = ass ? 100 : 1000;
  const sub = String(n % units).padStart(ass ? 2 : 3,'0'); n=Math.floor(n/units);
  const s=String(n%60).padStart(2,'0'); n=Math.floor(n/60);
  const m=String(n%60).padStart(2,'0'); const h=String(Math.floor(n/60)).padStart(ass ? 1 : 2,'0');
  return `${h}:${m}:${s}.${sub}`;
};
const wrap = text => {
  const words=text.split(/\s+/); const lines=[]; let line='';
  for(const word of words) { if(line.length+word.length+1>93){lines.push(line);line=word;}else{line+=(line?' ':'')+word;} }
  if(line)lines.push(line);return lines.join('\\N');
};
let offset=0; const subtitles=[]; const clips=[]; const ledger=[];
for (const scene of scenes) {
  const wave=scene.captions.map((_,i)=>path.join(output,`${scene.id}-${i}.wav`));
  const durations=wave.map(seconds); const lead=.30; const between=.18; const tail=.38;
  const duration=lead+durations.reduce((a,b)=>a+b,0)+between*(wave.length-1)+tail;
  let local=lead;
  scene.captions.forEach((text,i)=>{subtitles.push({start:offset+local,end:offset+local+durations[i],text});local+=durations[i]+between;});
  const clip=path.join(output,scene.id+'.mp4');
  const args=['-hide_banner','-loglevel','error','-y','-loop','1','-framerate','30','-i',path.join(output,scene.id+'.png')];
  for(const file of wave)args.push('-i',file);
  const audio=wave.map((_,i)=>`[${i+1}:a]aformat=sample_rates=48000:channel_layouts=mono,asetpts=PTS-STARTPTS,adelay=${Math.round((lead+durations.slice(0,i).reduce((a,b)=>a+b,0)+between*i)*1000)}:all=1[a${i}]`);
  audio.push(wave.map((_,i)=>`[a${i}]`).join('')+`amix=inputs=${wave.length}:normalize=0,apad=whole_dur=${duration},atrim=duration=${duration},loudnorm=I=-16:TP=-1.5:LRA=11[a]`);
  let visuals='[0:v]scale=1920:1080,setsar=1,format=yuv420p';
  if(deepDive && scene.layout==='board'){
    const width=(1760-(scene.cards.length-1)*24)/scene.cards.length;
    scene.cards.forEach((_,i)=>{
      const begin=.3+i*(duration-.9)/scene.cards.length;
      const end=.3+(i+1)*(duration-.9)/scene.cards.length;
      visuals+=`,drawbox=x=${80+i*(width+24)}:y=405:w=${width}:h=325:color=0xAEB5FF:t=5:enable='between(t,${begin},${end})'`;
    });
  }
  if(deepDive && scene.layout==='receipt'){
    scene.rows.forEach((_,i)=>{
      const begin=.3+i*(duration-.9)/scene.rows.length;
      const end=.3+(i+1)*(duration-.9)/scene.rows.length;
      visuals+=`,drawbox=x=80:y=${383+i*102}:w=7:h=92:color=0x535DF2:t=fill:enable='between(t,${begin},${end})'`;
    });
  }
  // Editorial focus moves only inside captured UI, leaving all labels stationary.
  if(deepDive && !scene.layout){
    const frames=Math.ceil(duration*30);
    visuals+=`[base];[0:v]crop=1178:703:651:170,scale=2356:1406,zoompan=z='1+0.024*(1-cos(PI*min(on/${frames},1)))/2':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1178x703:fps=30[focus];[base][focus]overlay=651:170`;
  }
  const filter=visuals+`,fade=t=in:st=0:d=0.22,fade=t=out:st=${duration-.22}:d=0.22[v];`+audio.join(';');
  args.push('-filter_complex',filter,'-map','[v]','-map','[a]','-t',duration.toFixed(4),'-c:v','libx264','-preset','veryfast','-tune','stillimage','-crf','20','-c:a','aac','-ar','48000','-b:a','160k','-movflags','+faststart',clip);
  command('ffmpeg',args);clips.push(clip);ledger.push({id:scene.id,start:offset,duration,source:scene.image});offset+=duration;
  process.stdout.write(`Rendered ${scene.id}\n`);
}
fs.writeFileSync(path.join(output,'concat.txt'),clips.map(p=>`file '${p.replaceAll('\\','/')}'`).join('\n'));
command('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',path.join(output,'concat.txt'),'-c','copy',path.join(output,'assembly.mp4')]);
fs.writeFileSync(path.join(output,basename+'.vtt'),'WEBVTT\n\n'+subtitles.map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n'));
const ass=`[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Segoe UI,34,&H00FFFFFF,&H000000FF,&H00253844,&H00253844,0,0,0,0,100,100,0,0,1,1,0,2,85,85,36,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`+subtitles.map(c=>`Dialogue: 0,${stamp(c.start,true)},${stamp(c.end,true)},Default,,0,0,0,,${wrap(c.text)}`).join('\n');
fs.writeFileSync(path.join(output,'captions.ass'),ass);
const final=path.join(output,basename+'.mp4');
const assPath=deepDive?'test-results/video/deep-dive/captions.ass':'test-results/video/captions.ass';
command('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(output,'assembly.mp4'),'-vf',`ass=filename='${assPath}',drawbox=x=0:y=1076:w=iw:h=4:color=0x535DF2:t=fill`,'-c:v','libx264','-preset','fast','-crf','21','-c:a','copy','-movflags','+faststart',final]);
command('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss','2','-i',final,'-frames:v','1',path.join(output,'poster.png')]);
const frameSelection=ledger.map(s=>`eq(n\\,${Math.round((s.start+s.duration/2)*30)})`).join('+');
command('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',final,'-vf',`select=${frameSelection},scale=480:270,tile=4x${Math.ceil(scenes.length/4)}`,'-frames:v','1',path.join(output,'contact-sheet.jpg')]);
const probe=JSON.parse(command('ffprobe',['-v','error','-show_format','-show_streams','-of','json',final]));
fs.writeFileSync(path.join(output,'render-evidence.json'),JSON.stringify({generatedAt:new Date().toISOString(),duration:offset,scenes:ledger,captions:subtitles.length,video:probe.streams.find(s=>s.codec_type==='video'),audio:probe.streams.find(s=>s.codec_type==='audio'),bytes:fs.statSync(final).size,claims:'Actual captured UI; synthetic fixture; real existing provider/test/PR execution.'},null,2));
const script=['# SpareCycle Review video narration','',`Length: ${stamp(offset)}. Local synthetic narration; genuine UI captures.`,...ledger.flatMap((s,i)=>['',`## ${stamp(s.start)} — ${scenes[i].chapter}`,'',...scenes[i].captions]),'','No public upload or Devpost submission is performed by the render script.'].join('\n');
fs.writeFileSync(path.join(output,basename+'-script.md'),script);
console.log(JSON.stringify({video:final,duration:seconds(final),bytes:fs.statSync(final).size}));
