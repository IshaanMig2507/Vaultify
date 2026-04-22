let saved = localStorage.getItem("fs");

let fileSystem = saved
  ? JSON.parse(saved)
  : { name: "root", type: "folder", children: [] };

let current = fileSystem;
let path = [];
let selectedItem = null;

let undoStack = [];
let redoStack = [];
let chartInstance = null;

function nameExists(name) {
  return current.children.some(item => item.name === name);
}

function render() {
  let pathDiv = document.getElementById("path");
  pathDiv.innerHTML = "/" + path.map(p => p.name).join("/");

  let fileList = document.getElementById("fileList");
  fileList.innerHTML = "";

  current.children.forEach((item, index) => {
    let div = document.createElement("div");
    div.className = "item";

div.innerHTML = `
  <div class="file-icon">
    ${
      item.type === "folder"
        ? '<i class="fa-solid fa-folder"></i>'
        : '<i class="fa-solid fa-file"></i>'
    }
  </div>
  <div class="file-name">${item.name}</div>
`;

    div.onclick = () => {
      selectedItem = { item, index };
      highlight(div);
    };

    div.ondblclick = () => {
      if (item.type === "folder") {
        fileList.classList.add("fade");
        setTimeout(() => {
          path.push(current);
          current = item;
          render();
          fileList.classList.remove("fade");
        }, 150);
      }
    };

    fileList.appendChild(div);
  });

  renderTree();
  generateChart();

  localStorage.setItem("fs", JSON.stringify(fileSystem));
}

function highlight(el) {
  document.querySelectorAll(".item").forEach(i => i.classList.remove("selected"));
  el.classList.add("selected");
}

function createFolder() {
  let name = prompt("Folder name:");
  if (!name || nameExists(name)) return alert("Invalid or duplicate name!");

  saveState();
  current.children.push({ name, type: "folder", children: [] });
  render();
}

function createFile() {
  let name = prompt("File name:");
  if (!name || nameExists(name)) return alert("Invalid or duplicate name!");

  saveState();
  current.children.push({ name, type: "file" });
  render();
}

function deleteItem() {
  if (!selectedItem) {
    alert("No item selected!");
    return;
  }

  saveState();
  current.children.splice(selectedItem.index, 1);
  selectedItem = null;
  render();
}
function renameItem() {
  if (!selectedItem) return;

  let name = prompt("Rename to:", selectedItem.item.name);
  if (!name || nameExists(name)) return alert("Invalid or duplicate name!");

  saveState();
  selectedItem.item.name = name;
  render();
}

function undo() {
  if (!undoStack.length) return;

  redoStack.push(JSON.stringify(fileSystem));
  fileSystem = JSON.parse(undoStack.pop());
  reset();
}

function redo() {
  if (!redoStack.length) return;

  undoStack.push(JSON.stringify(fileSystem));
  fileSystem = JSON.parse(redoStack.pop());
  reset();
}

function saveState() {
  undoStack.push(JSON.stringify(fileSystem));
  redoStack = [];
}

function reset() {
  current = fileSystem;
  path = [];
  render();
}

function renderTree() {
  let tree = document.getElementById("tree");
  tree.innerHTML = "";

  function build(node, ul) {
    let li = document.createElement("li");
    li.innerText = "📁 " + node.name;

    li.onclick = () => {
      current = node;
      path = [];
      render();
    };

    ul.appendChild(li);

    if (node.children) {
      let sub = document.createElement("ul");
      node.children
        .filter(c => c.type === "folder")
        .forEach(c => build(c, sub));
      ul.appendChild(sub);
    }
  }

  build(fileSystem, tree);
}

function searchItems() {
  let q = document.getElementById("search").value.toLowerCase();
  document.querySelectorAll(".item").forEach(i => {
    i.style.display = i.innerText.toLowerCase().includes(q) ? "block" : "none";
  });
}

function toggleDark() {
  document.body.classList.toggle("dark");

  let icon = document.getElementById("themeIcon");

  if (document.body.classList.contains("dark")) {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  } else {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  }
}

function calculateSizes(node) {
  if (node.type === "file") return 1;
  return node.children.reduce((sum, c) => sum + calculateSizes(c), 0);
}

function generateChart() {
  let ctx = document.getElementById("chart");

  let labels = current.children.map(i => i.name);
  let data = current.children.map(i => calculateSizes(i));

  if (!labels.length) return;

  if (chartInstance) chartInstance.destroy();
  backgroundColor: [
  "#f4b37a",
  "#6b7099",
  "#4a4f7c",
  "#7c83c3",
  "#a5aad9",
  "#f7c59f"
]

chartInstance = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels,
    datasets: [{
      data,
      backgroundColor: [
        "#f4b37a",  // peach
        "#6b7099",  // lavender
        "#4a4f7c",  // darker lavender
        "#8890c7",  // lighter tone
        "#f7c59f",  // soft peach
        "#7c83c3",
        "#a5aad9"
      ],
      borderWidth: 2,
      borderColor: "#0f1e36"
    }]
  },
  options: {
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#ffffff",   // ✅ FIX TEXT COLOR
          font: {
            size: 15
          }
        }
      }
    }
  }
});
}

/* Context Menu */
let menu = document.getElementById("contextMenu");
document.addEventListener("contextmenu", function (e) {
  e.preventDefault();

  let target = e.target.closest(".item");
  let items = document.querySelectorAll(".item");
  let renameOption = document.getElementById("renameOption");
let deleteOption = document.getElementById("deleteOption");

if (selectedItem) {
  renameOption.style.display = "block";
  deleteOption.style.display = "block";
} else {
  renameOption.style.display = "none";
  deleteOption.style.display = "none";
}

  // Remove previous selection
  items.forEach(el => el.classList.remove("selected"));

  if (target) {
    let index = [...items].indexOf(target);

    selectedItem = {
      item: current.children[index],
      index: index
    };

    // Highlight on right click
    target.classList.add("selected");
  } else {
    selectedItem = null;
  }

  let menu = document.getElementById("contextMenu");

  menu.style.display = "block";
  menu.style.left = Math.min(e.pageX, window.innerWidth - 170) + "px";
  menu.style.top = Math.min(e.pageY, window.innerHeight - 150) + "px";
});

document.addEventListener("click", () => {
  menu.style.display = "none";
});

render();

const contextMenu = document.getElementById("contextMenu");

document.addEventListener("contextmenu", function (e) {
  e.preventDefault();

  const target = e.target.closest(".item");
  const items = document.querySelectorAll(".item");

  // Clear selection
  items.forEach(el => el.classList.remove("selected"));

  if (target) {
    const index = [...items].indexOf(target);

    selectedItem = {
      item: current.children[index],
      index: index
    };

    target.classList.add("selected");
  } else {
    selectedItem = null;
  }

  contextMenu.style.display = "block";
  contextMenu.style.left = Math.min(e.pageX, window.innerWidth - 180) + "px";
  contextMenu.style.top = Math.min(e.pageY, window.innerHeight - 150) + "px";
});

// Hide menu on click
document.addEventListener("click", () => {
  contextMenu.style.display = "none";
});