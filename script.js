const todoForm = document.getElementById("todo-form");
const todoDisplayArea = document.getElementById("todo-list");
const taskCounter = document.getElementById("task-count");
const taskSearch = document.getElementById("task-search");
const sortTasks = document.getElementById("sort-tasks");
const toggleDark = document.getElementById("toggle-dark");

let allTasks = JSON.parse(localStorage.getItem("todos")) || [];
let taskBeingEditedId = null;

document.getElementById("todo-time").min = new Date().toISOString().slice(0, 16);

// Initialize dark mode from localStorage
if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
  toggleDark.textContent = "☀️";
}

todoForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const taskTitle = document.getElementById("todo-title").value.trim();
  const taskDetails = document.getElementById("todo-description").value.trim();
  const taskDateTime = document.getElementById("todo-time").value;
  const taskPriority = document.getElementById("task-priority").value;
  const taskCategory = document.getElementById("task-category").value || "General";

  if (taskTitle === "") {
    showMessage("Please enter a title for your task.");
    return;
  }

  if (taskBeingEditedId) {
    allTasks = allTasks.map(task =>
      task.id === taskBeingEditedId
        ? { 
            ...task, 
            title: taskTitle, 
            description: taskDetails, 
            time: taskDateTime || null,
            priority: taskPriority,
            category: taskCategory
          }
        : task
    );
    taskBeingEditedId = null;
  } else {
    const newTask = {
      id: Date.now(),
      title: taskTitle,
      description: taskDetails,
      time: taskDateTime || null,
      done: false,
      priority: taskPriority,
      category: taskCategory,
      createdAt: new Date().toISOString()
    };

    const boldColors = [
      '#AAC0AA', 
      '#F4A8B7',
      '#E89179', 
      '#9EABD5', 
      '#F5EC7A'  
    ];

    newTask.color = boldColors[Math.floor(Math.random() * boldColors.length)];

    allTasks.push(newTask);
  }

  saveTasksAndUpdate();
  todoForm.reset();
  document.getElementById("todo-time").min = new Date().toISOString().slice(0, 16);
});

function saveTasksAndUpdate() {
  localStorage.setItem("todos", JSON.stringify(allTasks));
  showTasksOnScreen();
}

function showTasksOnScreen() {
  renderTasks(allTasks);
  updateProgressBar();
}

function renderTasks(tasks) {
  todoDisplayArea.innerHTML = "";

  if (tasks.length === 0) {
    todoDisplayArea.innerHTML = `
      <div class="empty-state">
        <p>No tasks found</p>
        <img src="https://cdn-icons-png.flaticon.com/512/4076/4076478.png" alt="No tasks" width="100">
      </div>
    `;
    taskCounter.textContent = "You have no tasks";
    return;
  }

  // Sort tasks based on selected option
  const sortedTasks = [...tasks];
  switch(sortTasks.value) {
    case "priority":
      sortedTasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      break;
    case "date":
      sortedTasks.sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return new Date(a.time) - new Date(b.time);
      });
      break;
    case "category":
      sortedTasks.sort((a, b) => a.category.localeCompare(b.category));
      break;
    default:
      sortedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  sortedTasks.forEach((task) => {
    const taskBox = document.createElement("div");
    taskBox.className = `todo-item ${task.done ? "done" : ""}`;
    taskBox.style.backgroundColor = task.color || '#E0F7F6';

    // Add overdue/soon classes
    if (task.time && !task.done) {
      const dueDate = new Date(task.time);
      const today = new Date();
      const timeDiff = dueDate - today;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 0) {
        taskBox.classList.add("overdue");
      } else if (daysDiff <= 1) {
        taskBox.classList.add("due-soon");
      }
    }

    taskBox.innerHTML = `
      <div>
        <span class="priority priority-${task.priority}"></span>
        <span class="category-tag">${task.category}</span>
        <strong>${task.title}</strong><br/>
        ${task.description ? `${task.description}<br/>` : ""}
        ${task.time ? `🗓️ ${formatDate(task.time)}` : ""}
      </div>
      <div>
        <button onclick="markAsDone(${task.id})">✔</button>
        <button onclick="startEditing(${task.id})">✏️</button>
        <button onclick="removeTask(${task.id})">🗑</button>
      </div>
    `;

    todoDisplayArea.appendChild(taskBox);
  });

  const activeTasks = tasks.filter(task => !task.done).length;
  taskCounter.textContent = `You have ${activeTasks} ${activeTasks === 1 ? "task" : "tasks"} (${tasks.length} total)`;

  const finishedEverything = tasks.length > 0 && tasks.every(task => task.done);
  const congratsBox = document.getElementById("congrats-alert");

  if (finishedEverything) {
    congratsBox.classList.add("show");
  } else {
    congratsBox.classList.remove("show");
  }
}

