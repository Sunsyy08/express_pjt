// jwt_example.js
const jwt = require('jsonwebtoken');

const secretKey = 'mysecretkey'; // JWT 서명에 사용할 비밀키

const payload = { username: 'sunhyuk', role: 'student' };

// JWT 생성 (1시간 후 만료)
const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
console.log('생성된 JWT:', token);

// 토큰의 내부 내용을 확인 (헤더, 페이로드, 서명)
const decoded = jwt.decode(token, { complete: true });
console.log('디코딩한 JWT:', decoded);
 

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // 'Bearer <token>'
  
    if (!token) {
      return res.status(401).json({ error: "로그인 후 다시 시도해주세요." });
    }
  
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "유효하지 않은 토큰입니다." });
      }
      req.user = user; // 토큰에서 추출한 사용자 정보
      next(); // 인증이 완료되면 다음 미들웨어나 라우터로 이동
    });
  };