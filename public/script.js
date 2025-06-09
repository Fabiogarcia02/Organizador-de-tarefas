const form = document.getElementById('task-form');
const tarefasContainer = document.getElementById('tarefas');
const filtroSelect = document.getElementById('filtro-areas');
const API_URL = '/api/tarefas';

const icons = {
  academia: "🏋",
  trabalho: "💼",
  estudos: "📚",
  pessoal: "🏡"
};

// Solicitar permissão para notificações ao carregar o app
if (window.Notification && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Só executa se estiver na área de tarefas
if (form && tarefasContainer) {
  // Buscar tarefas apenas do usuário logado
  async function fetchTarefas() {
    let usuarioLogado = localStorage.getItem('usuario');
    if (!usuarioLogado) return;
    let url = API_URL + '?usuario=' + encodeURIComponent(usuarioLogado);
    if (filtroSelect && filtroSelect.value) {
      url += `&area=${filtroSelect.value}`;
    }
    const res = await fetch(url);
    const tarefas = await res.json();
    renderTarefas(tarefas);
  }

  // Renderizar tarefas
  function renderTarefas(tarefas) {
    tarefasContainer.innerHTML = '';
    if (tarefas.length === 0) {
      tarefasContainer.innerHTML = '<p style="text-align:center;color:#888;">Nenhuma tarefa encontrada.</p>';
      return;
    }
    tarefas.forEach(tarefa => {
      const card = document.createElement('div');
      card.className = `card ${tarefa.area || ''}`;
      card.innerHTML = `
        <h3>${icons[tarefa.area] || ''} ${tarefa.titulo}</h3>
        <p class="descricao">${tarefa.descricao ? tarefa.descricao : ''}</p>
        <p><b>Data:</b> ${tarefa.data}</p>
        <p><b>Tempo:</b> ${tarefa.tempo}</p>
        <div class="btns">
          <button class="btn-edit">✏️ Editar</button>
          <button class="btn-delete">🗑️ Excluir</button>
        </div>
      `;
      // Excluir
      card.querySelector('.btn-delete').onclick = async () => {
        await fetch(`${API_URL}/${tarefa.id}`, { method: 'DELETE' });
        fetchTarefas();
      };
      // Editar (preenche o form)
      card.querySelector('.btn-edit').onclick = () => {
        form.titulo.value = tarefa.titulo;
        form.descricao.value = tarefa.descricao || '';
        form.data.value = tarefa.data;
        form.tempo.value = tarefa.tempo;
        form.area.value = tarefa.area;
        form.setAttribute('data-edit-id', tarefa.id);
      };
      tarefasContainer.appendChild(card);
    });
  }

  // Submeter tarefa (adicionar ou editar)
  form.onsubmit = async function(e) {
    e.preventDefault();
    const usuarioLogado = localStorage.getItem('usuario');
    if (!usuarioLogado) return;
    const tarefa = {
      titulo: form.titulo.value,
      descricao: form.descricao.value,
      data: form.data.value,
      tempo: form.tempo.value,
      area: form.area.value,
      usuario: usuarioLogado
    };
    const editId = form.getAttribute('data-edit-id');
    if (editId) {
      await fetch(`${API_URL}/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tarefa)
      });
      form.removeAttribute('data-edit-id');
    } else {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tarefa)
      });
    }
    form.reset();
    fetchTarefas();
  };

  // Filtro de áreas
  if (filtroSelect) {
    filtroSelect.onchange = fetchTarefas;
  }

  // Carregar tarefas ao abrir área de tarefas
  window.addEventListener('load', () => {
    if (document.getElementById('app-container').style.display !== 'none') {
      fetchTarefas();
    }
  });

  // Também recarrega tarefas ao mostrar área de tarefas após login
  const observer = new MutationObserver(() => {
    if (document.getElementById('app-container').style.display !== 'none') {
      fetchTarefas();
    }
  });
  observer.observe(document.getElementById('app-container'), { attributes: true, attributeFilter: ['style'] });
}

// --- Notificações de tarefas próximas ---
function checarNotificacoesTarefas(tarefas) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const agora = new Date();
  tarefas.forEach(tarefa => {
    if (!tarefa.data || !tarefa.tempo) return;

    const dataHoraTarefa = new Date(`${tarefa.data}T${tarefa.tempo}`);
    const diffMin = Math.floor((dataHoraTarefa - agora) / 60000);

    // Notificar se faltar entre 0 e 10 minutos para a tarefa
    if (diffMin >= 0 && diffMin <= 10 && !tarefa.notificado) {
      new Notification("Tarefa próxima!", {
        body: `A tarefa "${tarefa.titulo}" está marcada para ${tarefa.tempo}.`,
        icon: "https://cdn-icons-png.flaticon.com/512/1828/1828817.png"
      });
      tarefa.notificado = true; // Evita notificar de novo (apenas na sessão)
    }
  });
}

// Checa notificações a cada minuto
setInterval(async () => {
  let usuarioLogado = localStorage.getItem('usuario');
  if (!usuarioLogado) return;
  const res = await fetch('/api/tarefas?usuario=' + encodeURIComponent(usuarioLogado));
  const tarefas = await res.json();
  checarNotificacoesTarefas(tarefas);
}, 60000);

// Também checa ao carregar a página
window.addEventListener('load', async () => {
  let usuarioLogado = localStorage.getItem('usuario');
  if (!usuarioLogado) return;
  const res = await fetch('/api/tarefas?usuario=' + encodeURIComponent(usuarioLogado));
  const tarefas = await res.json();
  checarNotificacoesTarefas(tarefas);
});