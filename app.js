// ===== STATE =====
let tasks = JSON.parse(localStorage.getItem('taskflow_tasks') || '[]');
let editingId = null;
let currentFilter = 'all';
let currentCat = 'all';
let currentPriority = 'all';
let currentSort = 'created';
let subtasks = [];
let notifTimers = {};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  requestNotifPermission();
  render();
  updateBadges();
  startNotifChecker();
  bindEvents();
  setInterval(render, 60000); // refresh every minute for overdue
});

// ===== BIND EVENTS =====
function bindEvents() {
  document.getElementById('openModal').onclick = () => openModal();
  document.getElementById('closeModal').onclick = closeModal;
  document.getElementById('cancelModal').onclick = closeModal;
  document.getElementById('saveTask').onclick = saveTask;
  document.getElementById('modalOverlay').onclick = (e) => { if(e.target.id==='modalOverlay') closeModal(); };
  document.getElementById('themeToggle').onclick = toggleTheme;
  document.getElementById('sidebarToggle').onclick = toggleSidebar;
  document.getElementById('searchInput').oninput = render;
  document.getElementById('sortSelect').onchange = (e) => { currentSort = e.target.value; render(); };
  document.getElementById('taskTitle').oninput = function() {
    document.getElementById('charCount').textContent = this.value.length + '/100';
  };
  document.getElementById('addSubtask').onclick = addSubtaskItem;
  document.getElementById('subtaskInput').onkeydown = (e) => { if(e.key==='Enter') addSubtaskItem(); };
  document.getElementById('allowNotif').onclick = () => {
    Notification.requestPermission().then(p => {
      if(p==='granted') { showToast('Bildirishnomalar yoqildi! 🔔','success'); }
      document.getElementById('notifBanner').style.display='none';
    });
  };
  document.getElementById('dismissBanner').onclick = () => {
    document.getElementById('notifBanner').style.display='none';
  };

  // Nav filters
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      updatePageTitle();
      render();
    };
  });

  // Category filters
  document.querySelectorAll('.cat-item').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.cat-item').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      render();
    };
  });

  // Priority filters
  document.querySelectorAll('.pf-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.pf-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentPriority = btn.dataset.priority;
      render();
    };
  });
}

// ===== NOTIFICATION PERMISSION =====
function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    document.getElementById('notifBanner').style.display = 'flex';
  }
}

// ===== NOTIFICATION CHECKER =====
function startNotifChecker() {
  setInterval(checkDeadlines, 30000);
  checkDeadlines();
}

function checkDeadlines() {
  const now = new Date();
  tasks.forEach(task => {
    if (task.completed || !task.deadline) return;
    const deadline = new Date(task.deadline);
    const diff = deadline - now;
    const reminderMs = (task.reminder || 0) * 60 * 1000;

    // Overdue notification
    if (diff < 0 && !task.overdueNotified) {
      sendNotification(
        '⏰ Muddati o\'tdi!',
        `"${task.title}" vazifasining muddati o'tib ketdi!`,
        'error'
      );
      task.overdueNotified = true;
      saveTasks();
      document.getElementById('notifyDot').style.display = 'block';
    }

    // Reminder notification
    if (reminderMs > 0 && diff > 0 && diff <= reminderMs && !task.reminderNotified) {
      const mins = Math.round(diff / 60000);
      sendNotification(
        '🔔 Eslatma!',
        `"${task.title}" vazifasi ${mins} daqiqadan keyin tugaydi!`,
        'warning'
      );
      task.reminderNotified = true;
      saveTasks();
      document.getElementById('notifyDot').style.display = 'block';
    }
  });
}

function sendNotification(title, body, type) {
  // Browser notification
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>'
    });
  }
  // In-app toast
  showToast(body, type);
}

// ===== TOAST =====
function showToast(msg, type='info') {
  const icons = { success:'✅', error:'🔥', warning:'⚠️', info:'💡' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]||'💡'}</span>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===== MODAL =====
function openModal(task=null) {
  editingId = task ? task.id : null;
  subtasks = task ? [...(task.subtasks||[])] : [];
  document.getElementById('modalTitle').textContent = task ? 'Vazifani tahrirlash' : 'Yangi vazifa';
  document.getElementById('taskTitle').value = task ? task.title : '';
  document.getElementById('taskDesc').value = task ? task.desc : '';
  document.getElementById('taskPriority').value = task ? task.priority : 'medium';
  document.getElementById('taskCategory').value = task ? task.category : 'work';
  document.getElementById('taskReminder').value = task ? (task.reminder||0) : 0;
  document.getElementById('charCount').textContent = (task?task.title.length:0)+'/100';

  if (task && task.deadline) {
    const d = new Date(task.deadline);
    document.getElementById('taskDate').value = d.toISOString().split('T')[0];
    document.getElementById('taskTime').value = d.toTimeString().slice(0,5);
  } else {
    document.getElementById('taskDate').value = '';
    document.getElementById('taskTime').value = '';
  }

  renderSubtaskList();
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('taskTitle').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  editingId = null; subtasks = [];
}

