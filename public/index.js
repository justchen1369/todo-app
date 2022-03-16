// @ts-check

function restMethod(method, url, data) {
    return fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(async response => {

        let json
        try {
            json = await response.json();
        } catch (e) { }

        return {
            status: response.status,
            json: json,
            message: response.statusText
        }
    });
}

const todos = document.getElementById("todos");

async function createTodo(description) {
    // @ts-ignore

    if (!description) {
        return
    }

    const { id } = (await restMethod("POST", "/create", { description })).json

    const container = createTodoItem(description, id);

    const todoItem = container.querySelector("li");

    todoItem.addEventListener("focusout", async () => {
        const description = todoItem.innerText;
        const res = await restMethod("PATCH", "/description", { id, description });

        if (res.status !== 200) {
            error(res.status, res.message);
            return;
        }
    })

    todos.appendChild(container);

    return container;
}

function createTodoItem(description, id, done = false) {
    const container = document.createElement("div");
    container.classList.add("todo-item");

    // clickable "done"
    const doneButton = document.createElement("input");
    doneButton.type = "checkbox";
    doneButton.classList.add("done-button");
    doneButton.onclick = async () => {
        const done = doneButton.checked;
        
        if (done) {
            todoItem.classList.add("strike");
        } else {
            todoItem.classList.remove("strike");
        }

        const res = await restMethod("PATCH", "/done", { id, done });

        if (res.status !== 200) {
            error(res.status, res.message);
            todoItem.classList.remove("strike");
            return;
        }
    }
    container.appendChild(doneButton);

    const todoItem = document.createElement("li");
    if (done) {
        todoItem.classList.add("strike");
        doneButton.checked = true;
    }
    todoItem.setAttribute("data-id", id);
    todoItem.spellcheck = false;

    // @ts-ignore
    todoItem.contentEditable = true;

    todoItem.textContent = description;

    container.appendChild(todoItem);

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("close");
    deleteButton.innerHTML = '<img src="/trash-can.svg"></img>';
    deleteButton.onclick = async () => {
        await restMethod("DELETE", "/delete", { id });
        container.remove();
    }
    container.appendChild(deleteButton);

    // prevent newlines in the description
    todoItem.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
        }
    })
    return container;
}

restMethod("GET", "/todos/all")
    .then(async res => {
        const todoList = (await res).json
        todoList.forEach(todo => {
            todos.appendChild(createTodoItem(todo.description, todo.id, todo.done));
        });
    })

function error(code, message) {
    console.log(`Error ${code}: ${message}`);
}


const newTodo = document.getElementById("new-todo");

async function newTodoClickCallback() {
}


newTodo.addEventListener("click", async () => {
    newTodo.style.visibility = "hidden";
    let finished = false;
    while (!finished) {
        finished = true;
        const container = createTodoItem("", "", false);

        todos.appendChild(container);
        container.querySelector("li").focus();


        
        await new Promise((resolve) => {
            async function attemptCreateTodo() {
                container.removeEventListener("keydown", containerKeyDownCallback);
                container.removeEventListener("focusout", containerFocusOutCallback);
                if (container.querySelector("li").innerText.length > 0) {
                    container.replaceWith(await createTodo(container.querySelector("li").innerText));
                } else {
                    container.remove();
                }
            }

            async function containerKeyDownCallback(e) {
                if (e.key === "Enter") {
                    attemptCreateTodo();
                    finished = false;
                    resolve();
                }
            }
            container.addEventListener("keydown", containerKeyDownCallback);

            async function containerFocusOutCallback() {
                attemptCreateTodo();
                resolve();
            }
            container.addEventListener("focusout", containerFocusOutCallback);

        })
    }
    newTodo.style.visibility = "visible";
});