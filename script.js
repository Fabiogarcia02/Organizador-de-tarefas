const form = document.getElementById('task-form');
const tarefasContainer = document.getElementById('tarefas');
const API_URL = 'http://localhost:3000/tarefas';

const icons = {
  academia: "🏋",
  trabalho: "💼",
  estudos: "📚",
  pessoal: "🏡"
};

const filtroSelect = document.createElement('select');
filtroSelect.innerHTML = `
  <option value="">Todas as áreas</option>
  <option value="academia">Academia</option>
  <option value="trabalho">Trabalho</option>
  <option value="estudos">Estudos</option>
  <option value="pessoal">Pessoal</option>
`;
filtroSelect.style.marginBottom = "20px";
form.parentNode.insertBefore(filtroSelect, tarefasContainer);

filtroSelect.addEventListener('change', fetchTarefas);

async function fetchTarefas() {
  const res = await fetch(API_URL);
  let tarefas = await res.json();

  const filtro = filtroSelect.value;
  if (filtro) {
    tarefas = tarefas.filter(t => t.area === filtro);
  }

  renderTarefas(tarefas);
}

function renderTarefas(tarefas) {
  tarefasContainer.innerHTML = '';
  tarefas.forEach(tarefa => {
    const card = document.createElement('div');
    card.classList.add('card', tarefa.area);
    card.innerHTML = `
      <h3>${icons[tarefa.area] || ''} ${tarefa.titulo}</h3>
      <p><strong>Data:</strong> ${tarefa.data}</p>
      <p><strong>Tempo:</strong> ${tarefa.tempo}</p>
      <div style="margin-top: 10px;">
        <button onclick="editarTarefa(${tarefa.id})">✏️ Editar</button>
        <button onclick="excluirTarefa(${tarefa.id})" style="margin-left: 10px;">🗑️ Excluir</button>
      </div>
    `;
    tarefasContainer.appendChild(card);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const idEditar = form.getAttribute("data-edit-id");

  const novaTarefa = {
    titulo: document.getElementById('titulo').value,
    data: document.getElementById('data').value,
    tempo: document.getElementById('tempo').value,
    area: document.getElementById('area').value
  };

  if (idEditar) {
    await fetch(`${API_URL}/${idEditar}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaTarefa)
    });
    form.removeAttribute("data-edit-id");
  } else {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaTarefa)
    });
  }

  form.reset();
  alert('✅ Tarefa salva com sucesso!');
  fetchTarefas();
});

async function excluirTarefa(id) {
  if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
    await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    fetchTarefas();
  }
}

async function editarTarefa(id) {
  const res = await fetch(`${API_URL}/${id}`);
  const tarefa = await res.json();

  document.getElementById('titulo').value = tarefa.titulo;
  document.getElementById('data').value = tarefa.data;
  document.getElementById('tempo').value = tarefa.tempo;
  document.getElementById('area').value = tarefa.area;

  form.setAttribute("data-edit-id", id);
}

fetchTarefas();
