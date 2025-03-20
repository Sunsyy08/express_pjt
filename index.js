const express = require('express');
const app = express();


const cors = require('cors');
app.use(cors());

// json으로 된 post의 바디를 읽기 위해 필요

app.use(express.json())

const PORT = 3000;

// SQLite 데이터베이스 연결
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  });

app.post("/articles", (req, res)=>{

    let {title,content} = req.body


    db.run(`INSERT INTO articles (title, content) VALUES (?, ?)`,
      [title, content],
      function(err) {
        if (err) {
          return res.status(500).json({error: err.message});
        }
        res.json({id: this.lastID, title, content});
      });
  });
  
  // 전체 아티클 리스트 주는 api를 만들어라
  app.get('/articles', (req, res) => {
    const sql = `SELECT * FROM articles`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("데이터 조회 중 오류 발생:", err);
            return res.status(500).json({ error: "데이터 조회 중 오류 발생" });
        }

        res.json({ articles: rows });
    });
  })

// 개별 아티클 주는 api를 만들어
app.get('/articles/:id', (req, res)=>{

    let id = req.params.id
    
    const sql = `SELECT * FROM articles WHERE id = ?`;

    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error("데이터 조회 중 오류 발생:", err);
            return res.status(500).json({ error: "데이터 조회 중 오류 발생" });
        }

        if (!row) {
            return res.status(404).json({ error: "해당 ID의 글을 찾을 수 없습니다." });
        }

        res.json(row);
    });

})