// ===== SUBTASKS =====
function addSubtaskItem() {
  const input = document.getElementById('subtaskInput');
  const val = input.value.trim();
  if (!val) return;
  subtasks.push({ id: Date.now(), text: val, done: false });
  input.value = '';
  renderSubtaskList();
}

function renderSubtaskList() {
  const ul = document.getElementById('subtaskList');
  ul.innerHTML = subtasks.map((s,i) => `
    <li>
      <span>${s.text}</span>
      <button onclick="subtasks.splice(${i},1);renderSubtaskList()">✕</button>
    </li>
  `).join('');
}

// ===== SAVE TASK =====
function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) { showToast('Vazifa nomini kiriting!','error'); return; }

  const dateVal = document.getElementById('taskDate').value;
  const timeVal = document.getElementById('taskTime').value || '23:59';
  let deadline = null;
  if (dateVal) deadline = new Date(dateVal + 'T' + timeVal).toISOString();

  const taskData = {
    id: editingId || Date.now(),
    title,
    desc: document.getElementById('taskDesc').value.trim(),
    priority: document.getElementById('taskPriority').value,
    category: document.getElementById('taskCategory').value,
    reminder: parseInt(document.getElementById('taskReminder').value),
    deadline,
    subtasks: [...subtasks],
    completed: false,
    createdAt: editingId ? (tasks.find(t=>t.id===editingId)||{}).createdAt || Date.now() : Date.now(),
    overdueNotified: false,
    reminderNotified: false
  };

  if (editingId) {
    const idx = tasks.findIndex(t=>t.id===editingId);
    if (idx>-1) {
      taskData.completed = tasks[idx].completed;
      tasks[idx] = taskData;
    }
    showToast('Vazifa yangilandi! ✏️','success');
  } else {
    tasks.unshift(taskData);
    showToast('Yangi vazifa qo\'shildi! 🎉','success');
  }

  saveTasks();
  closeModal();
  render();
  updateBadges();
}

// ===== TOGGLE COMPLETE =====
function toggleComplete(id) {
  const task = tasks.find(t=>t.id===id);
  if (!task) return;
  task.completed = !task.completed;
  if (task.completed) showToast(`"${task.title}" bajarildi! 🎉`, 'success');
  saveTasks(); render(); updateBadges();
}

// ===== TOGGLE SUBTASK =====
function toggleSubtask(taskId, subId) {
  const task = tasks.find(t=>t.id===taskId);
  if (!task) return;
  const sub = task.subtasks.find(s=>s.id===subId);
  if (sub) sub.done = !sub.done;
  saveTasks(); render();
}

// ===== DELETE TASK =====
function deleteTask(id) {
  const task = tasks.find(t=>t.id===id);
  if (!task) return;
  if (!confirm(`"${task.title}" o'chirilsinmi?`)) return;
  tasks = tasks.filter(t=>t.id!==id);
  saveTasks(); render(); updateBadges();
  showToast('Vazifa o\'chirildi','warning');
}

