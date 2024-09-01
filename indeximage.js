const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Configurando o multer para armazenar a imagem na pasta public
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'public');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Rota POST para receber e salvar a imagem
app.post('/imagem', upload.single('image'), (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Imagem salva com sucesso!',
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar a imagem',
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
