const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database('escola.db');
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, role TEXT NOT NULL, email TEXT, course TEXT, year TEXT, disciplines TEXT);
CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, author TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS schedule (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT NOT NULL, start TEXT NOT NULL, end TEXT NOT NULL, activity TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT, year TEXT, course TEXT, registered_by TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);

if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0) {
  const add = db.prepare('INSERT INTO users (name,role,email,course,year,disciplines) VALUES (?,?,?,?,?,?)');
  add.run('Administrador do Sistema','Administrador','admin@escola.pr.gov.br','Desenvolvimento de Sistemas','','Gestão completa');
  add.run('Direção da Escola','Diretor','diretor@escola.pr.gov.br','Desenvolvimento de Sistemas','','Alimentação, horários e comunicados');
  add.run('Coordenação do Curso','Coordenador','coordenacao@escola.pr.gov.br','Desenvolvimento de Sistemas','','Equipe docente e turmas');
  add.run('Antonio Carlos','Professor','antonio.carlos@escola.pr.gov.br','Desenvolvimento de Sistemas','3º ano','HTML, CSS, JavaScript, Backend e Projetos');
  add.run('Aluno Exemplo','Aluno','aluno@escola.pr.gov.br','Desenvolvimento de Sistemas','1º ano','');
}

app.get('/api/users', (req,res)=>res.json(db.prepare('SELECT * FROM users ORDER BY CASE role WHEN "Administrador" THEN 1 WHEN "Diretor" THEN 2 WHEN "Coordenador" THEN 3 WHEN "Professor" THEN 4 ELSE 5 END, name').all()));
app.put('/api/users/:id/role',(req,res)=>{ const {role}=req.body; if(!['Administrador','Diretor','Coordenador','Professor','Aluno'].includes(role)) return res.status(400).json({error:'Função inválida'}); db.prepare('UPDATE users SET role=? WHERE id=?').run(role,req.params.id); res.json({ok:true}); });
app.get('/api/posts',(req,res)=>res.json(db.prepare('SELECT * FROM posts ORDER BY id DESC').all()));
app.post('/api/posts',(req,res)=>{ const {type,title,content,author}=req.body; if(!type||!title||!content||!author) return res.status(400).json({error:'Preencha os campos'}); const r=db.prepare('INSERT INTO posts(type,title,content,author) VALUES(?,?,?,?)').run(type,title,content,author); res.json(db.prepare('SELECT * FROM posts WHERE id=?').get(r.lastInsertRowid)); });
app.delete('/api/posts/:id',(req,res)=>{db.prepare('DELETE FROM posts WHERE id=?').run(req.params.id);res.json({ok:true})});
app.get('/api/schedule',(req,res)=>res.json(db.prepare('SELECT * FROM schedule ORDER BY CASE day WHEN "Segunda" THEN 1 WHEN "Terça" THEN 2 WHEN "Quarta" THEN 3 WHEN "Quinta" THEN 4 WHEN "Sexta" THEN 5 ELSE 6 END,start').all()));
app.post('/api/schedule',(req,res)=>{const {day,start,end,activity}=req.body;const r=db.prepare('INSERT INTO schedule(day,start,end,activity) VALUES(?,?,?,?)').run(day,start,end,activity);res.json(db.prepare('SELECT * FROM schedule WHERE id=?').get(r.lastInsertRowid))});
app.get('/api/students',(req,res)=>res.json(db.prepare('SELECT * FROM students ORDER BY id DESC').all()));
app.post('/api/students',(req,res)=>{const {name,email,year,course,registered_by}=req.body;if(!name||!year||!course)return res.status(400).json({error:'Nome, curso e ano são obrigatórios'});const r=db.prepare('INSERT INTO students(name,email,year,course,registered_by) VALUES(?,?,?,?,?)').run(name,email,year,course,registered_by||'Professor');res.json(db.prepare('SELECT * FROM students WHERE id=?').get(r.lastInsertRowid))});
app.get('/api/summary',(req,res)=>res.json({users:db.prepare('SELECT COUNT(*) n FROM users').get().n,posts:db.prepare('SELECT COUNT(*) n FROM posts').get().n,students:db.prepare('SELECT COUNT(*) n FROM students').get().n,schedule:db.prepare('SELECT COUNT(*) n FROM schedule').get().n}));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(process.env.PORT||3000,()=>console.log('Portal rodando em http://localhost:'+(process.env.PORT||3000)));