// ===== SAVE TO LOCALSTORAGE =====
function saveTasks() {
  localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

// ===== FILTER & SORT =====
function getFilteredTasks() {
  const now = new Date();
  const today = now.toDateString();
  const search = document.getElementById('searchInput').value.toLowerCase();

  let filtered = tasks.filter(t => {
    // Search
    if (search && !t.title.toLowerCase().includes(search) && !t.desc.toLowerCase().includes(search)) return false;
    // Category
    if (currentCat !== 'all' && t.category !== currentCat) return false;
    // Priority
    if (currentPriority !== 'all' && t.priority !== currentPriority) return false;
    // Nav filter
    if (currentFilter === 'completed') return t.completed;
    if (currentFilter === 'today') {
      if (!t.deadline) return false;
      return new Date(t.deadline).toDateString() === today;
    }
    if (currentFilter === 'upcoming') {
      if (!t.deadline || t.completed) return false;
      return new Date(t.deadline) > now;
    }
    if (currentFilter === 'overdue') {
      if (!t.deadline || t.completed) return false;
      return new Date(t.deadline) < now;
    }
    return true;
  });

  // Sort
  filtered.sort((a,b) => {
    if (currentSort === 'deadline') {
      if (!a.deadline) return 1; if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (currentSort === 'priority') {
      const p = {high:0,medium:1,low:2};
      return p[a.priority] - p[b.priority];
    }
    if (currentSort === 'alpha') return a.title.localeCompare(b.title);
    return b.createdAt - a.createdAt;
  });

  return filtered;
}

// ===== RENDER =====
function render() {
  const filtered = getFilteredTasks();
  const list = document.getElementById('taskList');
  const empty = document.getElementById('emptyState');

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    list.innerHTML = filtered.map(task => renderTask(task)).join('');
  }

  updateStats();
}

function renderTask(task) {
  const now = new Date();
  const isOverdue = task.deadline && !task.completed && new Date(task.deadline) < now;
  const isToday = task.deadline && new Date(task.deadline).toDateString() === now.toDateString();

  const priorityLabels = { high:'Yuqori', medium:"O'rta", low:'Past' };
  const catLabels = { work:'💼 Ish', personal:'👤 Shaxsiy', shopping:'🛒 Xarid', health:'❤️ Salomatlik', education:'📚 Ta\'lim' };

  let deadlineHtml = '';
  if (task.deadline) {
    const d = new Date(task.deadline);
    const dateStr = d.toLocaleDateString('uz-UZ', {day:'2-digit',month:'short',year:'numeric'});
    const timeStr = d.toLocaleTimeString('uz-UZ', {hour:'2-digit',minute:'2-digit'});
    const cls = isOverdue ? 'overdue-text' : isToday ? 'today-text' : '';
    const icon = isOverdue ? '🔥' : isToday ? '⚡' : '📅';
    deadlineHtml = `<span class="task-deadline ${cls}">${icon} ${dateStr} ${timeStr}</span>`;
  }

  let subtaskHtml = '';
  if (task.subtasks && task.subtasks.length > 0) {
    const done = task.subtasks.filter(s=>s.done).length;
    const pct = Math.round((done/task.subtasks.length)*100);
    subtaskHtml = `
      <div class="subtask-progress">
        <span class="subtask-label">${done}/${task.subtasks.length} kichik vazifa</span>
        <div class="subtask-bar-wrap">
          <div class="subtask-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }

  return `
    <div class="task-card ${task.completed?'completed':''} ${isOverdue?'overdue':''}"
         draggable="true"
         ondragstart="dragStart(event,'${task.id}')"
         ondragover="dragOver(event)"
         ondrop="dragDrop(event,'${task.id}')">
      <button class="task-check ${task.completed?'checked':''}"
              onclick="toggleComplete(${task.id})"
              title="${task.completed?'Bajarilmagan deb belgilash':'Bajarilgan deb belgilash'}">
        ${task.completed?'✓':''}
      </button>
      <div class="task-body">
        <div class="task-title">${escHtml(task.title)}</div>
        ${task.desc ? `<div class="task-desc">${escHtml(task.desc)}</div>` : ''}
        <div class="task-meta">
          <span class="task-badge badge-${task.priority}">${priorityLabels[task.priority]}</span>
          <span class="task-cat">${catLabels[task.category]||task.category}</span>
          ${deadlineHtml}
        </div>
        ${subtaskHtml}
      </div>
      <div class="task-actions">
        <button class="task-btn edit" onclick="openModal(tasks.find(t=>t.id===${task.id}))" title="Tahrirlash">✏️</button>
        <button class="task-btn delete" onclick="deleteTask(${task.id})" title="O'chirish">🗑️</button>
      </div>
    </div>`;
}

// ===== STATS =====
function updateStats() {
  const now = new Date();
  const total = tasks.length;
  const done = tasks.filter(t=>t.completed).length;
  const pending = tasks.filter(t=>!t.completed).length;
  const overdue = tasks.filter(t=>t.deadline && !t.completed && new Date(t.deadline)<now).length;
  const pct = total > 0 ? Math.round((done/total)*100) : 0;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statDone').textContent = done;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statOverdue').textContent = overdue;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressPercent').textContent = pct + '%';
}

function updateBadges() {
  const now = new Date();
  const today = now.toDateString();
  document.getElementById('badge-all').textContent = tasks.filter(t=>!t.completed).length;
  document.getElementById('badge-today').textContent = tasks.filter(t=>t.deadline && new Date(t.deadline).toDateString()===today && !t.completed).length;
  document.getElementById('badge-upcoming').textContent = tasks.filter(t=>t.deadline && new Date(t.deadline)>now && !t.completed).length;
  document.getElementById('badge-overdue').textContent = tasks.filter(t=>t.deadline && new Date(t.deadline)<now && !t.completed).length;
  document.getElementById('badge-completed').textContent = tasks.filter(t=>t.completed).length;
}

// ===== PAGE TITLE =====
function updatePageTitle() {
  const titles = {
    all: ['Barcha vazifalar', 'Bugun ham samarali bo\'ling!'],
    today: ['Bugungi vazifalar', 'Bugun nima qilish kerak?'],
    upcoming: ['Kelgusi vazifalar', 'Oldinda nima bor?'],
    overdue: ['Muddati o\'tgan', 'Ularni tezda bajaring!'],
    completed: ['Bajarilgan vazifalar', 'Ajoyib ish! 🎉']
  };
  const [title, sub] = titles[currentFilter] || titles.all;
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSubtitle').textContent = sub;
}

// ===== THEME =====
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeIcon').textContent = isDark ? '🌙' : '☀️';
  document.getElementById('themeLabel').textContent = isDark ? 'Dark mode' : 'Light mode';
  localStorage.setItem('taskflow_theme', isDark ? 'light' : 'dark');
}

// Load saved theme
const savedTheme = localStorage.getItem('taskflow_theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'dark') {
    document.getElementById('themeIcon').textContent = '☀️';
    document.getElementById('themeLabel').textContent = 'Light mode';
  }
}

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ===== DRAG & DROP =====
let dragId = null;
function dragStart(e, id) { dragId = id; e.target.classList.add('dragging'); }
function dragOver(e) { e.preventDefault(); }
function dragDrop(e, targetId) {
  e.preventDefault();
  if (!dragId || dragId == targetId) { dragId=null; return; }
  const fromIdx = tasks.findIndex(t=>t.id==dragId);
  const toIdx = tasks.findIndex(t=>t.id==targetId);
  if (fromIdx>-1 && toIdx>-1) {
    const [moved] = tasks.splice(fromIdx,1);
    tasks.splice(toIdx,0,moved);
    saveTasks(); render();
  }
  dragId = null;
  document.querySelectorAll('.task-card').forEach(c=>c.classList.remove('dragging'));
}

// ===== HELPERS =====
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== DEMO TASKS (first run) =====
if (tasks.length === 0) {
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate()+1);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate()-1);
  const nextWeek = new Date(now); nextWeek.setDate(nextWeek.getDate()+7);

  tasks = [
    {
      id: 1, title: 'Loyiha taqdimotini tayyorlash',
      desc: 'Mijoz uchun yangi loyiha taqdimotini PowerPoint da tayyorlash',
      priority: 'high', category: 'work',
      deadline: tomorrow.toISOString(), reminder: 60,
      subtasks: [
        {id:11, text:'Slaydlar tuzish', done:true},
        {id:12, text:'Grafiklar qo\'shish', done:false},
        {id:13, text:'Matn tekshirish', done:false}
      ],
      completed: false, createdAt: Date.now()-86400000,
      overdueNotified: false, reminderNotified: false
    },
    {
      id: 2, title: 'Ingliz tili darsi',
      desc: 'Online dars - B2 darajasi',
      priority: 'medium', category: 'education',
      deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0).toISOString(),
      reminder: 30, subtasks: [],
      completed: false, createdAt: Date.now()-3600000,
      overdueNotified: false, reminderNotified: false
    },
    {
      id: 3, title: 'Supermarketdan xarid qilish',
      desc: 'Non, sut, tuxum, sabzavotlar',
      priority: 'low', category: 'shopping',
      deadline: null, reminder: 0, subtasks: [
        {id:31, text:'Non', done:true},
        {id:32, text:'Sut', done:true},
        {id:33, text:'Tuxum', done:false}
      ],
      completed: false, createdAt: Date.now()-7200000,
      overdueNotified: false, reminderNotified: false
    },
    {
      id: 4, title: 'Hisobot yozish',
      desc: 'Oylik moliyaviy hisobot',
      priority: 'high', category: 'work',
      deadline: yesterday.toISOString(), reminder: 0, subtasks: [],
      completed: false, createdAt: Date.now()-172800000,
      overdueNotified: false, reminderNotified: false
    },
    {
      id: 5, title: 'Sport zali',
      desc: 'Haftalik mashg\'ulot',
      priority: 'medium', category: 'health',
      deadline: nextWeek.toISOString(), reminder: 60, subtasks: [],
      completed: true, createdAt: Date.now()-259200000,
      overdueNotified: false, reminderNotified: false
    }
  ];
  saveTasks();
}
