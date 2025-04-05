const todoForm = document.getElementById("todo-form");
const todoDisplayArea = document.getElementById("todo-list");
const taskCounter = document.getElementById("task-count");

let allTasks = JSON.parse(localStorage.getItem("todos")) || [];
let taskBeingEditedId = null;

document.getElementById("todo-time").min = new Date().toISOString().slice(0, 16);

todoForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const taskTitle = document.getElementById("todo-title").value.trim();
  const taskDetails = document.getElementById("todo-description").value.trim();
  const taskDateTime = document.getElementById("todo-time").value;

  if (taskTitle === "") {
    showMessage("Please enter a title for your task.");
    return;
  }

  if (taskBeingEditedId) {
    allTasks = allTasks.map(task =>
      task.id === taskBeingEditedId
        ? { ...task, title: taskTitle, description: taskDetails, time: taskDateTime || null }
        : task
    );
    taskBeingEditedId = null;
  } else {
    const newTask = {
      id: Date.now(),
      title: taskTitle,
      description: taskDetails,
      time: taskDateTime || null,
      done: false
    };
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
  todoDisplayArea.innerHTML = "";

  allTasks.forEach((task) => {
    const taskBox = document.createElement("div");
    taskBox.className = `todo-item ${task.done ? "done" : ""}`;

    taskBox.innerHTML = `
      <div>
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

  taskCounter.textContent = `You have ${allTasks.length} task${allTasks.length !== 1 ? "s" : ""}`;

  const finishedEverything = allTasks.length > 0 && allTasks.every(task => task.done);
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
  document.getElementById("todo-description").value = task.description;
  document.getElementById("todo-time").value = task.time || "";
  document.getElementById("todo-time").min = new Date().toISOString().slice(0, 16);
  taskBeingEditedId = taskId;
}

function formatDate(dateTimeValue) {
  const date = new Date(dateTimeValue);
  if (isNaN(date)) return "Invalid date";
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
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

showTasksOnScreen();
