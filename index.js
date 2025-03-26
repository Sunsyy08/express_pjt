const express = require('express');
const app = express();
const bcrypt = require('bcrypt');  //해싱
const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;


function authMiddleware(req, res, next) {
  console.log("dslfjl")
  const authHeader = req.headers.authorization;
  console.log(authHeader)

  if (!authHeader) {
    return res.status(401).send('인증 헤더 없음');
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send('토큰 검증 실패');
    }

    // 인증 성공 시 decoded 안에 있는 사용자 정보 req에 저장
    req.user = decoded;
    next(); // 다음 미들웨어 or 라우터로
  });
}






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


//로그인 필요요
app.post("/articles", authMiddleware, (req, res) => {

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

// 게시글 조회 API - 로그인된 사용자만 조회 가능 
// 로그인 불필요요
app.get('/articles', (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Bearer 토큰 추출

  if (!token) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  // JWT 토큰 검증
  jwt.verify(token, 'secretKey', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "유효하지 않은 토큰입니다." });
    }

    // 토큰이 유효한 경우, 게시글 조회
    const sql = `SELECT * FROM articles`;

    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error("데이터 조회 중 오류 발생:", err);
        return res.status(500).json({ error: "데이터 조회 중 오류 발생" });
      }

      res.json({ articles: rows });
    });
  });
});

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

//로그인 필요
// 게시글이 본인인지 확인도 필요요
app.delete("/articles/:id", authMiddleware, (req, res) => {
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

// 로그인 필요요
app.put('/articles/:id', authMiddleware, (req, res) => {
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
// 로그인 필요요
app.post("/articles/:id/comments", authMiddleware, (req, res) => {
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

// // 특정 댓글 수정(집에서 *미완성*)
// app.put('/comments/:commentId', (req, res) => {
//   let commentId = req.params.commentId;  // URL에서 댓글 ID 가져오기
//   let { content } = req.body;  // 요청 본문에서 수정할 내용 가져오기

//   if (!content) {
//       return res.status(400).json({ error: "수정할 댓글 내용을 입력하세요." });
//   }

//   const sql = `UPDATE comments SET content = ? WHERE id = ?`;
  
//   db.run(sql, [content, commentId], function (err) {
//       if (err) {
//           return res.status(500).json({ error: "댓글 수정 중 오류 발생: " + err.message });
//       }

//       // 변경된 row가 없으면 해당 댓글이 존재하지 않는 것
//       if (this.changes === 0) {
//           return res.status(404).json({ error: "해당 댓글을 찾을 수 없습니다." });
//       }

//       res.json({ message: "댓글 수정 완료!", commentId });
//   });
// });



// 회원가입 API
app.post("/users", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력하세요." });
  }

  // 비밀번호 해싱
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: "비밀번호 해싱 중 오류 발생: " + err.message });
    }

    const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;

    db.run(sql, [email, hashedPassword], function (err) {
      if (err) {
        return res.status(500).json({ error: "회원가입 중 오류 발생: " + err.message });
      }
      res.json({ message: "회원가입 성공", userId: this.lastID });
    });
  });
});

// 로그인 API
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력하세요." });
  }

  const sql = `SELECT * FROM users WHERE email = ?`;

  db.get(sql, [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "로그인 중 오류 발생: " + err.message });
    }

    if (!user) {
      return res.status(404).json({ error: "이메일이 없습니다" });
    }

    // bcrypt로 비밀번호 비교
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: "비밀번호 비교 중 오류 발생: " + err.message });
      }

      if (!isMatch) {
        return res.status(401).json({ error: "패스워드가 틀립니다" });
      }

      // JWT 생성
      const token = jwt.sign(
        { userId: user.id, email: user.email }, // 페이로드에 사용자 정보 넣기
        secretKey, // 비밀키 (서버에서만 알고 있어야 하는 키)
        { expiresIn: '1h' } // 토큰 만료 시간 (예: 1시간)
      );

      res.json({ message: "로그인 성공", token });
    });
  });
});


// 로그인 테스트 API (유효한 JWT 토큰을 확인)
app.get('/logintest', authMiddleware, (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Bearer 토큰 추출

  if (!token) {
    return res.status(401).send("로그인이 필요합니다.");
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).send("유효하지 않은 토큰입니다.");
    }
    res.send('로그인 성공!');
  });
});

