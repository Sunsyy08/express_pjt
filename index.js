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

app.post("/articles", (req, res) => {

  let { title, content } = req.body


  db.run(`INSERT INTO articles (title, content) VALUES (?, ?)`,
    [title, content],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, title, content });
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
app.get('/articles/:id', (req, res) => {

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


app.delete("/articles/:id", (req, res) => {
  const id = req.params.id; // URL에서 id 가져오기

  const sql = 'DELETE FROM articles WHERE id = ?';

  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: '삭제 중 오류 발생: ' + err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: '해당 ID의 아티클이 없음' });
    }
    res.json({ message: `아티클 ID ${id} 삭제 완료` });
  });


  res.send("ok")
})

app.put('/articles/:id', (req, res) => {
  let id = req.params.id
  let { title, content } = req.body

  if (!title || !content) {
    return res.status(400).json({ error: 'title과 content를 모두 제공해야 합니다.' });
  }

  const sql = `UPDATE articles SET title = ?, content = ? WHERE id = ?`;

  db.run(sql, [title, content, id], function (err) {
    if (err) {
      return res.status(500).json({ error: '업데이트 중 오류 발생: ' + err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: '해당 ID의 아티클을 찾을 수 없습니다.' });
    }
    res.json({ message: `아티클 ID ${id} 업데이트 완료` });
  });
})


// 특정 아티클에 댓글 추가
app.post("/articles/:id/comments", (req, res) => {
  const articleId = req.params.id; // URL에서 아티클 ID 가져오기
  const content = req.body.content; // 요청 Body에서 content 가져오기

  if (!content) {
    return res.status(400).json({ error: "댓글 내용을 입력하세요." });
  }

  const sql = `INSERT INTO comments (content, article_id) VALUES (?, ?)`;

  db.run(sql, [content, articleId], function (err) {
    if (err) {
      return res.status(500).json({ error: "댓글 저장 중 오류 발생: " + err.message });
    }
    res.json({ message: "댓글 추가 완료", commentId: this.lastID });
  });
});

// 특정 게시글의 댓글 조회
app.get("/articles/:id/comments", (req, res) => {
  const articleId = req.params.id; // URL에서 article ID 가져오기

  const sql = `SELECT * FROM comments WHERE article_id = ? ORDER BY created_at DESC`;

  db.all(sql, [articleId], (err, rows) => {
      if (err) {
          return res.status(500).json({ error: "댓글 조회 중 오류 발생: " + err.message });
      }
      res.json({ articleId, comments: rows });
  });
});