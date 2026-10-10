const byId = id => document.getElementById(id);
const el = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
let features = [], page = 0;
const pageSize = 30;
function render() {
  const query = byId('search').value.toLocaleLowerCase().trim();
  const matches = features.filter(f => (!query || `${f.title} ${f.user_story} ${f.acceptance_criteria} ${f.id}`.toLocaleLowerCase().includes(query)) && (!byId('module').value || f.module_id === byId('module').value) && (!byId('status').value || f.status === byId('status').value) && (!byId('priority').value || f.priority === byId('priority').value) && (!byId('candidate').checked || f.differentiator_candidate));
  const pages = Math.max(1, Math.ceil(matches.length / pageSize)); page = Math.min(page, pages - 1);
  byId('count').textContent = `${matches.length} of ${features.length} capabilities match`;
  const cards = matches.slice(page * pageSize, (page + 1) * pageSize).map(f => {
    const card = el('article', undefined, 'feature');
    const meta = el('div', undefined, 'meta'); meta.append(el('span', f.id), el('span', f.priority), el('span', f.status, `status ${f.status}`));
    if (f.differentiator_candidate) meta.append(el('span', 'DIFFERENTIATION CANDIDATE', 'candidate'));
    const detail = el('details'); detail.append(el('summary', 'Acceptance criteria'), el('p', f.acceptance_criteria), el('p', `Intended user: ${f.target_user}`));
    card.append(meta, el('div', `${f.module_id} / ${f.module}`, 'module'), el('h2', f.title), el('p', f.user_story), detail); return card;
  });
  byId('results').replaceChildren(...(cards.length ? cards : [el('p', 'No capabilities match these filters. Try a broader search.', 'empty')]));
  byId('page').textContent = `Page ${page + 1} of ${pages}`; byId('previous').disabled = page === 0; byId('next').disabled = page + 1 === pages;
}
for (const id of ['search', 'module', 'status', 'priority', 'candidate']) byId(id).addEventListener('input', () => { page = 0; render(); });
byId('clear').addEventListener('click', () => { for (const id of ['search', 'module', 'status', 'priority']) byId(id).value = ''; byId('candidate').checked = false; page = 0; render(); });
for (const [id, delta] of [['previous', -1], ['next', 1]]) byId(id).addEventListener('click', () => { page += delta; render(); byId('count').scrollIntoView({ block: 'start' }); });
fetch('/roadmap-data.json').then(response => { if (!response.ok) throw new Error('Catalog unavailable'); return response.json(); }).then(data => {
  features = data.features;
  const modules = [...new Map(features.map(f => [f.module_id, f.module])).entries()];
  for (const [id, name] of modules) { const option = el('option', `${id} · ${name}`); option.value = id; byId('module').append(option); }
  for (const [value, label] of [[features.length, 'Defined capabilities'], [features.filter(f => f.status === 'shipped').length, 'Shipped prototype stories'], [features.filter(f => f.differentiator_candidate).length, 'Differentiation candidates'], [modules.length, 'Workflow modules']]) { const metric = el('div', undefined, 'metric'); metric.append(el('strong', String(value)), el('span', label)); byId('metrics').append(metric); }
  render();
}).catch(() => { byId('count').textContent = 'The catalog could not be loaded. Reload the page or read the research on GitHub.'; });