function markAsDone(taskId) {
  allTasks = allTasks.map(task =>
    task.id === taskId ? { ...task, done: !task.done } : task
  );
  
  if (allTasks.find(task => task.id === taskId).done) {
    createCelebrationBubbles();
  }
  
  saveTasksAndUpdate();
}

function removeTask(taskId) {
  if (confirm("Are you sure you want to delete this task?")) {
    allTasks = allTasks.filter(task => task.id !== taskId);
    saveTasksAndUpdate();
  }
}

function startEditing(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  document.getElementById("todo-title").value = task.title;
  document.getElementById("todo-description").value = task.description || "";
  document.getElementById("todo-time").value = task.time || "";
  document.getElementById("task-priority").value = task.priority;
  document.getElementById("task-category").value = task.category;
  document.getElementById("todo-time").min = new Date().toISOString().slice(0, 16);
  taskBeingEditedId = taskId;
  document.getElementById("todo-title").focus();
}

function formatDate(dateTimeValue) {
  const date = new Date(dateTimeValue);
  if (isNaN(date)) return "Invalid date";
  
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let dateString = date.toLocaleDateString();
  
  if (date.toDateString() === today.toDateString()) {
    dateString = "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    dateString = "Tomorrow";
  }
  
  return `${dateString} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function showMessage(text) {
  const alertBox = document.getElementById("custom-alert");
  alertBox.textContent = text;
  alertBox.classList.add("show");
  setTimeout(() => {
    alertBox.classList.remove("show");
  }, 3000);
}

function updateCurrentDate() {
  const dateElement = document.getElementById("current-date");
  const today = new Date();
  dateElement.textContent = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function createBubbles() {
  const bubblesContainer = document.querySelector('.bubbles');
  const colors = [
    'rgba(170, 192, 170, 0.2)',
    'rgba(244, 168, 183, 0.2)',
    'rgba(232, 145, 121, 0.2)',
    'rgba(158, 171, 213, 0.2)',
    'rgba(245, 236, 122, 0.2)'
  ];
  
  for (let i = 0; i < 5; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const size = Math.random() * 60 + 40;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const duration = Math.random() * 6 + 6;
    const delay = Math.random() * 5;
    
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${posX}%`;
    bubble.style.top = `${posY}%`;
    bubble.style.background = color;
    bubble.style.animationDuration = `${duration}s`;
    bubble.style.animationDelay = `${delay}s`;
    
    bubblesContainer.appendChild(bubble);
  }
}

function createCelebrationBubbles() {
  const colors = ['#AAC0AA', '#F4A8B7', '#E89179', '#9EABD5', '#F5EC7A'];
  const container = document.querySelector('.bubbles');
  
  for (let i = 0; i < 3; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble celebration';
    
    const size = Math.random() * 30 + 20;
    const posX = Math.random() * 100;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${posX}%`;
    bubble.style.bottom = '0';
    bubble.style.background = color;
    bubble.style.animation = `floatUp 3s ease-out forwards`;
    
    container.appendChild(bubble);
    
    setTimeout(() => {
      bubble.remove();
    }, 3000);
  }
}

function updateProgressBar() {
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(task => task.done).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  document.getElementById('progress-bar').style.width = `${progress}%`;
}

// Event listeners
taskSearch.addEventListener('input', function(e) {
  const searchTerm = e.target.value.toLowerCase();
  const filteredTasks = allTasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm) || 
    (task.description && task.description.toLowerCase().includes(searchTerm)) ||
    task.category.toLowerCase().includes(searchTerm)
  );
  
  renderTasks(filteredTasks);
});

sortTasks.addEventListener('change', function() {
  renderTasks(allTasks);
});

toggleDark.addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
  
  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('darkMode', 'enabled');
    toggleDark.textContent = "☀️";
  } else {
    localStorage.setItem('darkMode', 'disabled');
    toggleDark.textContent = "🌙";
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  createBubbles();
  updateCurrentDate();
  showTasksOnScreen();
});