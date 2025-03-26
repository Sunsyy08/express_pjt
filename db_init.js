const sqlite3 = require('sqlite3').verbose();

// SQLite DB 연결
const db = new sqlite3.Database('./database.db');

// 테이블 준비 함수
function initDB() {
  db.run(`PRAGMA foreign_keys = ON;`); // 외래키 활성화

  db.run(`  
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("테이블 생성 에러:", err);
    } else {
      console.log("테이블 준비 완료 (users)");
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error("테이블 생성 에러:", err);
    } else {
      console.log("테이블 준비 완료 (articles)");
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      article_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error("테이블 생성 에러:", err);
    } else {
      console.log("테이블 준비 완료 (comments)");
    }
  });
}

initDB();
