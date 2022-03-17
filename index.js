// @ts-check

const sqlite = require('better-sqlite3');
const express = require('express');
const blocked = require('blocked');
const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Database
const dbPath = process.env.DATABASEPATH || './db.sqlite';

const db = sqlite(dbPath, { verbose: console.log });



db.exec(
    `CREATE TABLE IF NOT EXISTS todo (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        timestamp INTEGER,
        description TEXT,
        done INTEGER
    );`
)

app.get('/todos/range', (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        res.status(400).send({ error: 'Missing start or end parameter' });
        return;
    }

    const result = db.prepare(`SELECT * FROM todo WHERE timestamp BETWEEN ? AND ?`).all(start, end);
    res.send(result);
})

app.get('/todos/all', (req, res) => {
    const result = db.prepare(`SELECT * FROM todo`).all();
    res.send(result);
})

app.post('/create', (req, res) => {
    const { description } = req.body;

    if (!description) {
        res.status(400).send({ error: 'Missing description' });
        return;
    }

    const timestamp = Date.now();

    db.prepare('INSERT INTO todo (timestamp, description, done) VALUES (?, ?, ?)').run(timestamp, description, 0);

    const id = db.prepare('SELECT id FROM todo WHERE timestamp = ?').get(timestamp);
    res.send({ timestamp, description, id: id.id });
})

app.patch('/done', (req, res) => {
    const { id } = req.body;

    const done = req.body.done ? 1 : 0;

    if (done !== 0 && done !== 1) {
        res.status(400).send({ error: 'done must be 0 or 1' });
        return;
    }

    if (!id) {
        res.status(400).send({ error: 'Missing id' });
        return;
    }

    if (!db.prepare('SELECT * FROM todo WHERE id = ?').get(id)) {
        res.status(404).send({ error: 'Todo not found' });
        return;
    }

    db.prepare(`UPDATE todo SET done = ? WHERE id = ?`).run(done, id);

    res.send({ id });
})

app.patch("/description", (req, res) => {
    const { id, description } = req.body;

    if (!id) {
        res.status(400).send({ error: 'Missing id' });
        return;
    }

    if (!description) {
        res.status(400).send({ error: 'Missing description' });
        return;
    }

    if (!db.prepare('SELECT * FROM todo WHERE id = ?').get(id)) {
        res.status(404).send({ error: 'Todo not found' });
        return;
    }

    db.prepare(`UPDATE todo SET description = ? WHERE id = ?`).run(description, id);

    res.send({ id });
})
// using app.delete hangs for some reason
app.delete("/delete", (req, res) => {
    const { id } = req.body;

    if (!id) {
        res.status(400).send({ error: 'Missing id' });
        return;
    }

    if (!db.prepare('SELECT * FROM todo WHERE id = ?').get(id)) {
        res.status(404).send({ error: 'Todo not found' });
        return;
    }

    db.prepare(`DELETE FROM todo WHERE id = ?`).run(id);

    res.send("OK");
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))