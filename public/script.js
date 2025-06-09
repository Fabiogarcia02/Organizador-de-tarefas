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