
CREATE TABLE users (
      id INTEGER PRIMARY KEY auto_increment,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      target_language TEXT,
      proficiency_level TEXT,
      learning_goals TEXT,
      practice_preference TEXT,
      motivation TEXT,
      onboarding_complete BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO users VALUES(1,'103188934446788601272','aishbal25@gmail.com','Aishani Bal',NULL,'user','hi','absolute-beginner','["family"]','daily-short','j',1,'2025-07-08 18:47:53','2025-07-08 18:48:05');
INSERT INTO users VALUES(2,NULL,'a@gmail.com','a','$2b$10$JQr8qSoGj/cJvDv5x6ntHupI3c./PMmYmM5fhWGMcqGhiq18HRlrW','user','hi','absolute-beginner','["travel"]','daily-short','jjjj',1,'2025-07-08 18:50:20','2025-07-08 18:50:31');
INSERT INTO users VALUES(3,'115043329526601033546','aishani.bal5@gmail.com','Aishani Bal',NULL,'user','es','absolute-beginner','["family"]','daily-short','j',1,'2025-07-09 14:48:25','2025-07-09 14:48:34');
INSERT INTO users VALUES(4,NULL,'df@gmail.com','dfa','$2b$10$/XfAEyu3XfJgQBp2kigrpujeyAKYY1N3ogCdtFyXSy7hacxEo9.KG','user','es','absolute-beginner','["family"]','daily-short','dd',1,'2025-07-09 15:05:20','2025-07-09 15:12:18');
CREATE TABLE sessions (
      id INTEGER PRIMARY KEY auto_increment,
      user_id INTEGER NOT NULL,
      chat_history TEXT,
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
CREATE TABLE conversations (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      language TEXT DEFAULT 'en',
      message_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
INSERT INTO conversations VALUES(1,1,'Hindi Practice Session','hi',2,'2025-07-08 18:48:10','2025-07-08 18:48:18');
INSERT INTO conversations VALUES(2,3,'Spanish Practice Session','es',4,'2025-07-09 14:48:40','2025-07-09 14:58:02');
INSERT INTO conversations VALUES(3,4,'Spanish Practice Session','es',2,'2025-07-09 15:14:16','2025-07-09 15:14:25');
INSERT INTO conversations VALUES(4,1,'Hindi Practice Session','hi',2,'2025-07-09 15:44:01','2025-07-09 15:44:11');
CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      conversation_id INTEGER NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      audio_file_path TEXT,
      message_order INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations (id)
    );
INSERT INTO messages VALUES(1,1,'User',' Namaste.','text',NULL,1,'2025-07-08 18:48:18');
INSERT INTO messages VALUES(2,1,'AI','"Vahid, tumhara parivaar kaise hai? Kya tumhein apne parivaar ke saath samay bitana pasand hai?" (How''s your family? Do you enjoy spending time with your family?)','text',NULL,2,'2025-07-08 18:48:18');
INSERT INTO messages VALUES(3,2,'User',' Hola como estas?','text',NULL,1,'2025-07-09 14:48:50');
INSERT INTO messages VALUES(4,2,'AI','Estoy bien gracias, ¿y tú? ¿Cuál es lo más importante que le has estado enseñando a tu familia últimamente?','text',NULL,2,'2025-07-09 14:48:50');
INSERT INTO messages VALUES(5,2,'User',' Espero que tu familia esté bien.','text',NULL,3,'2025-07-09 14:58:02');
INSERT INTO messages VALUES(6,2,'AI','Eso es muy considerado, ¿cómo puedes ayudar a tu familia en momentos complicados?','text',NULL,4,'2025-07-09 14:58:02');
INSERT INTO messages VALUES(7,3,'User',' Ami, I can''t. Oh!','text',NULL,1,'2025-07-09 15:14:25');
INSERT INTO messages VALUES(8,3,'AI','"Eso es normal, cariño. ¿Qué pasa? ¿Te sientes abrumada o no tienes la energía para hablar sobre esto?"','text',NULL,2,'2025-07-09 15:14:25');
INSERT INTO messages VALUES(9,4,'User',' Namaste.','text',NULL,1,'2025-07-09 15:44:11');
INSERT INTO messages VALUES(10,4,'AI','"अरे, तुमने क्या सीखा है? तुम्हारी भाषा सुधारने में बहुत प्रगति हुई है और मुझे यह अच्छी लगती है."','text',NULL,2,'2025-07-09 15:44:11');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',4);
INSERT INTO sqlite_sequence VALUES('conversations',4);
INSERT INTO sqlite_sequence VALUES('messages',10);
COMMIT;
